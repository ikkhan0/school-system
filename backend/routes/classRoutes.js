const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Class = require('../models/Class');

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const classes = await Class.find({ school_id: req.user.school_id }).sort({ name: 1 });
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/classes
// @desc    Create a new class
// @access  Private
router.post('/', protect, async (req, res) => {
    const { name, sections } = req.body;

    try {
        let newClass = new Class({
            name,
            sections,
            school_id: req.user.school_id
        });

        const savedClass = await newClass.save();
        res.json(savedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/classes/:id/subjects
// @desc    Assign subjects to a class
// @access  Private
router.put('/:id/subjects', protect, async (req, res) => {
    try {
        const { subjects } = req.body; // Array of subject IDs

        const classData = await Class.findOne({
            _id: req.params.id,
            school_id: req.user.school_id
        });

        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }

        classData.subjects = subjects;
        await classData.save();

        const populated = await Class.findById(classData._id).populate('subjects');
        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
