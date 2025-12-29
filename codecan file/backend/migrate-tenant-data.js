require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Fee = require('./models/Fee');
const Staff = require('./models/Staff');
const Exam = require('./models/Exam');
const Family = require('./models/Family');
const School = require('./models/School');
const Tenant = require('./models/Tenant');

async function migrateTenantData() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management');
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Map school_id to tenant_id
        console.log('Step 1: Mapping schools to tenants...');
        const schools = await School.find();
        const schoolToTenantMap = {};

        for (const school of schools) {
            // Find tenant by school name
            const tenant = await Tenant.findOne({ school_name: school.school_name });
            if (tenant) {
                schoolToTenantMap[school._id.toString()] = tenant._id;
                console.log(`  ${school.school_name} -> ${tenant.tenant_id}`);
            } else {
                console.log(`  ⚠️  No tenant found for ${school.school_name}`);
            }
        }

        console.log(`\nFound ${Object.keys(schoolToTenantMap).length} school-to-tenant mappings\n`);

        // Step 2: Update Students
        console.log('Step 2: Updating Students...');
        const students = await Student.find({ tenant_id: null });
        let studentCount = 0;
        for (const student of students) {
            if (student.school_id) {
                const tenantId = schoolToTenantMap[student.school_id.toString()];
                if (tenantId) {
                    student.tenant_id = tenantId;
                    await student.save();
                    studentCount++;
                }
            }
        }
        console.log(`  Updated ${studentCount} students\n`);

        // Step 3: Update Classes
        console.log('Step 3: Updating Classes...');
        const classes = await Class.find({ tenant_id: null });
        let classCount = 0;
        for (const cls of classes) {
            if (cls.school_id) {
                const tenantId = schoolToTenantMap[cls.school_id.toString()];
                if (tenantId) {
                    cls.tenant_id = tenantId;
                    await cls.save();
                    classCount++;
                }
            }
        }
        console.log(`  Updated ${classCount} classes\n`);

        // Step 4: Update Fees
        console.log('Step 4: Updating Fees...');
        const fees = await Fee.find({ tenant_id: null });
        let feeCount = 0;
        for (const fee of fees) {
            if (fee.school_id) {
                const tenantId = schoolToTenantMap[fee.school_id.toString()];
                if (tenantId) {
                    fee.tenant_id = tenantId;
                    await fee.save();
                    feeCount++;
                }
            }
        }
        console.log(`  Updated ${feeCount} fees\n`);

        // Step 5: Update Staff
        console.log('Step 5: Updating Staff...');
        const staff = await Staff.find({ tenant_id: null });
        let staffCount = 0;
        for (const s of staff) {
            if (s.school_id) {
                const tenantId = schoolToTenantMap[s.school_id.toString()];
                if (tenantId) {
                    s.tenant_id = tenantId;
                    await s.save();
                    staffCount++;
                }
            }
        }
        console.log(`  Updated ${staffCount} staff\n`);

        // Step 6: Update Exams
        console.log('Step 6: Updating Exams...');
        const exams = await Exam.find({ tenant_id: null });
        let examCount = 0;
        for (const exam of exams) {
            if (exam.school_id) {
                const tenantId = schoolToTenantMap[exam.school_id.toString()];
                if (tenantId) {
                    exam.tenant_id = tenantId;
                    await exam.save();
                    examCount++;
                }
            }
        }
        console.log(`  Updated ${examCount} exams\n`);

        // Step 7: Update Families
        console.log('Step 7: Updating Families...');
        const families = await Family.find({ tenant_id: null });
        let familyCount = 0;
        for (const family of families) {
            if (family.school_id) {
                const tenantId = schoolToTenantMap[family.school_id.toString()];
                if (tenantId) {
                    family.tenant_id = tenantId;
                    await family.save();
                    familyCount++;
                }
            }
        }
        console.log(`  Updated ${familyCount} families\n`);

        // Step 8: Update Subjects
        console.log('Step 8: Updating Subjects...');
        const Subject = require('./models/Subject');
        const subjects = await Subject.find({ tenant_id: null });
        let subjectCount = 0;
        for (const subject of subjects) {
            if (subject.school_id) {
                const tenantId = schoolToTenantMap[subject.school_id.toString()];
                if (tenantId) {
                    subject.tenant_id = tenantId;
                    await subject.save();
                    subjectCount++;
                }
            }
        }
        console.log(`  Updated ${subjectCount} subjects\n`);

        console.log('='.repeat(70));
        console.log('✅ Migration Complete!');
        console.log('='.repeat(70));
        console.log(`Students: ${studentCount}`);
        console.log(`Classes: ${classCount}`);
        console.log(`Fees: ${feeCount}`);
        console.log(`Staff: ${staffCount}`);
        console.log(`Exams: ${examCount}`);
        console.log(`Families: ${familyCount}`);
        console.log(`Subjects: ${subjectCount}`);
        console.log('');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateTenantData();
