# Pending Migrations — Run in Supabase SQL Editor

## Migration 0002: Add due_date to layers

```sql
ALTER TABLE layers ADD COLUMN due_date TIMESTAMPTZ;
```

### Verify:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'layers' AND column_name = 'due_date';
```

## Migration 0003: Create goals and tasks tables

Run the full contents of `0003_goals_tasks_tables.sql`.

### Verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('goals', 'tasks');
```

## Data Migration: Copy layers → goals/tasks

Run AFTER migration 0003:

```sql
-- Copy goals from layers
INSERT INTO goals (id, user_id, name, description, target_value, current_value, due_date, status, is_deleted, created_at, updated_at)
SELECT id, user_id, name, description, target_value, current_value, due_date, status, is_deleted, created_at, updated_at
FROM layers
WHERE type = 'goal';

-- Copy tasks from layers (resolve parent name → goal id)
INSERT INTO tasks (id, user_id, goal_id, name, description, target_value, current_value, status, is_deleted, created_at, updated_at)
SELECT t.id, t.user_id, g.id, t.name, t.description, t.target_value, t.current_value, t.status, t.is_deleted, t.created_at, t.updated_at
FROM layers t
JOIN layers g ON g.name = t.parent AND g.user_id = t.user_id AND g.type = 'goal' AND g.is_deleted = false
WHERE t.type = 'task';
```

### Verify:
```sql
SELECT 'goals' as tbl, count(*) FROM goals
UNION ALL
SELECT 'tasks', count(*) FROM tasks
UNION ALL
SELECT 'layers_goals', count(*) FROM layers WHERE type = 'goal' AND is_deleted = false
UNION ALL
SELECT 'layers_tasks', count(*) FROM layers WHERE type = 'task' AND is_deleted = false;
```
