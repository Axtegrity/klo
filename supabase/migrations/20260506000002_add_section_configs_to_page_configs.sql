alter table page_configs
  add column if not exists trending_config   jsonb default null,
  add column if not exists insight_config    jsonb default null,
  add column if not exists tool_config       jsonb default null,
  add column if not exists assessment_config jsonb default null;
