-- ============================================
-- RLS 無限再帰修正
-- Supabase SQL Editorでこれを実行してください
-- ============================================

-- 1. RLSをバイパスするヘルパー関数を作成
-- session_participantsのRLSを経由せずに参加チェックする
create or replace function public.is_session_participant(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.session_participants
    where session_id = p_session_id and user_id = p_user_id
  );
$$;

-- brainstorm_sessionsのRLSを経由せずにオーナーチェックする
create or replace function public.is_session_owner(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.brainstorm_sessions
    where id = p_session_id and user_id = p_user_id
  );
$$;

-- 2. 既存のポリシーを全て削除
drop policy if exists "Users can view own sessions" on public.brainstorm_sessions;
drop policy if exists "Users can view shared sessions they participate in" on public.brainstorm_sessions;
drop policy if exists "Users can insert own sessions" on public.brainstorm_sessions;
drop policy if exists "Users can update own sessions" on public.brainstorm_sessions;
drop policy if exists "Users can delete own sessions" on public.brainstorm_sessions;

drop policy if exists "Session owner can manage nodes" on public.idea_nodes;
drop policy if exists "Participants can view shared session nodes" on public.idea_nodes;
drop policy if exists "Participants can insert to shared sessions" on public.idea_nodes;

drop policy if exists "Session owner can manage edges" on public.idea_edges;
drop policy if exists "Participants can view shared session edges" on public.idea_edges;

drop policy if exists "Session owner can manage action plans" on public.action_plans;

drop policy if exists "Anyone can view participants of sessions they are in" on public.session_participants;
drop policy if exists "Session owner can manage participants" on public.session_participants;
drop policy if exists "Users can join shared sessions" on public.session_participants;

drop policy if exists "Participants can view inputs" on public.participant_inputs;
drop policy if exists "Participants can add inputs" on public.participant_inputs;

-- 3. 新しいポリシーを作成（循環参照なし）

-- brainstorm_sessions: オーナーは全操作可能
create policy "sessions_select_owner"
  on public.brainstorm_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_select_participant"
  on public.brainstorm_sessions for select
  using (
    session_type = 'shared'
    and public.is_session_participant(id, auth.uid())
  );

create policy "sessions_insert"
  on public.brainstorm_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions_update"
  on public.brainstorm_sessions for update
  using (auth.uid() = user_id);

create policy "sessions_delete"
  on public.brainstorm_sessions for delete
  using (auth.uid() = user_id);

-- idea_nodes: オーナーまたは参加者
create policy "nodes_owner_all"
  on public.idea_nodes for all
  using (public.is_session_owner(session_id, auth.uid()));

create policy "nodes_participant_select"
  on public.idea_nodes for select
  using (public.is_session_participant(session_id, auth.uid()));

create policy "nodes_participant_insert"
  on public.idea_nodes for insert
  with check (public.is_session_participant(session_id, auth.uid()));

-- idea_edges: オーナーまたは参加者
create policy "edges_owner_all"
  on public.idea_edges for all
  using (public.is_session_owner(session_id, auth.uid()));

create policy "edges_participant_select"
  on public.idea_edges for select
  using (public.is_session_participant(session_id, auth.uid()));

-- action_plans: オーナーのみ
create policy "action_plans_owner"
  on public.action_plans for all
  using (public.is_session_owner(session_id, auth.uid()));

-- session_participants: オーナーは全操作、参加者は閲覧
create policy "participants_select"
  on public.session_participants for select
  using (
    public.is_session_owner(session_id, auth.uid())
    or user_id = auth.uid()
  );

create policy "participants_owner_all"
  on public.session_participants for all
  using (public.is_session_owner(session_id, auth.uid()));

create policy "participants_join"
  on public.session_participants for insert
  with check (
    exists (
      select 1 from public.brainstorm_sessions bs
      where bs.id = session_id
        and bs.session_type = 'shared'
        and bs.share_code is not null
    )
  );

-- participant_inputs: オーナーまたは参加者が閲覧・追加
create policy "inputs_select"
  on public.participant_inputs for select
  using (
    public.is_session_owner(session_id, auth.uid())
    or public.is_session_participant(session_id, auth.uid())
  );

create policy "inputs_insert"
  on public.participant_inputs for insert
  with check (
    public.is_session_participant(session_id, auth.uid())
  );
