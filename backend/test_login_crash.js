require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const School = require('./models/School');
const Tenant = require('./models/Tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// LOGIC FROM authRoutes.js
async function testLoginLogic() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Hardcode a username to test.
        // I need a valid username. 'admin' is common.
        const username = 'admin';
        const password = 'password'; // Guessing, but logic should fail gracefully if wrong password, not 500.

        // Find user
        console.log(`Finding user: ${username}`);
        const validUser = await User.findOne({ username })
            .populate('school_id')
            .populate('tenant_id');

        console.log('User found:', validUser ? 'YES' : 'NO');
        if (validUser) {
            console.log('User details:', JSON.stringify(validUser, null, 2));

            // Test password compare
            // Note: if validUser.password is not a hash, bcrypt might error? 
            // Or if it's missing?
            console.log('Testing password comparison...');
            const match = await bcrypt.compare(password, validUser.password);
            console.log('Password match:', match);

            // Simulate the rest
            // Check if user is active
            if (!validUser.is_active) {
                console.log('User inactive');
                return;
            }

            // Get school info
            const schoolId = validUser.school_id ? validUser.school_id._id : null;
            const tenantId = validUser.tenant_id ? validUser.tenant_id._id : null;

            console.log('SchoolID:', schoolId);
            console.log('TenantID:', tenantId);

            let schoolName = 'Unknown School';
            if (validUser.tenant_id && validUser.tenant_id.school_name) {
                schoolName = validUser.tenant_id.school_name;
            } else if (validUser.school_id && validUser.school_id.school_name) {
                schoolName = validUser.school_id.school_name;
            }
            console.log('SchoolName:', schoolName);

            // Generate Token
            const token = jwt.sign(
                {
                    id: validUser._id,
                    role: validUser.role,
                    tenant_id: tenantId,
                    school_id: schoolId
                },
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '30d' }
            );
            console.log('Token generated successfully');
        }

    } catch (error) {
        console.error('CRASH DETECTED:');
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

testLoginLogic();
