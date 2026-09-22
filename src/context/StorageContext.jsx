import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, addDays } from 'date-fns';
import { db } from '../db';
import { populateSeedData } from '../utils/seedData';
import confetti from 'canvas-confetti';

const StorageContext = createContext(null);

const DEFAULT_SALAH = (dateStr) => ({
  date: dateStr,
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
  tahajjud: false,
  duha: false,
  rawatib: false,
  notes: ''
});

const DEFAULT_JOURNAL = (dateStr) => ({
  date: dateStr,
  mood: 'good',
  gratitude: ['', '', ''],
  wins: ['', ''],
  promptAnswers: { dailyFocus: '', challengeOvercome: '' },
  content: '',
  tags: []
});

export function StorageProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Local Backend / Disk Sync State
  const [diskSyncStatus, setDiskSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const pendingSaveTimerRef = useRef(null);

  // Trigger celebratory confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8']
      });
    } catch (e) {
      // ignore
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(prev => (prev?.id ? null : prev));
    }, 3500);
  };

  // --- Disk Synchronization Engine ---
  // Debounced auto-sync to local backend PC filesystem (SSOT)
  const syncAllToDisk = async (immediate = false) => {
    if (pendingSaveTimerRef.current) {
      clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }

    const doSave = async () => {
      try {
        setDiskSyncStatus('syncing');
        const payload = {
          salahLogs: await db.salahLogs.toArray().catch(() => []),
          habits: await db.habits.toArray().catch(() => []),
          habitLogs: await db.habitLogs.toArray().catch(() => []),
          workouts: await db.workouts.toArray().catch(() => []),
          books: await db.books.toArray().catch(() => []),
          readingLogs: await db.readingLogs.toArray().catch(() => []),
          goals: await db.goals.toArray().catch(() => []),
          journalEntries: await db.journalEntries.toArray().catch(() => []),
          settings: await db.settings.toArray().catch(() => [])
        };

        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json();
          setDiskSyncStatus('synced');
          setLastSavedTime(json.savedAt || new Date().toISOString());
        } else {
          setDiskSyncStatus('error');
        }
      } catch (err) {
        // Backend might be offline or booting
        console.warn('[Storage] Backend not reachable for auto-sync:', err.message);
        setDiskSyncStatus('offline');
      }
    };

    if (immediate) {
      await doSave();
    } else {
      pendingSaveTimerRef.current = setTimeout(doSave, 350);
    }
  };

  // Safe initialization: Disk is SSOT, Dexie is reactive cache mirror
  useEffect(() => {
    async function initDB() {
      try {
        setDiskSyncStatus('syncing');
        let diskHydrated = false;

        // 1. Try to fetch single source of truth from backend disk
        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data && result.initialized) {
              console.log('[Storage] Hydrating local state from permanent disk storage...');
              const data = result.data;
              await db.transaction('rw', [
                db.salahLogs,
                db.habits,
                db.habitLogs,
                db.workouts,
                db.books,
                db.readingLogs,
                db.goals,
                db.journalEntries,
                db.settings
              ], async () => {
                if (Array.isArray(data.salahLogs)) {
                  await db.salahLogs.clear();
                  await db.salahLogs.bulkAdd(data.salahLogs);
                }
                if (Array.isArray(data.habits)) {
                  await db.habits.clear();
                  await db.habits.bulkAdd(data.habits);
                }
                if (Array.isArray(data.habitLogs)) {
                  await db.habitLogs.clear();
                  await db.habitLogs.bulkAdd(data.habitLogs);
                }
                if (Array.isArray(data.workouts)) {
                  await db.workouts.clear();
                  await db.workouts.bulkAdd(data.workouts);
                }
                if (Array.isArray(data.books)) {
                  await db.books.clear();
                  await db.books.bulkAdd(data.books);
                }
                if (Array.isArray(data.readingLogs)) {
                  await db.readingLogs.clear();
                  await db.readingLogs.bulkAdd(data.readingLogs);
                }
                if (Array.isArray(data.goals)) {
                  await db.goals.clear();
                  await db.goals.bulkAdd(data.goals);
                }
                if (Array.isArray(data.journalEntries)) {
                  await db.journalEntries.clear();
                  await db.journalEntries.bulkAdd(data.journalEntries);
                }
                if (Array.isArray(data.settings)) {
                  await db.settings.clear();
                  await db.settings.bulkAdd(data.settings);
                }
              });
              diskHydrated = true;
              setDiskSyncStatus('synced');
              setLastSavedTime(result.lastSaved || new Date().toISOString());
              localStorage.setItem('mizan_initialized', 'true');
            } else if (result.empty) {
              // Disk file is empty. Check if Dexie has existing data
              const dexieCount = (await db.goals.count().catch(() => 0)) +
                                 (await db.books.count().catch(() => 0)) +
                                 (await db.salahLogs.count().catch(() => 0));
              if (dexieCount > 0) {
                console.log('[Storage] Local Dexie cache has data; syncing to disk SSOT...');
                await syncAllToDisk(true);
                diskHydrated = true;
              }
            }
          }
        } catch (err) {
          console.warn('[Storage] Local server not reachable on initial boot:', err.message);
          setDiskSyncStatus('offline');
        }

        // 2. If nothing on disk and nothing in Dexie, check if we need first-time demo seed
        if (!diskHydrated) {
          const isLocalStorageInit = localStorage.getItem('mizan_initialized');
          const goalsCount = await db.goals.count().catch(() => 0);
          const booksCount = await db.books.count().catch(() => 0);
          const salahCount = await db.salahLogs.count().catch(() => 0);

          if (!isLocalStorageInit && goalsCount === 0 && booksCount === 0 && salahCount === 0) {
            console.log('[Storage] Clean install detected. Populating initial seed data...');
            await populateSeedData(db, false);
            localStorage.setItem('mizan_initialized', 'true');
            await syncAllToDisk(true);
          } else {
            setDiskSyncStatus(prev => prev === 'offline' ? 'offline' : 'synced');
          }
        }
      } catch (err) {
        console.error('[Storage] Error during initialization:', err);
      } finally {
        setIsInitialized(true);
      }
    }

    initDB();

    // On window unload, flush pending debounced saves immediately
    const handleBeforeUnload = () => {
      if (pendingSaveTimerRef.current) {
        syncAllToDisk(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- Live Queries with Guaranteed Default Values ---

  // 1. Salah
  const todaySalah = useLiveQuery(
    async () => {
      try {
        const record = await db.salahLogs.where('date').equals(selectedDate).first();
        return record || DEFAULT_SALAH(selectedDate);
      } catch (e) {
        return DEFAULT_SALAH(selectedDate);
      }
    },
    [selectedDate],
    DEFAULT_SALAH(selectedDate)
  );

  const salahHistory = useLiveQuery(
    () => db.salahLogs.orderBy('date').reverse().limit(30).toArray().catch(() => []),
    [],
    []
  );

  // 2. Habits & Logs
  const allHabits = useLiveQuery(
    () => db.habits.toArray().then(list => list.filter(h => !h.archived)).catch(() => []),
    [],
    []
  );

  const selectedDateHabitLogs = useLiveQuery(
    () => db.habitLogs.where('date').equals(selectedDate).toArray().catch(() => []),
    [selectedDate],
    []
  );

  const allHabitLogs = useLiveQuery(
    () => db.habitLogs.toArray().catch(() => []),
    [],
    []
  );

  // 3. Workouts
  const workoutsForDate = useLiveQuery(
    () => db.workouts.where('date').equals(selectedDate).toArray().catch(() => []),
    [selectedDate],
    []
  );

  const allWorkouts = useLiveQuery(
    () => db.workouts.orderBy('date').reverse().limit(50).toArray().catch(() => []),
    [],
    []
  );

  // 4. Books & Reading Logs
  const books = useLiveQuery(
    () => db.books.toArray().catch(() => []),
    [],
    []
  );

  const readingLogsForDate = useLiveQuery(
    () => db.readingLogs.where('date').equals(selectedDate).toArray().catch(() => []),
    [selectedDate],
    []
  );

  const allReadingLogs = useLiveQuery(
    () => db.readingLogs.orderBy('date').reverse().limit(50).toArray().catch(() => []),
    [],
    []
  );

  // 5. Goals & Planning Hierarchy
  const allGoals = useLiveQuery(
    () => db.goals.toArray().catch(() => []),
    [],
    []
  );

  // 6. Journal Entries
  const journalEntry = useLiveQuery(
    async () => {
      try {
        const entry = await db.journalEntries.where('date').equals(selectedDate).first();
        return entry || DEFAULT_JOURNAL(selectedDate);
      } catch (e) {
        return DEFAULT_JOURNAL(selectedDate);
      }
    },
    [selectedDate],
    DEFAULT_JOURNAL(selectedDate)
  );

  const recentJournalEntries = useLiveQuery(
    () => db.journalEntries.orderBy('date').reverse().limit(15).toArray().catch(() => []),
    [],
    []
  );

  // --- Helper: Cascade Parent Goal Progress Recursively ---
  const recalculateParentProgress = async (parentId) => {
    if (!parentId) return;
    try {
      const parent = await db.goals.get(parentId);
      if (!parent) return;

      const siblings = await db.goals.where('parentId').equals(parentId).toArray();
      if (siblings && siblings.length > 0) {
        const completedCount = siblings.filter(s => s.status === 'completed').length;
        const inProgressCount = siblings.filter(s => s.status === 'in_progress').length;
        const progress = Math.round(
          siblings.reduce((acc, s) => acc + (s.progress || (s.status === 'completed' ? 100 : 0)), 0) / siblings.length
        );

        let status = 'in_progress';
        if (completedCount === siblings.length) {
          status = 'completed';
        } else if (completedCount === 0 && inProgressCount === 0) {
          status = 'pending';
        }

        await db.goals.update(parentId, {
          progress,
          status,
          updatedAt: new Date().toISOString()
        });

        if (parent.parentId) {
          await recalculateParentProgress(parent.parentId);
        }
      }
    } catch (err) {
      console.error('Error recalculating parent progress:', err);
    }
  };

  // --- CRUD Operations (Dexie + Auto Disk Persistence) ---

  // 1. Salah Operations
  const toggleSalah = async (prayerKey, dateStr = selectedDate) => {
    try {
      const existing = await db.salahLogs.where('date').equals(dateStr).first();
      const currentVal = existing ? !!existing[prayerKey] : false;
      const newVal = !currentVal;

      if (existing) {
        await db.salahLogs.update(existing.id, {
          [prayerKey]: newVal,
          updatedAt: new Date().toISOString()
        });
      } else {
        await db.salahLogs.add({
          date: dateStr,
          fajr: prayerKey === 'fajr',
          dhuhr: prayerKey === 'dhuhr',
          asr: prayerKey === 'asr',
          maghrib: prayerKey === 'maghrib',
          isha: prayerKey === 'isha',
          tahajjud: prayerKey === 'tahajjud',
          duha: prayerKey === 'duha',
          rawatib: prayerKey === 'rawatib',
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (newVal) {
        triggerCelebration();
      }
      syncAllToDisk();
    } catch (err) {
      console.error('Error toggling salah:', err);
      showToast('Error updating prayer status', 'error');
    }
  };

  const updateSalahNotes = async (notes, dateStr = selectedDate) => {
    const existing = await db.salahLogs.where('date').equals(dateStr).first();
    if (existing) {
      await db.salahLogs.update(existing.id, { notes, updatedAt: new Date().toISOString() });
    } else {
      await db.salahLogs.add({
        date: dateStr,
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        tahajjud: false,
        duha: false,
        rawatib: false,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    syncAllToDisk();
    showToast('Prayer notes saved');
  };

  // 2. Habit Operations
  const addHabit = async (habit) => {
    const id = await db.habits.add({
      title: habit.title,
      description: habit.description || '',
      category: habit.category || 'health',
      frequency: habit.frequency || 'daily',
      targetDaysPerWeek: habit.targetDaysPerWeek || 7,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    syncAllToDisk();
    showToast('Habit added successfully');
    return id;
  };

  const updateHabit = async (id, updates) => {
    await db.habits.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    syncAllToDisk();
    showToast('Habit updated');
  };

  const deleteHabit = async (id) => {
    await db.transaction('rw', [db.habits, db.habitLogs], async () => {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    });
    syncAllToDisk();
    showToast('Habit removed');
  };

  const toggleHabit = async (habitId, dateStr = selectedDate) => {
    try {
      const existing = await db.habitLogs
        .where('habitId')
        .equals(habitId)
        .and(l => l.date === dateStr)
        .first();

      if (existing) {
        const newStatus = !existing.completed;
        await db.habitLogs.update(existing.id, {
          completed: newStatus,
          updatedAt: new Date().toISOString()
        });
        if (newStatus) triggerCelebration();
      } else {
        await db.habitLogs.add({
          habitId,
          date: dateStr,
          completed: true,
          value: 1,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        triggerCelebration();
      }
      syncAllToDisk();
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  // 3. Workout Operations
  const addWorkout = async (workout) => {
    const id = await db.workouts.add({
      date: workout.date || selectedDate,
      exerciseName: workout.exerciseName,
      category: workout.category || 'Strength',
      sets: workout.sets || [],
      distanceKm: workout.distanceKm ? parseFloat(workout.distanceKm) : null,
      durationMinutes: workout.durationMinutes ? parseInt(workout.durationMinutes, 10) : null,
      notes: workout.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    triggerCelebration();
    syncAllToDisk();
    showToast('Workout logged!');
    return id;
  };

  const logWorkoutPreset = async (presetName, presetCategory, reps, durationMins, distanceKm = null) => {
    const sets = reps > 0 ? [{ setNumber: 1, reps, weightKg: 0, rpe: 8 }] : [];
    const id = await addWorkout({
      date: selectedDate,
      exerciseName: presetName,
      category: presetCategory,
      sets,
      durationMinutes: durationMins,
      distanceKm,
      notes: 'Quick logged preset'
    });
    return id;
  };

  const updateWorkout = async (id, updates) => {
    await db.workouts.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    syncAllToDisk();
    showToast('Workout updated');
  };

  const deleteWorkout = async (id) => {
    await db.workouts.delete(id);
    syncAllToDisk();
    showToast('Workout deleted');
  };

  // 4. Reading Operations
  const addBook = async (book) => {
    const totalPages = parseInt(book.totalPages, 10) || 100;
    const currentPage = parseInt(book.currentPage, 10) || 0;
    const status = currentPage >= totalPages ? 'finished' : (currentPage > 0 ? 'reading' : 'want-to-read');

    const id = await db.books.add({
      title: book.title,
      author: book.author || 'Unknown',
      totalPages,
      currentPage,
      category: book.category || 'General',
      coverUrl: book.coverUrl || '',
      status: book.status || status,
      startedDate: book.startedDate || (currentPage > 0 ? selectedDate : null),
      finishedDate: book.finishedDate || null,
      rating: book.rating || 5,
      notes: book.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    syncAllToDisk();
    showToast('Book added to library');
    return id;
  };

  const updateBook = async (id, updates) => {
    const current = await db.books.get(id);
    const newPage = updates.currentPage !== undefined ? parseInt(updates.currentPage, 10) : current?.currentPage;
    const totalPages = updates.totalPages !== undefined ? parseInt(updates.totalPages, 10) : current?.totalPages;
    const isFinished = newPage >= totalPages;

    const payload = {
      ...updates,
      currentPage: newPage,
      totalPages,
      status: isFinished ? 'finished' : (newPage > 0 ? 'reading' : 'want-to-read'),
      finishedDate: isFinished ? (current?.finishedDate || selectedDate) : current?.finishedDate,
      updatedAt: new Date().toISOString()
    };

    await db.books.update(id, payload);
    syncAllToDisk();
    showToast('Book updated');
  };

  // In-place page update helper for single book cards
  const updateBookCurrentPage = async (bookId, newPageNumber, durationMinutes = 20) => {
    const book = await db.books.get(bookId);
    if (!book) return;

    const previousPage = book.currentPage || 0;
    const targetPage = Math.min(book.totalPages, Math.max(0, parseInt(newPageNumber, 10)));
    const pagesRead = Math.max(0, targetPage - previousPage);
    const isFinished = targetPage >= book.totalPages;

    await db.transaction('rw', [db.books, db.readingLogs], async () => {
      // 1. Update book record in-place
      await db.books.update(bookId, {
        currentPage: targetPage,
        status: isFinished ? 'finished' : 'reading',
        finishedDate: isFinished ? (book.finishedDate || selectedDate) : null,
        updatedAt: new Date().toISOString()
      });

      // 2. If pages progressed, record a log entry for selected date
      if (pagesRead > 0) {
        await db.readingLogs.add({
          bookId,
          date: selectedDate,
          startPage: previousPage,
          endPage: targetPage,
          pagesRead,
          durationMinutes: parseInt(durationMinutes, 10) || 20,
          notes: 'In-place page update',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    triggerCelebration();
    syncAllToDisk();
    showToast(`Updated to page ${targetPage} (+${pagesRead} pgs)!`);
  };

  const deleteBook = async (id) => {
    await db.transaction('rw', [db.books, db.readingLogs], async () => {
      await db.books.delete(id);
      await db.readingLogs.where('bookId').equals(id).delete();
    });
    syncAllToDisk();
    showToast('Book deleted');
  };

  const logReadingSession = async (logData) => {
    const startPage = parseInt(logData.startPage, 10) || 0;
    const endPage = parseInt(logData.endPage, 10);
    const pagesRead = parseInt(logData.pagesRead, 10) || (endPage - startPage);
    const bookId = parseInt(logData.bookId, 10);

    await db.transaction('rw', [db.books, db.readingLogs], async () => {
      await db.readingLogs.add({
        bookId,
        date: logData.date || selectedDate,
        startPage,
        endPage,
        pagesRead: pagesRead > 0 ? pagesRead : 0,
        durationMinutes: parseInt(logData.durationMinutes, 10) || 20,
        notes: logData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const book = await db.books.get(bookId);
      if (book) {
        const newPage = Math.max(book.currentPage || 0, endPage);
        const isFinished = newPage >= book.totalPages;
        await db.books.update(bookId, {
          currentPage: newPage,
          status: isFinished ? 'finished' : 'reading',
          finishedDate: isFinished ? (book.finishedDate || selectedDate) : book.finishedDate,
          updatedAt: new Date().toISOString()
        });
      }
    });

    triggerCelebration();
    syncAllToDisk();
    showToast(`Recorded ${pagesRead > 0 ? pagesRead : 0} pages read!`);
  };

  // 5. Goals & Planning Hierarchy Operations
  const addGoal = async (goal) => {
    const parentId = goal.parentId ? parseInt(goal.parentId, 10) : null;
    const id = await db.goals.add({
      title: goal.title,
      description: goal.description || '',
      level: goal.level || 'daily',
      parentId,
      year: goal.year || new Date().getFullYear(),
      semester: goal.semester || (new Date().getMonth() >= 6 ? 2 : 1),
      month: goal.month || (new Date().getMonth() + 1),
      weekNumber: goal.weekNumber || 1,
      targetDate: goal.targetDate || selectedDate,
      status: goal.status || 'pending',
      progress: goal.progress || (goal.status === 'completed' ? 100 : 0),
      priority: goal.priority || 'medium',
      tags: Array.isArray(goal.tags) ? goal.tags : (goal.tags ? goal.tags.split(',').map(t => t.trim()) : []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (parentId) {
      await recalculateParentProgress(parentId);
    }

    syncAllToDisk();
    showToast('Goal / Task added');
    return id;
  };

  const updateGoal = async (id, updates) => {
    const existing = await db.goals.get(id);
    await db.goals.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    const parentId = updates.parentId !== undefined ? updates.parentId : existing?.parentId;
    if (parentId) {
      await recalculateParentProgress(parentId);
    }

    syncAllToDisk();
    showToast('Task / Goal updated');
  };

  const deleteGoal = async (id) => {
    const existing = await db.goals.get(id);
    await db.goals.delete(id);

    if (existing?.parentId) {
      await recalculateParentProgress(existing.parentId);
    }

    syncAllToDisk();
    showToast('Removed');
  };

  const toggleGoalStatus = async (id, currentStatus) => {
    let nextStatus = 'completed';
    let progress = 100;

    if (currentStatus === 'completed') {
      nextStatus = 'pending';
      progress = 0;
    } else {
      nextStatus = 'completed';
      progress = 100;
      triggerCelebration();
    }

    await db.goals.update(id, {
      status: nextStatus,
      progress,
      updatedAt: new Date().toISOString()
    });

    const goal = await db.goals.get(id);
    if (goal?.parentId) {
      await recalculateParentProgress(goal.parentId);
    }

    syncAllToDisk();
  };

  // 6. Journal Operations
  const saveJournalEntry = async (entry, showNotification = true) => {
    const existing = await db.journalEntries.where('date').equals(entry.date || selectedDate).first();
    const cleanEntry = {
      date: entry.date || selectedDate,
      mood: entry.mood || 'good',
      gratitude: entry.gratitude || [],
      wins: entry.wins || [],
      promptAnswers: entry.promptAnswers || {},
      content: entry.content || '',
      tags: entry.tags || [],
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      await db.journalEntries.update(existing.id, cleanEntry);
    } else {
      await db.journalEntries.add({
        ...cleanEntry,
        createdAt: new Date().toISOString()
      });
    }

    syncAllToDisk();
    if (showNotification) {
      showToast('Journal reflection saved');
    }
  };

  const deleteJournalEntry = async (id) => {
    await db.journalEntries.delete(id);
    syncAllToDisk();
    showToast('Journal entry deleted');
  };

  // 7. System Tools (Export / Import / Seed / Reset / Disk Backups)
  const seedSampleData = async () => {
    await populateSeedData(db, true);
    await syncAllToDisk(true);
    showToast('Demo seed data loaded successfully!');
  };

  const resetAllData = async () => {
    await db.transaction('rw', [
      db.salahLogs,
      db.habits,
      db.habitLogs,
      db.workouts,
      db.books,
      db.readingLogs,
      db.goals,
      db.journalEntries
    ], async () => {
      await db.salahLogs.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.workouts.clear();
      await db.books.clear();
      await db.readingLogs.clear();
      await db.goals.clear();
      await db.journalEntries.clear();
    });
    await syncAllToDisk(true);
    showToast('All local data cleared', 'info');
  };

  const exportDataJSON = async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      salahLogs: await db.salahLogs.toArray(),
      habits: await db.habits.toArray(),
      habitLogs: await db.habitLogs.toArray(),
      workouts: await db.workouts.toArray(),
      books: await db.books.toArray(),
      readingLogs: await db.readingLogs.toArray(),
      goals: await db.goals.toArray(),
      journalEntries: await db.journalEntries.toArray(),
      settings: await db.settings.toArray(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mizan-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported successfully');
  };

  const importDataJSON = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      await db.transaction('rw', [
        db.salahLogs,
        db.habits,
        db.habitLogs,
        db.workouts,
        db.books,
        db.readingLogs,
        db.goals,
        db.journalEntries,
        db.settings
      ], async () => {
        if (data.salahLogs) {
          await db.salahLogs.clear();
          await db.salahLogs.bulkAdd(data.salahLogs);
        }
        if (data.habits) {
          await db.habits.clear();
          await db.habits.bulkAdd(data.habits);
        }
        if (data.habitLogs) {
          await db.habitLogs.clear();
          await db.habitLogs.bulkAdd(data.habitLogs);
        }
        if (data.workouts) {
          await db.workouts.clear();
          await db.workouts.bulkAdd(data.workouts);
        }
        if (data.books) {
          await db.books.clear();
          await db.books.bulkAdd(data.books);
        }
        if (data.readingLogs) {
          await db.readingLogs.clear();
          await db.readingLogs.bulkAdd(data.readingLogs);
        }
        if (data.goals) {
          await db.goals.clear();
          await db.goals.bulkAdd(data.goals);
        }
        if (data.journalEntries) {
          await db.journalEntries.clear();
          await db.journalEntries.bulkAdd(data.journalEntries);
        }
      });
      await syncAllToDisk(true);
      showToast('Data restored successfully!');
    } catch (err) {
      console.error('Failed to import JSON:', err);
      showToast('Failed to parse and import backup JSON', 'error');
    }
  };

  // Disk Backup Operations
  const createDiskBackup = async () => {
    try {
      setDiskSyncStatus('syncing');
      const res = await fetch('/api/backup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDiskSyncStatus('synced');
        showToast(`Disk backup saved: ${data.filename}`, 'success');
        return data;
      } else {
        showToast('Failed to create disk backup', 'error');
      }
    } catch (err) {
      console.error('Error creating disk backup:', err);
      showToast('Backend offline - could not create disk backup', 'error');
    }
    return null;
  };

  const fetchDiskBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const json = await res.json();
        return json.backups || [];
      }
    } catch (err) {
      console.warn('Could not fetch backups:', err.message);
    }
    return [];
  };

  const restoreFromDiskBackup = async (filename) => {
    try {
      setDiskSyncStatus('syncing');
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          await db.transaction('rw', [
            db.salahLogs,
            db.habits,
            db.habitLogs,
            db.workouts,
            db.books,
            db.readingLogs,
            db.goals,
            db.journalEntries,
            db.settings
          ], async () => {
            if (d.salahLogs) { await db.salahLogs.clear(); await db.salahLogs.bulkAdd(d.salahLogs); }
            if (d.habits) { await db.habits.clear(); await db.habits.bulkAdd(d.habits); }
            if (d.habitLogs) { await db.habitLogs.clear(); await db.habitLogs.bulkAdd(d.habitLogs); }
            if (d.workouts) { await db.workouts.clear(); await db.workouts.bulkAdd(d.workouts); }
            if (d.books) { await db.books.clear(); await db.books.bulkAdd(d.books); }
            if (d.readingLogs) { await db.readingLogs.clear(); await db.readingLogs.bulkAdd(d.readingLogs); }
            if (d.goals) { await db.goals.clear(); await db.goals.bulkAdd(d.goals); }
            if (d.journalEntries) { await db.journalEntries.clear(); await db.journalEntries.bulkAdd(d.journalEntries); }
            if (d.settings) { await db.settings.clear(); await db.settings.bulkAdd(d.settings); }
          });
          setDiskSyncStatus('synced');
          showToast('Successfully restored from disk backup!');
          return true;
        }
      }
      showToast('Failed to restore from disk backup', 'error');
      return false;
    } catch (err) {
      showToast('Error restoring backup: ' + err.message, 'error');
      return false;
    }
  };

  const fetchDiskStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      return { status: 'offline' };
    }
    return { status: 'offline' };
  };

  // Date Navigation Helpers
  const goToPreviousDay = () => {
    setSelectedDate(prev => format(subDays(new Date(prev), 1), 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => format(addDays(new Date(prev), 1), 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const value = {
    selectedDate,
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isInitialized,
    toastMessage,
    showToast,
    // Disk backend states
    diskSyncStatus,
    lastSavedTime,
    syncAllToDisk,
    createDiskBackup,
    fetchDiskBackups,
    restoreFromDiskBackup,
    fetchDiskStatus,
    // Live entities with guaranteed safe arrays/objects
    todaySalah: todaySalah || DEFAULT_SALAH(selectedDate),
    salahHistory: salahHistory || [],
    allHabits: allHabits || [],
    selectedDateHabitLogs: selectedDateHabitLogs || [],
    allHabitLogs: allHabitLogs || [],
    workoutsForDate: workoutsForDate || [],
    allWorkouts: allWorkouts || [],
    books: books || [],
    readingLogsForDate: readingLogsForDate || [],
    allReadingLogs: allReadingLogs || [],
    allGoals: allGoals || [],
    journalEntry: journalEntry || DEFAULT_JOURNAL(selectedDate),
    recentJournalEntries: recentJournalEntries || [],
    // Operations
    toggleSalah,
    updateSalahNotes,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    addWorkout,
    logWorkoutPreset,
    updateWorkout,
    deleteWorkout,
    addBook,
    updateBook,
    updateBookCurrentPage,
    deleteBook,
    logReadingSession,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalStatus,
    saveJournalEntry,
    deleteJournalEntry,
    seedSampleData,
    resetAllData,
    exportDataJSON,
    importDataJSON
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
