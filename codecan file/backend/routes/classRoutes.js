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
// @desc    Assign subjects to a class and auto-assign to all students in that class
// @access  Private
router.put('/:id/subjects', protect, async (req, res) => {
    try {
        const { subjects } = req.body; // Array of subject IDs
        const Student = require('../models/Student');
        const Subject = require('../models/Subject');

        console.log(`📚 Assigning ${subjects?.length || 0} subjects to class ${req.params.id}`);

        const classData = await Class.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!classData) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Validate that all subject IDs exist and belong to this tenant
        if (subjects && subjects.length > 0) {
            const validSubjects = await Subject.find({
                _id: { $in: subjects },
                tenant_id: req.tenant_id
            });

            if (validSubjects.length !== subjects.length) {
                console.error('⚠️ Some subject IDs are invalid or do not belong to this school');
                return res.status(400).json({
                    message: 'Some subject IDs are invalid or do not belong to this school',
                    valid: validSubjects.length,
                    provided: subjects.length
                });
            }
            console.log(`✅ All ${validSubjects.length} subjects validated for tenant`);
        }

        // Update class subjects
        classData.subjects = subjects;
        await classData.save();
        console.log(`✅ Class ${classData.name} subjects updated`);

        // Auto-assign subjects to all students in this class
        const students = await Student.find({
            class_id: classData.name,
            tenant_id: req.tenant_id,
            is_active: true
        });

        console.log(`📝 Found ${students.length} students in class ${classData.name} to update`);

        // Update each student's enrolled_subjects
        let updatedCount = 0;
        for (const student of students) {
            // Get existing subject IDs
            const existingSubjectIds = student.enrolled_subjects.map(es => es.subject_id.toString());
            const beforeCount = student.enrolled_subjects.length;

            // Add new subjects that aren't already enrolled
            for (const subjectId of subjects) {
                if (!existingSubjectIds.includes(subjectId.toString())) {
                    student.enrolled_subjects.push({
                        subject_id: subjectId,
                        enrollment_date: new Date(),
                        is_active: true
                    });
                }
            }

            // Remove subjects that are no longer in the class
            student.enrolled_subjects = student.enrolled_subjects.filter(es =>
                subjects.some(subId => subId.toString() === es.subject_id.toString())
            );

            await student.save();
            const afterCount = student.enrolled_subjects.length;

            if (beforeCount !== afterCount) {
                updatedCount++;
                console.log(`  ✓ ${student.full_name}: ${beforeCount} → ${afterCount} subjects`);
            }
        }

        console.log(`✅ Updated ${updatedCount} of ${students.length} students with new subjects`);

        const populated = await Class.findById(classData._id).populate('subjects');
        res.json({
            class: populated,
            message: `Subjects assigned to class and ${students.length} students updated`,
            details: {
                totalStudents: students.length,
                updatedStudents: updatedCount,
                subjectsAssigned: subjects.length
            }
        });
    } catch (err) {
        console.error('❌ Error assigning subjects to class:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
