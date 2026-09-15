import { useMemo, useState } from 'react';
import { X, Wand2, Check, Loader2, Cloud, FileCode2 } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import { AdminType, Flag } from '../types';
import { classifyAdminType, isSubnationalFlag } from '../lib/subnational';

interface SubnationalClassifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Candidate {
  id: string;
  name: string;
  adminType: AdminType;
  reason: string;
  isCloud: boolean;
}

/**
 * Admin bulk tool: applies the same high-precision classifier used by
 * scripts/classify-subnational.mjs to flags that live in the cloud
 * (Firestore `custom_flags` overrides / creations). Built-in code flags are
 * listed separately — those must go through the local script so the fix lands
 * in the data files instead of creating thousands of override docs.
 */
export function SubnationalClassifyModal({ isOpen, onClose }: SubnationalClassifyModalProps) {
  const { flags, isCustomFlag, editCustomFlag } = useFlags();
  const [applied, setApplied] = useState(0);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  const { cloudCandidates, builtinCount } = useMemo(() => {
    const cloud: Candidate[] = [];
    let builtin = 0;
    flags.forEach((f) => {
      if (!isSubnationalFlag(f)) return;
      if ((f.adminType || '').trim()) return;
      const r = classifyAdminType(f.name, f.imageUrl);
      if (!r.confident || !r.adminType) return;
      if (isCustomFlag(f.id)) {
        cloud.push({ id: f.id, name: f.name, adminType: r.adminType, reason: r.reason || '', isCloud: true });
      } else {
        builtin += 1;
      }
    });
    cloud.sort((a, b) => a.name.localeCompare(b.name));
    return { cloudCandidates: cloud, builtinCount: builtin };
  }, [flags, isCustomFlag]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setApplying(true);
    setApplied(0);
    setDone(false);
    const byId = new Map<string, Flag>(flags.map((f) => [f.id, f]));
    let n = 0;
    for (const c of cloudCandidates) {
      const orig = byId.get(c.id);
      if (!orig) continue;
      try {
        editCustomFlag({ ...orig, adminType: c.adminType });
        n += 1;
        setApplied(n);
      } catch {
        // keep going; failures stay untagged for a later pass
      }
      // Yield so the progress counter paints between Firestore writes.
      await new Promise((r) => setTimeout(r, 0));
    }
    setApplying(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
              <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Classify subdivision types</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                High-precision only — ambiguous flags stay unspecified
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
            <Cloud className="w-4 h-4 mt-0.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
              <strong>{cloudCandidates.length}</strong> cloud flag{cloudCandidates.length === 1 ? '' : 's'} can be
              tagged confidently (e.g. “(City Flag)”, “Municipality of …”). Applying writes each one back via the
              normal edit path, so sync and history keep working.
            </p>
          </div>

          {builtinCount > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <FileCode2 className="w-4 h-4 mt-0.5 text-zinc-500 flex-shrink-0" />
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <strong>{builtinCount}</strong> built-in flag{builtinCount === 1 ? '' : 's'} also look{builtinCount === 1 ? 's' : ''}{' '}
                classifiable — run <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[11px]">node scripts/classify-subnational.mjs --write</code>{' '}
                locally instead, so the fix lands in the data files rather than creating override records.
              </p>
            </div>
          )}

          {cloudCandidates.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Preview ({cloudCandidates.length})
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {cloudCandidates.slice(0, 100).map((c) => (
                  <div key={c.id} className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-zinc-700 dark:text-zinc-200" title={`${c.name} — ${c.reason}`}>
                      {c.name}
                    </span>
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold capitalize">
                      {c.adminType}
                    </span>
                  </div>
                ))}
                {cloudCandidates.length > 100 && (
                  <div className="px-3 py-2 text-[11px] text-zinc-400 text-center">
                    …and {cloudCandidates.length - 100} more
                  </div>
                )}
              </div>
            </div>
          )}

          {cloudCandidates.length === 0 && (
            <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Nothing confident left to tag in the cloud. Ambiguous flags stay unspecified by design.
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
              <Check className="w-4 h-4" />
              Applied {applied} tag{applied === 1 ? '' : 's'}. Close and re-open to recompute.
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {done ? 'Done' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={cloudCandidates.length === 0 || applying}
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors flex items-center gap-2"
          >
            {applying && <Loader2 className="w-4 h-4 animate-spin" />}
            {applying ? `Applying ${applied}/${cloudCandidates.length}…` : `Apply ${cloudCandidates.length} tags`}
          </button>
        </div>
      </div>
    </div>
  );
}
