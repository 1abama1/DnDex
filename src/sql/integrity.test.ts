// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
const ids = {
  dm: '10000000-0000-4000-8000-000000000001',
  one: '10000000-0000-4000-8000-000000000002',
  two: '10000000-0000-4000-8000-000000000003',
  three: '10000000-0000-4000-8000-000000000004',
  outsider: '10000000-0000-4000-8000-000000000005',
};
const campaignId = '20000000-0000-4000-8000-000000000001';
let db: PGlite;
async function actor(user: string | null, role = 'authenticated') {
  await db.exec(`RESET ROLE; SET ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
}
async function fails(sql: string, code: string) {
  await db.exec('SAVEPOINT expected_failure');
  try {
    await expect(db.exec(sql)).rejects.toMatchObject({ code });
  } finally {
    await db.exec('ROLLBACK TO SAVEPOINT expected_failure; RELEASE SAVEPOINT expected_failure');
  }
}
async function apply(user: string) {
  await actor(user);
  await db.query('INSERT INTO public.participants(user_id,campaign_id) VALUES ($1,$2)', [
    user,
    campaignId,
  ]);
}
async function accept(user: string) {
  await actor(ids.dm);
  await db.query(
    "UPDATE public.participants SET status='accepted' WHERE user_id=$1 AND campaign_id=$2",
    [user, campaignId],
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;`);
  const full = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  const migration = readFileSync(
    new URL('./migrations/202611170001_integrity_and_privacy.sql', import.meta.url),
    'utf8',
  );
  expect(full.trimEnd().endsWith(migration.trimEnd())).toBe(true);
  const baseline = full
    .split('-- DNDEX_VERSIONED_MIGRATIONS')[0]
    .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '');
  await db.exec(baseline);
  // A legacy row deliberately violates the new content constraint: upgrading must preserve it.
  await db.exec(`INSERT INTO auth.users VALUES ('90000000-0000-4000-8000-000000000001', '{"username":"LegacyMaster"}');
    INSERT INTO public.campaigns(id,title,description,dm_id) VALUES ('90000000-0000-4000-8000-000000000002','Old adventure','','90000000-0000-4000-8000-000000000001');`);
  await db.exec(migration);
  await db.exec(migration); // Safe to reapply during a deployment retry.
});
beforeEach(async () => {
  await db.exec('RESET ROLE; BEGIN');
  for (const [name, id] of Object.entries(ids))
    await db.query('INSERT INTO auth.users VALUES ($1,$2)', [
      id,
      JSON.stringify({ username: `Test_${name}` }),
    ]);
  await actor(ids.dm);
  await db.query(
    "INSERT INTO public.campaigns(id,title,description,max_players,dm_id,discord_url) VALUES ($1,'Lanterns of Ashenvale','An adventure beyond the last lantern in an ancient forest.',2,$2,'https://discord.gg/private-party')",
    [campaignId, ids.dm],
  );
});
afterEach(async () => {
  if (db) await db.exec('RESET ROLE; ROLLBACK');
});
afterAll(async () => {
  await db?.close();
});
describe('real local PostgreSQL policies and integrity', () => {
  it('publishes only a campaign activity signal, including application withdrawals', async () => {
    await apply(ids.one);
    await actor(null, 'anon');
    expect(
      (await db.query('SELECT * FROM public.campaign_activity WHERE campaign_id=$1', [campaignId]))
        .rows,
    ).toEqual([{ campaign_id: campaignId, revision: 1 }]);
    await actor(ids.one);
    await fails(
      `UPDATE public.campaign_activity SET revision=999 WHERE campaign_id='${campaignId}'`,
      '42501',
    );
    await db.query('DELETE FROM public.participants WHERE user_id=$1 AND campaign_id=$2', [
      ids.one,
      campaignId,
    ]);
    await actor(null, 'anon');
    expect(
      (await db.query('SELECT * FROM public.campaign_activity WHERE campaign_id=$1', [campaignId]))
        .rows,
    ).toEqual([{ campaign_id: campaignId, revision: 2 }]);
  });
  it('keeps legacy records during the additive upgrade', async () => {
    expect(
      (
        await db.query(
          "SELECT description FROM public.campaigns WHERE id='90000000-0000-4000-8000-000000000002'",
        )
      ).rows,
    ).toEqual([{ description: '' }]);
  });
  it('never exposes a private invite through the public table, view, or RPC', async () => {
    await actor(null, 'anon');
    await fails(`SELECT discord_url FROM public.campaigns WHERE id='${campaignId}'`, '42501');
    expect(
      (
        await db.query(
          'SELECT discord_url,player_count,available_seats FROM public.campaigns_with_stats WHERE id=$1',
          [campaignId],
        )
      ).rows,
    ).toEqual([{ discord_url: null, player_count: 0, available_seats: 2 }]);
    await fails(`SELECT public.get_campaign_discord('${campaignId}')`, '42501');
    await actor(ids.outsider);
    await fails(`SELECT public.get_campaign_discord('${campaignId}')`, '42501');
    await actor(ids.dm);
    expect(
      (await db.query('SELECT public.get_campaign_discord($1) AS invite', [campaignId])).rows,
    ).toEqual([{ invite: 'https://discord.gg/private-party' }]);
  });
  it('rejects forged accepted applications, impersonation and DM self-enrollment', async () => {
    await actor(ids.one);
    await fails(
      `INSERT INTO public.participants(user_id,campaign_id,status) VALUES ('${ids.one}','${campaignId}','accepted')`,
      '23514',
    );
    await fails(
      `INSERT INTO public.participants(user_id,campaign_id) VALUES ('${ids.two}','${campaignId}')`,
      '42501',
    );
    await actor(ids.dm);
    await fails(
      `INSERT INTO public.participants(user_id,campaign_id) VALUES ('${ids.dm}','${campaignId}')`,
      '23514',
    );
  });
  it('hides pending requests from visitors and prevents player self-acceptance', async () => {
    await apply(ids.one);
    await actor(ids.one);
    expect(
      (
        await db.query(
          "UPDATE public.participants SET status='accepted' WHERE campaign_id=$1 RETURNING user_id",
          [campaignId],
        )
      ).rows,
    ).toEqual([]);
    await actor(null, 'anon');
    expect(
      (await db.query('SELECT * FROM public.participants WHERE campaign_id=$1', [campaignId])).rows,
    ).toEqual([]);
    await actor(ids.dm);
    expect(
      (await db.query('SELECT status FROM public.participants WHERE campaign_id=$1', [campaignId]))
        .rows,
    ).toEqual([{ status: 'pending' }]);
  });
  it('enforces capacity, immutable decisions and minimum party size', async () => {
    await apply(ids.one);
    await apply(ids.two);
    await apply(ids.three);
    await accept(ids.one);
    await accept(ids.two);
    await fails(
      `UPDATE public.participants SET status='accepted' WHERE campaign_id='${campaignId}' AND user_id='${ids.three}'`,
      '23514',
    );
    await fails(
      `UPDATE public.participants SET status='pending' WHERE campaign_id='${campaignId}' AND user_id='${ids.one}'`,
      '23514',
    );
    await fails(`UPDATE public.campaigns SET max_players=1 WHERE id='${campaignId}'`, '23514');
    await actor(null, 'anon');
    expect(
      (
        await db.query(
          'SELECT player_count,available_seats FROM public.campaigns_with_stats WHERE id=$1',
          [campaignId],
        )
      ).rows,
    ).toEqual([{ player_count: 2, available_seats: 0 }]);
    await actor(ids.one);
    expect(
      (await db.query('SELECT public.get_campaign_discord($1) AS invite', [campaignId])).rows,
    ).toEqual([{ invite: 'https://discord.gg/private-party' }]);
  });
  it('disallows applications to closed campaigns and ownership changes', async () => {
    await actor(ids.dm);
    await db.query("UPDATE public.campaigns SET status='completed' WHERE id=$1", [campaignId]);
    await fails(
      `UPDATE public.campaigns SET status='in_progress' WHERE id='${campaignId}'`,
      '23514',
    );
    await fails(`UPDATE public.campaigns SET dm_id='${ids.one}' WHERE id='${campaignId}'`, '23514');
    await actor(ids.one);
    await fails(
      `INSERT INTO public.participants(user_id,campaign_id) VALUES ('${ids.one}','${campaignId}')`,
      '23514',
    );
    expect(
      (
        await db.query(
          "UPDATE public.campaigns SET title='Hacked campaign' WHERE id=$1 RETURNING id",
          [campaignId],
        )
      ).rows,
    ).toEqual([]);
  });
  it('allows reviews only after acceptance, preserves author controls, and denies reparenting', async () => {
    await actor(ids.one);
    await fails(
      `INSERT INTO public.reviews(author_id,campaign_id,rating,comment) VALUES ('${ids.one}','${campaignId}',5,'A great adventure')`,
      '42501',
    );
    await apply(ids.one);
    await accept(ids.one);
    await actor(ids.one);
    await db.query(
      "INSERT INTO public.reviews(author_id,campaign_id,rating,comment) VALUES ($1,$2,5,'A great adventure')",
      [ids.one, campaignId],
    );
    await db.query(
      "UPDATE public.reviews SET rating=4,comment='An updated review' WHERE campaign_id=$1",
      [campaignId],
    );
    await fails(
      `UPDATE public.reviews SET author_id='${ids.two}' WHERE campaign_id='${campaignId}'`,
      '23514',
    );
    await actor(ids.outsider);
    expect(
      (await db.query('DELETE FROM public.reviews WHERE campaign_id=$1 RETURNING id', [campaignId]))
        .rows,
    ).toEqual([]);
    await actor(ids.one);
    expect(
      (
        await db.query('DELETE FROM public.reviews WHERE campaign_id=$1 RETURNING rating', [
          campaignId,
        ])
      ).rows,
    ).toEqual([{ rating: 4 }]);
  });
});
