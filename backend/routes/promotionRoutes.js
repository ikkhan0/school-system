const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const AcademicSession = require('../models/AcademicSession');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get students eligible for promotion
// @route   GET /api/promotions/eligible?from_session=X&class_id=Y&section_id=Z
router.get('/eligible', protect, checkPermission('students.edit'), async (req, res) => {
    try {
        const { from_session, class_id, section_id } = req.query;

        if (!from_session) {
            return res.status(400).json({ message: 'from_session is required' });
        }

        const query = {
            tenant_id: req.tenant_id,
            current_session_id: from_session,
            is_active: true
        };

        if (class_id) query.class_id = class_id;
        if (section_id) query.section_id = section_id;

        const students = await Student.find(query)
            .populate('family_id')
            .sort({ roll_no: 1 });

        // Calculate fee balances for each student
        const studentsWithBalances = await Promise.all(
            students.map(async (student) => {
                const fees = await Fee.find({
                    student_id: student._id,
                    session_id: from_session,
                    tenant_id: req.tenant_id
                });

                const totalDue = fees.reduce((sum, f) => sum + (f.gross_amount || 0), 0);
                const totalPaid = fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
                const balance = totalDue - totalPaid;

                return {
                    ...student.toObject(),
                    fee_balance: balance,
                    total_due: totalDue,
                    total_paid: totalPaid
                };
            })
        );

        res.json(studentsWithBalances);
    } catch (error) {
        console.error('Error fetching eligible students:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Promote students to new session
// @route   POST /api/promotions/promote
router.post('/promote', protect, checkPermission('students.edit'), async (req, res) => {
    try {
        const {
            from_session_id,
            to_session_id,
            to_class_id,
            to_section_id,
            students // Array of { student_id, final_result_status, remarks, new_roll_no }
        } = req.body;

        // Validate sessions exist
        const fromSession = await AcademicSession.findOne({
            _id: from_session_id,
            tenant_id: req.tenant_id
        });

        const toSession = await AcademicSession.findOne({
            _id: to_session_id,
            tenant_id: req.tenant_id
        });

        if (!fromSession || !toSession) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const results = {
            success: [],
            failed: []
        };

        for (const studentData of students) {
            try {
                const student = await Student.findOne({
                    _id: studentData.student_id,
                    tenant_id: req.tenant_id
                });

                if (!student) {
                    results.failed.push({
                        student_id: studentData.student_id,
                        error: 'Student not found'
                    });
                    continue;
                }

                // Calculate closing balance from old session
                const oldFees = await Fee.find({
                    student_id: student._id,
                    session_id: from_session_id,
                    tenant_id: req.tenant_id
                });

                const totalDue = oldFees.reduce((sum, f) => sum + (f.gross_amount || 0), 0);
                const totalPaid = oldFees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
                const closingBalance = totalDue - totalPaid;

                // Get opening balance (from previous session's closing)
                const openingBalance = student.session_history.length > 0
                    ? student.session_history[student.session_history.length - 1].closing_balance
                    : 0;

                // Add current session to history
                student.session_history.push({
                    session_id: from_session_id,
                    class_id: student.class_id,
                    section_id: student.section_id,
                    roll_no: student.roll_no,
                    final_result_status: studentData.final_result_status || 'Promoted',
                    opening_balance: openingBalance,
                    closing_balance: closingBalance,
                    promoted_date: new Date(),
                    remarks: studentData.remarks || ''
                });

                // Update to new session
                student.current_session_id = to_session_id;
                student.class_id = to_class_id;
                student.section_id = to_section_id;

                // Update roll number if provided
                if (studentData.new_roll_no) {
                    student.roll_no = studentData.new_roll_no;
                }

                await student.save();

                // Create opening balance entry in new session if there's a balance
                if (closingBalance > 0) {
                    await Fee.create({
                        tenant_id: req.tenant_id,
                        session_id: to_session_id,
                        student_id: student._id,
                        month: 'Opening Balance',
                        tuition_fee: 0,
                        other_charges: 0,
                        arrears: closingBalance,
                        opening_balance: closingBalance,
                        gross_amount: closingBalance,
                        paid_amount: 0,
                        balance: closingBalance,
                        status: 'Pending',
                        is_opening_entry: true
                    });
                }

                results.success.push({
                    student_id: student._id,
                    name: student.full_name,
                    roll_no: student.roll_no,
                    from_class: `${studentData.old_class || student.session_history[student.session_history.length - 1]?.class_id}-${studentData.old_section || student.session_history[student.session_history.length - 1]?.section_id}`,
                    to_class: `${to_class_id}-${to_section_id}`,
                    carried_forward: closingBalance
                });

            } catch (error) {
                console.error('Error promoting student:', error);
                results.failed.push({
                    student_id: studentData.student_id,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Promotion completed',
            from_session: fromSession.session_name,
            to_session: toSession.session_name,
            summary: {
                total: students.length,
                promoted: results.success.length,
                failed: results.failed.length
            },
            results
        });

    } catch (error) {
        console.error('Error in promotion:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get promotion history for a student
// @route   GET /api/promotions/history/:student_id
router.get('/history/:student_id', protect, async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.student_id,
            tenant_id: req.tenant_id
        }).populate('session_history.session_id');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({
            student: {
                _id: student._id,
                full_name: student.full_name,
                roll_no: student.roll_no
            },
            current_session: student.current_session_id,
            history: student.session_history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
