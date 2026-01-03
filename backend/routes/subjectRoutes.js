const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Create a new subject
// @route   POST /api/subjects
router.post('/', protect, checkPermission('classes.edit'), async (req, res) => {
    try {
        const subject = await Subject.create({
            ...req.body,
            tenant_id: req.tenant_id
        });
        res.status(201).json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get all subjects for school
// @route   GET /api/subjects
router.get('/', protect, checkPermission('classes.view'), async (req, res) => {
    try {
        const subjects = await Subject.find({
            tenant_id: req.tenant_id,
            is_active: true
        }).sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get subjects for a specific class
// @route   GET /api/subjects/class/:classId
router.get('/class/:classId', protect, checkPermission('classes.view'), async (req, res) => {
    try {
        const Class = require('../models/Class');
        const classData = await Class.findById(req.params.classId).populate('subjects');

        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json(classData.subjects || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a subject
// @route   PUT /api/subjects/:id
router.put('/:id', protect, checkPermission('classes.edit'), async (req, res) => {
    try {
        const subject = await Subject.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        Object.assign(subject, req.body);
        await subject.save();

        res.json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a subject (soft delete)
// @route   DELETE /api/subjects/:id
router.delete('/:id', protect, checkPermission('classes.edit'), async (req, res) => {
    try {
        const subject = await Subject.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        subject.is_active = false;
        await subject.save();

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Seed default subjects (Pre-Medical, Engineering, ICS)
// @route   POST /api/subjects/seed
router.post('/seed', protect, async (req, res) => {
    try {
        const defaultSubjects = [
            // Common subjects
            { name: 'English', code: 'ENG', total_marks: 100 },
            { name: 'Urdu', code: 'URD', total_marks: 100 },
            { name: 'Islamiat', code: 'ISL', total_marks: 50 },
            { name: 'Pakistan Studies', code: 'PAK', total_marks: 50 },

            // Pre-Medical subjects
            { name: 'Biology', code: 'BIO', total_marks: 100 },
            { name: 'Physics', code: 'PHY', total_marks: 100 },
            { name: 'Chemistry', code: 'CHEM', total_marks: 100 },

            // Engineering subjects
            { name: 'Mathematics', code: 'MATH', total_marks: 100 },

            // ICS (Computer Science) subjects
            { name: 'Computer Science', code: 'CS', total_marks: 100 },

            // Primary subjects
            { name: 'Science', code: 'SCI', total_marks: 100 },
            { name: 'Social Studies', code: 'SS', total_marks: 50 },
            { name: 'Drawing', code: 'ART', total_marks: 50 }
        ];

        const created = [];
        for (const subData of defaultSubjects) {
            // Check if subject already exists
            const existing = await Subject.findOne({
                name: subData.name,
                tenant_id: req.tenant_id
            });

            if (!existing) {
                const subject = await Subject.create({
                    ...subData,
                    tenant_id: req.tenant_id
                });
                created.push(subject);
            }
        }

        res.json({
            message: `${created.length} subjects created`,
            subjects: created
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
