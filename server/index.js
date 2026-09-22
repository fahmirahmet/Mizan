import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'mizan_db.json');

// Ensure directories exist on startup
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper: safe atomic write to file
function atomicWriteFileSync(filePath, content) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, content, 'utf8');
  fs.renameSync(tempPath, filePath);
}

// Helper: safe date string for filenames
function getTimestampString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${MM}-${dd}_${HH}-${mm}-${ss}`;
}

// Helper: get today's date string YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Helper: perform auto-backup snapshot
function performAutoBackup(jsonData) {
  try {
    const today = getTodayDateString();
    const dailyBackupFile = path.join(BACKUPS_DIR, `mizan_daily_${today}.json`);
    
    // Always keep the daily snapshot up to date
    atomicWriteFileSync(dailyBackupFile, jsonData);
  } catch (err) {
    console.error('[Mizan Server] Auto-backup error:', err);
  }
}

// 1. Health & Persistence Status
app.get('/api/status', (req, res) => {
  try {
    const exists = fs.existsSync(DB_FILE);
    let stats = null;
    let recordCounts = {};

    if (exists) {
      stats = fs.statSync(DB_FILE);
      try {
        const content = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        recordCounts = {
          salah: content.salahLogs?.length || 0,
          habits: content.habits?.length || 0,
          habitLogs: content.habitLogs?.length || 0,
          workouts: content.workouts?.length || 0,
          books: content.books?.length || 0,
          readingLogs: content.readingLogs?.length || 0,
          goals: content.goals?.length || 0,
          journal: content.journalEntries?.length || 0
        };
      } catch (e) {
        // file might be in write transit
      }
    }

    const backupFiles = fs.existsSync(BACKUPS_DIR) ? fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json')) : [];

    res.json({
      status: 'online',
      persistence: 'local_disk',
      dbFile: DB_FILE,
      exists,
      sizeBytes: stats ? stats.size : 0,
      lastModified: stats ? stats.mtime : null,
      backupCount: backupFiles.length,
      recordCounts
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Load all data from disk
app.get('/api/data', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return res.json({
        success: true,
        data: null,
        initialized: false,
        empty: true,
        message: 'No local disk database found yet.'
      });
    }

    const raw = fs.readFileSync(DB_FILE, 'utf8');
    if (!raw.trim()) {
      return res.json({
        success: true,
        data: null,
        initialized: false,
        empty: true,
        message: 'Local disk database file is empty.'
      });
    }

    const data = JSON.parse(raw);
    const hasRecords = (
      (data.salahLogs && data.salahLogs.length > 0) ||
      (data.habits && data.habits.length > 0) ||
      (data.workouts && data.workouts.length > 0) ||
      (data.books && data.books.length > 0) ||
      (data.goals && data.goals.length > 0) ||
      (data.journalEntries && data.journalEntries.length > 0)
    );

    return res.json({
      success: true,
      data,
      initialized: hasRecords,
      empty: !hasRecords,
      lastSaved: data.savedAt || null
    });
  } catch (err) {
    console.error('[Mizan Server] Error reading data:', err);
    res.status(500).json({ success: false, message: 'Failed to read database file: ' + err.message });
  }
});

// 3. Save / Sync data to disk
app.post('/api/save', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }

    const envelope = {
      version: 1,
      savedAt: new Date().toISOString(),
      salahLogs: Array.isArray(payload.salahLogs) ? payload.salahLogs : [],
      habits: Array.isArray(payload.habits) ? payload.habits : [],
      habitLogs: Array.isArray(payload.habitLogs) ? payload.habitLogs : [],
      workouts: Array.isArray(payload.workouts) ? payload.workouts : [],
      books: Array.isArray(payload.books) ? payload.books : [],
      readingLogs: Array.isArray(payload.readingLogs) ? payload.readingLogs : [],
      goals: Array.isArray(payload.goals) ? payload.goals : [],
      journalEntries: Array.isArray(payload.journalEntries) ? payload.journalEntries : [],
      settings: Array.isArray(payload.settings) ? payload.settings : []
    };

    const formatted = JSON.stringify(envelope, null, 2);
    atomicWriteFileSync(DB_FILE, formatted);

    // Maintain auto-backup snapshot
    performAutoBackup(formatted);

    return res.json({
      success: true,
      savedAt: envelope.savedAt,
      message: 'Successfully persisted data to disk.'
    });
  } catch (err) {
    console.error('[Mizan Server] Error saving data:', err);
    res.status(500).json({ success: false, message: 'Failed to write to disk: ' + err.message });
  }
});

// 4. Create on-demand timestamped disk backup
app.post('/api/backup', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return res.status(400).json({ success: false, message: 'No database file to backup.' });
    }

    const content = fs.readFileSync(DB_FILE, 'utf8');
    const timestamp = getTimestampString();
    const backupFileName = `mizan_backup_${timestamp}.json`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    atomicWriteFileSync(backupFilePath, content);

    const stats = fs.statSync(backupFilePath);
    res.json({
      success: true,
      filename: backupFileName,
      sizeBytes: stats.size,
      createdAt: new Date().toISOString(),
      message: `Backup created: ${backupFileName}`
    });
  } catch (err) {
    console.error('[Mizan Server] Error creating backup:', err);
    res.status(500).json({ success: false, message: 'Failed to create backup: ' + err.message });
  }
});

// 5. List available backups
app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const filePath = path.join(BACKUPS_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          sizeBytes: stats.size,
          createdAt: stats.birthtime || stats.mtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    res.json({ success: true, backups: files });
  } catch (err) {
    console.error('[Mizan Server] Error reading backups:', err);
    res.status(500).json({ success: false, message: 'Failed to list backups: ' + err.message });
  }
});

// 6. Restore from backup
app.post('/api/restore', (req, res) => {
  try {
    const { filename, rawJson } = req.body;
    let contentToRestore = null;

    if (filename) {
      // Validate safe filename (prevent path traversal)
      const cleanName = path.basename(filename);
      const filePath = path.join(BACKUPS_DIR, cleanName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Backup file not found.' });
      }
      contentToRestore = fs.readFileSync(filePath, 'utf8');
    } else if (rawJson) {
      contentToRestore = typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson, null, 2);
    } else {
      return res.status(400).json({ success: false, message: 'Provide either filename or rawJson.' });
    }

    // Validate JSON structure
    const parsed = JSON.parse(contentToRestore);
    if (!parsed || typeof parsed !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid backup JSON content.' });
    }

    // Safety backup of current state before overwrite
    if (fs.existsSync(DB_FILE)) {
      const preRestoreBackup = path.join(BACKUPS_DIR, `mizan_pre_restore_${getTimestampString()}.json`);
      fs.copyFileSync(DB_FILE, preRestoreBackup);
    }

    atomicWriteFileSync(DB_FILE, JSON.stringify(parsed, null, 2));

    res.json({
      success: true,
      data: parsed,
      restoredAt: new Date().toISOString(),
      message: 'Database restored successfully from backup.'
    });
  } catch (err) {
    console.error('[Mizan Server] Error restoring backup:', err);
    res.status(500).json({ success: false, message: 'Failed to restore: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Mizan Local Server] Running on http://localhost:${PORT}`);
  console.log(`[Mizan Local Server] Disk storage at: ${DB_FILE}`);
  console.log(`[Mizan Local Server] Backups storage at: ${BACKUPS_DIR}`);
});
