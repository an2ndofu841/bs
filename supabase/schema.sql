-- ============================================
-- 最強で最高に楽しいブレストツール - DB Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- brainstorm_sessions
-- ============================================
create table public.brainstorm_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  theme text not null,
  goal text not null,
  target text,
  constraints text,
  avoid_rules text,
  mode text not null default 'mass' check (mode in ('mass','sharpen','differentiate','monetize','realize','buzz','customer_pain','worldview')),
  session_type text not null default 'solo' check (session_type in ('solo','shared')),
  status text not null default 'active' check (status in ('draft','active','paused','completed','archived')),
  share_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sessions_user on public.brainstorm_sessions(user_id);
create index idx_sessions_share_code on public.brainstorm_sessions(share_code);

-- ============================================
-- idea_nodes
-- ============================================
create table public.idea_nodes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.brainstorm_sessions(id) on delete cascade not null,
  parent_id uuid references public.idea_nodes(id) on delete set null,
  type text not null default 'seed' check (type in ('seed','sprout','card','action_plan')),
  title text not null,
  description text not null default '',
  position_x float not null default 0,
  position_y float not null default 0,
  cluster_key text,
  source_type text not null default 'manual' check (source_type in ('manual','ai','merged','perspective','rescue','participant')),
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_nodes_session on public.idea_nodes(session_id);

-- ============================================
-- idea_edges
-- ============================================
create table public.idea_edges (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.brainstorm_sessions(id) on delete cascade not null,
  from_node_id uuid references public.idea_nodes(id) on delete cascade not null,
  to_node_id uuid references public.idea_nodes(id) on delete cascade not null,
  edge_type text not null default 'derived' check (edge_type in ('derived','merged','related'))
);

create index idx_edges_session on public.idea_edges(session_id);

-- ============================================
-- perspective_cards (seed data)
-- ============================================
create table public.perspective_cards (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  label text not null,
  description text not null
);

insert into public.perspective_cards (key, label, description) values
  ('reverse', '真逆にする', '全ての前提を逆転させてみる'),
  ('kids', '子ども向けにする', '小学生でも使えるようにシンプルに'),
  ('luxury', '富裕層向けにする', '最高級・プレミアムな体験に変換'),
  ('add_constraint', '制約を足す', 'あえて制限を加えて創造性を引き出す'),
  ('cross_industry', '異業種から借りる', '全く違う業界の成功パターンを適用'),
  ('worldview', '世界観を乗せる', 'ストーリーやブランドの世界観を付与'),
  ('three_seconds', '3秒で伝える', '一瞬で価値が伝わる形に圧縮'),
  ('subscription', 'サブスク化する', '継続利用モデルに変換'),
  ('fanatic', '熱狂ファン向けにする', 'コアファンが熱狂する要素を追加'),
  ('beginner', '初心者向けにする', '誰でも始められるハードルの低さに'),
  ('automate', '全自動にする', 'ユーザーの手間をゼロにできないか'),
  ('social', 'ソーシャル化する', '友達と使える・共有したくなる設計に'),
  ('gamify', 'ゲーム化する', 'ゲームの仕組みを取り入れる'),
  ('offline', 'オフラインで考える', 'リアルな場での体験に変換'),
  ('data_driven', 'データで語る', '数字やエビデンスベースにする');

-- ============================================
-- action_plans
-- ============================================
create table public.action_plans (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.brainstorm_sessions(id) on delete cascade not null,
  node_id uuid references public.idea_nodes(id) on delete cascade not null,
  summary text not null,
  target_user text not null default '',
  value_proposition text not null default '',
  steps jsonb not null default '[]',
  kpi jsonb not null default '[]',
  risks jsonb not null default '[]',
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_action_plans_session on public.action_plans(session_id);

-- ============================================
-- session_participants
-- ============================================
create table public.session_participants (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.brainstorm_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  role text not null default 'participant' check (role in ('facilitator','participant','viewer')),
  joined_at timestamptz not null default now()
);

create index idx_participants_session on public.session_participants(session_id);

-- ============================================
-- participant_inputs
-- ============================================
create table public.participant_inputs (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.brainstorm_sessions(id) on delete cascade not null,
  participant_id uuid references public.session_participants(id) on delete cascade not null,
  content text not null,
  input_type text not null default 'idea' check (input_type in ('idea','reaction','vote','comment')),
  target_node_id uuid references public.idea_nodes(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_participant_inputs_session on public.participant_inputs(session_id);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.brainstorm_sessions enable row level security;
alter table public.idea_nodes enable row level security;
alter table public.idea_edges enable row level security;
alter table public.perspective_cards enable row level security;
alter table public.action_plans enable row level security;
alter table public.session_participants enable row level security;
alter table public.participant_inputs enable row level security;

-- perspective_cards: everyone can read
create policy "Anyone can read perspective cards"
  on public.perspective_cards for select using (true);

-- brainstorm_sessions: owner can CRUD, shared session participants can read
create policy "Users can view own sessions"
  on public.brainstorm_sessions for select
  using (auth.uid() = user_id);

create policy "Users can view shared sessions they participate in"
  on public.brainstorm_sessions for select
  using (
    session_type = 'shared' and
    exists (
      select 1 from public.session_participants sp
      where sp.session_id = id and sp.user_id = auth.uid()
    )
  );

create policy "Users can insert own sessions"
  on public.brainstorm_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.brainstorm_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.brainstorm_sessions for delete
  using (auth.uid() = user_id);

-- idea_nodes: session owner + participants (for shared)
create policy "Session owner can manage nodes"
  on public.idea_nodes for all
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and bs.user_id = auth.uid()
    )
  );

create policy "Participants can view shared session nodes"
  on public.idea_nodes for select
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      join public.session_participants sp on sp.session_id = bs.id
      where bs.id = session_id and bs.session_type = 'shared' and sp.user_id = auth.uid()
    )
  );

create policy "Participants can insert to shared sessions"
  on public.idea_nodes for insert
  with check (
    exists (
      select 1 from public.brainstorm_sessions bs
      join public.session_participants sp on sp.session_id = bs.id
      where bs.id = session_id and bs.session_type = 'shared'
        and sp.user_id = auth.uid() and sp.role in ('facilitator','participant')
    )
  );

-- idea_edges: same as nodes
create policy "Session owner can manage edges"
  on public.idea_edges for all
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and bs.user_id = auth.uid()
    )
  );

create policy "Participants can view shared session edges"
  on public.idea_edges for select
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      join public.session_participants sp on sp.session_id = bs.id
      where bs.id = session_id and bs.session_type = 'shared' and sp.user_id = auth.uid()
    )
  );

-- action_plans
create policy "Session owner can manage action plans"
  on public.action_plans for all
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and bs.user_id = auth.uid()
    )
  );

-- session_participants
create policy "Anyone can view participants of sessions they are in"
  on public.session_participants for select
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and (bs.user_id = auth.uid() or exists (
        select 1 from public.session_participants sp2
        where sp2.session_id = session_id and sp2.user_id = auth.uid()
      ))
    )
  );

create policy "Session owner can manage participants"
  on public.session_participants for all
  using (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and bs.user_id = auth.uid()
    )
  );

create policy "Users can join shared sessions"
  on public.session_participants for insert
  with check (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and bs.session_type = 'shared' and bs.share_code is not null
    )
  );

-- participant_inputs
create policy "Participants can view inputs"
  on public.participant_inputs for select
  using (
    exists (
      select 1 from public.session_participants sp
      where sp.session_id = session_id and sp.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id and bs.user_id = auth.uid()
    )
  );

create policy "Participants can add inputs"
  on public.participant_inputs for insert
  with check (
    exists (
      select 1 from public.session_participants sp
      where sp.id = participant_id and sp.user_id = auth.uid()
        and sp.role in ('facilitator','participant')
    )
  );

-- ============================================
-- Realtime publication
-- ============================================
alter publication supabase_realtime add table public.idea_nodes;
alter publication supabase_realtime add table public.idea_edges;
alter publication supabase_realtime add table public.session_participants;
alter publication supabase_realtime add table public.participant_inputs;

-- ============================================
-- Updated_at trigger
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.brainstorm_sessions
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.idea_nodes
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.action_plans
  for each row execute function public.handle_updated_at();
