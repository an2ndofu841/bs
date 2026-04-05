'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const PLACEHOLDERS = [
  'ひらめきを投げる...',
  '雑でもいいから書く...',
  '思いつきをそのまま置く...',
  'ふと浮かんだことを...',
  'とりあえず言ってみる...',
  '何でもいいから一言...',
];

interface IdeaInputBarProps {
  onSubmit: (text: string, autoGenerate: boolean) => void;
  disabled?: boolean;
}

export function IdeaInputBar({ onSubmit, disabled }: IdeaInputBarProps) {
  const [text, setText] = useState('');
  const [autoGen, setAutoGen] = useState(true);
  const [placeholder] = useState(() =>
    PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement;
        if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit(text.trim(), autoGen);
    setText('');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[var(--shadow-float)] border border-gray-100 p-1.5 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center">
          <span className="text-lg pl-3 pr-1">💡</span>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-2 py-2.5 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          onClick={() => setAutoGen(!autoGen)}
          className={`text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            autoGen
              ? 'bg-brand-50 text-brand-600 border border-brand-200'
              : 'bg-gray-50 text-gray-400 border border-gray-200'
          }`}
          title={autoGen ? 'AI自動派生: ON' : 'AI自動派生: OFF'}
        >
          🤖 {autoGen ? 'ON' : 'OFF'}
        </button>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          disabled={!text.trim() || disabled}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-brand-700 transition-colors"
        >
          投げる
        </motion.button>
      </form>

      <div className="text-center mt-1.5">
        <span className="text-[10px] text-gray-400">
          <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">/</kbd> で入力にフォーカス
        </span>
      </div>
    </motion.div>
  );
}
