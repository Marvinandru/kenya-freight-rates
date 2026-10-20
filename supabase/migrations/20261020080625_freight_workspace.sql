-- Shared export workspace. No prototype accounts, credentials or shipments are imported.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 120),
  company_name text not null default '' check (length(company_name) <= 160),
  created_at timestamptz not null default now()
);

-- These are customer-facing selling rates only. Internal buy rates/margins do not belong here.
create table public.rates (
  id text primary key check (length(id) between 1 and 100),
  origin text not null default 'NBO' check (origin = 'NBO'),
  destination text not null check (destination ~ '^[A-Z]{3}$'),
  commodity text not null check (length(commodity) between 1 and 80),
  airline_id text not null check (length(airline_id) between 1 and 20),
  airline_name text not null check (length(airline_name) between 1 and 160),
  transit_time text not null default 'Confirm with cargo desk' check (length(transit_time) <= 160),
  tiers jsonb not null check (
    jsonb_typeof(tiers) = 'object' and tiers ?& array['45','100','300','500','1000']
    and (tiers->>'45')::numeric between 0.01 and 10000
    and (tiers->>'100')::numeric between 0.01 and 10000
    and (tiers->>'300')::numeric between 0.01 and 10000
    and (tiers->>'500')::numeric between 0.01 and 10000
    and (tiers->>'1000')::numeric between 0.01 and 10000
  ),
  fuel_per_kg numeric(10,4) not null default 0 check (fuel_per_kg between 0 and 1000),
  min_charge numeric(12,2) not null default 0 check (min_charge between 0 and 1000000),
  handling_percent numeric(8,6) not null default 0 check (handling_percent between 0 and 1),
  security_percent numeric(8,6) not null default 0 check (security_percent between 0 and 1),
  board_fee numeric(12,2) not null default 0 check (board_fee between 0 and 1000000),
  tax_rate numeric(8,6) not null default 0 check (tax_rate between 0 and 1),
  status text not null default 'indicative' check (status in ('indicative','published','withdrawn')),
  is_sample boolean not null default false,
  source text not null check (length(source) between 5 and 500),
  valid_until timestamptz,
  updated_at timestamptz not null default now(),
  check (status <> 'published' or (valid_until is not null and not is_sample))
);
create index rates_route_idx on public.rates(destination, commodity) where status <> 'withdrawn';

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  reference text generated always as ('REQ-' || upper(replace(id::text, '-', ''))) stored,
  request_key uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rate_id text not null references public.rates(id),
  origin text not null default 'NBO',
  destination text not null,
  commodity text not null,
  airline_name text not null,
  gross_weight numeric(12,3) not null check (gross_weight > 0 and gross_weight <= 100000),
  chargeable_weight numeric(12,3) not null check (chargeable_weight >= gross_weight and chargeable_weight <= 100000),
  dimensions jsonb,
  ready_date date not null,
  notes text not null default '' check (length(notes) <= 2000),
  quote jsonb not null,
  status text not null default 'requested' check (status in ('requested','reviewing','confirmed','dispatched','cancelled')),
  awb_number text check (length(awb_number) between 3 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_key)
);
create index shipments_user_created_idx on public.shipments(user_id, created_at desc);
create index shipments_rate_idx on public.shipments(rate_id);

create table public.documents (
  id uuid primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('commercial_invoice','packing_list','phytosanitary','veterinary','certificate_of_origin','awb','other')),
  file_name text not null check (length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  object_path text not null unique,
  review_status text not null default 'pending' check (review_status in ('pending','accepted','needs_changes')),
  review_notes text not null default '' check (length(review_notes) <= 2000),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  extraction_status text not null default 'not_started' check (extraction_status in ('not_started','processing','completed','failed')),
  extraction jsonb,
  extraction_model text,
  extracted_at timestamptz,
  extraction_started_at timestamptz,
  extraction_attempts integer not null default 0 check (extraction_attempts between 0 and 3),
  ai_consented_at timestamptz,
  created_at timestamptz not null default now(),
  check (object_path = user_id::text || '/' || shipment_id::text || '/' || id::text || case mime_type when 'application/pdf' then '.pdf' when 'image/jpeg' then '.jpg' else '.png' end)
);
create index documents_shipment_created_idx on public.documents(shipment_id, created_at desc);
create index documents_user_idx on public.documents(user_id);
create index documents_reviewer_idx on public.documents(reviewed_by);

create table public.shipment_events (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  note text not null check (length(note) between 5 and 2000),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index shipment_events_shipment_idx on public.shipment_events(shipment_id, created_at desc);
create index shipment_events_actor_idx on public.shipment_events(actor_id);

alter table public.profiles enable row level security;
alter table public.rates enable row level security;
alter table public.shipments enable row level security;
alter table public.documents enable row level security;
alter table public.shipment_events enable row level security;

-- Explicit grants support projects where newly created tables are not auto-exposed.
revoke all on public.profiles, public.rates, public.shipments, public.documents, public.shipment_events from anon, authenticated;
grant select on public.rates to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant insert, update on public.rates to authenticated;
grant select on public.shipments, public.documents, public.shipment_events to authenticated;
grant insert (id, shipment_id, user_id, type, file_name, mime_type, byte_size, object_path) on public.documents to authenticated;
grant update (review_status, review_notes) on public.documents to authenticated;
grant all on public.profiles, public.rates, public.shipments, public.documents, public.shipment_events to service_role;
grant usage, select on sequence public.shipment_events_id_seq to service_role;

create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy profiles_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy rates_read on public.rates for select to anon, authenticated using (status <> 'withdrawn' or (select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy rates_insert on public.rates for insert to authenticated with check ((select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy rates_update on public.rates for update to authenticated using ((select auth.jwt()->'app_metadata'->>'role') in ('staff','admin')) with check ((select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy shipments_read on public.shipments for select to authenticated using (user_id = (select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy documents_read on public.documents for select to authenticated using (user_id = (select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy documents_insert on public.documents for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.shipments s where s.id = shipment_id and s.user_id = (select auth.uid()) and s.status not in ('cancelled','dispatched'))
  and exists (select 1 from storage.objects o where o.bucket_id = 'shipment-documents' and o.name = object_path)
);
create policy documents_review on public.documents for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'))
  with check ((select auth.jwt()->'app_metadata'->>'role') in ('staff','admin'));
create policy shipment_events_read on public.shipment_events for select to authenticated using (
  exists (select 1 from public.shipments s where s.id = shipment_id and (s.user_id = (select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role') in ('staff','admin')))
);

create function private.stamp_rate() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger rates_updated before update on public.rates for each row execute function private.stamp_rate();

create function private.stamp_review() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.review_status is distinct from old.review_status or new.review_notes is distinct from old.review_notes then
    if coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('staff','admin') then raise exception 'Staff access required'; end if;
    if new.review_status = 'pending' or length(trim(new.review_notes)) < 5 then raise exception 'Choose a decision and enter review notes'; end if;
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
  end if;
  return new;
end;
$$;
create trigger document_review_stamp before update on public.documents for each row execute function private.stamp_review();

-- Private privilege boundary: clients cannot directly insert or alter quote snapshots.
create function private.request_shipment(
  p_rate_id text, p_gross_weight numeric, p_ready_date date, p_dimensions jsonb,
  p_notes text, p_expected_total numeric, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); r public.rates; existing public.shipments;
  gross numeric := p_gross_weight; volume numeric := 0; chargeable numeric; tier text; per_kg numeric;
  freight numeric; fuel numeric; handling numeric; security numeric; board numeric; tax numeric; total numeric;
  quote jsonb; result public.shipments; dim numeric; dim_key text;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Sign in with an exporter account'; end if;
  if p_request_id is null then raise exception 'A request identifier is required'; end if;
  -- Serializes retries for the same user/request key, including simultaneous requests.
  perform pg_advisory_xact_lock(hashtextextended(actor::text || p_request_id::text, 0));
  select * into existing from public.shipments where user_id = actor and request_key = p_request_id;
  if found then return jsonb_build_object('id',existing.id,'reference',existing.reference); end if;
  if gross is null or gross <= 0 or gross > 100000 or gross::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid gross weight'; end if;
  if p_ready_date is null or p_ready_date < (now() at time zone 'Africa/Nairobi')::date or p_ready_date > (now() at time zone 'Africa/Nairobi')::date + 365 then raise exception 'Choose a cargo-ready date within the next year'; end if;
  if p_notes is null or length(p_notes) > 2000 then raise exception 'Invalid handling notes'; end if;
  if p_dimensions is not null then
    if jsonb_typeof(p_dimensions) <> 'object' or not (p_dimensions ?& array['length','width','height','pieces']) then raise exception 'Invalid package dimensions'; end if;
    foreach dim_key in array array['length','width','height','pieces'] loop
      dim := (p_dimensions->>dim_key)::numeric;
      if dim is null or dim <= 0 or dim > 100000 or dim::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid package dimensions'; end if;
    end loop;
    if (p_dimensions->>'pieces')::numeric <> trunc((p_dimensions->>'pieces')::numeric) then raise exception 'Pieces must be a whole number'; end if;
    volume := (p_dimensions->>'length')::numeric * (p_dimensions->>'width')::numeric * (p_dimensions->>'height')::numeric * (p_dimensions->>'pieces')::numeric / 1000000;
  end if;
  chargeable := ceil(greatest(gross, ceil(volume * 1000000 / 6000 * 10) / 10) * 10) / 10;
  if chargeable > 100000 then raise exception 'Chargeable weight exceeds supported limit'; end if;
  select * into r from public.rates where id = p_rate_id for share;
  if not found or r.status = 'withdrawn' or (r.valid_until is not null and r.valid_until <= now()) then raise exception 'This rate is unavailable or expired. Please compare again.'; end if;
  tier := case when chargeable < 100 then '45' when chargeable < 300 then '100' when chargeable < 500 then '300' when chargeable < 1000 then '500' else '1000' end;
  per_kg := (r.tiers->>tier)::numeric;
  freight := round(greatest(r.min_charge, per_kg * chargeable), 2);
  fuel := round(r.fuel_per_kg * chargeable, 2);
  handling := round(r.handling_percent * per_kg * chargeable, 2);
  security := round(r.security_percent * per_kg * chargeable, 2);
  board := r.board_fee;
  tax := round((handling + security + board) * r.tax_rate, 2);
  total := freight + fuel + handling + security + board + tax;
  if p_expected_total is null or p_expected_total::text in ('NaN','Infinity','-Infinity') or abs(p_expected_total - total) >= 0.01 then raise exception 'The estimate has changed. Refresh rates and review the updated price.'; end if;
  quote := jsonb_build_object('gross',gross,'volume',volume,'volumetric',ceil(volume * 1000000 / 6000 * 10) / 10,'chargeable',chargeable,'tier',tier,'perKg',per_kg,'freight',freight,'fuel',fuel,'handling',handling,'security',security,'board',board,'tax',tax,'total',total,'currency','USD','weightEstimated',p_dimensions is null,'source',r.source,'isSample',r.is_sample,'rateUpdatedAt',r.updated_at,'validUntil',r.valid_until);
  insert into public.shipments(request_key,user_id,rate_id,origin,destination,commodity,airline_name,gross_weight,chargeable_weight,dimensions,ready_date,notes,quote)
    values(p_request_id,actor,r.id,r.origin,r.destination,r.commodity,r.airline_name,gross,chargeable,p_dimensions,p_ready_date,p_notes,quote) returning * into result;
  insert into public.shipment_events(shipment_id,status,note,actor_id) values(result.id,'requested','Booking request received. Airline space and final price are awaiting cargo desk confirmation.',actor);
  return jsonb_build_object('id',result.id,'reference',result.reference);
end;
$$;
create function public.request_shipment(p_rate_id text, p_gross_weight numeric, p_ready_date date, p_dimensions jsonb, p_notes text, p_expected_total numeric, p_request_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$ select private.request_shipment(p_rate_id,p_gross_weight,p_ready_date,p_dimensions,p_notes,p_expected_total,p_request_id); $$;

create function private.update_shipment_status(p_shipment_id uuid,p_status text,p_note text,p_awb_number text)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.shipments;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('staff','admin') then raise exception 'Staff access required'; end if;
  if p_note is null or length(trim(p_note)) < 5 or length(p_note)>2000 then raise exception 'Explain the shipment update'; end if;
  select * into s from public.shipments where id=p_shipment_id for update;
  if not found then raise exception 'Shipment unavailable'; end if;
  if p_status is null or p_status not in ('requested','reviewing','confirmed','dispatched','cancelled') then raise exception 'Invalid status'; end if;
  if p_status <> s.status and not (
    (s.status='requested' and p_status in ('reviewing','cancelled')) or
    (s.status='reviewing' and p_status in ('confirmed','cancelled')) or
    (s.status='confirmed' and p_status in ('dispatched','cancelled'))
  ) then raise exception 'Invalid transition from % to %',s.status,p_status; end if;
  if p_status='dispatched' and nullif(trim(p_awb_number),'') is null then raise exception 'A carrier-issued air waybill reference is required'; end if;
  update public.shipments set status=p_status,awb_number=nullif(trim(p_awb_number),''),updated_at=now() where id=s.id;
  insert into public.shipment_events(shipment_id,status,note,actor_id) values(s.id,p_status,p_note,auth.uid());
end;
$$;
create function public.update_shipment_status(p_shipment_id uuid,p_status text,p_note text,p_awb_number text)
returns void language sql security invoker set search_path = '' as $$ select private.update_shipment_status(p_shipment_id,p_status,p_note,p_awb_number); $$;

-- Extraction claim is atomic, rate-limited, and does not confer document approval.
create function private.claim_document_intake(p_document_id uuid)
returns public.documents language plpgsql security definer set search_path = '' as $$
declare doc public.documents;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':intake',0));
  select * into doc from public.documents where id=p_document_id and user_id=auth.uid() for update;
  if not found then raise exception 'Document unavailable'; end if;
  if doc.extraction_status='completed' then raise exception 'This document was already extracted'; end if;
  if doc.extraction_attempts>=3 then raise exception 'Extraction retry limit reached. Use manual review.'; end if;
  if doc.extraction_started_at > now()-interval '2 minutes' then raise exception 'Please wait before retrying extraction'; end if;
  if (select count(*) from public.documents where user_id=auth.uid() and extraction_started_at>now()-interval '1 hour')>=10 then raise exception 'Hourly extraction limit reached. Try again later.'; end if;
  update public.documents set extraction_status='processing',extraction_started_at=now(),extraction_attempts=extraction_attempts+1,ai_consented_at=now() where id=doc.id returning * into doc;
  return doc;
end;
$$;
create function public.claim_document_intake(p_document_id uuid) returns public.documents language sql security invoker set search_path = '' as $$ select private.claim_document_intake(p_document_id); $$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.request_shipment(text,numeric,date,jsonb,text,numeric,uuid), public.update_shipment_status(uuid,text,text,text), public.claim_document_intake(uuid) from public, anon;
grant execute on function private.request_shipment(text,numeric,date,jsonb,text,numeric,uuid), private.update_shipment_status(uuid,text,text,text), private.claim_document_intake(uuid) to authenticated;
grant execute on function public.request_shipment(text,numeric,date,jsonb,text,numeric,uuid), public.update_shipment_status(uuid,text,text,text), public.claim_document_intake(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('shipment-documents','shipment-documents',false,10485760,array['application/pdf','image/jpeg','image/png']);

create policy shipment_files_read on storage.objects for select to authenticated using (
  bucket_id='shipment-documents' and (
    ((storage.foldername(name))[1]=(select auth.uid())::text and exists (select 1 from public.shipments s where s.id::text=(storage.foldername(name))[2] and s.user_id=(select auth.uid())))
    or ((select auth.jwt()->'app_metadata'->>'role') in ('staff','admin') and exists (select 1 from public.shipments s where s.id::text=(storage.foldername(name))[2] and s.user_id::text=(storage.foldername(name))[1]))
  )
);
create policy shipment_files_insert on storage.objects for insert to authenticated with check (
  bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists (select 1 from public.shipments s where s.id::text=(storage.foldername(name))[2] and s.user_id=(select auth.uid()) and s.status not in ('cancelled','dispatched'))
);
-- Only unattached uploads may be removed by customers; reviewed document bytes stay immutable.
create policy shipment_files_cleanup on storage.objects for delete to authenticated using (
  bucket_id='shipment-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
  and not exists (select 1 from public.documents d where d.object_path=name)
);
