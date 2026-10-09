# タビマエMEO

## Monthly magazine cron

`202610090003_monthly_magazine_cron.sql` schedules magazine generation for 09:00 JST on the first day of each month when `pg_cron`, `pg_net`, and Vault are available.

Before applying it, enable `pg_cron` and `pg_net` in Supabase and add these Vault secrets:

- `project_url`: Supabase project URL
- `service_role_key`: Supabase service-role key

If `pg_cron` is unavailable, configure an external scheduler to send `POST /functions/v1/generate-magazine` at `0 0 1 * *` UTC with `Authorization: Bearer <service-role-key>` and JSON body `{}`.

The Edge Functions also require:

- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (recommended)
- `APP_URL` (defaults to `https://tabimae-meo.netlify.app`)
