-- Claude Usage Tracker sync store on Neon (project claude-usage-tracker,
-- quiet-firefly-09470327). Reached only through the sync function, which
-- calls these three functions. Rows hold end-to-end encrypted data.
create table public.usage_tracker_sync (
  sync_code text primary key check (char_length(sync_code) between 32 and 64),
  data jsonb not null,
  rev integer not null default 1,
  updated_at timestamptz not null default now()
);

create function public.tracker_pull(p_code text) returns jsonb
  language sql set search_path to '' as $f$
  select case when char_length(p_code) between 32 and 64 then
    (select jsonb_build_object('data', s.data, 'rev', s.rev)
       from public.usage_tracker_sync s where s.sync_code = p_code)
  end; $f$;

create function public.tracker_push(p_code text, p_data jsonb, p_rev integer) returns jsonb
  language plpgsql set search_path to '' as $f$
declare cur integer; cur_data jsonb;
begin
  if char_length(p_code) not between 32 and 64 then raise exception 'invalid sync code'; end if;
  if pg_column_size(p_data) > 262144 then raise exception 'payload too large'; end if;
  -- Only end-to-end encrypted payloads: {v, iv, ct} and nothing else.
  if jsonb_typeof(p_data) is distinct from 'object'
     or jsonb_typeof(p_data->'iv') is distinct from 'string'
     or jsonb_typeof(p_data->'ct') is distinct from 'string'
     or (select count(*) from jsonb_object_keys(p_data)) > 3 then
    raise exception 'payload must be encrypted';
  end if;
  select rev, data into cur, cur_data from public.usage_tracker_sync where sync_code = p_code for update;
  if not found then
    if p_rev <> 0 then return jsonb_build_object('ok', false, 'rev', 0); end if;
    -- Serialize inserts so the row cap can't be raced past
    perform pg_advisory_xact_lock(hashtext('usage_tracker_sync_insert'));
    if (select count(*) from public.usage_tracker_sync) >= 20 then raise exception 'sync row limit reached'; end if;
    insert into public.usage_tracker_sync (sync_code, data, rev) values (p_code, p_data, 1);
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;
  if cur_data ? 'revoked' then return jsonb_build_object('ok', false, 'rev', cur, 'revoked', true); end if;
  if cur <> p_rev then return jsonb_build_object('ok', false, 'rev', cur); end if;
  update public.usage_tracker_sync set data = p_data, rev = cur + 1, updated_at = now() where sync_code = p_code;
  return jsonb_build_object('ok', true, 'rev', cur + 1);
end; $f$;

create function public.tracker_revoke(p_code text) returns jsonb
  language sql set search_path to '' as $f$
  update public.usage_tracker_sync
     set data = '{"revoked": true}'::jsonb, rev = rev + 1, updated_at = now()
   where char_length(p_code) between 32 and 64 and sync_code = p_code
  returning jsonb_build_object('ok', true); $f$;
