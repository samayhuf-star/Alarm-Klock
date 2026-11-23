// Refer-a-friend backend. Deploy with verify_jwt = false (the app calls it without a Supabase login).
// Secrets: RC_SECRET_KEY (RevenueCat secret API key). Optional: RC_ENTITLEMENT (default "premium").
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const RC_KEY = Deno.env.get('RC_SECRET_KEY')!; const ENT = Deno.env.get('RC_ENTITLEMENT') ?? 'premium';
const MONTH = 30 * 24 * 3600 * 1000;
const rc = (path: string, init: RequestInit = {}) => fetch(`https://api.revenuecat.com/v1/subscribers/${path}`,
  { ...init, headers: { Authorization: `Bearer ${RC_KEY}`, 'Content-Type': 'application/json' } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[b % 32]).join('');

async function ensureUser(uid: string) {
  for (let i = 0; i < 5; i++) { // retry only if the random code collides
    const { data } = await db.from('referral_users').select('code, uses_left').eq('uid', uid).maybeSingle();
    if (data) return data;
    await db.from('referral_users').insert({ uid, code: newCode() });
  }
  throw new Error('could not create user');
}

/** Grants any banked months as a RevenueCat promotional entitlement. Returns months granted.
 *  While a paid subscription (or trial) is active the months stay banked, so they are not wasted
 *  running alongside time the user already has; they apply on the first launch after it ends. */
async function applyCredits(uid: string): Promise<number> {
  const res = await rc(encodeURIComponent(uid)); if (!res.ok) return 0;
  const e = (await res.json())?.subscriber?.entitlements?.[ENT];
  const ends = e?.expires_date ? Date.parse(e.expires_date) : e ? Infinity : 0; // no expiry date = lifetime
  const active = ends > Date.now(); const promo = String(e?.product_identifier ?? '').startsWith('rc_promo');
  if (active && !promo) return 0;
  const { data: n } = await db.rpc('referral_take_credits', { p_uid: uid }); if (!n) return 0;
  const grant = await rc(`${encodeURIComponent(uid)}/entitlements/${ENT}/promotional`,
    { method: 'POST', body: JSON.stringify({ end_time_ms: (active ? ends : Date.now()) + n * MONTH }) });
  if (grant.ok) return n;
  const { data: u } = await db.from('referral_users').select('credits').eq('uid', uid).single(); // give them back
  await db.from('referral_users').update({ credits: (u?.credits ?? 0) + n }).eq('uid', uid);
  return 0;
}

Deno.serve(async (req) => {
  try {
    const { action, uid, code } = await req.json();
    if (typeof uid !== 'string' || uid.length < 8 || uid.length > 128) return json({ error: 'bad_request' }, 400);
    if (action === 'hello') {
      const u = await ensureUser(uid);
      return json({ code: u.code, usesLeft: u.uses_left, applied: await applyCredits(uid) });
    }
    if (action === 'redeem') {
      await ensureUser(uid);
      const c = String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const { data: out } = await db.rpc('referral_redeem', { p_friend: uid, p_code: c });
      if (!String(out).startsWith('ok:')) return json({ ok: false, error: out ?? 'offline' });
      await applyCredits(uid);                    // friend: Pro starts now (or after their trial)
      await applyCredits(String(out).slice(3));   // inviter: now, or banked if already paying
      return json({ ok: true });
    }
    return json({ error: 'bad_request' }, 400);
  } catch { return json({ error: 'offline' }, 500); }
});
