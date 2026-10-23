-- Run in SQL Editor. Synthetic records are always rolled back.
rollback;
begin;
do $actors$ begin
 perform set_config('handoff.admin',(select id::text from public.profiles where role='admin' limit 1),true);
 perform set_config('handoff.consultant',(select id::text from public.profiles where role='consultant' limit 1),true);
 perform set_config('handoff.user',(select id::text from public.profiles where role='user' limit 1),true);
end $actors$;
insert into public.meo_magazines(id,year,month,title,summary,actions,status) values
 ('00000000-0000-4000-8000-000000000001',2199,11,'RLS verification draft','synthetic',array['a','b','c'],'draft'),
 ('00000000-0000-4000-8000-000000000002',2199,12,'RLS verification published','synthetic',array['a','b','c'],'published');
insert into public.meo_news(id,title,body,published_at,category) values('00000000-0000-4000-8000-000000000003','RLS verification','synthetic',now(),'gbp');
do $claims$ begin perform set_config('request.jwt.claims',json_build_object('sub',current_setting('handoff.admin'),'role','authenticated')::text,true); end $claims$;
set local role authenticated;
do $admin$ begin
 if (select count(*) from public.meo_magazines where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'))<>2 then raise exception 'admin read failed'; end if;
 update public.meo_magazines set title='RLS admin edit' where id='00000000-0000-4000-8000-000000000001';
 if not found then raise exception 'admin edit failed'; end if;
end $admin$;
reset role;
do $claims$ begin perform set_config('request.jwt.claims',json_build_object('sub',current_setting('handoff.consultant'),'role','authenticated')::text,true); end $claims$;
set local role authenticated;
do $consultant$ declare n integer; begin
 if (select count(*) from public.meo_magazines where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'))<>2 then raise exception 'consultant read failed'; end if;
 if (select count(*) from public.meo_news where id='00000000-0000-4000-8000-000000000003')<>1 then raise exception 'consultant news read failed'; end if;
 update public.meo_magazines set title='must not change' where id='00000000-0000-4000-8000-000000000001'; get diagnostics n=row_count;
 if n<>0 then raise exception 'consultant write unexpectedly allowed'; end if;
end $consultant$;
reset role;
do $claims$ begin perform set_config('request.jwt.claims',json_build_object('sub',current_setting('handoff.user'),'role','authenticated')::text,true); end $claims$;
set local role authenticated;
do $user$ declare n integer; begin
 if (select count(*) from public.meo_magazines where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'))<>1 then raise exception 'user published-only read failed'; end if;
 if (select count(*) from public.meo_news where id='00000000-0000-4000-8000-000000000003')<>0 then raise exception 'user news leaked'; end if;
 update public.meo_magazines set title='must not change' where id='00000000-0000-4000-8000-000000000002'; get diagnostics n=row_count;
 if n<>0 then raise exception 'user write unexpectedly allowed'; end if;
 insert into public.notification_settings(user_id,magazine_enabled) values(auth.uid(),false) on conflict(user_id) do update set magazine_enabled=false;
end $user$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $anon$ begin
 if (select count(*) from public.meo_magazines where id='00000000-0000-4000-8000-000000000002')<>0 then raise exception 'anonymous read unexpectedly allowed'; end if;
end $anon$;
reset role;
rollback;
select 'PASS: admin, consultant, user, anon; synthetic records rolled back' as verification;
