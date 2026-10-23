-- Explicitly scope magazine and tip policies to signed-in application users.
do $roles$ declare p record; begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('gbp_tips','meo_news','meo_magazines','magazine_deliveries','notification_settings','magazine_recipient_deliveries') loop
  execute format('alter policy %I on public.%I to authenticated',p.policyname,p.tablename);
 end loop;
end $roles$;
