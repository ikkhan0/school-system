const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Class = require('../models/Class');

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const classes = await Class.find({ tenant_id: req.tenant_id }).sort({ name: 1 });
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
            tenant_id: req.tenant_id
        });

        const savedClass = await newClass.save();
        res.json(savedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/classes/:id
// @desc    Update class name and/or sections
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { name, sections } = req.body;

    try {
        const classData = await Class.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Update fields if provided
        if (name) classData.name = name;
        if (sections) classData.sections = sections;

        const updatedClass = await classData.save();
        res.json(updatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/classes/:id
// @desc    Delete a class
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const classData = await Class.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }

        await Class.deleteOne({ _id: req.params.id });
        res.json({ message: 'Class deleted successfully' });
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
            tenant_id: req.tenant_id
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
