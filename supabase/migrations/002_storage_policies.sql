-- Storage RLS policies so the app (anon key) can upload/read objects
-- in buckets foto_profile and foto_rhk

drop policy if exists "foto_profile public all" on storage.objects;
drop policy if exists "foto_rhk public all" on storage.objects;
drop policy if exists "public read foto_profile" on storage.objects;
drop policy if exists "public read foto_rhk" on storage.objects;

-- Allow anon/authenticated full access on objects whose bucket is foto_profile or foto_rhk
create policy "foto_profile public all"
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'foto_profile')
  with check (bucket_id = 'foto_profile');

create policy "foto_rhk public all"
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'foto_rhk')
  with check (bucket_id = 'foto_rhk');
