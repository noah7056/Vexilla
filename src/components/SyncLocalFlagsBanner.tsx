import React, { useState, useRef } from 'react';
import { Check, Copy, Download, Upload, AlertCircle, X, Cloud, Sparkles } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';

export function SyncLocalFlagsBanner() {
  const {
    customFlags,
    trash,
    permanentlyDeletedIds,
    hasLocalChanges,
    isFirestoreConnected,
    importCustomFlagsData
  } = useFlags();

  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!hasLocalChanges || isDismissed) {
    return null;
  }

  const totalDeleted = trash.length + permanentlyDeletedIds.length;

  const handleCopyJson = () => {
    const payload = {
      customFlags,
      trash,
      permanentlyDeletedIds
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadBackup = () => {
    const payload = {
      customFlags,
      trash,
      permanentlyDeletedIds,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexillo-custom-flags-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = importCustomFlagsData(json);
        if (res.success) {
          setImportStatus(`Successfully imported ${res.importedCount} flags!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus(`Import error: ${res.error}`);
        }
      } catch (err: any) {
        setImportStatus(`Invalid JSON file: ${err?.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`mb-4 p-4 rounded-2xl border text-zinc-800 dark:text-zinc-200 shadow-sm ${
      isFirestoreConnected
        ? 'bg-gradient-to-r from-emerald-500/10 via-zinc-100 to-indigo-500/10 dark:from-emerald-950/40 dark:via-zinc-800/90 dark:to-indigo-950/40 border-emerald-500/30 dark:border-emerald-800/50'
        : 'bg-gradient-to-r from-amber-500/10 via-zinc-100 to-indigo-500/10 dark:from-amber-500/15 dark:via-zinc-800/90 dark:to-indigo-500/15 border-amber-500/30 dark:border-zinc-700'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
            isFirestoreConnected
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            {isFirestoreConnected ? <Cloud className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
              <span>{isFirestoreConnected ? 'Saved to Cloud Database (Firestore)' : 'Local Flags Stored in Browser'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isFirestoreConnected
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
              }`}>
                {customFlags.length} added/edited · {totalDeleted} in trash
              </span>
            </h4>
            <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
              {isFirestoreConnected ? (
                <>All custom additions, edits, and deletions are <strong>automatically saved to Google Firebase Cloud Firestore</strong> in real time. Local browser storage is also maintained as an offline fallback.</>
              ) : (
                <>These changes are stored safely in your browser. To bake them permanently into the codebase files across all devices, click <strong>Copy JSON</strong> and paste it into the AI chat.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 border border-zinc-300/80 dark:border-zinc-600 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Download full JSON backup of your custom flags"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Download Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 border border-zinc-300/80 dark:border-zinc-600 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Import flags from JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Import JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs active:scale-95"
            title="Copy flags JSON to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isFirestoreConnected ? 'Copy JSON' : 'Copy JSON for AI Bake'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-800 dark:text-indigo-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}
    </div>
  );
}
