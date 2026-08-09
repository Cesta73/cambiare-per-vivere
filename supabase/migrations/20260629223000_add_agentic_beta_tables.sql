/*
  Schema futuro per il framework agentico Jarvis 2.0.
  La beta locale usa file isolati: questa migrazione non viene applicata
  automaticamente e prepara il passaggio a memoria e audit condivisi.
*/

CREATE TABLE IF NOT EXISTS jarvis_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT,
  source TEXT NOT NULL DEFAULT 'telegram',
  mode TEXT NOT NULL DEFAULT 'beta',
  input_text TEXT,
  context_summary TEXT,
  reasoning_summary TEXT,
  proposal JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_result JSONB,
  confidence TEXT,
  feedback_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jarvis_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'fact', 'user_preference', 'inferred_pattern', 'hypothesis',
    'confirmed_rule', 'identity', 'episodic'
  )),
  content TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jarvis_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT,
  related_event_id UUID REFERENCES jarvis_agent_events(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL,
  feedback_text TEXT,
  interpreted_lesson TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jarvis_agent_events_user_created
  ON jarvis_agent_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jarvis_memories_user_agent
  ON jarvis_memories(user_id, agent_id, memory_type, status);
CREATE INDEX IF NOT EXISTS idx_jarvis_feedback_user_created
  ON jarvis_feedback(user_id, created_at DESC);

ALTER TABLE jarvis_agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jarvis_agent_events_own" ON jarvis_agent_events
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jarvis_memories_own" ON jarvis_memories
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jarvis_feedback_own" ON jarvis_feedback
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

