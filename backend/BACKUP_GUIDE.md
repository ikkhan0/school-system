# Backup and Restore Guide

## Prerequisites

Install MongoDB Database Tools:
```bash
# Download from: https://www.mongodb.com/try/download/database-tools
# Or install via package manager
```

## Create Backup

### Database Backup
```bash
cd backend
node scripts/backup-database.js
```

**What it does**:
- Creates timestamped backup in `backend/backups/backup-YYYY-MM-DD/`
- Keeps last 5 backups automatically
- Includes all collections and data

**Backup location**: `backend/backups/backup-2026-01-07/`

### Code Backup (Git)
```bash
# Commit all current changes
git add .
git commit -m "Backup: Before implementing custom student fees system"
git tag backup-$(date +%Y-%m-%d)
git push origin main --tags
```

## Restore Backup

### Restore Database
```bash
cd backend
node scripts/restore-database.js backup-2026-01-07
```

⚠️ **WARNING**: This will **delete all current data** and replace with backup!

### Restore Code
```bash
# List available backup tags
git tag -l "backup-*"

# Restore to specific backup
git checkout backup-2026-01-07

# Or restore specific files
git checkout <commit-hash> -- <file-path>
```

## Manual Backup (Alternative)

### MongoDB Atlas Cloud Backup
If using MongoDB Atlas:
1. Go to Atlas Dashboard
2. Navigate to your cluster
3. Click "Backup" tab
4. Create on-demand backup

### Local MongoDB Backup
```bash
mongodump --uri="your-mongodb-uri" --out="./backup-folder"
```

### Local MongoDB Restore
```bash
mongorestore --uri="your-mongodb-uri" --drop "./backup-folder"
```

## Backup Schedule

**Recommended**:
- Daily automatic backups (production)
- Before major deployments
- Before database migrations
- Before large data imports

## Best Practices

1. **Test restores**: Regularly test if backups can be restored
2. **Multiple locations**: Store backups in multiple locations (local + cloud)
3. **Retention**: Keep at least 7 daily, 4 weekly, 12 monthly backups
4. **Documentation**: Document what each backup contains
5. **Encryption**: Encrypt sensitive backups

## Backup Contents

Each backup includes:
- All database collections
- Indexes
- Users and permissions (if --oplog used)
- Current database state at backup time

## Troubleshooting

**Error: mongodump not found**
- Install MongoDB Database Tools
- Add to system PATH

**Error: Connection refused**
- Check MongoDB URI in .env
- Verify database is running
- Check network connection

**Large backup size**
- Consider compressing: `tar -czf backup.tar.gz backup-folder/`
- Use selective backup: `mongodump --collection=specific_collection`

## Recovery Scenarios

### Scenario 1: Accidental Data Deletion
```bash
# Restore from most recent backup
node scripts/restore-database.js backup-2026-01-07
```

### Scenario 2: Rollback Failed Migration
```bash
# 1. Restore database
node scripts/restore-database.js backup-before-migration

# 2. Restore code
git checkout backup-before-migration
```

### Scenario 3: Corrupted Data
```bash
# Restore from last known good backup
node scripts/restore-database.js backup-2026-01-06
```
