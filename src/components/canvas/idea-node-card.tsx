'use client';

import { useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { IdeaNode } from '@/types/database';
import { IDEA_NODE_TYPE_CONFIG } from '@/types/database';
import { useSessionStore } from '@/stores/session-store';

interface IdeaNodeCardProps {
  node: IdeaNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function IdeaNodeCard({ node, isSelected, onSelect, onDragEnd }: IdeaNodeCardProps) {
  const config = IDEA_NODE_TYPE_CONFIG[node.type];
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const hoveredNodeId = useSessionStore((s) => s.hoveredNodeId);
  const hoverNode = useSessionStore((s) => s.hoverNode);
  const isHovered = hoveredNodeId === node.id;

  return (
    <motion.div
      ref={constraintsRef}
      layout
      initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.08 : isHovered ? 1.04 : 1,
        rotate: 0,
        zIndex: isSelected ? 50 : isHovered ? 40 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onDragEnd(node.id, node.position_x + info.offset.x, node.position_y + info.offset.y);
      }}
      onClick={() => onSelect(node.id)}
      onHoverStart={() => hoverNode(node.id)}
      onHoverEnd={() => hoverNode(null)}
      className={`
        absolute cursor-grab active:cursor-grabbing
        idea-node-${node.type}
        rounded-2xl px-4 py-3 min-w-[160px] max-w-[220px]
        shadow-[var(--shadow-card)]
        select-none
        ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2 shadow-[var(--shadow-card-active)]' : ''}
        ${isHovered ? 'shadow-[var(--shadow-card-hover)]' : ''}
      `}
      style={{
        left: node.position_x,
        top: node.position_y,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0 mt-0.5">{config.emoji}</span>
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-500/80 mb-0.5">{config.label}</div>
          <div className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">
            {node.title}
          </div>
          {node.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
              {node.description}
            </div>
          )}
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full border-2 border-white"
        />
      )}
    </motion.div>
  );
}
