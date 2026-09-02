import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Calendar,
  Sparkles,
  Tag,
  Trash2,
  ChevronRight,
  Filter,
  MessageSquare,
  FileText,
  Lightbulb,
  Compass,
  Brain,
  Download,
  Copy,
  Check,
  PlusCircle,
} from 'lucide-react';
import type { JournalInteraction, ReflectionMode } from '../types';

interface HistoryListProps {
  interactions: JournalInteraction[];
  onSelectInteraction: (interaction: JournalInteraction) => void;
  onDeleteInteraction: (id: string) => void;
  onNewReflection: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MODE_ICONS: Record<ReflectionMode, any> = {
  reflection: Compass,
  brainstorm: Lightbulb,
  summary: FileText,
  clarity: Brain,
};

const MODE_COLORS: Record<ReflectionMode, string> = {
  reflection: 'bg-amber-100 text-amber-800 border-amber-200',
  brainstorm: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  summary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  clarity: 'bg-purple-100 text-purple-800 border-purple-200',
};

const MOOD_EMOJIS: Record<string, string> = {
  mindful: '🌿',
  thoughtful: '🤔',
  'seeking-clarity': '🔍',
  grateful: '🙏',
  creative: '💡',
  energized: '⚡',
};

export const HistoryList: React.FC<HistoryListProps> = ({
  interactions,
  onSelectInteraction,
  onDeleteInteraction,
  onNewReflection,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    interactions.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [interactions]);

  // Filtered interactions
  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchMode = selectedMode === 'all' || item.mode === selectedMode;
      const matchTag = selectedTag === 'all' || (item.tags && item.tags.includes(selectedTag));

      return matchSearch && matchMode && matchTag;
    });
  }, [interactions, searchQuery, selectedMode, selectedTag]);

  const handleCopyMarkdown = (item: JournalInteraction, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `# ${item.title || 'Journal Reflection'}\n`;
    text += `Date: ${new Date(item.createdAt).toLocaleDateString()}\n`;
    text += `Mode: ${item.mode} | Mood: ${item.mood}\n\n`;
    
    if (item.summary) {
      text += `## Executive Summary\n${item.summary}\n\n`;
    }
    if (item.actionInsight) {
      text += `## Actionable Insight\n${item.actionInsight}\n\n`;
    }

    text += `## Conversation\n\n`;
    if (item.conversation && item.conversation.length > 0) {
      item.conversation.forEach((msg) => {
        text += `### ${msg.role === 'user' ? 'You' : 'Gemini 3.6 Flash'}\n${msg.content}\n\n`;
      });
    } else if (item.prompt) {
      text += `### You\n${item.prompt}\n\n`;
      if (item.response) {
        text += `### Gemini 3.6 Flash\n${item.response}\n\n`;
      }
    }

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Copied full reflection to clipboard!', 'info');
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteInteraction(id);
    setDeleteConfirmId(null);
    onShowToast('Journal entry removed from Firestore.', 'info');
  };

  return (
    <div id="history-view-container" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Search Bar */}
      <div className="bg-white/95 dark:bg-stone-900/90 rounded-2xl border border-stone-300 dark:border-stone-700 p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
              Past Reflections & Journal History
            </h2>
            <p className="text-xs text-stone-800 dark:text-stone-300 font-medium mt-1">
              All entries are securely stored and strictly isolated to your account in Cloud Firestore.
            </p>
          </div>

          <button
            onClick={onNewReflection}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-white transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-history-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries or tags..."
              className="w-full text-xs font-medium bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white dark:focus:bg-stone-700 focus:border-stone-500 text-stone-950 dark:text-stone-100 placeholder:text-stone-500 transition-colors"
            />
          </div>

          {/* Mode Filter */}
          <div>
            <select
              id="select-filter-mode"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full text-xs font-bold bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:bg-white dark:focus:bg-stone-700 focus:border-stone-500 text-stone-950 dark:text-stone-100 cursor-pointer"
            >
              <option value="all">All Strategies</option>
              <option value="reflection">Deep Reflection</option>
              <option value="brainstorm">Action Brainstorm</option>
              <option value="summary">Synthesis & Summary</option>
              <option value="clarity">Mental Clarity</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <select
              id="select-filter-tag"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full text-xs font-bold bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:bg-white dark:focus:bg-stone-700 focus:border-stone-500 text-stone-950 dark:text-stone-100 cursor-pointer"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entry Cards List */}
      {filteredInteractions.length === 0 ? (
        <div className="bg-white/95 dark:bg-stone-900/90 rounded-2xl border border-stone-300 dark:border-stone-700 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-stone-950 dark:text-stone-50 text-lg mb-1">
            {interactions.length === 0 ? 'No Reflections Yet' : 'No Matching Reflections'}
          </h3>
          <p className="text-xs text-stone-800 dark:text-stone-300 font-medium max-w-sm mx-auto mb-6 leading-relaxed">
            {interactions.length === 0
              ? 'Begin your first conversation or journal entry with Gemini 3.6 Flash. It will automatically save to your isolated Firestore account.'
              : 'Try adjusting your search query or reset filters to see your past journal entries.'}
          </p>
          <button
            onClick={onNewReflection}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:bg-stone-800 dark:hover:bg-white transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
            <span>Create First Reflection</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInteractions.map((item) => {
            const Icon = MODE_ICONS[item.mode] || Compass;
            const modeColor = MODE_COLORS[item.mode] || 'bg-stone-100 text-stone-800';
            const moodEmoji = MOOD_EMOJIS[item.mood] || '📝';
            const turnCount = item.conversation?.length || (item.prompt ? 2 : 0);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectInteraction(item)}
                className="bg-white/95 dark:bg-stone-900/90 rounded-2xl border border-stone-300 dark:border-stone-700 p-5 shadow-sm hover:border-stone-500 dark:hover:border-stone-500 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Mode Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${modeColor}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{item.mode}</span>
                    </span>

                    {/* Mood Emoji */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-[11px] font-bold">
                      <span>{moodEmoji}</span>
                      <span className="capitalize">{item.mood || 'Thoughtful'}</span>
                    </span>

                    {/* Conversation turns */}
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-700 dark:text-stone-300 font-bold">
                      <MessageSquare className="w-3 h-3" />
                      <span>{turnCount} turn{turnCount === 1 ? '' : 's'}</span>
                    </span>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex items-center gap-3 text-xs text-stone-700 dark:text-stone-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => handleCopyMarkdown(item, e)}
                      className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors"
                      title="Copy markdown"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Button */}
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => confirmDelete(item.id, e)}
                          className="px-2.5 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-[11px] font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Preview Body */}
                <div className="pt-3">
                  <h3 className="font-serif text-lg font-bold text-stone-950 dark:text-stone-50 group-hover:text-stone-800 dark:group-hover:text-white transition-colors flex items-center justify-between">
                    <span>{item.title || 'Untitled Reflection'}</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 group-hover:translate-x-0.5 transition-all" />
                  </h3>

                  {/* Summary or initial text snippet */}
                  <p className="text-xs text-stone-900 dark:text-stone-200 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                    {item.summary || (item.conversation && item.conversation[0]?.content) || item.prompt || 'No content preview.'}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                      <Tag className="w-3 h-3 text-stone-600 dark:text-stone-400" />
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-200 text-[11px] font-bold"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
