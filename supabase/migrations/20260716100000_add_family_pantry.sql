-- Cambusa familiare condivisa. La logica di movimento resta nel Jarvis Core;
-- l'app legge i dati tramite RLS e usa il Core per tutte le mutazioni.

create extension if not exists unaccent with schema extensions;

create table if not exists public.pantry_households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Cambusa di famiglia',
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pantry_households_owner_unique
  on public.pantry_households(owner_user_id);

create table if not exists public.pantry_household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  family_member_id uuid,
  display_name text not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (auth_user_id is not null or family_member_id is not null)
);

create unique index if not exists pantry_members_auth_unique
  on public.pantry_household_members(household_id, auth_user_id)
  where auth_user_id is not null;
create unique index if not exists pantry_members_family_unique
  on public.pantry_household_members(household_id, family_member_id)
  where family_member_id is not null;

create table if not exists public.pantry_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  code text not null unique,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses integer not null default 1 check (max_uses between 1 and 20),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pantry_products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  brand text,
  barcode text,
  category text not null default 'altro' check (category in (
    'frutta', 'verdura', 'proteine', 'latticini', 'cereali', 'dispensa',
    'surgelati', 'bevande', 'condimenti', 'altro'
  )),
  default_unit text not null default 'g' check (default_unit in ('g', 'ml', 'pz')),
  minimum_quantity numeric(12,3) not null default 0 check (minimum_quantity >= 0),
  track_expiry boolean not null default true,
  plan_aliases text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pantry_products_household_barcode_unique
  on public.pantry_products(household_id, barcode) where barcode is not null;
create index if not exists pantry_products_household_name_idx
  on public.pantry_products(household_id, normalized_name);

create table if not exists public.pantry_lots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  product_id uuid not null references public.pantry_products(id) on delete cascade,
  storage_location text not null default 'dispensa' check (storage_location in ('dispensa', 'frigorifero', 'freezer')),
  current_quantity numeric(12,3) not null default 0 check (current_quantity >= 0),
  unit text not null check (unit in ('g', 'ml', 'pz')),
  expires_on date,
  purchased_on date,
  opened_on date,
  source text not null default 'manual' check (source in ('manual', 'barcode', 'receipt', 'migration')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pantry_lots_fifo_idx
  on public.pantry_lots(household_id, product_id, expires_on, created_at)
  where current_quantity > 0;

create table if not exists public.pantry_movements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  product_id uuid not null references public.pantry_products(id) on delete restrict,
  lot_id uuid references public.pantry_lots(id) on delete set null,
  movement_type text not null check (movement_type in (
    'purchase', 'meal', 'manual_add', 'manual_remove', 'waste', 'correction', 'transfer'
  )),
  quantity_delta numeric(12,3) not null check (quantity_delta <> 0),
  unit text not null check (unit in ('g', 'ml', 'pz')),
  reference_type text,
  reference_id text,
  performed_by_auth_user_id uuid references auth.users(id) on delete set null,
  performed_by_family_member_id uuid,
  idempotency_key text,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create unique index if not exists pantry_movements_idempotency_unique
  on public.pantry_movements(household_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists pantry_movements_household_created_idx
  on public.pantry_movements(household_id, created_at desc);

create table if not exists public.pantry_shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  product_id uuid references public.pantry_products(id) on delete set null,
  name text not null,
  category text not null default 'altro',
  needed_quantity numeric(12,3),
  unit text check (unit in ('g', 'ml', 'pz')),
  status text not null default 'missing' check (status in ('missing', 'listed', 'purchased', 'stocked', 'dismissed')),
  reason text,
  is_manual boolean not null default false,
  purchased_at timestamptz,
  stocked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pantry_shopping_active_idx
  on public.pantry_shopping_items(household_id, status, created_at desc);

create table if not exists public.pantry_recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  name text not null,
  instructions text,
  base_servings numeric(6,2) not null default 1 check (base_servings > 0),
  meal_types text[] not null default '{}',
  plan_compliant boolean not null default false,
  plan_notes text,
  preparation_minutes integer check (preparation_minutes is null or preparation_minutes >= 0),
  is_favorite boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pantry_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.pantry_recipes(id) on delete cascade,
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  product_id uuid references public.pantry_products(id) on delete set null,
  name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'ml', 'pz')),
  plan_category text,
  optional boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pantry_meal_consumptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  meal_entry_id uuid,
  recipe_id uuid references public.pantry_recipes(id) on delete set null,
  meal_location text not null check (meal_location in ('casa', 'mensa', 'mamma', 'suocera', 'ristorante', 'altro')),
  servings_prepared numeric(6,2) not null default 1 check (servings_prepared > 0),
  status text not null default 'pending' check (status in ('pending', 'applied', 'skipped', 'reversed')),
  movement_ids uuid[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists public.pantry_receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.pantry_households(id) on delete cascade,
  image_path text,
  merchant text,
  purchased_on date,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'needs_review', 'stocked', 'failed')),
  extracted_items jsonb not null default '[]',
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hunger_satiety_entries
  add column if not exists meal_location text,
  add column if not exists servings_prepared numeric(6,2),
  add column if not exists pantry_consumption_status text;

do $$ begin
  alter table public.hunger_satiety_entries
    add constraint hunger_satiety_meal_location_check
    check (meal_location is null or meal_location in ('casa', 'mensa', 'mamma', 'suocera', 'ristorante', 'altro'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.hunger_satiety_entries
    add constraint hunger_satiety_servings_prepared_check
    check (servings_prepared is null or servings_prepared > 0);
exception when duplicate_object then null; end $$;

create or replace function public.pantry_role_rank(value text)
returns integer language sql immutable as $$
  select case value when 'owner' then 3 when 'editor' then 2 when 'viewer' then 1 else 0 end;
$$;

create or replace function public.is_pantry_member(target_household uuid, minimum_role text default 'viewer')
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pantry_household_members member
    where member.household_id = target_household
      and member.auth_user_id = auth.uid()
      and member.is_active = true
      and public.pantry_role_rank(member.role) >= public.pantry_role_rank(minimum_role)
  );
$$;

create or replace function public.ensure_pantry_household(household_name text default 'Cambusa di famiglia')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  new_id uuid;
  display_name text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select household_id into existing_id
  from public.pantry_household_members
  where auth_user_id = auth.uid() and is_active = true
  order by created_at asc limit 1;
  if existing_id is not null then return existing_id; end if;

  select coalesce(nullif(profiles.display_name, ''), 'Famiglia') into display_name
  from public.profiles where profiles.id = auth.uid();
  insert into public.pantry_households(name, owner_user_id)
    values (coalesce(nullif(trim(household_name), ''), 'Cambusa di famiglia'), auth.uid())
    returning id into new_id;
  insert into public.pantry_household_members(household_id, auth_user_id, display_name, role)
    values (new_id, auth.uid(), coalesce(display_name, 'Famiglia'), 'owner');
  return new_id;
end;
$$;

create or replace function public.create_pantry_invite(target_household uuid, invite_role text default 'editor')
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare generated_code text;
begin
  if not public.is_pantry_member(target_household, 'owner') then raise exception 'owner_required'; end if;
  if invite_role not in ('editor', 'viewer') then raise exception 'invalid_role'; end if;
  generated_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
  return query
    insert into public.pantry_invites(household_id, code, role, created_by)
    values (target_household, generated_code, invite_role, auth.uid())
    returning pantry_invites.code, pantry_invites.expires_at;
end;
$$;

create or replace function public.join_pantry_household(invite_code text, member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare invite public.pantry_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into invite from public.pantry_invites
  where code = upper(trim(invite_code)) and revoked_at is null
    and expires_at > now() and use_count < max_uses
  for update;
  if invite.id is null then raise exception 'invalid_or_expired_invite'; end if;
  insert into public.pantry_household_members(household_id, auth_user_id, display_name, role)
    values (invite.household_id, auth.uid(), coalesce(nullif(trim(member_name), ''), 'Familiare'), invite.role)
  on conflict (household_id, auth_user_id) where auth_user_id is not null
    do update set is_active = true, display_name = excluded.display_name, role = excluded.role, updated_at = now();
  update public.pantry_invites set use_count = use_count + 1 where id = invite.id;
  return invite.household_id;
end;
$$;

create or replace function public.pantry_add_stock_core(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  household uuid := (payload->>'household_id')::uuid;
  product uuid := nullif(payload->>'product_id', '')::uuid;
  lot uuid;
  movement uuid;
  amount numeric := (payload->>'quantity')::numeric;
  item_unit text := coalesce(nullif(payload->>'unit', ''), 'g');
  item_name text := trim(payload->>'name');
  normalized text := lower(regexp_replace(extensions.unaccent(item_name), '[^a-z0-9]+', ' ', 'g'));
  idem text := nullif(payload->>'idempotency_key', '');
  existing_movement public.pantry_movements%rowtype;
begin
  if auth.role() <> 'service_role' and not public.is_pantry_member(household, 'editor') then
    raise exception 'editor_required';
  end if;
  if amount is null or amount <= 0 or item_unit not in ('g', 'ml', 'pz') then
    raise exception 'invalid_stock_quantity';
  end if;
  if idem is not null then
    select * into existing_movement from public.pantry_movements
      where household_id = household and idempotency_key = idem limit 1;
    if existing_movement.id is not null then
      return jsonb_build_object('duplicate', true, 'movement_id', existing_movement.id, 'lot_id', existing_movement.lot_id, 'product_id', existing_movement.product_id);
    end if;
  end if;

  if product is null and nullif(payload->>'barcode', '') is not null then
    select id into product from public.pantry_products
      where household_id = household and barcode = payload->>'barcode' limit 1;
  end if;
  if product is null and item_name <> '' then
    select id into product from public.pantry_products
      where household_id = household and normalized_name = normalized limit 1;
  end if;
  if product is null then
    insert into public.pantry_products(
      household_id, name, normalized_name, brand, barcode, category, default_unit,
      minimum_quantity, track_expiry, metadata
    ) values (
      household, item_name, normalized, nullif(payload->>'brand', ''), nullif(payload->>'barcode', ''),
      coalesce(nullif(payload->>'category', ''), 'altro'), item_unit,
      coalesce((payload->>'minimum_quantity')::numeric, 0), coalesce((payload->>'track_expiry')::boolean, true),
      coalesce(payload->'metadata', '{}')
    ) returning id into product;
  end if;
  if not exists (select 1 from public.pantry_products where id = product and household_id = household and default_unit = item_unit) then
    raise exception 'product_unit_mismatch';
  end if;

  insert into public.pantry_lots(
    household_id, product_id, storage_location, current_quantity, unit,
    expires_on, purchased_on, source, notes
  ) values (
    household, product, coalesce(nullif(payload->>'storage_location', ''), 'dispensa'), amount, item_unit,
    nullif(payload->>'expires_on', '')::date, coalesce(nullif(payload->>'purchased_on', '')::date, current_date),
    coalesce(nullif(payload->>'source', ''), 'manual'), nullif(payload->>'notes', '')
  ) returning id into lot;

  insert into public.pantry_movements(
    household_id, product_id, lot_id, movement_type, quantity_delta, unit,
    reference_type, reference_id, performed_by_auth_user_id, idempotency_key, notes, metadata
  ) values (
    household, product, lot,
    case when coalesce(payload->>'source', 'manual') in ('barcode', 'receipt') then 'purchase' else 'manual_add' end,
    amount, item_unit, nullif(payload->>'reference_type', ''), nullif(payload->>'reference_id', ''),
    nullif(payload->>'actor_user_id', '')::uuid, idem, nullif(payload->>'notes', ''), coalesce(payload->'metadata', '{}')
  ) returning id into movement;

  update public.pantry_shopping_items set
    product_id = coalesce(product_id, product), status = 'stocked', stocked_at = now(), updated_at = now()
  where household_id = household and status in ('missing', 'listed', 'purchased')
    and (product_id = product or lower(regexp_replace(extensions.unaccent(name), '[^a-z0-9]+', ' ', 'g')) = normalized);

  return jsonb_build_object('duplicate', false, 'movement_id', movement, 'lot_id', lot, 'product_id', product);
end;
$$;

create or replace function public.pantry_consume_many_core(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  household uuid := (payload->>'household_id')::uuid;
  item jsonb;
  requested_product uuid;
  requested_quantity numeric;
  requested_unit text;
  available numeric;
  remaining numeric;
  lot_row public.pantry_lots%rowtype;
  taken numeric;
  movement uuid;
  movement_ids uuid[] := '{}';
  idem_prefix text := nullif(payload->>'idempotency_key', '');
  item_index integer := 0;
begin
  if auth.role() <> 'service_role' and not public.is_pantry_member(household, 'editor') then
    raise exception 'editor_required';
  end if;
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then
    raise exception 'missing_consumption_items';
  end if;

  for item in select * from jsonb_array_elements(payload->'items') loop
    requested_product := (item->>'product_id')::uuid;
    requested_quantity := (item->>'quantity')::numeric;
    requested_unit := item->>'unit';
    if requested_quantity <= 0 or requested_unit not in ('g', 'ml', 'pz') then raise exception 'invalid_consumption_item'; end if;
    select coalesce(sum(current_quantity), 0) into available from public.pantry_lots
      where household_id = household and product_id = requested_product and unit = requested_unit and current_quantity > 0;
    if available < requested_quantity then
      raise exception 'insufficient_stock:%:%:%', requested_product, requested_quantity, available;
    end if;
  end loop;

  for item in select * from jsonb_array_elements(payload->'items') loop
    item_index := item_index + 1;
    requested_product := (item->>'product_id')::uuid;
    requested_quantity := (item->>'quantity')::numeric;
    requested_unit := item->>'unit';
    remaining := requested_quantity;
    for lot_row in
      select * from public.pantry_lots
      where household_id = household and product_id = requested_product and unit = requested_unit and current_quantity > 0
      order by expires_on asc nulls last, created_at asc
      for update
    loop
      exit when remaining <= 0;
      taken := least(remaining, lot_row.current_quantity);
      update public.pantry_lots set current_quantity = current_quantity - taken, updated_at = now() where id = lot_row.id;
      insert into public.pantry_movements(
        household_id, product_id, lot_id, movement_type, quantity_delta, unit,
        reference_type, reference_id, performed_by_auth_user_id, performed_by_family_member_id,
        idempotency_key, notes, metadata
      ) values (
        household, requested_product, lot_row.id,
        coalesce(nullif(payload->>'movement_type', ''), 'meal'), -taken, requested_unit,
        nullif(payload->>'reference_type', ''), nullif(payload->>'reference_id', ''),
        nullif(payload->>'actor_user_id', '')::uuid, nullif(payload->>'actor_family_member_id', '')::uuid,
        case when idem_prefix is null then null else idem_prefix || ':' || item_index || ':' || lot_row.id end,
        nullif(payload->>'notes', ''), coalesce(payload->'metadata', '{}')
      ) returning id into movement;
      movement_ids := array_append(movement_ids, movement);
      remaining := remaining - taken;
    end loop;
  end loop;
  return jsonb_build_object('movement_ids', movement_ids, 'consumed_items', jsonb_array_length(payload->'items'));
end;
$$;

alter table public.pantry_households enable row level security;
alter table public.pantry_household_members enable row level security;
alter table public.pantry_invites enable row level security;
alter table public.pantry_products enable row level security;
alter table public.pantry_lots enable row level security;
alter table public.pantry_movements enable row level security;
alter table public.pantry_shopping_items enable row level security;
alter table public.pantry_recipes enable row level security;
alter table public.pantry_recipe_ingredients enable row level security;
alter table public.pantry_meal_consumptions enable row level security;
alter table public.pantry_receipts enable row level security;

create policy pantry_households_read on public.pantry_households
  for select to authenticated using (public.is_pantry_member(id, 'viewer'));
create policy pantry_members_read on public.pantry_household_members
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_members_owner_write on public.pantry_household_members
  for all to authenticated using (public.is_pantry_member(household_id, 'owner'))
  with check (public.is_pantry_member(household_id, 'owner'));
create policy pantry_invites_owner on public.pantry_invites
  for all to authenticated using (public.is_pantry_member(household_id, 'owner'))
  with check (public.is_pantry_member(household_id, 'owner'));

create policy pantry_products_read on public.pantry_products
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_lots_read on public.pantry_lots
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_movements_read on public.pantry_movements
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_shopping_read on public.pantry_shopping_items
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_recipes_read on public.pantry_recipes
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_recipe_ingredients_read on public.pantry_recipe_ingredients
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_meal_consumptions_read on public.pantry_meal_consumptions
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));
create policy pantry_receipts_read on public.pantry_receipts
  for select to authenticated using (public.is_pantry_member(household_id, 'viewer'));

-- Le modifiche dirette sono consentite agli editor per resilienza offline;
-- il percorso ordinario dell'app usa comunque Jarvis Core e le sue verifiche.
create policy pantry_products_write on public.pantry_products
  for all to authenticated using (public.is_pantry_member(household_id, 'editor'))
  with check (public.is_pantry_member(household_id, 'editor'));
create policy pantry_lots_write on public.pantry_lots
  for all to authenticated using (public.is_pantry_member(household_id, 'editor'))
  with check (public.is_pantry_member(household_id, 'editor'));
create policy pantry_shopping_write on public.pantry_shopping_items
  for all to authenticated using (public.is_pantry_member(household_id, 'editor'))
  with check (public.is_pantry_member(household_id, 'editor'));
create policy pantry_recipes_write on public.pantry_recipes
  for all to authenticated using (public.is_pantry_member(household_id, 'editor'))
  with check (public.is_pantry_member(household_id, 'editor'));
create policy pantry_recipe_ingredients_write on public.pantry_recipe_ingredients
  for all to authenticated using (public.is_pantry_member(household_id, 'editor'))
  with check (public.is_pantry_member(household_id, 'editor'));
create policy pantry_receipts_write on public.pantry_receipts
  for all to authenticated using (public.is_pantry_member(household_id, 'editor'))
  with check (public.is_pantry_member(household_id, 'editor'));

grant execute on function public.ensure_pantry_household(text) to authenticated;
grant execute on function public.create_pantry_invite(uuid, text) to authenticated;
grant execute on function public.join_pantry_household(text, text) to authenticated;
revoke all on function public.pantry_add_stock_core(jsonb) from public, anon, authenticated;
revoke all on function public.pantry_consume_many_core(jsonb) from public, anon, authenticated;
grant execute on function public.pantry_add_stock_core(jsonb) to service_role;
grant execute on function public.pantry_consume_many_core(jsonb) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pantry-receipts', 'pantry-receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy pantry_receipt_files_read on storage.objects
  for select to authenticated using (
    bucket_id = 'pantry-receipts' and
    public.is_pantry_member((storage.foldername(name))[1]::uuid, 'viewer')
  );
create policy pantry_receipt_files_write on storage.objects
  for insert to authenticated with check (
    bucket_id = 'pantry-receipts' and
    public.is_pantry_member((storage.foldername(name))[1]::uuid, 'editor')
  );
