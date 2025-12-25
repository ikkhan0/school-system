const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const AcademicSession = require('../models/AcademicSession');
const Student = require('../models/Student');

async function checkMigration() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        // Check sessions
        const sessions = await AcademicSession.find({});
        console.log(`📊 Found ${sessions.length} academic sessions:`);
        sessions.forEach(s => {
            console.log(`   - ${s.session_name} (${s.is_current ? 'CURRENT' : 'not current'})`);
        });

        // Check students with session
        const studentsWithSession = await Student.countDocuments({ current_session_id: { $exists: true } });
        const totalStudents = await Student.countDocuments({});
        console.log(`\n👥 Students: ${studentsWithSession}/${totalStudents} have session assigned`);

        if (sessions.length > 0 && studentsWithSession > 0) {
            console.log('\n✅ Migration appears to have succeeded!');
        } else {
            console.log('\n⚠️  Migration may not have completed');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkMigration();
