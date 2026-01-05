/**
 * Clean Up Duplicate Subjects for Green Valley School
 * 
 * Removes duplicate subject entries keeping only unique subjects per class
 */

const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Tenant = require('./models/Tenant');
require('dotenv').config();

const cleanDuplicateSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_management');
        console.log('✅ Connected to MongoDB');

        // Find Green Valley School
        const tenant = await Tenant.findOne({ tenant_id: 'SCH-002' });
        if (!tenant) {
            console.error('❌ Green Valley School not found!');
            process.exit(1);
        }

        console.log(`\n🏫 Cleaning subjects for: ${tenant.school_name}`);

        // Get all subjects for this tenant
        const allSubjects = await Subject.find({ tenant_id: tenant._id });
        console.log(`\n📊 Found ${allSubjects.length} total subjects`);

        // Group by name + class_id to find duplicates
        const subjectGroups = {};
        allSubjects.forEach(subject => {
            const key = `${subject.name}-${subject.class_id}`;
            if (!subjectGroups[key]) {
                subjectGroups[key] = [];
            }
            subjectGroups[key].push(subject);
        });

        // Keep first, delete rest
        let deletedCount = 0;
        for (const [key, subjects] of Object.entries(subjectGroups)) {
            if (subjects.length > 1) {
                console.log(`\n🔍 Found ${subjects.length} duplicates for: ${key}`);
                // Keep the first one, delete the rest
                for (let i = 1; i < subjects.length; i++) {
                    await Subject.findByIdAndDelete(subjects[i]._id);
                    deletedCount++;
                    console.log(`   ❌ Deleted duplicate: ${subjects[i]._id}`);
                }
            }
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   - Deleted: ${deletedCount} duplicate subjects`);
        console.log(`   - Remaining: ${allSubjects.length - deletedCount} unique subjects`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

cleanDuplicateSubjects();
