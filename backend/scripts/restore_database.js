const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Database Restore Script
 * Restores database from a backup file
 */

const DB_PATH = path.join(__dirname, '..', 'automedic.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// List available backups
const backupFiles = fs.readdirSync(BACKUP_DIR)
  .filter(file => file.startsWith('automedic-backup-') && file.endsWith('.db'))
  .map(file => ({
    name: file,
    path: path.join(BACKUP_DIR, file),
    time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
  }))
  .sort((a, b) => b.time - a.time);

if (backupFiles.length === 0) {
  console.error('❌ No backup files found in:', BACKUP_DIR);
  process.exit(1);
}

console.log('\n📚 Available backups:\n');
backupFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.name}`);
  console.log(`   Created: ${file.time.toLocaleString()}`);
  console.log(`   Size: ${(fs.statSync(file.path).size / 1024 / 1024).toFixed(2)} MB\n`);
});

rl.question('Enter backup number to restore (or 0 to cancel): ', (answer) => {
  const selection = parseInt(answer);
  
  if (selection === 0 || isNaN(selection)) {
    console.log('❌ Restore cancelled');
    rl.close();
    process.exit(0);
  }

  if (selection < 1 || selection > backupFiles.length) {
    console.error('❌ Invalid selection');
    rl.close();
    process.exit(1);
  }

  const selectedBackup = backupFiles[selection - 1];
  
  rl.question(`\n⚠️  This will replace the current database. Continue? (yes/no): `, (confirm) => {
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      rl.close();
      process.exit(0);
    }

    try {
      // Create backup of current database before restoring
      if (fs.existsSync(DB_PATH)) {
        const preRestoreBackup = path.join(BACKUP_DIR, `pre-restore-${Date.now()}.db`);
        fs.copyFileSync(DB_PATH, preRestoreBackup);
        console.log('✅ Created pre-restore backup');
      }

      // Restore from backup
      fs.copyFileSync(selectedBackup.path, DB_PATH);
      
      console.log('\n✅ Database restored successfully!');
      console.log(`📁 Restored from: ${selectedBackup.name}`);
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    }
    
    rl.close();
  });
});
