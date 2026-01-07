const mongoose = require('mongoose');
require('dotenv').config();

const WhatsappTemplate = require('../models/WhatsappTemplate');

const MONGO_URI = process.env.MONGO_URI;

async function cleanupDuplicateTemplates() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Find all duplicate templates (same tenant_id + name)
        const duplicates = await WhatsappTemplate.aggregate([
            {
                $group: {
                    _id: { tenant_id: '$tenant_id', name: '$name' },
                    ids: { $push: '$_id' },
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        console.log(`\n🔍 Found ${duplicates.length} sets of duplicate templates\n`);

        if (duplicates.length === 0) {
            console.log('✅ No duplicates found!');
            process.exit(0);
        }

        let totalRemoved = 0;

        for (const dup of duplicates) {
            const { tenant_id, name } = dup._id;
            const docs = dup.docs;

            console.log(`\n📋 Template: "${name}" (Tenant: ${tenant_id || 'System Default'})`);
            console.log(`   Found ${docs.length} duplicates:`);

            docs.forEach((doc, index) => {
                console.log(`   ${index + 1}. ID: ${doc._id}, Created: ${doc.createdAt}, Active: ${doc.isActive}`);
            });

            // Sort by createdAt descending (newest first)
            docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Keep the newest one, delete the rest
            const keepId = docs[0]._id;
            const deleteIds = docs.slice(1).map(d => d._id);

            console.log(`   ✅ Keeping: ${keepId} (newest)`);
            console.log(`   ❌ Deleting: ${deleteIds.length} duplicate(s)`);

            // Delete duplicates
            const result = await WhatsappTemplate.deleteMany({ _id: { $in: deleteIds } });
            totalRemoved += result.deletedCount;
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Removed ${totalRemoved} duplicate templates`);
        console.log(`   Kept ${duplicates.length} unique templates\n`);

        // Verify unique index exists
        const indexes = await WhatsappTemplate.collection.getIndexes();
        console.log('📊 Current indexes on WhatsappTemplate:');
        Object.keys(indexes).forEach(key => {
            console.log(`   - ${key}: ${JSON.stringify(indexes[key])}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupDuplicateTemplates();
