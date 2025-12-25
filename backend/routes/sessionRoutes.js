const express = require('express');
const router = express.Router();
const AcademicSession = require('../models/AcademicSession');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get all sessions for school
// @route   GET /api/sessions
router.get('/', protect, async (req, res) => {
    try {
        const sessions = await AcademicSession.find({
            tenant_id: req.tenant_id
        }).sort({ start_date: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get active sessions only
// @route   GET /api/sessions/active
router.get('/active', protect, async (req, res) => {
    try {
        const sessions = await AcademicSession.find({
            tenant_id: req.tenant_id,
            is_active: true
        }).sort({ start_date: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current session
// @route   GET /api/sessions/current
router.get('/current', protect, async (req, res) => {
    try {
        let session = await AcademicSession.findOne({
            tenant_id: req.tenant_id,
            is_current: true
        });

        // Fallback to latest active session
        if (!session) {
            session = await AcademicSession.findOne({
                tenant_id: req.tenant_id,
                is_active: true
            }).sort({ start_date: -1 });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new session
// @route   POST /api/sessions
router.post('/', protect, checkPermission('settings.manage'), async (req, res) => {
    try {
        const { session_name, start_date, end_date, is_current, notes } = req.body;

        // If marking as current, unmark others
        if (is_current) {
            await AcademicSession.updateMany(
                { tenant_id: req.tenant_id },
                { is_current: false }
            );
        }

        const session = await AcademicSession.create({
            tenant_id: req.tenant_id,
            session_name,
            start_date,
            end_date,
            is_current: is_current || false,
            is_active: true,
            notes,
            created_by: req.user._id
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update session
// @route   PUT /api/sessions/:id
router.put('/:id', protect, checkPermission('settings.manage'), async (req, res) => {
    try {
        const { is_current, is_locked, locked_modules, is_active } = req.body;

        const session = await AcademicSession.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // If marking as current, unmark others
        if (is_current && !session.is_current) {
            await AcademicSession.updateMany(
                { tenant_id: req.tenant_id, _id: { $ne: session._id } },
                { is_current: false }
            );
        }

        // Update fields
        Object.assign(session, req.body);
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Lock/Unlock session modules
// @route   PUT /api/sessions/:id/lock-module
router.put('/:id/lock-module', protect, checkPermission('settings.manage'), async (req, res) => {
    try {
        const { module, locked } = req.body;

        const session = await AcademicSession.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (!session.locked_modules) {
            session.locked_modules = {};
        }

        session.locked_modules[module] = locked;
        session.markModified('locked_modules');
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Archive session (deactivate)
// @route   PUT /api/sessions/:id/archive
router.put('/:id/archive', protect, checkPermission('settings.manage'), async (req, res) => {
    try {
        const session = await AcademicSession.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenant_id },
            { is_active: false, is_current: false },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({ message: 'Session archived successfully', session });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete session (only if no data)
// @route   DELETE /api/sessions/:id
router.delete('/:id', protect, checkPermission('settings.manage'), async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Fee = require('../models/Fee');

        // Check if session has any data
        const studentCount = await Student.countDocuments({
            current_session_id: req.params.id
        });

        const feeCount = await Fee.countDocuments({
            session_id: req.params.id
        });

        if (studentCount > 0 || feeCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete session with existing data. Archive it instead.',
                students: studentCount,
                fees: feeCount
            });
        }

        const session = await AcademicSession.findOneAndDelete({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
