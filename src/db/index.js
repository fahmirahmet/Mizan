import Dexie from 'dexie';

export class MizanDatabase extends Dexie {
  constructor() {
    super('MizanDatabase');

    this.version(1).stores({
      salahLogs: '++id, date, createdAt',
      habits: '++id, title, category, frequency, archived, createdAt',
      habitLogs: '++id, habitId, date, [habitId+date], completed',
      workouts: '++id, date, exerciseName, category, createdAt',
      books: '++id, title, author, status, category, createdAt',
      readingLogs: '++id, bookId, date, [bookId+date], createdAt',
      goals: '++id, title, level, parentId, status, targetDate, year, semester, month, weekNumber, createdAt',
      journalEntries: '++id, &date, mood, createdAt',
      settings: '&key, updatedAt'
    });
  }
}

export const db = new MizanDatabase();
