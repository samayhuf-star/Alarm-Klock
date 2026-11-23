-- Refer-a-friend. Only the edge function (service role) touches these tables: RLS is on with no policies.
create table referral_users (
  uid text primary key,                 -- RevenueCat app user ID (anonymous)
  code text unique not null,
  uses_left int not null default 30,
  credits int not null default 0,       -- free months earned but not yet granted
  created_at timestamptz not null default now()
);
create table referral_redemptions (
  friend_uid text primary key references referral_users(uid),  -- one redemption per install
  code text not null,
  created_at timestamptz not null default now()
);
alter table referral_users enable row level security;
alter table referral_redemptions enable row level security;

-- Atomic redeem. Returns 'ok:<referrer uid>' or an error key the app maps to a message.
create function referral_redeem(p_friend text, p_code text) returns text language plpgsql as $$
declare f referral_users; r referral_users;
begin
  select * into f from referral_users where uid = p_friend for update;
  if not found then return 'unknown_user'; end if;
  if f.created_at < now() - interval '48 hours' then return 'too_late'; end if;
  if exists (select 1 from referral_redemptions where friend_uid = p_friend) then return 'already_redeemed'; end if;
  select * into r from referral_users where code = p_code for update;
  if not found then return 'bad_code'; end if;
  if r.uid = p_friend then return 'own_code'; end if;
  if r.uses_left <= 0 then return 'no_uses'; end if;
  insert into referral_redemptions (friend_uid, code) values (p_friend, p_code);
  update referral_users set uses_left = uses_left - 1, credits = credits + 1 where uid = r.uid;
  update referral_users set credits = credits + 1 where uid = p_friend;
  return 'ok:' || r.uid;
end $$;

-- Takes all banked months for a user (sets credits to 0) and returns how many there were.
create function referral_take_credits(p_uid text) returns int language sql as $$
  with old as (select credits from referral_users where uid = p_uid for update)
  update referral_users u set credits = 0 from old where u.uid = p_uid returning old.credits;
$$;
revoke execute on function referral_redeem(text, text), referral_take_credits(text) from public, anon, authenticated;
