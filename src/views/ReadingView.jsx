import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Bookmark,
  TrendingUp,
  Star,
  Edit2,
  Check,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';

export function ReadingView() {
  const {
    books,
    readingLogsForDate,
    addBook,
    updateBook,
    updateBookCurrentPage,
    deleteBook,
    selectedDate
  } = useStorage();

  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'reading' | 'finished' | 'want-to-read'
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);

  // New Book Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTotalPages, setNewTotalPages] = useState('300');
  const [newCurrentPage, setNewCurrentPage] = useState('0');
  const [newCategory, setNewCategory] = useState('Intellect & Mind');

  // Edit Book Form State
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editTotalPages, setEditTotalPages] = useState('');
  const [editCurrentPage, setEditCurrentPage] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Per-card custom inline input state { [bookId]: pageInputString }
  const [pageInputs, setPageInputs] = useState({});

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addBook({
      title: newTitle.trim(),
      author: newAuthor.trim() || 'Unknown',
      totalPages: parseInt(newTotalPages, 10) || 100,
      currentPage: parseInt(newCurrentPage, 10) || 0,
      category: newCategory
    });

    setNewTitle('');
    setNewAuthor('');
    setNewTotalPages('300');
    setNewCurrentPage('0');
    setIsAddingBook(false);
  };

  const startEdit = (book) => {
    setEditingBookId(book.id);
    setEditTitle(book.title);
    setEditAuthor(book.author || '');
    setEditTotalPages(String(book.totalPages));
    setEditCurrentPage(String(book.currentPage));
    setEditCategory(book.category || 'General');
  };

  const handleSaveEdit = async (bookId) => {
    await updateBook(bookId, {
      title: editTitle.trim(),
      author: editAuthor.trim() || 'Unknown',
      totalPages: parseInt(editTotalPages, 10) || 100,
      currentPage: parseInt(editCurrentPage, 10) || 0,
      category: editCategory
    });
    setEditingBookId(null);
  };

  const handleCustomPageSubmit = async (bookId) => {
    const val = pageInputs[bookId];
    if (val === undefined || val === '') return;
    const pageNum = parseInt(val, 10);
    if (!isNaN(pageNum)) {
      await updateBookCurrentPage(bookId, pageNum);
      setPageInputs(prev => ({ ...prev, [bookId]: '' }));
    }
  };

  const handleQuickAddPages = async (book, delta) => {
    const target = Math.min(book.totalPages, (book.currentPage || 0) + delta);
    await updateBookCurrentPage(book.id, target);
  };

  const handleToggleComplete = async (book) => {
    if (book.status === 'finished') {
      await updateBook(book.id, {
        status: 'reading',
        currentPage: Math.max(0, book.totalPages - 10)
      });
    } else {
      await updateBookCurrentPage(book.id, book.totalPages);
    }
  };

  // Metrics
  const totalPagesToday = readingLogsForDate?.reduce((acc, log) => acc + (log.pagesRead || 0), 0) || 0;
  const finishedBooksCount = books?.filter(b => b.status === 'finished' || b.currentPage >= b.totalPages).length || 0;
  const readingBooksCount = books?.filter(b => b.status === 'reading' && b.currentPage < b.totalPages).length || 0;

  const filteredBooks = books ? books.filter(b => {
    const isFinished = b.status === 'finished' || b.currentPage >= b.totalPages;
    if (activeTabFilter === 'reading') return b.status === 'reading' && !isFinished;
    if (activeTabFilter === 'finished') return isFinished;
    if (activeTabFilter === 'want-to-read') return b.status === 'want-to-read' && !isFinished;
    return true;
  }) : [];

  return (
    <div className="space-y-8 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Library & Reading Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track books with in-place page logging, real-time percentages, and persistent shelf status.
          </p>
        </div>

        <button
          onClick={() => setIsAddingBook(prev => !prev)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2 self-start shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          {isAddingBook ? 'Cancel' : 'Add New Book'}
        </button>
      </div>

      {/* High-Level Reading Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Pages Read Today</div>
            <div className="text-lg font-bold text-slate-100">+{totalPagesToday} pages</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Currently Reading</div>
            <div className="text-lg font-bold text-slate-100">{readingBooksCount} books</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Completed Books</div>
            <div className="text-lg font-bold text-slate-100">{finishedBooksCount} books</div>
          </div>
        </div>
      </div>

      {/* Add New Book Form Modal / Card */}
      {isAddingBook && (
        <form onSubmit={handleCreateBook} className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Add Book to Shelf</h2>
            <button type="button" onClick={() => setIsAddingBook(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Book Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Atomic Habits, The Sealed Nectar"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
              <input
                type="text"
                placeholder="e.g. James Clear"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Pages</label>
              <input
                type="number"
                required
                value={newTotalPages}
                onChange={(e) => setNewTotalPages(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Page</label>
              <input
                type="number"
                value={newCurrentPage}
                onChange={(e) => setNewCurrentPage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Genre / Category</label>
              <input
                type="text"
                placeholder="e.g. Productivity, Seerah, Philosophy"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingBook(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
            >
              Save Book to Shelf
            </button>
          </div>
        </form>
      )}

      {/* Shelf Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: `All Books (${books?.length || 0})` },
          { id: 'reading', label: `Reading (${readingBooksCount})` },
          { id: 'finished', label: `Completed (${finishedBooksCount})` },
          { id: 'want-to-read', label: 'Want to Read' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTabFilter === tab.id
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single Persistent Book Cards Grid with In-Place Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => {
            const isEditing = editingBookId === book.id;
            const progressPct = Math.round(((book.currentPage || 0) / book.totalPages) * 100);
            const isFinished = book.status === 'finished' || book.currentPage >= book.totalPages;
            const pagesRemaining = Math.max(0, book.totalPages - (book.currentPage || 0));

            if (isEditing) {
              return (
                <div key={book.id} className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase">Edit Book Details</h3>
                  <div>
                    <label className="text-[10px] text-slate-400">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Author</label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Current Page</label>
                      <input
                        type="number"
                        value={editCurrentPage}
                        onChange={(e) => setEditCurrentPage(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Total Pages</label>
                      <input
                        type="number"
                        value={editTotalPages}
                        onChange={(e) => setEditTotalPages(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingBookId(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(book.id)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={book.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-md ${
                  isFinished
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Category & Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 font-semibold uppercase tracking-wider">
                      {book.category || 'Book'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(book)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Edit Book"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteBook(book.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Book"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Book Title & Author */}
                  <h3 className="text-base font-bold text-slate-100 mt-2 line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-slate-400">by {book.author}</p>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      Page <strong className="text-slate-200">{book.currentPage}</strong> of {book.totalPages}
                    </span>
                    <span className={`font-bold ${isFinished ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {progressPct}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished ? 'bg-emerald-400 shadow-sm shadow-emerald-500/30' : 'bg-indigo-500 shadow-sm shadow-indigo-500/30'
                      }`}
                      style={{ width: `${Math.min(100, progressPct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {isFinished ? '🎉 Book Completed' : `${pagesRemaining} pages remaining`}
                    </span>
                    <button
                      onClick={() => handleToggleComplete(book)}
                      className={`text-[10px] font-semibold underline ${
                        isFinished ? 'text-slate-400 hover:text-slate-200' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {isFinished ? 'Mark as In-Progress' : 'Mark Completed'}
                    </button>
                  </div>
                </div>

                {/* In-Place Quick-Update Controls (No duplicate cards!) */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Log In-Place
                    </span>
                  </div>

                  {/* Quick Increment Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 20, 50].map(delta => (
                      <button
                        key={delta}
                        onClick={() => handleQuickAddPages(book, delta)}
                        disabled={isFinished}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950/60 hover:border-indigo-500/40 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-indigo-300 transition-all disabled:opacity-30"
                      >
                        +{delta}p
                      </button>
                    ))}
                  </div>

                  {/* Custom Page Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      placeholder={`Current: ${book.currentPage}`}
                      value={pageInputs[book.id] || ''}
                      onChange={(e) => setPageInputs({ ...pageInputs, [book.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCustomPageSubmit(book.id);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => handleCustomPageSubmit(book.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">No books found in this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
