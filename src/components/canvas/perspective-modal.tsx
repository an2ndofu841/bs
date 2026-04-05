'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PERSPECTIVE_CARDS } from '@/lib/ai/perspective-cards';

interface PerspectiveModalProps {
  onSelect: (key: string) => void;
  onClose: () => void;
}

export function PerspectiveModal({ onSelect, onClose }: PerspectiveModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-[var(--shadow-float)] max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🃏</div>
            <h2 className="text-2xl font-bold text-gray-900">視点カードを引く</h2>
            <p className="text-gray-500 mt-1">新しい視点でアイディアを広げよう</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PERSPECTIVE_CARDS.map((card, i) => (
              <motion.button
                key={card.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.05, rotate: Math.random() * 4 - 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(card.key)}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-brand-50 border-2 border-purple-100 hover:border-purple-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-sm text-gray-900 mb-1">{card.label}</div>
                <div className="text-xs text-gray-500">{card.description}</div>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const random = PERSPECTIVE_CARDS[Math.floor(Math.random() * PERSPECTIVE_CARDS.length)];
                onSelect(random.key);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-brand-500 text-white font-bold shadow-lg cursor-pointer"
            >
              🎲 ランダムに引く
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
