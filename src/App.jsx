import React, { useState } from 'react';
import { StorageProvider } from './context/StorageContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { QuickAddModal } from './components/layout/QuickAddModal';
import { Toast } from './components/ui/Toast';

import { DashboardView } from './views/DashboardView';
import { SalahHabitsView } from './views/SalahHabitsView';
import { WorkoutsView } from './views/WorkoutsView';
import { ReadingView } from './views/ReadingView';
import { PlannerView } from './views/PlannerView';
import { JournalView } from './views/JournalView';
import { HistoryView } from './views/HistoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} onOpenQuickAdd={() => setIsQuickAddOpen(true)} />;
      case 'salah-habits':
        return <SalahHabitsView />;
      case 'workouts':
        return <WorkoutsView />;
      case 'reading':
        return <ReadingView />;
      case 'planner':
        return <PlannerView />;
      case 'journal':
        return <JournalView />;
      case 'history':
        return <HistoryView setActiveTab={setActiveTab} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} onOpenQuickAdd={() => setIsQuickAddOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Sidebar Navigation (Desktop & Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300">
        {/* Sticky Header with Date Navigator */}
        <Header
          setIsMobileOpen={setIsMobileOpen}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* System Toast Notification */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StorageProvider>
        <AppContent />
      </StorageProvider>
    </ErrorBoundary>
  );
}
