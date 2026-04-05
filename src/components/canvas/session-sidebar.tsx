'use client';

import Link from 'next/link';
import type { BrainstormSession } from '@/types/database';
import { IDEATION_MODE_LABELS } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface SessionSidebarProps {
  session: BrainstormSession;
  nodeCount: number;
}

export function SessionSidebar({ session, nodeCount }: SessionSidebarProps) {
  const modeConfig = IDEATION_MODE_LABELS[session.mode];

  return (
    <div className="w-64 bg-white border-r border-gray-100 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-brand-600 flex items-center gap-1 mb-3">
          ← ダッシュボード
        </Link>
        <h2 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{session.theme}</h2>
      </div>

      <div className="flex-1 p-4 space-y-5">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">目的</div>
          <p className="text-sm text-gray-700 leading-relaxed">{session.goal}</p>
        </div>

        {session.target && (
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">ターゲット</div>
            <p className="text-sm text-gray-700">{session.target}</p>
          </div>
        )}

        {session.constraints && (
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">制約</div>
            <p className="text-sm text-gray-700">{session.constraints}</p>
          </div>
        )}

        {session.avoid_rules && (
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">避けたいこと</div>
            <p className="text-sm text-gray-700">{session.avoid_rules}</p>
          </div>
        )}

        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">発想モード</div>
          <Badge variant="info">
            {modeConfig.emoji} {modeConfig.label}
          </Badge>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">アイディア数</span>
            <span className="font-bold text-gray-900">{nodeCount}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <Link
            href={`/session/${session.id}/organize`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors py-1"
          >
            🗂️ 整理・クラスタリング
          </Link>
          <Link
            href={`/session/${session.id}/action-plan`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors py-1"
          >
            🚀 実行案化
          </Link>
          {session.session_type === 'shared' && (
            <>
              <Link
                href={`/session/${session.id}/shared`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors py-1"
              >
                👥 共有画面
              </Link>
              <Link
                href={`/session/${session.id}/summary`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors py-1"
              >
                📝 会議サマリー
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
