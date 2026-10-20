-- Cache the complete JWT lookup as an InitPlan before extracting the staff claim.
alter policy profiles_read on public.profiles to authenticated
  using (id = (select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy rates_read on public.rates to anon, authenticated using (status <> 'withdrawn' or ((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy rates_insert on public.rates to authenticated with check (((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy rates_update on public.rates to authenticated using (((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin')) with check (((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy shipments_read on public.shipments to authenticated using (user_id = (select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy documents_read on public.documents to authenticated using (user_id = (select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy documents_review on public.documents to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'))
  with check (((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin'));

alter policy shipment_events_read on public.shipment_events to authenticated using (
  exists (select 1 from public.shipments s where s.id = shipment_id and (s.user_id = (select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin')))
);

alter policy shipment_files_read on storage.objects to authenticated using (
  bucket_id='shipment-documents' and (
    ((storage.foldername(name))[1]=(select auth.uid())::text and exists (select 1 from public.shipments s where s.id::text=(storage.foldername(name))[2] and s.user_id=(select auth.uid())))
    or (((select auth.jwt())->'app_metadata'->>'role') in ('staff','admin') and exists (select 1 from public.shipments s where s.id::text=(storage.foldername(name))[2] and s.user_id::text=(storage.foldername(name))[1]))
  )
);
