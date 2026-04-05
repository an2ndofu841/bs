'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { IdeaNodeCard } from './idea-node-card';
import type { IdeaNode } from '@/types/database';
import { generateId } from '@/lib/utils/id';
import { PERSPECTIVE_CARDS } from '@/lib/ai/perspective-cards';
import { Button } from '@/components/ui/button';

interface BrainstormCanvasProps {
  onAddManualNode: (title: string) => void;
}

export function BrainstormCanvas({ onAddManualNode }: BrainstormCanvasProps) {
  const { nodes, session, selectNode, selectedNodeId, updateNodePosition, isGenerating } = useSessionStore();
  const [manualInput, setManualInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSelect = useCallback((id: string) => {
    selectNode(selectedNodeId === id ? null : id);
  }, [selectNode, selectedNodeId]);

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    updateNodePosition(id, x, y);
  }, [updateNodePosition]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onAddManualNode(manualInput.trim());
    setManualInput('');
    setShowInput(false);
  }, [manualInput, onAddManualNode]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 canvas-grid bg-[var(--color-canvas-bg)]">
        {/* Center theme indicator */}
        {session && nodes.length === 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-40 h-40 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-6"
              >
                <div className="w-28 h-28 rounded-full bg-brand-500/15 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <span className="text-3xl">🌱</span>
                  </div>
                </div>
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{session.theme}</h3>
              <p className="text-gray-500 text-sm mb-6">AIがアイディアの種を生成します...</p>
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 backdrop-blur-lg rounded-full px-5 py-2.5 shadow-lg flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
              <span className="text-sm font-medium text-gray-700">AIが考え中...</span>
            </div>
          </motion.div>
        )}

        {/* Idea nodes */}
        <AnimatePresence>
          {nodes.map((node) => (
            <IdeaNodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={handleSelect}
              onDragEnd={handleDragEnd}
            />
          ))}
        </AnimatePresence>

        {/* Manual input toggle */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
          <AnimatePresence mode="wait">
            {showInput ? (
              <motion.form
                key="input"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                onSubmit={handleManualSubmit}
                className="flex items-center gap-2 bg-white rounded-2xl shadow-[var(--shadow-float)] p-2"
              >
                <input
                  autoFocus
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="アイディアを入力..."
                  className="px-4 py-2 text-sm rounded-xl border-0 focus:outline-none w-64"
                />
                <Button type="submit" size="sm" disabled={!manualInput.trim()}>
                  追加
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInput(false)}
                >
                  ✕
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowInput(true)}
                  className="shadow-[var(--shadow-float)] bg-white/90 backdrop-blur-lg"
                >
                  <span>✏️</span> 手動で追加
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
