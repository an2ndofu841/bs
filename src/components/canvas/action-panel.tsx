'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { IdeaNode } from '@/types/database';

interface ActionPanelProps {
  selectedNode: IdeaNode | null;
  onDerive: (action: string) => void;
  onPerspective: () => void;
  onRescue: (type: string) => void;
  isGenerating: boolean;
}

const BOOSTERS = [
  { key: 'sharpen', label: 'もっと尖らせる', emoji: '⚡', color: 'from-yellow-400 to-orange-400' },
  { key: 'monetize', label: 'もっと売れる形に', emoji: '💰', color: 'from-green-400 to-emerald-500' },
  { key: 'reverse', label: '真逆にする', emoji: '🔄', color: 'from-purple-400 to-indigo-500' },
  { key: 'target_change', label: 'ターゲットを変える', emoji: '🎯', color: 'from-pink-400 to-rose-500' },
  { key: 'sns', label: 'SNSでバズらせる', emoji: '📱', color: 'from-cyan-400 to-blue-500' },
  { key: 'naming', label: '3秒で伝わる名前に', emoji: '✏️', color: 'from-amber-400 to-yellow-500' },
  { key: 'mvp', label: 'MVP化する', emoji: '🚀', color: 'from-blue-400 to-indigo-500' },
  { key: 'realistic', label: '今すぐ始められる形に', emoji: '🔧', color: 'from-gray-400 to-slate-500' },
  { key: 'worldview', label: '世界観を足す', emoji: '🌍', color: 'from-teal-400 to-cyan-500' },
  { key: 'story', label: 'ストーリー化する', emoji: '📖', color: 'from-violet-400 to-purple-500' },
  { key: 'character', label: 'キャラクター化する', emoji: '🎭', color: 'from-fuchsia-400 to-pink-500' },
  { key: 'weakness_flip', label: '弱点を武器にする', emoji: '💪', color: 'from-red-400 to-orange-500' },
  { key: 'subscription', label: 'サブスク化する', emoji: '♻️', color: 'from-lime-400 to-green-500' },
  { key: 'ai_service', label: 'AIサービス化する', emoji: '🤖', color: 'from-sky-400 to-blue-500' },
  { key: 'cross_industry', label: '他業界に転用する', emoji: '🔀', color: 'from-orange-400 to-red-500' },
];

const RESCUE_ACTIONS = [
  { key: 'stuck', label: '詰まった！助けて', emoji: '😵‍💫' },
  { key: 'weird', label: 'ぶっ飛んだ案ほしい', emoji: '🤪' },
  { key: 'broaden', label: '雑にぶわっと広げる', emoji: '🌀' },
  { key: 'too_serious', label: '真面目すぎる', emoji: '🎉' },
  { key: 'steal_from_others', label: '他業界から盗む', emoji: '🕵️' },
  { key: 'reverse', label: '全部ひっくり返す', emoji: '🔃' },
  { key: 'more_sellable', label: 'もっと売れる方向', emoji: '💸' },
];

export function ActionPanel({ selectedNode, onDerive, onPerspective, onRescue, isGenerating }: ActionPanelProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAction = (key: string) => {
    if (isGenerating) return;
    setActiveAction(key);
    onDerive(key);
    setTimeout(() => setActiveAction(null), 1500);
  };

  const handleRescue = (key: string) => {
    if (isGenerating) return;
    setActiveAction(key);
    onRescue(key);
    setTimeout(() => setActiveAction(null), 1500);
  };

  return (
    <div className="w-[280px] bg-white/80 backdrop-blur-xl border-l border-gray-100 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
          <span className="text-lg">🧠</span> 思考ブースター
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">押すたびにアイディアが変異する</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Selected node context */}
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl p-3 border border-brand-100"
            >
              <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-1">
                フォーカス中
              </div>
              <div className="font-bold text-sm text-gray-900 line-clamp-2">{selectedNode.title}</div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="text-2xl mb-2">👆</div>
              <p className="text-xs text-gray-500">
                カードを選んで
                <br />
                ブーストしよう
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boosters grid */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            🚀 派生させる
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {BOOSTERS.map((b) => (
              <motion.button
                key={b.key}
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.93 }}
                disabled={isGenerating || !selectedNode}
                onClick={() => handleAction(b.key)}
                className={`
                  relative overflow-hidden text-left p-2.5 rounded-xl
                  border border-gray-100 bg-white
                  hover:border-gray-200 hover:shadow-md
                  disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed
                  transition-all cursor-pointer group
                `}
              >
                {activeAction === b.key && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className={`absolute inset-0 bg-gradient-to-r ${b.color} opacity-10 origin-left`}
                  />
                )}
                <div className="relative">
                  <div className="text-base mb-0.5 group-hover:scale-110 transition-transform inline-block">
                    {b.emoji}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-700 leading-tight">
                    {b.label}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Perspective card */}
        <div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isGenerating || !selectedNode}
            onClick={onPerspective}
            className="w-full p-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 hover:border-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🃏</span>
              <div className="text-left">
                <div className="font-bold text-sm text-purple-900">視点カードを引く</div>
                <div className="text-[10px] text-purple-500">ランダムな視点でアイディアを変異</div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Rescue zone */}
        <div className="border-t border-gray-100 pt-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            🆘 行き詰まった？
          </div>
          <div className="space-y-1.5">
            {RESCUE_ACTIONS.map((r) => (
              <motion.button
                key={r.key}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.97 }}
                disabled={isGenerating}
                onClick={() => handleRescue(r.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-accent-300 hover:bg-accent-500/5 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="text-base">{r.emoji}</span>
                <span className="text-xs font-semibold text-gray-700">{r.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
