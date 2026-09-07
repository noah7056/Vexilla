import React from 'react';
import {
  ShieldCheck,
  History,
  HelpCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Heart,
  Layers,
  Award,
  FileQuestion
} from 'lucide-react';
import { FlagStatus } from '../types';

interface StatusBadgeProps {
  status?: FlagStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  if (!status) return null;

  const config: Record<
    FlagStatus,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      bgLight: string;
      bgDark: string;
      textLight: string;
      textDark: string;
      borderLight: string;
      borderDark: string;
    }
  > = {
    official: {
      label: 'Official',
      icon: ShieldCheck,
      bgLight: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-950/60',
      textLight: 'text-emerald-700',
      textDark: 'dark:text-emerald-300',
      borderLight: 'border-emerald-200',
      borderDark: 'dark:border-emerald-800/60'
    },
    unofficial: {
      label: 'Unofficial',
      icon: HelpCircle,
      bgLight: 'bg-amber-50',
      bgDark: 'dark:bg-amber-950/60',
      textLight: 'text-amber-700',
      textDark: 'dark:text-amber-300',
      borderLight: 'border-amber-200',
      borderDark: 'dark:border-amber-800/60'
    },
    historical: {
      label: 'Historical',
      icon: History,
      bgLight: 'bg-orange-50',
      bgDark: 'dark:bg-orange-950/60',
      textLight: 'text-orange-700',
      textDark: 'dark:text-orange-300',
      borderLight: 'border-orange-200',
      borderDark: 'dark:border-orange-800/60'
    },
    proposed: {
      label: 'Proposed',
      icon: Sparkles,
      bgLight: 'bg-sky-50',
      bgDark: 'dark:bg-sky-950/60',
      textLight: 'text-sky-700',
      textDark: 'dark:text-sky-300',
      borderLight: 'border-sky-200',
      borderDark: 'dark:border-sky-800/60'
    },
    fictional: {
      label: 'Fictional',
      icon: Sparkles,
      bgLight: 'bg-purple-50',
      bgDark: 'dark:bg-purple-950/60',
      textLight: 'text-purple-700',
      textDark: 'dark:text-purple-300',
      borderLight: 'border-purple-200',
      borderDark: 'dark:border-purple-800/60'
    },
    'fan-made': {
      label: 'Fan-made',
      icon: Heart,
      bgLight: 'bg-pink-50',
      bgDark: 'dark:bg-pink-950/60',
      textLight: 'text-pink-700',
      textDark: 'dark:text-pink-300',
      borderLight: 'border-pink-200',
      borderDark: 'dark:border-pink-800/60'
    },
    obsolete: {
      label: 'Obsolete',
      icon: Clock,
      bgLight: 'bg-zinc-100',
      bgDark: 'dark:bg-zinc-800',
      textLight: 'text-zinc-700',
      textDark: 'dark:text-zinc-300',
      borderLight: 'border-zinc-300',
      borderDark: 'dark:border-zinc-700'
    },
    variant: {
      label: 'Variant',
      icon: Layers,
      bgLight: 'bg-cyan-50',
      bgDark: 'dark:bg-cyan-950/60',
      textLight: 'text-cyan-700',
      textDark: 'dark:text-cyan-300',
      borderLight: 'border-cyan-200',
      borderDark: 'dark:border-cyan-800/60'
    },
    disputed: {
      label: 'Disputed',
      icon: AlertTriangle,
      bgLight: 'bg-rose-50',
      bgDark: 'dark:bg-rose-950/60',
      textLight: 'text-rose-700',
      textDark: 'dark:text-rose-300',
      borderLight: 'border-rose-200',
      borderDark: 'dark:border-rose-800/60'
    },
    ceremonial: {
      label: 'Ceremonial',
      icon: Award,
      bgLight: 'bg-yellow-50',
      bgDark: 'dark:bg-yellow-950/60',
      textLight: 'text-yellow-800',
      textDark: 'dark:text-yellow-300',
      borderLight: 'border-yellow-200',
      borderDark: 'dark:border-yellow-800/60'
    }
  };

  const item = config[status] || {
    label: status,
    icon: FileQuestion,
    bgLight: 'bg-zinc-100',
    bgDark: 'dark:bg-zinc-800',
    textLight: 'text-zinc-700',
    textDark: 'dark:text-zinc-300',
    borderLight: 'border-zinc-200',
    borderDark: 'dark:border-zinc-700'
  };

  const Icon = item.icon;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] rounded-md gap-1 font-medium'
      : 'px-3 py-1 text-xs rounded-xl gap-1.5 font-semibold';
  const iconSizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <div
      className={`inline-flex items-center border ${item.bgLight} ${item.bgDark} ${item.textLight} ${item.textDark} ${item.borderLight} ${item.borderDark} ${sizeClasses} ${className}`}
      title={`Status: ${item.label}`}
    >
      <Icon className={iconSizeClasses} />
      <span>{item.label}</span>
    </div>
  );
}
