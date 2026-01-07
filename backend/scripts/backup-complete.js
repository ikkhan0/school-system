const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

// Backup directory outside project
const PROJECT_ROOT = path.join(__dirname, '../../');
const BACKUP_BASE = path.join(PROJECT_ROOT, '../school-backups');
const timestamp = new Date().toISOString().split('T')[0];
const BACKUP_DIR = path.join(BACKUP_BASE, `backup-${timestamp}`);

console.log('═══════════════════════════════════════════════════════');
console.log('🔄 COMPLETE SCHOOL SYSTEM BACKUP');
console.log('═══════════════════════════════════════════════════════');
console.log('📅 Date:', new Date().toLocaleString());
console.log('📁 Backup Location:', BACKUP_DIR);
console.log('');

// Create backup directories
if (!fs.existsSync(BACKUP_BASE)) {
    fs.mkdirSync(BACKUP_BASE, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createCompleteBackup() {
    try {
        // Step 1: Backup Database
        console.log('📦 STEP 1/3: Backing up Database...');
        console.log('─────────────────────────────────────');

        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const dbBackupPath = path.join(BACKUP_DIR, 'database');
        fs.mkdirSync(dbBackupPath, { recursive: true });

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections`);

        let totalDocs = 0;
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            const collection = mongoose.connection.db.collection(collectionName);
            const documents = await collection.find({}).toArray();

            const filePath = path.join(dbBackupPath, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

            console.log(`   ✅ ${collectionName}: ${documents.length} documents`);
            totalDocs += documents.length;
        }

        // Save backup metadata
        const backupInfo = {
            date: new Date().toISOString(),
            collections: collections.length,
            totalDocuments: totalDocs,
            collections_list: collections.map(c => c.name)
        };
        fs.writeFileSync(
            path.join(dbBackupPath, '_backup_info.json'),
            JSON.stringify(backupInfo, null, 2)
        );

        await mongoose.connection.close();
        console.log(`✅ Database backup complete: ${totalDocs} documents\n`);

        // Step 2: Backup Backend
        console.log('📦 STEP 2/3: Backing up Backend Code...');
        console.log('─────────────────────────────────────');

        const backendSource = path.join(PROJECT_ROOT, 'backend');
        const backendDest = path.join(BACKUP_DIR, 'backend');

        console.log('   Copying backend files...');
        copyFolderRecursive(backendSource, backendDest, [
            'node_modules',
            'backups',
            '.env',
            'package-lock.json'
        ]);

        // Copy important files
        if (fs.existsSync(path.join(backendSource, '.env'))) {
            fs.copyFileSync(
                path.join(backendSource, '.env'),
                path.join(backendDest, '.env.example')
            );
        }

        console.log('✅ Backend code backed up\n');

        // Step 3: Backup Frontend
        console.log('📦 STEP 3/3: Backing up Frontend Code...');
        console.log('─────────────────────────────────────');

        const frontendSource = path.join(PROJECT_ROOT, 'frontend');
        const frontendDest = path.join(BACKUP_DIR, 'frontend');

        console.log('   Copying frontend files...');
        copyFolderRecursive(frontendSource, frontendDest, [
            'node_modules',
            'dist',
            'build',
            '.next',
            'package-lock.json'
        ]);

        console.log('✅ Frontend code backed up\n');

        // Step 4: Create README
        const readmeContent = `# School System Backup - ${timestamp}

## Backup Information
- **Date**: ${new Date().toLocaleString()}
- **Database Collections**: ${collections.length}
- **Total Documents**: ${totalDocs}

## Contents
- \`database/\` - All MongoDB collections as JSON files
- \`backend/\` - All backend code (Node.js/Express)
- \`frontend/\` - All frontend code (React)

## How to Restore

### 1. Restore Database
\`\`\`bash
cd backend
node scripts/restore-database.js ../school-backups/backup-${timestamp}/database
\`\`\`

### 2. Restore Code
\`\`\`bash
# Copy files back
cp -r backup-${timestamp}/backend/* school/backend/
cp -r backup-${timestamp}/frontend/* school/frontend/

# Reinstall dependencies
cd school/backend && npm install
cd ../frontend && npm install
\`\`\`

### 3. Configure Environment
- Copy \`.env.example\` to \`.env\` in backend
- Update MongoDB connection string
- Update API URLs if needed

## Collections Backed Up
${collections.map(c => `- ${c.name}`).join('\n')}

## Git Commit Reference
Tag: backup-before-custom-fees-2026-01-07
Commit: Latest commit at backup time

---
**Backup created by**: School Management System Backup Tool
**Total Size**: ${getFolderSize(BACKUP_DIR)}
`;

        fs.writeFileSync(path.join(BACKUP_DIR, 'README.md'), readmeContent);

        // Final Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ BACKUP COMPLETE!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 Summary:');
        console.log(`   Database: ${totalDocs} documents in ${collections.length} collections`);
        console.log(`   Backend: All code files`);
        console.log(`   Frontend: All code files`);
        console.log('');
        console.log('💾 Backup Location:');
        console.log(`   ${BACKUP_DIR}`);
        console.log('');
        console.log('📝 Contains:');
        console.log(`   ├── database/ (${collections.length} JSON files)`);
        console.log(`   ├── backend/ (all code)`);
        console.log(`   ├── frontend/ (all code)`);
        console.log(`   └── README.md (restore instructions)`);
        console.log('');
        console.log('🔒 This is a COMPLETE backup - safe to implement changes!');
        console.log('═══════════════════════════════════════════════════════');

        process.exit(0);

    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

function copyFolderRecursive(source, target, excludes = []) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);

    files.forEach(file => {
        // Skip excluded files/folders
        if (excludes.includes(file)) return;

        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyFolderRecursive(sourcePath, targetPath, excludes);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

function getFolderSize(folderPath) {
    let totalSize = 0;

    function calculateSize(dirPath) {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                calculateSize(filePath);
            } else {
                totalSize += stats.size;
            }
        });
    }

    calculateSize(folderPath);

    // Convert to human readable
    if (totalSize < 1024) return totalSize + ' B';
    if (totalSize < 1024 * 1024) return (totalSize / 1024).toFixed(2) + ' KB';
    if (totalSize < 1024 * 1024 * 1024) return (totalSize / (1024 * 1024)).toFixed(2) + ' MB';
    return (totalSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

createCompleteBackup();
