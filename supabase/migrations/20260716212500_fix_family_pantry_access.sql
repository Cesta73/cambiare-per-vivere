-- Rende l'accesso alla Cambusa coerente con un nucleo familiare: un codice
-- temporaneo serve piu membri e collega i profili gia predisposti.

update public.pantry_invites
set max_uses = greatest(max_uses, 8)
where revoked_at is null
  and expires_at > now()
  and use_count < max_uses;

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

  return query
    select pantry_invites.code, pantry_invites.expires_at
    from public.pantry_invites
    where pantry_invites.household_id = target_household
      and pantry_invites.role = invite_role
      and pantry_invites.revoked_at is null
      and pantry_invites.expires_at > now()
      and pantry_invites.use_count < pantry_invites.max_uses
    order by pantry_invites.created_at desc
    limit 1;
  if found then return; end if;

  generated_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
  return query
    insert into public.pantry_invites(household_id, code, role, created_by, max_uses)
    values (target_household, generated_code, invite_role, auth.uid(), 8)
    returning pantry_invites.code, pantry_invites.expires_at;
end;
$$;

create or replace function public.join_pantry_household(invite_code text, member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.pantry_invites%rowtype;
  existing_household uuid;
  joined_household uuid;
  clean_name text := coalesce(nullif(trim(member_name), ''), 'Familiare');
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select household_id into existing_household
  from public.pantry_household_members
  where auth_user_id = auth.uid() and is_active = true
  order by created_at asc
  limit 1;
  if existing_household is not null then return existing_household; end if;

  select * into invite from public.pantry_invites
  where code = upper(trim(invite_code)) and revoked_at is null
    and expires_at > now() and use_count < max_uses
  for update;
  if invite.id is null then raise exception 'invalid_or_expired_invite'; end if;

  update public.pantry_household_members
  set auth_user_id = auth.uid(),
      display_name = clean_name,
      role = invite.role,
      is_active = true,
      updated_at = now()
  where id = (
    select id
    from public.pantry_household_members
    where household_id = invite.household_id
      and auth_user_id is null
      and is_active = true
      and lower(trim(display_name)) = lower(clean_name)
    order by created_at asc
    limit 1
  )
  returning household_id into joined_household;

  if joined_household is null then
    insert into public.pantry_household_members(household_id, auth_user_id, display_name, role)
      values (invite.household_id, auth.uid(), clean_name, invite.role)
    on conflict (household_id, auth_user_id) where auth_user_id is not null
      do update set is_active = true, display_name = excluded.display_name,
        role = excluded.role, updated_at = now()
    returning household_id into joined_household;
  end if;

  update public.pantry_invites set use_count = use_count + 1 where id = invite.id;
  return joined_household;
end;
$$;

grant execute on function public.create_pantry_invite(uuid, text) to authenticated;
grant execute on function public.join_pantry_household(text, text) to authenticated;
