-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Activities table
create table activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  value text not null default '',
  value_unit text,
  category text not null default 'Other',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Layers table (goals + tasks)
create table layers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('goal', 'task')),
  name text not null,
  parent text,
  description text not null default '',
  target_value text,
  current_value text,
  status text not null default 'active' check (status in ('active', 'done', 'archived')),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint on layer name per user (only for non-deleted)
create unique index layers_user_name_unique
  on layers (user_id, name)
  where is_deleted = false;

-- Indexes
create index activities_user_id_idx on activities (user_id, created_at desc) where is_deleted = false;
create index layers_user_id_idx on layers (user_id) where is_deleted = false;
create index layers_parent_idx on layers (parent) where is_deleted = false;

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger activities_updated_at
  before update on activities
  for each row execute function update_updated_at();

create trigger layers_updated_at
  before update on layers
  for each row execute function update_updated_at();

-- Row Level Security
alter table activities enable row level security;
alter table layers enable row level security;

create policy "Users can manage own activities"
  on activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own layers"
  on layers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
