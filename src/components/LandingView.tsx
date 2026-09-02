import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Brain, 
  Compass, 
  ArrowRight,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { ThemeToggle } from './ThemeToggle';
import { AmbientBackground } from './AmbientBackground';

interface LandingViewProps {
  onSignInSuccess?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignInSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      if (onSignInSuccess) onSignInSuccess();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Authentication was cancelled.');
      } else {
        setError(err.message || 'Failed to authenticate with Google. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="landing-view" className="relative min-h-screen text-stone-900 dark:text-stone-100 flex flex-col justify-between overflow-hidden transition-colors duration-300">
      {/* Background Animated Gradient Aura */}
      <AmbientBackground />

      {/* Top Banner / Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl tracking-tight text-stone-900 dark:text-stone-100">
                ReflectAI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-500/30">
                Gemini 3.6
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Private Journaling & Mindful Reflection Companion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Theme Toggle Button */}
          <ThemeToggle />

          <button
            id="btn-nav-signin"
            onClick={handleSignIn}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-100 dark:to-stone-200 text-stone-50 dark:text-stone-900 text-xs font-bold hover:shadow-lg hover:scale-102 transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-md"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-stone-400 border-t-white dark:border-t-stone-900 rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In with Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        {/* Trust & Architecture Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 dark:bg-stone-850/85 backdrop-blur-xl border border-stone-200/80 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 text-xs font-semibold shadow-xs mb-8"
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Strict User-Isolated Cloud Firestore Storage & Gemini 3.6 Flash</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight max-w-3xl leading-[1.15] text-stone-900 dark:text-white"
        >
          Turn quiet reflections into deep clarity with{' '}
          <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 dark:from-amber-400 dark:via-rose-400 dark:to-cyan-400 bg-clip-text text-transparent">
            AI Guidance
          </span>
          .
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl font-normal leading-relaxed"
        >
          Write your unfiltered thoughts, brainstorm paths forward, and converse with a compassionate Gemini companion. Every word is strictly isolated to your private account.
        </motion.p>

        {/* Error notification if any */}
        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm max-w-md w-full text-left shadow-md">
            <span className="font-semibold block mb-1">Authentication Notice:</span>
            {error}
          </div>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <button
            id="btn-hero-google-signin"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-950 dark:from-white dark:via-stone-100 dark:to-amber-50 text-white dark:text-stone-900 font-bold text-base hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-102 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-60 shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-400 border-t-white dark:border-t-stone-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                  />
                </svg>
                <span>Continue with Google Sign-In</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1: Multi-Turn Gemini */}
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-300/80 dark:border-stone-700/80 shadow-md hover:border-amber-500/70 dark:hover:border-amber-500/70 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-950 dark:text-stone-50 text-base mb-2">
                Multi-Turn Gemini 3.6
              </h3>
              <p className="text-xs text-stone-900 dark:text-stone-200 font-medium leading-relaxed">
                Converse iteratively with Gemini on your reflections. Ask follow-ups, unpack emotions, or challenge assumptions.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Multi-Model Fallback Ladder</span>
            </div>
          </div>

          {/* Card 2: Isolated Firestore */}
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-300/80 dark:border-stone-700/80 shadow-md hover:border-emerald-500/70 dark:hover:border-emerald-500/70 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-950 dark:text-stone-50 text-base mb-2">
                Isolated Cloud Firestore
              </h3>
              <p className="text-xs text-stone-900 dark:text-stone-200 font-medium leading-relaxed">
                Every reflection is stored under strictly enforced owner security rules. No cross-user leaks or unauthorized reading.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-300 font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>Owner Security Rules</span>
            </div>
          </div>

          {/* Card 3: Four Adaptive Modes */}
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-300/80 dark:border-stone-700/80 shadow-md hover:border-indigo-500/70 dark:hover:border-indigo-500/70 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-950 dark:text-stone-50 text-base mb-2">
                4 Reflection Strategies
              </h3>
              <p className="text-xs text-stone-900 dark:text-stone-200 font-medium leading-relaxed">
                Seamlessly toggle Deep Reflection, Action Brainstorm, Synthesis Summary, and Mental Clarity with one tap.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 text-xs text-indigo-950 dark:text-indigo-300 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>Synthesis & Theme Extraction</span>
            </div>
          </div>
        </div>

        {/* Security & Privacy Commitment Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-white/95 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-700/80 backdrop-blur-xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-950 dark:text-stone-50 text-sm">
                Zero-Password Privacy & Secure Auth
              </h4>
              <p className="text-xs text-stone-900 dark:text-stone-300 font-medium mt-0.5">
                Authentication is protected with Google Identity; Gemini secrets never leave the server layer.
              </p>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            className="text-xs font-bold text-indigo-800 dark:text-indigo-300 underline underline-offset-4 hover:text-indigo-950 dark:hover:text-indigo-200 whitespace-nowrap cursor-pointer"
          >
            Start Reflecting &rarr;
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-stone-200/60 dark:border-stone-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
        <span>&copy; {new Date().getFullYear()} ReflectAI. Mindful AI Journaling Platform.</span>
        <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
      </footer>
    </div>
  );
};
