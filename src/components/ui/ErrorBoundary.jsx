import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { db } from '../../db';
import { populateSeedData } from '../../utils/seedData';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mizan Runtime Caught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndSeed = async () => {
    try {
      await populateSeedData(db);
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset and seed:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Something Went Wrong</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Mizan encountered an unexpected error while rendering. Your data in IndexedDB is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" /> Reload App
              </button>

              <button
                onClick={this.handleResetAndSeed}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4 text-teal-400" /> Reset & Re-Seed
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
