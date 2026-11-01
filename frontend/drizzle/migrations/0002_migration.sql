
create policy "media read" on storage.objects for select to anon, authenticated using (bucket_id='media');
create policy "media admin products" on storage.objects for insert to authenticated with check (bucket_id='media' and ((storage.foldername(name))[1]='products' and public.has_role(auth.uid(),'admin') or (storage.foldername(name))[1]='avatars' and (storage.foldername(name))[2]=auth.uid()::text));
create policy "media own update" on storage.objects for update to authenticated using (bucket_id='media' and (storage.foldername(name))[1]='avatars' and (storage.foldername(name))[2]=auth.uid()::text);
