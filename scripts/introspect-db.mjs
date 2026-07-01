/**
 * READ-ONLY live DB introspection (shared-prod-DB rule: NO writes).
 * Pulls the PostgREST OpenAPI spec (service role) → lists every exposed table + columns.
 * Run:  node --env-file=.env.local scripts/introspect-db.mjs
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

// Tables most relevant to the booking-funnel deploy / slot-assignment work.
const CONCERNED = [
  'user_funnels', 'funnel_slot_assignments', 'ghl_slot_custom_value_ids',
  'ghl_custom_values_log', 'user_profiles', 'ghl_subaccounts', 'ghl_tokens',
];

const res = await fetch(`${URL}/rest/v1/`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
if (!res.ok) {
  console.error('OpenAPI fetch failed:', res.status, await res.text());
  process.exit(1);
}
const spec = await res.json();
const defs = spec.definitions || {};
const tables = Object.keys(defs).sort();

console.log(`\n===== ALL TABLES (${tables.length}) =====`);
console.log(tables.join('\n'));

const describe = (name) => {
  const props = defs[name]?.properties || {};
  console.log(`\n----- ${name} (${Object.keys(props).length} cols) -----`);
  for (const [col, meta] of Object.entries(props)) {
    const desc = meta.description ? `  [${meta.description.replace(/\s+/g, ' ').slice(0, 60)}]` : '';
    console.log(`  ${col.padEnd(34)} ${(meta.format || meta.type || '')}${desc}`);
  }
};

console.log(`\n\n===== CONCERNED TABLES (detail) =====`);
for (const t of CONCERNED) {
  if (defs[t]) describe(t);
  else console.log(`\n----- ${t} -----  (NOT FOUND in exposed schema)`);
}
