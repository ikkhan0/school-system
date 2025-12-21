const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Add a Student
// @route   POST /api/students/add
router.post('/add', protect, async (req, res) => {
    try {
        const { father_name, father_mobile, father_cnic, ...studentData } = req.body;

        // Check if family exists or create (Scoped to School)
        let family = await Family.findOne({ father_mobile, school_id: req.user.school_id });
        if (!family) {
            family = await Family.create({
                father_name,
                father_mobile,
                father_cnic,
                school_id: req.user.school_id
            });
        }

        const student = await Student.create({
            ...studentData,
            family_id: family._id,
            father_name: father_name, // keep denormalized copy
            school_id: req.user.school_id
        });

        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/list', protect, async (req, res) => {
    try {
        const students = await Student.find({ school_id: req.user.school_id }).populate('family_id');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
