'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session-store';
import type { IdeaNode } from '@/types/database';

interface ActionPanelProps {
  selectedNode: IdeaNode | null;
  onDerive: (action: string) => void;
  onPerspective: () => void;
  onRescue: (type: string) => void;
  isGenerating: boolean;
}

const DERIVE_ACTIONS = [
  { key: 'sharpen', label: 'もっと尖らせる', emoji: '⚡' },
  { key: 'realistic', label: '現実的にする', emoji: '🔧' },
  { key: 'reverse', label: '真逆にする', emoji: '🔄' },
  { key: 'target_change', label: 'ターゲット変更', emoji: '🎯' },
  { key: 'monetize', label: '収益化する', emoji: '💰' },
  { key: 'sns', label: 'SNS向けにする', emoji: '📱' },
  { key: 'naming', label: '名前をつける', emoji: '✏️' },
  { key: 'mvp', label: 'MVP化する', emoji: '🚀' },
  { key: 'lp', label: 'LP化する', emoji: '📄' },
  { key: 'action', label: '実行案にする', emoji: '📋' },
];

const RESCUE_ACTIONS = [
  { key: 'stuck', label: '詰まった', emoji: '😵' },
  { key: 'weird', label: '変な案ほしい', emoji: '🤪' },
  { key: 'too_serious', label: '真面目すぎる', emoji: '😤' },
  { key: 'more_sellable', label: 'もっと売れる方向', emoji: '💸' },
  { key: 'broaden', label: '雑に広げる', emoji: '🌀' },
  { key: 'steal_from_others', label: '他業界から盗む', emoji: '🕵️' },
  { key: 'reverse', label: '真逆から見る', emoji: '🔄' },
];

export function ActionPanel({ selectedNode, onDerive, onPerspective, onRescue, isGenerating }: ActionPanelProps) {
  return (
    <div className="w-72 bg-white border-l border-gray-100 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span>🎮</span> アクション
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">選択中</div>
                <div className="font-bold text-sm text-gray-900 line-clamp-2">{selectedNode.title}</div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  派生させる
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {DERIVE_ACTIONS.map((action) => (
                    <motion.button
                      key={action.key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isGenerating}
                      onClick={() => onDerive(action.key)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-100 hover:border-brand-200 hover:bg-brand-50 text-xs font-medium text-gray-700 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>{action.emoji}</span>
                      <span className="truncate">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="text-3xl mb-2">👆</div>
              <p className="text-sm text-gray-500">
                カードを選択すると
                <br />
                派生アクションが使えます
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>🃏</span> 視点カード
          </h4>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onPerspective}
            disabled={isGenerating || !selectedNode}
          >
            🎴 視点カードを引く
          </Button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>🆘</span> 行き詰まり救済
          </h4>
          <div className="space-y-2">
            {RESCUE_ACTIONS.map((action) => (
              <motion.button
                key={action.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isGenerating}
                onClick={() => onRescue(action.key)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-accent-300 hover:bg-accent-500/5 text-sm font-medium text-gray-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{action.emoji}</span>
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
