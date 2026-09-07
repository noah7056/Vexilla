import React, { useState, useRef } from 'react';
import { Download, Upload, Copy, Check, AlertCircle, X, FileJson, Sparkles } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const {
    customFlags,
    trash,
    permanentlyDeletedIds,
    importCustomFlagsData,
    exportCustomFlagsData
  } = useFlags();

  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalModifications = customFlags.length + trash.length + permanentlyDeletedIds.length;

  const handleCopy = () => {
    const data = exportCustomFlagsData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const data = exportCustomFlagsData();
    const payload = {
      ...data,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexillo-flags-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ text: 'Backup downloaded successfully!', isError: false });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const res = importCustomFlagsData(parsed);
        if (res.success) {
          setStatusMessage({ text: `Successfully imported ${res.importedCount} flags!`, isError: false });
        } else {
          setStatusMessage({ text: res.error || 'Failed to import', isError: true });
        }
      } catch (err: any) {
        setStatusMessage({ text: `Invalid JSON file: ${err?.message}`, isError: true });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = () => {
    if (!jsonText.trim()) {
      setStatusMessage({ text: 'Please paste JSON data first.', isError: true });
      return;
    }
    try {
      const parsed = JSON.parse(jsonText.trim());
      const res = importCustomFlagsData(parsed);
      if (res.success) {
        setStatusMessage({ text: `Successfully imported ${res.importedCount} flags!`, isError: false });
        setJsonText('');
      } else {
        setStatusMessage({ text: res.error || 'Failed to import flags', isError: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Invalid JSON format: ${err?.message}`, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/80">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Custom Flags & Backup Manager
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Export, backup, or restore your custom flags and dictionary edits.
            </p>
          </div>
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Info card */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 mb-5">
          <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Current Stored Data</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[11px]">
              {customFlags.length} flags · {trash.length} in trash · {permanentlyDeletedIds.length} hidden
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Flags you add or edit in the browser are saved directly in your browser's persistent local storage. You can download a backup file anytime, or copy the JSON to share with the AI agent to permanently bake them into source code files.
          </p>
        </div>

        {/* Section 1: Export / Backup */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            1. Export & Backup
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 border border-zinc-300/80 dark:border-zinc-600 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Download .JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy JSON to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Import */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            2. Import & Restore
          </h4>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 border border-zinc-300/80 dark:border-zinc-600 transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Upload Backup File (.json)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="space-y-2 mt-2">
            <textarea
              rows={3}
              placeholder="Or paste JSON flags data here..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {jsonText.trim() && (
              <button
                type="button"
                onClick={handlePasteImport}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer active:scale-95"
              >
                Restore from Pasted JSON
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
