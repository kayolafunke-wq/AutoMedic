const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Automated SQLite Database Backup Script
 * Creates timestamped backups and maintains retention policy
 */

const DB_PATH = path.join(__dirname, '..', 'automedic.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // Keep last 30 backups

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✅ Created backup directory');
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
const dateStr = timestamp[0];
const timeStr = timestamp[1].split('-')[0];
const backupFilename = `automedic-backup-${dateStr}-${timeStr}.db`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

try {
  // Check if source database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Source database not found:', DB_PATH);
    process.exit(1);
  }

  // Copy database file (SQLite backup)
  fs.copyFileSync(DB_PATH, backupPath);
  
  // Verify backup
  const originalSize = fs.statSync(DB_PATH).size;
  const backupSize = fs.statSync(backupPath).size;
  
  if (backupSize === originalSize) {
    console.log('✅ Database backup created successfully!');
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
  } else {
    throw new Error('Backup size mismatch');
  }

  // Cleanup old backups
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('automedic-backup-') && file.endsWith('.db'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by newest first

  if (backupFiles.length > MAX_BACKUPS) {
    const filesToDelete = backupFiles.slice(MAX_BACKUPS);
    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    });
  }

  console.log(`\n📚 Total backups: ${Math.min(backupFiles.length, MAX_BACKUPS)}`);
  
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}
