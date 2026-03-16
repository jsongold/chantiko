-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_value TEXT,
    current_value TEXT,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'archived')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE UNIQUE INDEX idx_goals_unique_name ON goals(user_id, name) WHERE is_deleted = FALSE;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    goal_id UUID NOT NULL REFERENCES goals(id),
    name TEXT NOT NULL,
    label TEXT,
    description TEXT NOT NULL DEFAULT '',
    target_value TEXT,
    current_value TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'archived')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);

-- Updated_at triggers
CREATE TRIGGER goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS policies for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY goals_select ON goals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY goals_insert ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_update ON goals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY goals_delete ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tasks_insert ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tasks_update ON tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tasks_delete ON tasks
    FOR DELETE USING (auth.uid() = user_id);
