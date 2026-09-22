import React, { useRef, useState, useEffect } from 'react';
import {
  Sliders,
  Download,
  Upload,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  HardDrive,
  AlertTriangle,
  FileCheck,
  X,
  Smartphone,
  Laptop,
  Share2,
  Wifi,
  Sparkles,
  ArrowDownToLine,
  Save,
  FolderArchive,
  History,
  Check,
  Clock
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { usePWA } from '../hooks/usePWA';
import { format, parseISO } from 'date-fns';

export function SettingsView() {
  const {
    salahHistory,
    allHabits,
    allWorkouts,
    books,
    allGoals,
    recentJournalEntries,
    diskSyncStatus,
    lastSavedTime,
    syncAllToDisk,
    createDiskBackup,
    fetchDiskBackups,
    restoreFromDiskBackup,
    fetchDiskStatus,
    seedSampleData,
    resetAllData,
    exportDataJSON,
    importDataJSON,
    showToast
  } = useStorage();

  const { canInstall, isInstalled, isStandalone, isIOS, promptInstall } = usePWA();
  const fileInputRef = useRef(null);
  
  const [importPreview, setImportPreview] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  
  // Disk Backups & Status
  const [diskStatus, setDiskStatus] = useState(null);
  const [diskBackups, setDiskBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSavingDisk, setIsSavingDisk] = useState(false);

  // Load disk status and backups
  const loadDiskInfo = async () => {
    setLoadingBackups(true);
    try {
      const [status, backups] = await Promise.all([
        fetchDiskStatus(),
        fetchDiskBackups()
      ]);
      setDiskStatus(status);
      setDiskBackups(backups);
    } catch (e) {
      console.warn('Failed loading disk info:', e);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    loadDiskInfo();
  }, [diskSyncStatus]);

  const handleManualSaveToDisk = async () => {
    setIsSavingDisk(true);
    await syncAllToDisk(true);
    await loadDiskInfo();
    setIsSavingDisk(false);
    showToast('Saved all records directly to PC filesystem (data/mizan_db.json)!', 'success');
  };

  const handleCreateDiskBackup = async () => {
    setIsBackingUp(true);
    const result = await createDiskBackup();
    if (result) {
      await loadDiskInfo();
    }
    setIsBackingUp(false);
  };

  const handleConfirmRestoreDiskBackup = async () => {
    if (!selectedBackupToRestore) return;
    const success = await restoreFromDiskBackup(selectedBackupToRestore.filename);
    if (success) {
      setIsRestoreModalOpen(false);
      setSelectedBackupToRestore(null);
      await loadDiskInfo();
    }
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    const success = await promptInstall();
    setInstalling(false);
    if (success) {
      showToast('Mizan installed successfully!', 'success');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text);

        // Validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON file format.');
        }

        const counts = {
          salah: parsed.salahLogs?.length || 0,
          habits: parsed.habits?.length || 0,
          workouts: parsed.workouts?.length || 0,
          books: parsed.books?.length || 0,
          goals: parsed.goals?.length || 0,
          journal: parsed.journalEntries?.length || 0,
          rawJson: text
        };

        setImportPreview(counts);
        setIsImportModalOpen(true);
      } catch (err) {
        showToast('Invalid backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.rawJson) return;
    await importDataJSON(importPreview.rawJson);
    setIsImportModalOpen(false);
    setImportPreview(null);
    await loadDiskInfo();
  };

  const handleSeedClick = () => {
    if (window.confirm('This will load realistic demo records for all modules (Salah, Habits, Workouts, Reading, 5-Tier Planner, and Journals) and persist them directly to disk. Proceed?')) {
      seedSampleData();
      loadDiskInfo();
    }
  };

  const handleResetClick = () => {
    if (window.confirm('WARNING: Are you sure you want to erase all data in Mizan? This cannot be undone unless you have a disk backup.')) {
      resetAllData();
      loadDiskInfo();
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-slate-400" />
          Data Management & Local Persistence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Your life data is saved directly to your PC filesystem (<code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded">data/mizan_db.json</code>) with automated daily snapshots in <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded">backups/</code>.
        </p>
      </div>

      {/* 1. Permanent Local Backend & Disk Persistence Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Local Disk Persistence (SSOT)
              </h2>
              <p className="text-xs text-slate-400">
                Single Source of Truth on PC Filesystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {diskSyncStatus === 'synced' ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Disk Connected & Synced
              </span>
            ) : diskSyncStatus === 'syncing' ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-950/80 border border-sky-700/80 text-sky-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                Writing to Disk...
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                IndexedDB Fallback Mode
              </span>
            )}
          </div>
        </div>

        {/* Disk stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Primary Database File</span>
            <span className="text-xs font-mono font-bold text-emerald-300 block truncate mt-1" title={diskStatus?.dbFile || 'data/mizan_db.json'}>
              data/mizan_db.json
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {diskStatus?.sizeBytes ? `${(diskStatus.sizeBytes / 1024).toFixed(1)} KB on disk` : 'Initialized'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Last Saved to Disk</span>
            <span className="text-xs font-bold text-slate-200 block mt-1">
              {lastSavedTime ? format(parseISO(lastSavedTime), 'MMM d, yyyy · HH:mm:ss') : (diskStatus?.lastModified ? format(new Date(diskStatus.lastModified), 'MMM d, yyyy · HH:mm:ss') : 'Just now')}
            </span>
            <span className="text-[11px] text-emerald-400 mt-1 block flex items-center gap-1">
              <Check className="w-3 h-3" /> Auto-saved on every change
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Automated Backups</span>
            <span className="text-lg font-bold text-indigo-400 block mt-0.5">
              {diskBackups.length} snapshots
            </span>
            <span className="text-[11px] text-slate-400 block">
              Saved in <code className="text-slate-300 font-mono">backups/</code> folder
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleManualSaveToDisk}
            disabled={isSavingDisk}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSavingDisk ? 'Flushing to Disk...' : 'Force Flush to Disk Now'}
          </button>

          <button
            onClick={handleCreateDiskBackup}
            disabled={isBackingUp}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <FolderArchive className="w-4 h-4 text-indigo-400" />
            {isBackingUp ? 'Creating Backup...' : 'Create Timestamped Disk Backup'}
          </button>
        </div>
      </div>

      {/* 2. Automated Disk Backups List */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Local Disk Backups (PC Filesystem)
          </h2>
          <button
            onClick={loadDiskInfo}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
            title="Refresh backups list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <p className="text-xs text-slate-400">
          The backend automatically captures daily snapshots and manual backups into the <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded font-mono">backups/</code> directory on your computer.
        </p>

        {diskBackups.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No backup snapshots found in <code className="text-slate-300 font-mono">backups/</code> yet.</p>
            <button
              onClick={handleCreateDiskBackup}
              disabled={isBackingUp}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors inline-flex items-center gap-1.5"
            >
              <FolderArchive className="w-3.5 h-3.5" /> Create First Disk Backup
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {diskBackups.map((b) => (
              <div
                key={b.filename}
                className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between gap-3 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-slate-200 truncate">{b.filename}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span><Clock className="w-3 h-3 inline mr-1 text-slate-500" />{format(new Date(b.modifiedAt), 'MMM d, yyyy · HH:mm:ss')}</span>
                      <span>·</span>
                      <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBackupToRestore(b);
                    setIsRestoreModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Live Record Statistics */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Active Records Overview
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> High Integrity
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Salah Records</span>
            <span className="text-lg font-bold text-slate-100">{salahHistory?.length || 0} logs</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Active Habits</span>
            <span className="text-lg font-bold text-slate-100">{allHabits?.length || 0} habits</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Workouts Logged</span>
            <span className="text-lg font-bold text-slate-100">{allWorkouts?.length || 0} entries</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Library Books</span>
            <span className="text-lg font-bold text-slate-100">{books?.length || 0} books</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">5-Tier Goals</span>
            <span className="text-lg font-bold text-slate-100">{allGoals?.length || 0} items</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Journal Entries</span>
            <span className="text-lg font-bold text-slate-100">{recentJournalEntries?.length || 0} reflections</span>
          </div>
        </div>
      </div>

      {/* 4. Manual Browser Export & Import */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-400" />
          JSON Download & Upload (Portability)
        </h2>
        <p className="text-xs text-slate-400">
          Export a standalone backup JSON file to download through your browser, or import a JSON file from another machine.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={exportDataJSON}
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Download JSON File</h3>
              <p className="text-xs text-slate-400 mt-0.5">Download full snapshot to your browser's Downloads folder.</p>
            </div>
          </button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all flex items-start gap-3.5 group"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Upload & Restore JSON File</h3>
                <p className="text-xs text-slate-400 mt-0.5">Import a JSON backup from your computer and sync to disk.</p>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSeedClick}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
            Reset / Load Realistic Sample Data
          </button>
        </div>
      </div>

      {/* 5. PWA & Device Installation Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            Progressive Web App & Offline Access
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" /> 100% Offline Ready
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Mizan runs with ultra-low latency and works offline. Install it as a standalone app on your desktop, iPhone, or Android device.
          </p>

          {isStandalone || isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300">Mizan is Installed on this Device</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Running in standalone application mode with automatic offline background caching.
                </p>
              </div>
            </div>
          ) : canInstall ? (
            <div className="p-4 rounded-xl bg-slate-800/70 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Install Mizan App
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      1-Tap Install
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add Mizan to your home screen or dock for instant startup and zero browser chrome.
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                {installing ? 'Installing...' : 'Install App Now'}
              </button>
            </div>
          ) : isIOS ? (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-slate-200">How to Install on iOS (iPhone / iPad):</h3>
                <ol className="list-decimal list-inside text-slate-400 space-y-0.5">
                  <li>Tap the <strong className="text-slate-200">Share</strong> button (box with upward arrow) at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong className="text-slate-200">"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong className="text-slate-200">Add</strong> in the top-right corner.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
              <Laptop className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-xs text-slate-400">
                To install on desktop browsers, click the <strong className="text-slate-300">Install App</strong> icon in your browser's address bar or menu.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Danger Zone */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
        <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Danger Zone
        </h2>
        <p className="text-xs text-slate-400">
          This will wipe all records (Salah logs, workouts, reading progress, goals, habits, and journals) from your local browser and PC disk database.
        </p>

        <button
          onClick={handleResetClick}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20"
        >
          Reset / Wipe All Data
        </button>
      </div>

      {/* Modal: Restore from Disk Backup */}
      {isRestoreModalOpen && selectedBackupToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-indigo-400" />
                Restore Disk Backup
              </h3>
              <button
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setSelectedBackupToRestore(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>Are you sure you want to restore from this disk backup snapshot?</p>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs">
                <p className="text-emerald-400 font-bold">{selectedBackupToRestore.filename}</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Created: {format(new Date(selectedBackupToRestore.modifiedAt), 'PPpp')} ({(selectedBackupToRestore.sizeBytes / 1024).toFixed(1)} KB)
                </p>
              </div>
              <p className="text-slate-400 text-[11px]">
                A safety snapshot of your current state will automatically be created before overwriting.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setSelectedBackupToRestore(null);
                }}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestoreDiskBackup}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Restore Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: JSON File Upload Restore */}
      {isImportModalOpen && importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Confirm JSON Restore
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              The uploaded file contains valid Mizan database records. Restoring will replace your current records and persist directly to disk:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Salah Logs:</span>
              <span className="font-bold text-emerald-400 text-right">{importPreview.salah} records</span>
              <span className="text-slate-400">Habits:</span>
              <span className="font-bold text-teal-400 text-right">{importPreview.habits} habits</span>
              <span className="text-slate-400">Workouts:</span>
              <span className="font-bold text-sky-400 text-right">{importPreview.workouts} entries</span>
              <span className="text-slate-400">Books:</span>
              <span className="font-bold text-indigo-400 text-right">{importPreview.books} books</span>
              <span className="text-slate-400">5-Tier Goals:</span>
              <span className="font-bold text-amber-400 text-right">{importPreview.goals} items</span>
              <span className="text-slate-400">Journal Reflections:</span>
              <span className="font-bold text-rose-400 text-right">{importPreview.journal} entries</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Confirm & Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
