// Fix user "imran" role in database
// Run this in backend directory: node fix_imran_role.js

const mongoose = require('mongoose');
const User = require('./models/User');

async function fixImranRole() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'YOUR_MONGO_URI_HERE');

        console.log('Connected to MongoDB');

        // Find user imran
        const user = await User.findOne({ username: 'imran' });

        if (!user) {
            console.log('User "imran" not found');
            return;
        }

        console.log('BEFORE:');
        console.log('Username:', user.username);
        console.log('Role:', user.role);
        console.log('Permissions:', user.permissions);

        // Update role to teacher
        user.role = 'teacher';
        await user.save();

        console.log('\nAFTER UPDATE:');
        console.log('Username:', user.username);
        console.log('Role:', user.role);
        console.log('Permissions:', user.permissions);

        console.log('\n✅ User role updated successfully!');
        console.log('Now logout and login again as imran');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

fixImranRole();
