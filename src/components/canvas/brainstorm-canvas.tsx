'use client';

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/stores/session-store';
import { IDEA_NODE_TYPE_CONFIG } from '@/types/database';
import type { IdeaNode } from '@/types/database';

interface BrainstormCanvasProps {
  onSelectCenter: (id: string) => void;
  centerNodeId: string | null;
}

export function BrainstormCanvas({ onSelectCenter, centerNodeId }: BrainstormCanvasProps) {
  const { nodes, session, isGenerating } = useSessionStore();

  const centerNode = useMemo(
    () => nodes.find((n) => n.id === centerNodeId) || null,
    [nodes, centerNodeId]
  );

  const derivedNodes = useMemo(() => {
    if (!centerNodeId) return nodes.slice(0, 10);
    return nodes.filter((n) => n.id !== centerNodeId);
  }, [nodes, centerNodeId]);

  const visibleDerived = derivedNodes.slice(0, 12);

  const getPosition = useCallback((index: number, total: number) => {
    const baseRadius = 220;
    const jitter = 20;
    const angle = (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
    const r = baseRadius + (Math.sin(index * 2.7) * jitter);
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    };
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden canvas-dots bg-[var(--color-canvas-bg)]">
      {/* Generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-5 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg flex items-center gap-3 border border-brand-100">
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 border-2 border-brand-200 rounded-full" />
                <div className="absolute inset-0 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-sm font-semibold text-brand-700">ひらめき生成中...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idea count badge */}
      {nodes.length > 0 && (
        <div className="absolute top-5 right-5 z-30">
          <motion.div
            key={nodes.length}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-md border border-gray-100 flex items-center gap-2"
          >
            <span className="text-lg">💡</span>
            <span className="font-bold text-gray-900">{nodes.length}</span>
            <span className="text-xs text-gray-500">アイディア</span>
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      {!centerNode && nodes.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-36 h-36 rounded-full bg-gradient-to-br from-brand-100 to-brand-200/60 flex items-center justify-center mx-auto mb-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-200 to-brand-300/60 flex items-center justify-center">
                <span className="text-4xl">🌱</span>
              </div>
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{session?.theme}</h3>
            <p className="text-gray-500 text-sm">AIがアイディアの種を生成します...</p>
          </div>
        </motion.div>
      )}

      {/* Radial layout container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bac8ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#bac8ff" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {centerNode && visibleDerived.map((node, i) => {
            const pos = getPosition(i, visibleDerived.length);
            return (
              <motion.line
                key={`line-${node.id}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                x1="50%" y1="50%"
                x2={`calc(50% + ${pos.x}px)`}
                y2={`calc(50% + ${pos.y}px)`}
                stroke="url(#lineGrad)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            );
          })}
        </svg>

        {/* Center card */}
        <AnimatePresence mode="wait">
          {centerNode && (
            <CenterCard key={centerNode.id} node={centerNode} />
          )}
        </AnimatePresence>

        {/* Derived cards */}
        <AnimatePresence>
          {centerNode && visibleDerived.map((node, i) => {
            const pos = getPosition(i, visibleDerived.length);
            return (
              <DerivedCard
                key={node.id}
                node={node}
                x={pos.x}
                y={pos.y}
                index={i}
                onClick={() => onSelectCenter(node.id)}
              />
            );
          })}
        </AnimatePresence>

        {/* If no center, show all as a grid */}
        {!centerNode && nodes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl p-8">
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <SmallCard node={node} onClick={() => onSelectCenter(node.id)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CenterCard({ node }: { node: IdeaNode }) {
  const config = IDEA_NODE_TYPE_CONFIG[node.type];
  const meta = node.metadata as Record<string, string>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      className={`
        relative z-20 idea-node-${node.type}
        rounded-3xl px-8 py-6 min-w-[240px] max-w-[320px]
        shadow-[var(--shadow-card-active)]
        animate-pulse-ring cursor-default
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{config.emoji}</span>
        <span className="text-xs font-semibold text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
          {config.label}
        </span>
        {meta?.derivedFrom && (
          <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            {meta.derivedFrom}
          </span>
        )}
      </div>
      <h3 className="font-bold text-base text-gray-900 leading-snug mb-1.5">
        {node.title}
      </h3>
      {node.description && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {node.description}
        </p>
      )}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white rounded-full px-3 py-0.5 shadow-sm border border-gray-100 whitespace-nowrap">
        クリックで中心を変更 →
      </div>
    </motion.div>
  );
}

function DerivedCard({ node, x, y, index, onClick }: {
  node: IdeaNode; x: number; y: number; index: number; onClick: () => void;
}) {
  const config = IDEA_NODE_TYPE_CONFIG[node.type];
  const meta = node.metadata as Record<string, string>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        delay: index * 0.06,
        type: 'spring',
        stiffness: 200,
        damping: 18,
      }}
      whileHover={{ scale: 1.12, zIndex: 30, boxShadow: 'var(--shadow-card-hover)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        absolute idea-node-${node.type}
        rounded-2xl px-4 py-3 min-w-[150px] max-w-[200px]
        shadow-[var(--shadow-card)] cursor-pointer
        hover:shadow-[var(--shadow-card-hover)] transition-shadow
        ${node.metadata && (node.metadata as Record<string, unknown>).favorite ? 'idea-node-favorite' : ''}
      `}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{config.emoji}</span>
        {meta?.derivedFrom && (
          <span className="text-[9px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
            {meta.derivedFrom}
          </span>
        )}
      </div>
      <div className="font-semibold text-xs text-gray-900 leading-snug line-clamp-2">
        {node.title}
      </div>
      {node.description && (
        <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{node.description}</div>
      )}
    </motion.div>
  );
}

function SmallCard({ node, onClick }: { node: IdeaNode; onClick: () => void }) {
  const config = IDEA_NODE_TYPE_CONFIG[node.type];
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        w-full text-left idea-node-${node.type}
        rounded-2xl px-4 py-3 shadow-[var(--shadow-card)]
        hover:shadow-[var(--shadow-card-hover)] transition-shadow cursor-pointer
      `}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span>{config.emoji}</span>
        <span className="text-[10px] text-gray-500">{config.label}</span>
      </div>
      <div className="font-semibold text-sm text-gray-900 line-clamp-2">{node.title}</div>
    </motion.button>
  );
}
