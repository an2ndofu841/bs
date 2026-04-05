'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { IdeaNode } from '@/types/database';

interface QuickActionsProps {
  node: IdeaNode | null;
  onDerive: (action: string) => void;
  onFavorite: () => void;
  isGenerating: boolean;
}

const QUICK = [
  { key: 'sharpen', label: '深掘る', emoji: '🔍' },
  { key: 'broaden', label: '広げる', emoji: '🌊' },
  { key: 'reverse', label: '真逆に', emoji: '🔄' },
  { key: 'naming', label: '名前変更', emoji: '✏️' },
  { key: 'target_change', label: 'ターゲット変更', emoji: '🎯' },
  { key: 'monetize', label: 'マネタイズ', emoji: '💰' },
  { key: 'worldview', label: '世界観', emoji: '🌍' },
  { key: 'mvp', label: 'MVP化', emoji: '🚀' },
];

export function QuickActions({ node, onDerive, onFavorite, isGenerating }: QuickActionsProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-1">
            <span className="text-xs text-gray-500 font-semibold mr-1 whitespace-nowrap">
              「{node.title.slice(0, 10)}{node.title.length > 10 ? '...' : ''}」→
            </span>

            {QUICK.map((q) => (
              <motion.button
                key={q.key}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                disabled={isGenerating}
                onClick={() => onDerive(q.key)}
                title={q.label}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer text-sm"
              >
                {q.emoji}
              </motion.button>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onFavorite}
              title="お気に入り"
              className="w-8 h-8 rounded-lg hover:bg-pink-50 flex items-center justify-center transition-colors cursor-pointer text-sm"
            >
              ❤️
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
