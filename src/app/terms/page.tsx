'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  Edit3,
  FileText,
  Heading1,
  Heading3,
  Bold,
  List,
  ListOrdered,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function TermsEditorPage() {
  const [markdown, setMarkdown] = useState<string>('');
  const [originalMarkdown, setOriginalMarkdown] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'both' | 'editor' | 'preview'>('both');
  const [, startTransition] = useTransition();

  const isDirty = markdown !== originalMarkdown;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Compile markdown to HTML for live preview
  const updatePreview = useCallback((rawMd: string) => {
    try {
      const parsed = marked.parse(rawMd) as string;
      setPreviewHtml(parsed);
    } catch (err) {
      console.error('Failed to parse markdown:', err);
    }
  }, []);

  // Fetch initial terms on load
  useEffect(() => {
    async function loadTerms() {
      try {
        setLoading(true);
        const res = await fetch('/api/terms');
        if (!res.ok) {
          throw new Error('Failed to fetch terms of service');
        }
        const data = await res.json();
        if (data.markdown) {
          setMarkdown(data.markdown);
          setOriginalMarkdown(data.markdown);
          updatePreview(data.markdown);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load terms', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, [updatePreview]);

  // Handle textarea change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMarkdown(val);
    startTransition(() => {
      updatePreview(val);
    });
  };

  // Save handler
  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save terms');
      }

      setOriginalMarkdown(markdown);
      showToast('Terms of Service saved! Preview & PDF will immediately reflect changes.');
    } catch (err: any) {
      showToast(err.message || 'Failed to save terms', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset handler
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset Terms of Service to the default Nusa Flores Travel template?')) {
      return;
    }

    try {
      setResetting(true);
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset terms');
      }

      if (data.markdown) {
        setMarkdown(data.markdown);
        setOriginalMarkdown(data.markdown);
        updatePreview(data.markdown);
      }
      showToast('Terms of Service reset to default template.');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset terms', 'error');
    } finally {
      setResetting(false);
    }
  };

  // Helper to insert markdown tags at cursor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('terms-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selection = current.substring(start, end);

    const replacement = `${prefix}${selection || 'text'}${suffix}`;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);

    setMarkdown(nextVal);
    updatePreview(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection.length || 4));
    }, 50);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markdown, originalMarkdown]);

  // Statistics
  const lineCount = markdown.split('\n').length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left Brand & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-zinc-100 text-zinc-700 transition"
              title="Return to Proposal Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-zinc-200"></div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h1 className="text-sm font-bold text-zinc-900 tracking-tight">Terms of Service Editor</h1>
            </div>

            {/* Dirty / Saved Status */}
            <div className="hidden md:flex items-center ml-2">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View switcher for tablets/mobile */}
            <div className="flex lg:hidden bg-zinc-100 rounded-md p-0.5 border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-2 py-1 rounded ${activeTab === 'editor' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-600'}`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 rounded ${activeTab === 'preview' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-600'}`}
              >
                Preview
              </button>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Reset terms to default template"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-zinc-500 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset to Default</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || !isDirty}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Save changes to database (Ctrl+S)"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              <kbd className="hidden md:inline ml-1 text-[10px] text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">Ctrl+S</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Banner Info */}
        <div className="bg-white rounded-lg border border-zinc-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Edit the Terms & Conditions below using standard Markdown. All updates are immediately reflected dynamically in both the web proposal preview and exported PDFs.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-zinc-400">
            <span>{lineCount} lines</span>
            <span>•</span>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        {/* Editor and Preview Split Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[650px]">
          {/* LEFT: Markdown Editor */}
          <div
            className={`flex flex-col bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden ${
              activeTab === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Editor Toolbar */}
            <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('# ', '')}
                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 rounded transition"
                  title="Heading 1 (#)"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ', '')}
                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 rounded transition"
                  title="Section Heading 3 (###)"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-zinc-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 rounded transition"
                  title="Bold (**text**)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ', '')}
                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 rounded transition"
                  title="Bullet List (- item)"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('1. ', '')}
                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 rounded transition"
                  title="Numbered List (1. item)"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Markdown Editor</span>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative p-3">
              {loading ? (
                <div className="flex items-center justify-center h-full text-zinc-400 text-xs">
                  Loading terms content...
                </div>
              ) : (
                <textarea
                  id="terms-textarea"
                  value={markdown}
                  onChange={handleChange}
                  placeholder="Enter terms and conditions in markdown..."
                  className="w-full h-full min-h-[550px] p-3 text-xs font-mono leading-relaxed text-zinc-900 bg-zinc-50/50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white resize-none transition"
                  spellCheck={false}
                />
              )}
            </div>
          </div>

          {/* RIGHT: Live A4 Document Preview */}
          <div
            className={`flex flex-col bg-zinc-200/60 rounded-xl border border-zinc-300/80 shadow-xs overflow-hidden ${
              activeTab === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Preview Header */}
            <div className="bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-zinc-900">Live Proposal Preview</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                  Page 6 (Terms)
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">A4 Document Scale</span>
            </div>

            {/* Live Document Viewport */}
            <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-zinc-200/60">
              <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-md border border-zinc-200 rounded-sm p-[12mm] flex flex-col justify-between">
                {/* Terms Content Rendered with standard styling */}
                <div className="terms-section flex-1">
                  <div
                    className="terms-content text-zinc-900"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>

                {/* Footer Preview */}
                <div className="mt-8 pt-4 border-t border-zinc-100">
                  <div className="h-9 bg-[#00897b] flex justify-center items-center gap-6 text-[11px] text-white rounded">
                    <span>tourfloreskomodo.com</span>
                    <span>•</span>
                    <span>WhatsApp: +62 821-4473-7881</span>
                    <span>•</span>
                    <span>@tourfloreskomodo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
