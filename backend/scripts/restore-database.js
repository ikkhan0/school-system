const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (process.argv.length < 3) {
    console.log('❌ Usage: node restore-database.js <backup-folder-name>');
    console.log('📂 Example: node restore-database.js backup-2026-01-07');
    console.log('\nAvailable backups:');

    const backupDir = path.join(__dirname, '../backups');
    if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-'))
            .sort()
            .reverse();
        backups.forEach(b => {
            const infoPath = path.join(backupDir, b, '_backup_info.json');
            if (fs.existsSync(infoPath)) {
                const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                console.log(`  📁 ${b} - ${info.totalDocuments} documents (${info.date})`);
            } else {
                console.log(`  📁 ${b}`);
            }
        });
    } else {
        console.log('  No backups found.');
    }
    process.exit(1);
}

const backupName = process.argv[2];
const backupPath = path.join(__dirname, '../backups', backupName);

if (!fs.existsSync(backupPath)) {
    console.log('❌ Backup folder not found:', backupPath);
    process.exit(1);
}

async function restoreDatabase() {
    try {
        console.log('⚠️  WARNING: This will DELETE all current data!');
        console.log('🔄 Restoring from:', backupPath);
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all JSON files in backup directory
        const files = fs.readdirSync(backupPath)
            .filter(f => f.endsWith('.json') && f !== '_backup_info.json');

        console.log(`📦 Found ${files.length} collections to restore\n`);

        let totalRestored = 0;

        for (const file of files) {
            const collectionName = file.replace('.json', '');
            console.log(`📥 Restoring: ${collectionName}...`);

            try {
                const filePath = path.join(backupPath, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                const collection = mongoose.connection.db.collection(collectionName);

                // Drop existing collection
                await collection.drop().catch(() => { });

                // Insert backup data
                if (data.length > 0) {
                    await collection.insertMany(data);
                }

                console.log(`   ✅ Restored ${data.length} documents`);
                totalRestored += data.length;
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅ Restore Complete!');
        console.log(`📊 Collections Restored: ${files.length}`);
        console.log(`📄 Total Documents: ${totalRestored}`);
        console.log('═══════════════════════════════════════');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Restore failed:', error.message);
        process.exit(1);
    }
}

console.log('⏳ Starting restore in 3 seconds... Press Ctrl+C to cancel');
setTimeout(restoreDatabase, 3000);
