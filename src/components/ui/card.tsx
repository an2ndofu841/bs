'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
}

export function Card({ hover = false, children, className = '', ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: 'var(--shadow-card-hover)' } : undefined}
      className={`
        bg-white rounded-2xl shadow-[var(--shadow-card)]
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
