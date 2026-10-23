-- Keep credentials in Vault rather than embedding them in cron.job.command.
-- Optional extensions are never enabled automatically.
do $migration$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron')
    or not exists (select 1 from pg_extension where extname = 'pg_net')
    or to_regclass('vault.decrypted_secrets') is null then
    raise notice 'Magazine cron skipped: see README.md for setup instructions';
    return;
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'project_url')
    or not exists (select 1 from vault.decrypted_secrets where name = 'service_role_key') then
    raise notice 'Magazine cron skipped: configure Vault secrets and rerun this migration';
    return;
  end if;
  if exists (select 1 from cron.job where jobname = 'monthly-magazine-generate') then
    perform cron.unschedule('monthly-magazine-generate');
  end if;
  perform cron.schedule('monthly-magazine-generate', '0 0 1 * *', $job$
    select net.http_post(
      url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'project_url' limit 1), '/') || '/functions/v1/generate-magazine',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 180000
    );
  $job$);
end $migration$;
