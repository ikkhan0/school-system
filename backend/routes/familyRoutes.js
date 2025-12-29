const express = require('express');
const router = express.Router();
const Family = require('../models/Family');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const School = require('../models/School');
const WhatsappTemplate = require('../models/WhatsappTemplate');
const { protect } = require('../middleware/auth');
const {
    generateFamilyFeeMessage,
    generateWhatsAppLink,
    generateBulkMessages
} = require('../utils/whatsappMessageGenerator');

// @route   GET /api/families
// @desc    Get all families for the school (with optional search)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { search } = req.query;

        // Build query to support both tenant_id and school_id
        const query = {
            $or: [
                { tenant_id: req.tenant_id },
                { school_id: req.tenant_id }
            ]
        };

        // Add search filter if provided
        if (search) {
            query.$or = [
                { father_name: { $regex: search, $options: 'i' } },
                { father_mobile: { $regex: search, $options: 'i' } },
                { mother_mobile: { $regex: search, $options: 'i' } }
            ];
        }

        const families = await Family.find(query)
            .sort({ father_name: 1 });

        // Get student count for each family
        const familiesWithCounts = await Promise.all(
            families.map(async (family) => {
                const studentCount = await Student.countDocuments({
                    family_id: family._id,
                    is_active: true
                });

                return {
                    ...family.toObject(),
                    student_count: studentCount
                };
            })
        );

        res.json(familiesWithCounts);
    } catch (error) {
        console.error('Error fetching families:', error);
        res.status(500).json({ message: 'Failed to fetch families', error: error.message });
    }
});

// @route   GET /api/families/:id
// @desc    Get single family details
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const family = await Family.findOne({
            _id: req.params.id,
            $or: [
                { tenant_id: req.tenant_id },
                { school_id: req.tenant_id }
            ]
        });

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        res.json(family);
    } catch (error) {
        console.error('Error fetching family:', error);
        res.status(500).json({ message: 'Failed to fetch family', error: error.message });
    }
});

// @route   GET /api/families/:id/students
// @desc    Get all students in a family
// @access  Private
router.get('/:id/students', protect, async (req, res) => {
    try {
        const students = await Student.find({
            family_id: req.params.id,
            tenant_id: req.tenant_id,
            is_active: true
        }).sort({ sibling_discount_position: 1 });

        res.json(students);
    } catch (error) {
        console.error('Error fetching family students:', error);
        res.status(500).json({ message: 'Failed to fetch students', error: error.message });
    }
});

// @route   GET /api/families/:id/consolidated-fees
// @desc    Get consolidated fee breakdown for all children in family
// @access  Private
router.get('/:id/consolidated-fees', protect, async (req, res) => {
    try {
        const { month } = req.query;
        const currentMonth = month || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const family = await Family.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        const students = await Student.find({
            family_id: req.params.id,
            tenant_id: req.tenant_id,
            is_active: true
        }).sort({ sibling_discount_position: 1 });

        const studentsWithFees = await Promise.all(
            students.map(async (student) => {
                let fee = await Fee.findOne({
                    student_id: student._id,
                    month: currentMonth,
                    tenant_id: req.tenant_id
                });

                // If no fee record, create preview
                if (!fee) {
                    fee = {
                        month: currentMonth,
                        tuition_fee: student.monthly_fee || 5000,
                        other_charges: 0,
                        arrears: 0,
                        gross_amount: student.monthly_fee || 5000,
                        paid_amount: 0,
                        balance: student.monthly_fee || 5000,
                        status: 'Pending'
                    };
                }

                return {
                    student: student,
                    fee: fee
                };
            })
        );

        // Calculate totals
        const totals = studentsWithFees.reduce((acc, item) => {
            acc.total_due += item.fee.gross_amount || 0;
            acc.total_paid += item.fee.paid_amount || 0;
            acc.total_balance += item.fee.balance || 0;
            return acc;
        }, { total_due: 0, total_paid: 0, total_balance: 0 });

        res.json({
            family: family,
            students_with_fees: studentsWithFees,
            totals: totals,
            month: currentMonth
        });

    } catch (error) {
        console.error('Error fetching consolidated fees:', error);
        res.status(500).json({ message: 'Failed to fetch consolidated fees', error: error.message });
    }
});

// @route   POST /api/families/:id/whatsapp-message
// @desc    Generate WhatsApp message for family
// @access  Private
router.post('/:id/whatsapp-message', protect, async (req, res) => {
    try {
        const { month } = req.body;
        const currentMonth = month || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const family = await Family.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        const students = await Student.find({
            family_id: req.params.id,
            tenant_id: req.tenant_id,
            is_active: true
        }).sort({ sibling_discount_position: 1 });

        const studentsWithFees = await Promise.all(
            students.map(async (student) => {
                let fee = await Fee.findOne({
                    student_id: student._id,
                    month: currentMonth,
                    tenant_id: req.tenant_id
                });

                if (!fee) {
                    fee = {
                        month: currentMonth,
                        tuition_fee: student.monthly_fee || 5000,
                        other_charges: 0,
                        arrears: 0,
                        gross_amount: student.monthly_fee || 5000,
                        paid_amount: 0,
                        balance: student.monthly_fee || 5000,
                        status: 'Pending'
                    };
                }

                return { student, fee };
            })
        );

        const school = await School.findById(req.tenant_id) || { name: 'School', school_name: 'School', phone: '' };

        let message = "";
        try {
            const template = await WhatsappTemplate.findOne({
                tenant_id: req.tenant_id,
                type: 'family_fee',
                isActive: true
            });

            if (template) {
                let childrenList = "";
                let totalDue = 0;
                studentsWithFees.forEach(item => {
                    totalDue += item.fee.balance || 0;
                    childrenList += `* ${item.student.full_name} (${item.student.class_id}): Due ${item.fee.balance}\n`;
                });

                message = template.content
                    .replace(/{father_name}/g, family.father_name || 'Parent')
                    .replace(/{children_list}/g, childrenList)
                    .replace(/{total_due}/g, totalDue)
                    .replace(/{month}/g, currentMonth)
                    .replace(/{school_name}/g, school.name || 'School');
            }
        } catch (e) {
            console.error("Template error", e);
        }

        if (!message) {
            message = generateFamilyFeeMessage(family, studentsWithFees, school);
        }
        const whatsappNumber = family.whatsapp_number || family.father_mobile;
        const whatsappLink = generateWhatsAppLink(whatsappNumber, message);

        // Update fee records to mark WhatsApp sent
        const messageId = `FAM_${family._id}_${Date.now()}`;
        await Fee.updateMany(
            {
                student_id: { $in: students.map(s => s._id) },
                month: currentMonth,
                tenant_id: req.tenant_id
            },
            {
                whatsapp_sent: true,
                whatsapp_sent_at: new Date(),
                family_message_id: messageId
            }
        );

        res.json({
            success: true,
            family_id: family._id,
            family_name: family.father_name,
            whatsapp_number: whatsappNumber,
            message: message,
            whatsapp_link: whatsappLink,
            students_count: students.length
        });

    } catch (error) {
        console.error('Error generating WhatsApp message:', error);
        res.status(500).json({ message: 'Failed to generate WhatsApp message', error: error.message });
    }
});

// @route   POST /api/families/bulk-whatsapp
// @desc    Generate WhatsApp messages for multiple families
// @access  Private
router.post('/bulk-whatsapp', protect, async (req, res) => {
    try {
        const { class_id, section_id, min_balance, month } = req.body;
        const currentMonth = month || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Build student query
        const studentQuery = {
            tenant_id: req.tenant_id,
            is_active: true,
            family_id: { $exists: true, $ne: null }
        };

        if (class_id) studentQuery.class_id = class_id;
        if (section_id) studentQuery.section_id = section_id;

        const students = await Student.find(studentQuery).populate('family_id');

        // Group by family
        const familyGroups = {};
        students.forEach(student => {
            if (!student.family_id) return; // Skip students with broken family references

            const familyId = student.family_id._id.toString();
            if (!familyGroups[familyId]) {
                familyGroups[familyId] = {
                    family: student.family_id,
                    students: []
                };
            }
            familyGroups[familyId].students.push(student);
        });

        const school = await School.findById(req.tenant_id) || { name: 'School', school_name: 'School', phone: '' };

        // Generate messages for each family
        const familiesData = await Promise.all(
            Object.values(familyGroups).map(async (group) => {
                const studentsWithFees = await Promise.all(
                    group.students.map(async (student) => {
                        let fee = await Fee.findOne({
                            student_id: student._id,
                            month: currentMonth,
                            tenant_id: req.tenant_id
                        });

                        if (!fee) {
                            fee = {
                                month: currentMonth,
                                tuition_fee: student.monthly_fee || 5000,
                                other_charges: 0,
                                arrears: 0,
                                gross_amount: student.monthly_fee || 5000,
                                paid_amount: 0,
                                balance: student.monthly_fee || 5000,
                                status: 'Pending'
                            };
                        }

                        return { student, fee };
                    })
                );

                // Calculate total balance
                const totalBalance = studentsWithFees.reduce((sum, item) =>
                    sum + (item.fee.balance || 0), 0
                );

                return {
                    family: group.family,
                    studentsWithFees: studentsWithFees,
                    totalBalance: totalBalance
                };
            })
        );

        // Filter by minimum balance if specified
        let filteredFamilies = familiesData;
        if (min_balance && min_balance > 0) {
            filteredFamilies = familiesData.filter(f => f.totalBalance >= min_balance);
        }

        const messages = generateBulkMessages(filteredFamilies, school);

        res.json({
            success: true,
            total_families: messages.length,
            messages: messages
        });

    } catch (error) {
        console.error('Error generating bulk WhatsApp messages:', error);
        res.status(500).json({ message: 'Failed to generate bulk messages', error: error.message });
    }
});

// @route   POST /api/families
// @desc    Create a new family
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const family = new Family({
            ...req.body,
            tenant_id: req.tenant_id
        });

        await family.save();
        res.status(201).json(family);
    } catch (error) {
        console.error('Error creating family:', error);
        res.status(500).json({ message: 'Failed to create family', error: error.message });
    }
});

// @route   PUT /api/families/:id
// @desc    Update family information
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const family = await Family.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        res.json(family);
    } catch (error) {
        console.error('Error updating family:', error);
        res.status(500).json({ message: 'Failed to update family', error: error.message });
    }
});

// @route   DELETE /api/families/:id
// @desc    Delete family (only if no students linked)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        // Check if family has students
        const studentCount = await Student.countDocuments({
            family_id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (studentCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete family with linked students. Please unlink students first.'
            });
        }

        const family = await Family.findOneAndDelete({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        res.json({ message: 'Family deleted successfully' });
    } catch (error) {
        console.error('Error deleting family:', error);
        res.status(500).json({ message: 'Failed to delete family', error: error.message });
    }
});

module.exports = router;
