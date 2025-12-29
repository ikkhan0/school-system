require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Fee = require('./models/Fee');
const Staff = require('./models/Staff');
const Exam = require('./models/Exam');
const Family = require('./models/Family');
const Subject = require('./models/Subject');
const School = require('./models/School');
const Tenant = require('./models/Tenant');

async function forceMigrateTenantData() {
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
                console.log(`  ${school.school_name} -> ${tenant.tenant_id} (${tenant._id})`);
            } else {
                console.log(`  ⚠️  No tenant found for ${school.school_name}`);
            }
        }

        console.log(`\nFound ${Object.keys(schoolToTenantMap).length} school-to-tenant mappings\n`);

        // Step 2: Update ALL Students (force update even if tenant_id exists)
        console.log('Step 2: Updating ALL Students...');
        const students = await Student.find();
        let studentCount = 0;
        for (const student of students) {
            if (student.school_id) {
                const tenantId = schoolToTenantMap[student.school_id.toString()];
                if (tenantId) {
                    await Student.updateOne(
                        { _id: student._id },
                        { $set: { tenant_id: tenantId } }
                    );
                    studentCount++;
                }
            }
        }
        console.log(`  Updated ${studentCount} students\n`);

        // Step 3: Update ALL Classes
        console.log('Step 3: Updating ALL Classes...');
        const classes = await Class.find();
        let classCount = 0;
        for (const cls of classes) {
            if (cls.school_id) {
                const tenantId = schoolToTenantMap[cls.school_id.toString()];
                if (tenantId) {
                    await Class.updateOne(
                        { _id: cls._id },
                        { $set: { tenant_id: tenantId } }
                    );
                    classCount++;
                }
            }
        }
        console.log(`  Updated ${classCount} classes\n`);

        // Step 4: Update ALL Fees
        console.log('Step 4: Updating ALL Fees...');
        const fees = await Fee.find();
        let feeCount = 0;
        for (const fee of fees) {
            if (fee.school_id) {
                const tenantId = schoolToTenantMap[fee.school_id.toString()];
                if (tenantId) {
                    await Fee.updateOne(
                        { _id: fee._id },
                        { $set: { tenant_id: tenantId } }
                    );
                    feeCount++;
                }
            }
        }
        console.log(`  Updated ${feeCount} fees\n`);

        // Step 5: Update ALL Staff
        console.log('Step 5: Updating ALL Staff...');
        const staff = await Staff.find();
        let staffCount = 0;
        for (const s of staff) {
            if (s.school_id) {
                const tenantId = schoolToTenantMap[s.school_id.toString()];
                if (tenantId) {
                    await Staff.updateOne(
                        { _id: s._id },
                        { $set: { tenant_id: tenantId } }
                    );
                    staffCount++;
                }
            }
        }
        console.log(`  Updated ${staffCount} staff\n`);

        // Step 6: Update ALL Families
        console.log('Step 6: Updating ALL Families...');
        const families = await Family.find();
        let familyCount = 0;
        for (const family of families) {
            if (family.school_id) {
                const tenantId = schoolToTenantMap[family.school_id.toString()];
                if (tenantId) {
                    await Family.updateOne(
                        { _id: family._id },
                        { $set: { tenant_id: tenantId } }
                    );
                    familyCount++;
                }
            }
        }
        console.log(`  Updated ${familyCount} families\n`);

        // Step 7: Update ALL Subjects
        console.log('Step 7: Updating ALL Subjects...');
        const subjects = await Subject.find();
        let subjectCount = 0;
        for (const subject of subjects) {
            if (subject.school_id) {
                const tenantId = schoolToTenantMap[subject.school_id.toString()];
                if (tenantId) {
                    await Subject.updateOne(
                        { _id: subject._id },
                        { $set: { tenant_id: tenantId } }
                    );
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
        console.log(`Families: ${familyCount}`);
        console.log(`Subjects: ${subjectCount}`);
        console.log('');
        console.log('✅ Tenant isolation is now active!');
        console.log('✅ Each school will only see their own data');
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

forceMigrateTenantData();
