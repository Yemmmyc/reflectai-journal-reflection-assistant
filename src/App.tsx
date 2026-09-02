import React, { useState, useEffect, useCallback } from 'react';
import { auth, onAuthStateChanged, logOut, fetchUserInteractions, deleteUserInteraction } from './lib/firebase';
import type { UserProfile, JournalInteraction } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LandingView } from './components/LandingView';
import { Header } from './components/Header';
import { ReflectionEditor } from './components/ReflectionEditor';
import { HistoryList } from './components/HistoryList';
import { NotificationToast, type ToastMessage } from './components/NotificationToast';
import { AmbientBackground } from './components/AmbientBackground';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'editor' | 'history'>('editor');
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { isDark } = useTheme();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        setInteractions([]);
        setActiveInteraction(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user reflections from Firestore
  const loadInteractions = useCallback(async (uid: string) => {
    try {
      const data = await fetchUserInteractions(uid);
      setInteractions(data);
    } catch (err: any) {
      console.error('Error fetching interactions:', err);
      showToast('Could not load past reflections from Firestore.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (user?.uid) {
      loadInteractions(user.uid);
    }
  }, [user?.uid, loadInteractions]);

  // Handlers
  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setActiveInteraction(null);
      setInteractions([]);
      showToast('Successfully signed out.', 'info');
    } catch (err: any) {
      console.error('Sign out error:', err);
      showToast('Error signing out.', 'error');
    }
  };

  const handleNewReflection = () => {
    setActiveInteraction(null);
    setCurrentView('editor');
  };

  const handleSelectInteraction = (interaction: JournalInteraction) => {
    setActiveInteraction(interaction);
    setCurrentView('editor');
  };

  const handleSaveComplete = (saved: JournalInteraction) => {
    setInteractions((prev) => {
      const idx = prev.findIndex((item) => item.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!user?.uid) return;
    try {
      await deleteUserInteraction(user.uid, id);
      setInteractions((prev) => prev.filter((item) => item.id !== id));
      if (activeInteraction?.id === id) {
        setActiveInteraction(null);
      }
    } catch (err: any) {
      console.error('Error deleting interaction:', err);
      showToast('Failed to delete interaction.', 'error');
    }
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <div className="relative min-h-screen bg-[#f8f8f6] dark:bg-[#0c0a09] flex flex-col items-center justify-center text-stone-700 dark:text-stone-200 overflow-hidden transition-colors duration-500">
        <AmbientBackground />
        <div className="relative z-10 w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 mb-4 animate-pulse">
          <Sparkles className="w-7 h-7 text-amber-200" />
        </div>
        <span className="relative z-10 text-base font-bold text-stone-900 dark:text-stone-100">
          ReflectAI
        </span>
        <span className="relative z-10 text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
          Connecting to Firebase & Gemini 3.6 Flash...
        </span>
      </div>
    );
  }

  // Unauthenticated State -> Landing Page
  if (!user) {
    return (
      <>
        <LandingView onSignInSuccess={() => showToast('Welcome to ReflectAI!', 'success')} />
        <NotificationToast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Authenticated State -> Main App
  return (
    <div className="relative min-h-screen bg-[#f8f8f6] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-500 selection:bg-amber-400/30">
      {/* Animated Glowing Ambient Aura Background */}
      <AmbientBackground />

      <Header
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewReflection={handleNewReflection}
        onSignOut={handleSignOut}
        historyCount={interactions.length}
      />

      <main className="relative z-10 flex-1 pb-16">
        {currentView === 'editor' ? (
          <ReflectionEditor
            key={activeInteraction?.id || 'new'}
            user={user}
            interaction={activeInteraction}
            onSaveComplete={handleSaveComplete}
            onShowToast={showToast}
          />
        ) : (
          <HistoryList
            interactions={interactions}
            onSelectInteraction={handleSelectInteraction}
            onDeleteInteraction={handleDeleteInteraction}
            onNewReflection={handleNewReflection}
            onShowToast={showToast}
          />
        )}
      </main>

      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
