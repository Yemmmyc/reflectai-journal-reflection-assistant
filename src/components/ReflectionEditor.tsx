import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Brain,
  Lightbulb,
  FileText,
  Compass,
  Smile,
  RefreshCw,
  Copy,
  Check,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Wand2,
} from 'lucide-react';
import type { 
  JournalInteraction, 
  ReflectionMode, 
  JournalMood, 
  ChatMessage, 
  UserProfile 
} from '../types';
import { saveUserInteraction, getCurrentUserIdToken } from '../lib/firebase';

interface ReflectionEditorProps {
  user: UserProfile;
  interaction: JournalInteraction | null;
  onSaveComplete: (saved: JournalInteraction) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MODES: { id: ReflectionMode; label: string; icon: any; description: string; color: string }[] = [
  {
    id: 'reflection',
    label: 'Deep Reflection',
    icon: Compass,
    description: 'Empathetic inquiry, mindfulness, and reframing perspective',
    color: 'border-amber-500 bg-amber-50/50 text-amber-900',
  },
  {
    id: 'brainstorm',
    label: 'Action Brainstorm',
    icon: Lightbulb,
    description: 'Creative solutions, divergent ideas, and practical next steps',
    color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900',
  },
  {
    id: 'summary',
    label: 'Synthesis & Summary',
    icon: FileText,
    description: 'Crisp executive summary, key themes, and core takeaways',
    color: 'border-indigo-500 bg-indigo-50/50 text-indigo-900',
  },
  {
    id: 'clarity',
    label: 'Mental Clarity',
    icon: Brain,
    description: 'Declutter thinking, challenge assumptions, and focus priorities',
    color: 'border-purple-500 bg-purple-50/50 text-purple-900',
  },
];

const MOODS: { id: JournalMood; label: string; emoji: string }[] = [
  { id: 'mindful', label: 'Mindful', emoji: '🌿' },
  { id: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { id: 'seeking-clarity', label: 'Seeking Clarity', emoji: '🔍' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'creative', label: 'Creative', emoji: '💡' },
  { id: 'energized', label: 'Energized', emoji: '⚡' },
];

const PROMPT_INSPIRATIONS = [
  "What is one challenge that occupied my mind today, and what did it teach me?",
  "Where am I experiencing resistance or hesitation in my current goals?",
  "What are three subtle things I am genuinely grateful for today?",
  "If I had complete confidence, what decision would I make right now?",
  "What energised me most today, and what drained my energy?",
];

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  user,
  interaction,
  onSaveComplete,
  onShowToast,
}) => {
  const [currentId, setCurrentId] = useState<string>(interaction?.id || crypto.randomUUID());
  const [title, setTitle] = useState<string>(interaction?.title || '');
  const [mode, setMode] = useState<ReflectionMode>(interaction?.mode || 'reflection');
  const [mood, setMood] = useState<JournalMood>(interaction?.mood || 'thoughtful');
  const [tags, setTags] = useState<string[]>(interaction?.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  
  const [initialPrompt, setInitialPrompt] = useState<string>(interaction?.prompt || '');
  const [conversation, setConversation] = useState<ChatMessage[]>(interaction?.conversation || []);
  const [followUpInput, setFollowUpInput] = useState<string>('');
  
  const [summary, setSummary] = useState<string>(interaction?.summary || '');
  const [keyThemes, setKeyThemes] = useState<string[]>(interaction?.keyThemes || []);
  const [actionInsight, setActionInsight] = useState<string>(interaction?.actionInsight || '');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.6-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when selected interaction prop changes
  useEffect(() => {
    if (interaction) {
      setCurrentId(interaction.id);
      setTitle(interaction.title || '');
      setMode(interaction.mode || 'reflection');
      setMood(interaction.mood || 'thoughtful');
      setTags(interaction.tags || []);
      setInitialPrompt(interaction.prompt || '');
      setConversation(interaction.conversation || []);
      setSummary(interaction.summary || '');
      setKeyThemes(interaction.keyThemes || []);
      setActionInsight(interaction.actionInsight || '');
      setSaveStatus('saved');
    } else {
      // Reset for fresh reflection
      setCurrentId(crypto.randomUUID());
      setTitle('');
      setMode('reflection');
      setMood('thoughtful');
      setTags([]);
      setInitialPrompt('');
      setConversation([]);
      setSummary('');
      setKeyThemes([]);
      setActionInsight('');
      setSaveStatus('saved');
    }
  }, [interaction]);

  // Scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isGenerating]);

  // Unified save routine strictly verifying persistence
  const performSave = async (updatedConversation = conversation, updatedTitle = title, updatedSummary = summary, updatedThemes = keyThemes, updatedInsight = actionInsight) => {
    if (!user?.uid) return;
    
    setSaveStatus('saving');
    try {
      const entryTitle = updatedTitle.trim() || (initialPrompt ? initialPrompt.slice(0, 40) + '...' : 'Untitled Reflection');
      
      const payload: JournalInteraction = {
        id: currentId,
        userId: user.uid,
        title: entryTitle,
        prompt: initialPrompt,
        response: updatedConversation.length > 0 ? updatedConversation[updatedConversation.length - 1].content : '',
        mode,
        mood,
        tags,
        conversation: updatedConversation,
        summary: updatedSummary || undefined,
        keyThemes: updatedThemes.length > 0 ? updatedThemes : undefined,
        actionInsight: updatedInsight || undefined,
        createdAt: interaction?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserInteraction(user.uid, payload);
      setSaveStatus('saved');
      onSaveComplete(payload);
    } catch (err: any) {
      console.error('Save to Firestore failed:', err);
      setSaveStatus('error');
      onShowToast('Could not sync to Cloud Firestore. Check connection.', 'error');
    }
  };

  // Submit initial prompt or follow-up conversation to Gemini
  const handleSendPrompt = async (promptText: string, isFollowUp = false) => {
    const cleanText = promptText.trim();
    if (!cleanText || isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: cleanText,
      timestamp: new Date().toISOString(),
    };

    const nextConversation = [...conversation, userMessage];
    setConversation(nextConversation);
    if (!isFollowUp) {
      setInitialPrompt(cleanText);
    }
    setFollowUpInput('');
    setIsGenerating(true);
    setSaveStatus('unsaved');

    try {
      const idToken = await getCurrentUserIdToken();
      if (!idToken) {
        throw new Error('Authentication token missing. Please sign in again.');
      }

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: cleanText,
          history: conversation.map((msg) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            content: msg.content,
          })),
          mode,
          journalTitle: title,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini processing failed.');
      }

      if (data.modelUsed) {
        setActiveModel(data.modelUsed);
      }

      const modelMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: data.text,
        timestamp: new Date().toISOString(),
      };

      const finalConversation = [...nextConversation, modelMessage];
      setConversation(finalConversation);

      // Auto-generate title if blank
      let newTitle = title;
      if (!newTitle.trim()) {
        newTitle = cleanText.length > 35 ? cleanText.slice(0, 35) + '...' : cleanText;
        setTitle(newTitle);
      }

      // Persist immediately to Firestore
      await performSave(finalConversation, newTitle);
      onShowToast('Reflection generated and saved to Firestore.', 'success');
    } catch (error: any) {
      console.error('Reflection submission error:', error);
      onShowToast(error?.message || 'Failed to generate reflection with Gemini.', 'error');
      setSaveStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Executive Summary & Theme Tags via Gemini
  const handleAutoSummarize = async () => {
    const allContent = conversation.map((c) => `${c.role.toUpperCase()}: ${c.content}`).join('\n\n') || initialPrompt;
    if (!allContent.trim()) {
      onShowToast('Write or converse first before synthesizing a summary.', 'info');
      return;
    }

    setIsSummarizing(true);
    try {
      const idToken = await getCurrentUserIdToken();
      if (!idToken) {
        throw new Error('Authentication token missing. Please sign in again.');
      }

      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ content: allContent, title }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize summary.');
      }

      const { suggestedTitle, executiveSummary, keyThemes: themes, actionInsight: insight } = data.data;

      if (suggestedTitle && (!title || title.startsWith('Untitled'))) {
        setTitle(suggestedTitle);
      }
      setSummary(executiveSummary || '');
      if (Array.isArray(themes)) {
        setKeyThemes(themes);
        // Merge into tags
        setTags((prev) => Array.from(new Set([...prev, ...themes])));
      }
      setActionInsight(insight || '');

      await performSave(conversation, suggestedTitle || title, executiveSummary, themes || keyThemes, insight || actionInsight);
      onShowToast('Synthesized executive summary and key themes!', 'success');
    } catch (err: any) {
      console.error('Summarize error:', err);
      onShowToast(err.message || 'Could not generate summary.', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, '');
      if (cleaned && !tags.includes(cleaned)) {
        const nextTags = [...tags, cleaned];
        setTags(nextTags);
        setTagInput('');
        setSaveStatus('unsaved');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    setSaveStatus('unsaved');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Copied to clipboard', 'info');
  };

  return (
    <div id="reflection-editor-container" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Meta Bar: Mode Selector & Save Status */}
      <div className="bg-white/95 dark:bg-stone-900/90 rounded-2xl border border-stone-300 dark:border-stone-700 p-5 shadow-sm mb-6">
        {/* Row 1: Mode Selection Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-300 block mb-1.5">
              Reflection Strategy
            </span>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    id={`mode-btn-${m.id}`}
                    onClick={() => {
                      setMode(m.id);
                      setSaveStatus('unsaved');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? m.color + ' shadow-xs ring-1 ring-stone-900/20'
                        : 'border-stone-300 dark:border-stone-700 bg-stone-100/80 dark:bg-stone-800 text-stone-900 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Status & Action Controls */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="flex items-center gap-1.5 text-xs text-stone-800 dark:text-stone-300 font-semibold">
              {saveStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Syncing to Firestore...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-emerald-900 dark:text-emerald-300 font-bold">Saved to Cloud Firestore</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-900 dark:text-amber-300 font-bold">Unsaved edits</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-rose-700 dark:text-rose-300 font-bold">Save failed</span>
                </>
              )}
            </div>

            <button
              id="btn-manual-save"
              onClick={() => performSave()}
              disabled={saveStatus === 'saving'}
              className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Row 2: Title, Mood, & Tags */}
        <div className="pt-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              id="input-reflection-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus('unsaved');
              }}
              placeholder="Give this reflection a title (or start writing below)..."
              className="flex-1 w-full text-lg font-serif font-bold text-stone-950 dark:text-stone-50 placeholder:text-stone-500 dark:placeholder:text-stone-400 bg-transparent border-0 border-b border-transparent hover:border-stone-300 focus:border-stone-500 focus:ring-0 px-1 py-1 transition-all outline-none"
            />

            {/* Mood selector */}
            <div className="flex items-center gap-1.5 shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-300">Mood:</span>
              <select
                id="select-journal-mood"
                value={mood}
                onChange={(e) => {
                  setMood(e.target.value as JournalMood);
                  setSaveStatus('unsaved');
                }}
                className="text-xs font-bold text-stone-950 dark:text-stone-100 bg-transparent border-none outline-none cursor-pointer pr-1"
              >
                {MOODS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Synthesize Button */}
            {conversation.length > 0 && (
              <button
                id="btn-ai-synthesize"
                onClick={handleAutoSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 text-xs font-bold hover:bg-indigo-200 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
              >
                {isSummarizing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
                )}
                <span>Synthesize Insights</span>
              </button>
            )}
          </div>

          {/* Tags list & quick tag adder */}
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-stone-700 dark:text-stone-400" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200/90 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-200 text-xs font-bold"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-100 text-xs ml-0.5 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              id="input-tag-adder"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ add tag (press Enter)"
              className="text-xs font-semibold bg-transparent text-stone-900 dark:text-stone-200 placeholder:text-stone-500 outline-none border-b border-dashed border-stone-400 focus:border-stone-700 px-1 py-0.5 w-32"
            />
          </div>
        </div>
      </div>

      {/* AI Synthesized Insights Panel (if available) */}
      <AnimatePresence>
        {(summary || actionInsight || (keyThemes && keyThemes.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-indigo-100/90 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 text-stone-950 dark:text-stone-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-700 dark:bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                    AI Reflection Synthesis & Key Themes
                  </span>
                </div>
                <span className="text-[11px] text-indigo-900 dark:text-indigo-300 font-mono font-bold">Gemini Insight</span>
              </div>

              {summary && (
                <div className="text-sm text-stone-900 dark:text-stone-100 leading-relaxed mb-3">
                  <span className="font-bold text-stone-950 dark:text-white block mb-0.5">Executive Summary:</span>
                  {summary}
                </div>
              )}

              {actionInsight && (
                <div className="p-3.5 rounded-xl bg-white/95 dark:bg-stone-900/90 border border-indigo-200 dark:border-indigo-900 text-xs text-stone-950 dark:text-stone-100 flex items-start gap-2.5 mb-3 shadow-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-stone-950 dark:text-white">Actionable Takeaway:</span>
                    <span className="font-medium text-stone-900 dark:text-stone-200">{actionInsight}</span>
                  </div>
                </div>
              )}

              {keyThemes && keyThemes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Core Themes:</span>
                  {keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-white dark:bg-stone-900 text-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 text-xs font-bold"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Conversation & Journal Flow */}
      <div className="space-y-6">
        {/* If no messages yet: Initial Journal Entry Composition Card */}
        {conversation.length === 0 && (
          <div className="bg-white/95 dark:bg-stone-900/90 rounded-2xl border border-stone-300 dark:border-stone-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider">
                Unpack Your Thoughts
              </span>
              <span className="text-xs text-stone-700 dark:text-stone-400 font-semibold">Press Cmd/Ctrl + Enter to Reflect</span>
            </div>

            <textarea
              id="textarea-initial-journal"
              ref={promptInputRef}
              rows={6}
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSendPrompt(initialPrompt, false);
                }
              }}
              placeholder="What is on your mind today? Write freely about a decision, an emotion, a challenge at work, or something you are grateful for..."
              className="w-full text-base font-normal text-stone-950 dark:text-stone-50 placeholder:text-stone-500 dark:placeholder:text-stone-400 bg-stone-50 dark:bg-stone-850 rounded-xl p-4 border border-stone-300 dark:border-stone-700 focus:border-stone-600 focus:bg-white dark:focus:bg-stone-800 focus:ring-0 outline-none transition-all resize-y"
            />

            {/* Prompt Inspirations */}
            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-300 block mb-2">
                Need inspiration? Tap a reflective prompt:
              </span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_INSPIRATIONS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInitialPrompt(promptText);
                      promptInputRef.current?.focus();
                    }}
                    className="text-left text-xs px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-medium border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                  >
                    &ldquo;{promptText}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-stone-700 dark:text-stone-400 font-semibold">
                {initialPrompt.length} characters
              </div>

              <button
                id="btn-submit-first-reflection"
                onClick={() => handleSendPrompt(initialPrompt, false)}
                disabled={!initialPrompt.trim() || isGenerating}
                className="px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm hover:bg-stone-800 dark:hover:bg-white transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300 dark:text-amber-600" />
                    <span>Conversing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 dark:text-amber-600" />
                    <span>Begin Reflection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Multi-Turn Conversation Thread */}
        {conversation.length > 0 && (
          <div className="space-y-6">
            {conversation.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-3xl w-full rounded-2xl p-6 shadow-sm border ${
                      isUser
                        ? 'bg-stone-900 text-stone-50 border-stone-800'
                        : 'bg-white/95 dark:bg-stone-900/90 text-stone-950 dark:text-stone-50 border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {/* Header of message bubble */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 dark:border-stone-800 text-xs">
                      <div className="flex items-center gap-2">
                        {isUser ? (
                          <div className="w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold text-white">
                            You
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-amber-300 dark:text-amber-600" />
                          </div>
                        )}
                        <span className={`font-bold ${isUser ? 'text-stone-100' : 'text-stone-900 dark:text-stone-100'}`}>
                          {isUser ? user.displayName || 'Your Journal Entry' : 'ReflectAI Companion'}
                        </span>
                        {!isUser && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-200 border border-stone-300 dark:border-stone-700">
                            {activeModel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                        <span className="text-xs font-medium">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors p-1 rounded cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert text-stone-100' : 'text-stone-900 dark:text-stone-100 font-medium'} leading-relaxed`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Generating Indicator Bubble */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start"
              >
                <div className="p-5 rounded-2xl bg-white/95 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-700 shadow-sm flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300 dark:text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-950 dark:text-stone-50 block">Gemini 3.6 Flash is reflecting...</span>
                    <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">Processing multi-turn context and synthesizing guidance</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />

            {/* Follow-up Question / Multi-turn Prompt Input Box */}
            <div className="bg-white/95 dark:bg-stone-900/90 rounded-2xl border border-stone-300 dark:border-stone-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-200">
                  Continue Reflection or Ask Gemini a Follow-up
                </span>
                <span className="text-xs text-stone-700 dark:text-stone-400 font-semibold">Cmd/Ctrl + Enter to send</span>
              </div>

              <div className="relative">
                <textarea
                  id="textarea-followup-prompt"
                  rows={3}
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSendPrompt(followUpInput, true);
                    }
                  }}
                  placeholder="Ask a question, elaborate on a thought, or ask Gemini to break this down into actionable next steps..."
                  className="w-full text-sm font-medium text-stone-950 dark:text-stone-50 placeholder:text-stone-500 dark:placeholder:text-stone-400 bg-stone-50 dark:bg-stone-850 rounded-xl p-3.5 pr-24 border border-stone-300 dark:border-stone-700 focus:border-stone-600 focus:bg-white dark:focus:bg-stone-800 focus:ring-0 outline-none transition-all resize-y"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    id="btn-send-followup"
                    onClick={() => handleSendPrompt(followUpInput, true)}
                    disabled={!followUpInput.trim() || isGenerating}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3 text-amber-300 dark:text-amber-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
