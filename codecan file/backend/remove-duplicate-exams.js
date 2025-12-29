const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school-system');

const Exam = require('./models/Exam');

async function removeDuplicateExams() {
    try {
        console.log('Starting duplicate exam removal...');

        // Get all exams
        const exams = await Exam.find({}).sort({ createdAt: 1 });
        console.log(`Found ${exams.length} total exams`);

        // Group by school_id and title
        const examGroups = {};

        exams.forEach(exam => {
            const key = `${exam.school_id}_${exam.title}`;
            if (!examGroups[key]) {
                examGroups[key] = [];
            }
            examGroups[key].push(exam);
        });

        // Find duplicates and keep only the first one
        let duplicatesRemoved = 0;

        for (const key in examGroups) {
            const group = examGroups[key];
            if (group.length > 1) {
                console.log(`\nFound ${group.length} duplicates for: ${group[0].title}`);

                // Keep the first exam (oldest), delete the rest
                for (let i = 1; i < group.length; i++) {
                    console.log(`  Removing duplicate: ${group[i]._id} (created: ${group[i].createdAt})`);
                    await Exam.findByIdAndDelete(group[i]._id);
                    duplicatesRemoved++;
                }
            }
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Total duplicates removed: ${duplicatesRemoved}`);
        console.log(`   Remaining exams: ${exams.length - duplicatesRemoved}`);

        // Drop the old index if it exists
        try {
            await Exam.collection.dropIndex('tenant_id_1_title_1');
            console.log('✅ Dropped old tenant_id index');
        } catch (err) {
            console.log('ℹ️  Old index not found (this is okay)');
        }

        // Ensure the new unique index is created
        await Exam.collection.createIndex({ school_id: 1, title: 1 }, { unique: true });
        console.log('✅ Created new school_id unique index');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

removeDuplicateExams();
