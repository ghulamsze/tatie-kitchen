-- Migration 008: Perbaiki update_shop_profile agar dapat menghapus owner_avatar_url ke NULL
create or replace function public.update_shop_profile(
  p_shop_id uuid,
  p_name text default null,
  p_phone_no text default null,
  p_address text default null,
  p_bank_name text default null,
  p_bank_account text default null,
  p_bank_account_holder text default null,
  p_owner_name text default null,
  p_owner_avatar_url text default null,
  p_clear_avatar boolean default false
)
returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.shops;
begin
  update public.shops
  set
    name = coalesce(p_name, name),
    phone_no = coalesce(p_phone_no, phone_no),
    address = coalesce(p_address, address),
    bank_name = coalesce(p_bank_name, bank_name),
    bank_account = coalesce(p_bank_account, bank_account),
    bank_account_holder = coalesce(p_bank_account_holder, bank_account_holder),
    owner_name = coalesce(p_owner_name, owner_name),
    owner_avatar_url = case
      when p_clear_avatar is true or p_owner_avatar_url = 'DELETE' or p_owner_avatar_url = '' then null
      when p_owner_avatar_url is not null then p_owner_avatar_url
      else owner_avatar_url
    end
  where id = p_shop_id
  returning * into v_result;

  return v_result;
end;
$$;

