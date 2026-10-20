import { readFileSync, writeFileSync } from "node:fs";
const rates = JSON.parse(
  readFileSync(
    new URL("../src/data/sampleRates.json", import.meta.url),
    "utf8",
  ),
);
const literal = (value) =>
  value === null
    ? "null"
    : typeof value === "boolean" || typeof value === "number"
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
const keys = Object.keys(rates[0]).filter((k) => k !== "updated_at");
const rows = rates.map(
  (rate) =>
    `(${keys.map((key) => (key === "tiers" ? `${literal(JSON.stringify(rate[key]))}::jsonb` : literal(rate[key]))).join(",")})`,
);
writeFileSync(
  new URL("../supabase/seed.sql", import.meta.url),
  `-- Explicitly indicative SAMPLE rates. Never presented as supplier-verified.\n-- Apply only to a fresh local/staging database; replace through staff rate management.\ninsert into public.rates(${keys.join(",")}) values\n${rows.join(",\n")}\non conflict (id) do nothing;\n`,
);
console.log(
  `Generated ${rates.length} sample rate rows. Existing rates are never overwritten.`,
);
