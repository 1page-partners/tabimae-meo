drop policy if exists "facilities_user_update" on public.facilities;
create policy "facilities_user_update"
on public.facilities
for update
using (id in (select public.my_user_facility_ids()))
with check (id in (select public.my_user_facility_ids()));
