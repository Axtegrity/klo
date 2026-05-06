alter table page_configs
  add column if not exists brief_config jsonb default null;
