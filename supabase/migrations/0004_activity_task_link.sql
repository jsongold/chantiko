-- Add optional goal_id and task_id to activities
ALTER TABLE activities ADD COLUMN goal_id UUID REFERENCES goals(id);
ALTER TABLE activities ADD COLUMN task_id UUID REFERENCES tasks(id);

CREATE INDEX idx_activities_goal_id ON activities(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX idx_activities_task_id ON activities(task_id) WHERE task_id IS NOT NULL;
