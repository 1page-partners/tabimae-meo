-- Requires pg_cron, pg_net, and Vault secrets named project_url and service_role_key.
-- If unavailable, follow README.md "Monthly magazine cron".
do $$
declare
  project_url text;
  service_role_key text;
  command_sql text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron')
     or not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise notice 'pg_cron or pg_net is not enabled; skipping monthly-magazine-generate schedule';
    return;
  end if;

  begin
    select decrypted_secret into project_url from vault.decrypted_secrets where name = 'project_url' limit 1;
    select decrypted_secret into service_role_key from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  exception when undefined_table or invalid_schema_name then
    raise notice 'Vault is unavailable; skipping monthly-magazine-generate schedule';
    return;
  end;

  if project_url is null or service_role_key is null then
    raise notice 'Vault secrets project_url/service_role_key are missing; skipping schedule';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'monthly-magazine-generate') then
    perform cron.unschedule('monthly-magazine-generate');
  end if;

  command_sql := format(
    $command$select net.http_post(url := %L, headers := jsonb_build_object('Authorization', 'Bearer ' || %L, 'Content-Type', 'application/json'), body := '{}'::jsonb);$command$,
    rtrim(project_url, '/') || '/functions/v1/generate-magazine',
    service_role_key
  );
  perform cron.schedule('monthly-magazine-generate', '0 0 1 * *', command_sql);
end $$;
