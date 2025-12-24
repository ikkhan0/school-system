const Student = require('../models/Student');
const Family = require('../models/Family');

/**
 * Detect siblings by family_id
 * @param {String} school_id - School ID
 * @returns {Array} - Array of sibling groups
 */
async function detectSiblingsByFamily(tenant_id) {
    try {
        const students = await Student.find({
            tenant_id,
            is_active: true,
            family_id: { $exists: true, $ne: null }
        }).populate('family_id');

        // Group by family_id
        const familyGroups = {};

        students.forEach(student => {
            const familyId = student.family_id._id.toString();
            if (!familyGroups[familyId]) {
                familyGroups[familyId] = {
                    family: student.family_id,
                    students: []
                };
            }
            familyGroups[familyId].students.push(student);
        });

        // Filter groups with 2+ children
        const siblingGroups = Object.values(familyGroups).filter(
            group => group.students.length >= 2
        );

        return siblingGroups;

    } catch (error) {
        console.error('Error detecting siblings by family:', error);
        return [];
    }
}

/**
 * Detect potential siblings by matching mobile numbers
 * @param {String} school_id - School ID
 * @returns {Array} - Array of suggested sibling groups
 */
async function detectSiblingsByMobile(tenant_id) {
    try {
        const students = await Student.find({
            tenant_id,
            is_active: true
        });

        // Group by father_mobile
        const mobileGroups = {};

        students.forEach(student => {
            // Group by father mobile
            if (student.father_mobile) {
                const mobile = student.father_mobile.trim();
                if (!mobileGroups[mobile]) {
                    mobileGroups[mobile] = [];
                }
                mobileGroups[mobile].push(student);
            }

            // Group by mother mobile
            if (student.mother_mobile) {
                const mobile = student.mother_mobile.trim();
                if (!mobileGroups[mobile]) {
                    mobileGroups[mobile] = [];
                }
                // Avoid duplicates
                if (!mobileGroups[mobile].find(s => s._id.toString() === student._id.toString())) {
                    mobileGroups[mobile].push(student);
                }
            }
        });

        // Filter groups with 2+ students and no existing family_id
        const suggestedGroups = Object.entries(mobileGroups)
            .filter(([mobile, students]) => students.length >= 2)
            .map(([mobile, students]) => ({
                mobile_number: mobile,
                students: students,
                has_family: students.some(s => s.family_id),
                suggested_father_name: students[0].father_name,
                suggested_mother_name: students[0].mother_name
            }));

        return suggestedGroups;

    } catch (error) {
        console.error('Error detecting siblings by mobile:', error);
        return [];
    }
}

/**
 * Get all suggested sibling groups (combined from family and mobile detection)
 * @param {String} school_id - School ID
 * @returns {Object} - Suggested sibling groups
 */
async function suggestSiblingGroups(tenant_id) {
    try {
        const [familyGroups, mobileGroups] = await Promise.all([
            detectSiblingsByFamily(tenant_id),
            detectSiblingsByMobile(tenant_id)
        ]);

        return {
            confirmed_families: familyGroups,
            suggested_by_mobile: mobileGroups.filter(g => !g.has_family),
            total_confirmed: familyGroups.length,
            total_suggested: mobileGroups.filter(g => !g.has_family).length
        };

    } catch (error) {
        console.error('Error suggesting sibling groups:', error);
        return {
            confirmed_families: [],
            suggested_by_mobile: [],
            total_confirmed: 0,
            total_suggested: 0
        };
    }
}

/**
 * Link students as siblings by creating/updating family
 * @param {Array} studentIds - Array of student IDs to link
 * @param {Object} familyData - Family information
 * @param {String} school_id - School ID
 * @returns {Object} - Result of linking operation
 */
async function linkSiblings(studentIds, familyData, tenant_id) {
    try {
        // Validate input
        if (!studentIds || studentIds.length < 2) {
            return {
                success: false,
                message: 'At least 2 students required to link as siblings'
            };
        }

        // Fetch students
        const students = await Student.find({
            _id: { $in: studentIds },
            tenant_id
        });

        if (students.length !== studentIds.length) {
            return {
                success: false,
                message: 'Some students not found'
            };
        }

        let family;

        // Check if any student already has a family
        const existingFamily = students.find(s => s.family_id);

        if (existingFamily && existingFamily.family_id) {
            // Use existing family
            family = await Family.findById(existingFamily.family_id);

            // Update family data if provided
            if (familyData) {
                Object.assign(family, familyData);
                family.total_children = students.length;
                await family.save();
            }
        } else {
            // Create new family
            family = new Family({
                tenant_id,
                father_name: familyData.father_name || students[0].father_name,
                father_mobile: familyData.father_mobile || students[0].father_mobile,
                father_cnic: familyData.father_cnic,
                mother_name: familyData.mother_name || students[0].mother_name,
                mother_mobile: familyData.mother_mobile || students[0].mother_mobile,
                address: familyData.address || students[0].address,
                whatsapp_number: familyData.whatsapp_number || familyData.father_mobile || students[0].father_mobile,
                total_children: students.length
            });
            await family.save();
        }

        // Sort students by admission date to determine positions
        students.sort((a, b) => {
            const dateA = a.admission_date || a.createdAt || new Date();
            const dateB = b.admission_date || b.createdAt || new Date();
            return new Date(dateA) - new Date(dateB);
        });

        // Update all students with family_id and positions
        const updatePromises = students.map((student, index) => {
            student.family_id = family._id;
            student.sibling_discount_position = index + 1;

            // Update siblings array
            student.siblings = students
                .filter(s => s._id.toString() !== student._id.toString())
                .map(s => s._id);

            return student.save();
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: 'Siblings linked successfully',
            family_id: family._id,
            students_linked: students.length,
            family: family
        };

    } catch (error) {
        console.error('Error linking siblings:', error);
        return {
            success: false,
            message: 'Failed to link siblings',
            error: error.message
        };
    }
}

/**
 * Update sibling positions for a family
 * @param {String} family_id - Family ID
 * @returns {Object} - Result of update operation
 */
async function updateSiblingPositions(family_id) {
    try {
        const students = await Student.find({ family_id, is_active: true });

        // Sort by admission date
        students.sort((a, b) => {
            const dateA = a.admission_date || a.createdAt || new Date();
            const dateB = b.admission_date || b.createdAt || new Date();
            return new Date(dateA) - new Date(dateB);
        });

        // Update positions
        const updatePromises = students.map((student, index) => {
            student.sibling_discount_position = index + 1;
            return student.save();
        });

        await Promise.all(updatePromises);

        // Update family total_children
        await Family.findByIdAndUpdate(family_id, {
            total_children: students.length
        });

        return {
            success: true,
            message: 'Sibling positions updated',
            total_siblings: students.length
        };

    } catch (error) {
        console.error('Error updating sibling positions:', error);
        return {
            success: false,
            message: 'Failed to update positions',
            error: error.message
        };
    }
}

module.exports = {
    detectSiblingsByFamily,
    detectSiblingsByMobile,
    suggestSiblingGroups,
    linkSiblings,
    updateSiblingPositions
};
