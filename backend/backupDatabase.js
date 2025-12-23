require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Backup directory
const backupDir = 'd:\\Projects Backup\\school-backups\\backup-2025-12-23-162654\\mongodb';

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// MongoDB connection - try local first, then from .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management';

console.log('🔄 Starting MongoDB backup...');
console.log(`📁 Backup location: ${backupDir}`);
console.log(`🔗 Connecting to: ${MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`);

async function backupDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB successfully');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log(`\n📊 Found ${collections.length} collections to backup:\n`);

        let totalDocuments = 0;
        const backupSummary = {
            backupDate: new Date().toISOString(),
            mongoUri: MONGO_URI.replace(/\/\/.*@/, '//***:***@'),
            collections: []
        };

        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`  ⏳ Backing up: ${collectionName}...`);

            try {
                const data = await db.collection(collectionName).find({}).toArray();
                const filePath = path.join(backupDir, `${collectionName}.json`);

                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

                console.log(`  ✅ Saved ${data.length} documents from ${collectionName}`);
                totalDocuments += data.length;

                backupSummary.collections.push({
                    name: collectionName,
                    documentCount: data.length,
                    fileSize: fs.statSync(filePath).size
                });
            } catch (err) {
                console.error(`  ❌ Error backing up ${collectionName}:`, err.message);
            }
        }

        // Save backup summary
        fs.writeFileSync(
            path.join(backupDir, '_backup-summary.json'),
            JSON.stringify(backupSummary, null, 2),
            'utf8'
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ MongoDB backup completed successfully!');
        console.log('='.repeat(60));
        console.log(`📁 Backup location: ${backupDir}`);
        console.log(`📊 Total collections: ${collections.length}`);
        console.log(`📄 Total documents: ${totalDocuments}`);
        console.log('\n📋 Collections backed up:');
        backupSummary.collections.forEach(col => {
            const sizeMB = (col.fileSize / 1024 / 1024).toFixed(2);
            console.log(`   - ${col.name}: ${col.documentCount} documents (${sizeMB} MB)`);
        });
        console.log('='.repeat(60));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error during backup:', err.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure MongoDB is running');
        console.error('   2. Check your connection string in .env file');
        console.error('   3. Try: mongod --version (to verify MongoDB is installed)');
        process.exit(1);
    }
}

backupDatabase();
