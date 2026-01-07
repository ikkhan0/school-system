const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().split('T')[0];
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
}

async function backupDatabase() {
    try {
        console.log('🔄 Starting Database Backup...');
        console.log('📁 Backup Location:', backupPath);
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections\n`);

        let totalDocuments = 0;

        // Export each collection
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`📦 Exporting: ${collectionName}...`);

            try {
                const collection = mongoose.connection.db.collection(collectionName);
                const documents = await collection.find({}).toArray();

                // Save to JSON file
                const filePath = path.join(backupPath, `${collectionName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

                console.log(`   ✅ Exported ${documents.length} documents`);
                totalDocuments += documents.length;
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅ Backup Complete!');
        console.log(`📊 Total Collections: ${collections.length}`);
        console.log(`📄 Total Documents: ${totalDocuments}`);
        console.log(`💾 Backup Location: ${backupPath}`);
        console.log('═══════════════════════════════════════');

        // Create backup info file
        const backupInfo = {
            date: new Date().toISOString(),
            collections: collections.length,
            totalDocuments: totalDocuments,
            collections_list: collections.map(c => c.name)
        };
        fs.writeFileSync(
            path.join(backupPath, '_backup_info.json'),
            JSON.stringify(backupInfo, null, 2)
        );

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

backupDatabase();
