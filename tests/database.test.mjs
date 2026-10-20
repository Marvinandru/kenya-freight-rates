import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { calculateQuote, todayNairobi } from "../src/lib/quote.js";
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const staff = "33333333-3333-4333-8333-333333333333";
let db, rate, shipment, documentId;
async function asUser(id, fn, role = "exporter", extra = {}) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: id, app_metadata: { role }, ...extra }),
  ]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function request(input = {}, expected, actor = owner) {
  const form = { grossWeight: 600, dimensionMode: "actual", ...input };
  const quote = calculateQuote(rate, form);
  const dimensions =
    form.dimensionMode === "dimensions"
      ? JSON.stringify({
          length: form.length,
          width: form.width,
          height: form.height,
          pieces: form.pieces,
        })
      : null;
  return asUser(actor, async () => {
    const { rows } = await db.query(
      "select public.request_shipment($1,$2,$3,$4::jsonb,$5,$6,$7) as result",
      [
        rate.id,
        form.grossWeight,
        todayNairobi(),
        dimensions,
        "Keep cool",
        expected ?? quote.total,
        input.requestId || crypto.randomUUID(),
      ],
    );
    return rows[0].result;
  });
}
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
    create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    alter table storage.objects enable row level security;
    grant usage on schema auth,storage to anon,authenticated,service_role;
    grant select,insert,update,delete on storage.objects to authenticated;
    grant all on storage.objects to service_role;
    insert into auth.users values('${owner}'),('${other}'),('${staff}');`);
  for (const file of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  rate = (await db.query("select * from public.rates order by id limit 1"))
    .rows[0];
});
after(async () => {
  await db?.close();
});

test("migrations apply, all exposed tables have RLS, private privilege boundaries are not public definers", async () => {
  const { rows } = await db.query(
    "select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
  );
  assert.equal(rows.length, 5);
  assert.ok(rows.every((row) => row.relrowsecurity));
  assert.equal(
    (
      await db.query(
        "select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and prosecdef",
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select count(*)::int as n from public.rates")).rows[0].n,
    490,
  );
});
test("anonymous users may compare rates but cannot read shipments or create requests", async () => {
  await db.exec("set role anon");
  try {
    assert.equal(
      (await db.query("select count(*)::int n from public.rates")).rows[0].n,
      490,
    );
    await assert.rejects(
      db.query("select * from public.shipments"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.claim_document_intake($1)", [
        crypto.randomUUID(),
      ]),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
test("server computes price snapshots consistently at weight boundaries and for dimensions", async () => {
  for (const weight of [
    0.1, 40, 99.9, 100, 299.9, 300, 499.9, 500, 999.9, 1000, 1200,
  ]) {
    const form = { grossWeight: weight, dimensionMode: "actual" };
    const result = await request(form);
    const quote = calculateQuote(rate, form);
    const row = (
      await db.query("select * from public.shipments where id=$1", [result.id])
    ).rows[0];
    for (const key of [
      "total",
      "freight",
      "fuel",
      "handling",
      "security",
      "board",
      "tax",
      "chargeable",
      "perKg",
    ])
      assert.equal(
        Number(row.quote[key]),
        quote[key],
        `${key} for ${weight} kg`,
      );
    assert.equal(row.status, "requested");
    assert.equal(row.awb_number, null);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from public.documents where shipment_id=$1",
          [result.id],
        )
      ).rows[0].n,
      0,
    );
    shipment = row;
  }
  const form = {
    grossWeight: 100,
    dimensionMode: "dimensions",
    length: 120,
    width: 100,
    height: 160,
    pieces: 2,
  };
  const result = await request(form);
  const row = (
    await db.query("select * from public.shipments where id=$1", [result.id])
  ).rows[0];
  assert.equal(Number(row.chargeable_weight), 640);
  assert.equal(Number(row.gross_weight), 100);
  assert.equal(row.quote.total, calculateQuote(rate, form).total);
});
test("changed prices, bad weights, invalid dimensions, and expired rates are rejected", async () => {
  await assert.rejects(request({}, 0), /estimate has changed/);
  await asUser(owner, async () => {
    await assert.rejects(
      db.query("select public.request_shipment($1,$2,$3,$4::jsonb,$5,$6,$7)", [
        rate.id,
        -1,
        todayNairobi(),
        null,
        "",
        100,
        crypto.randomUUID(),
      ]),
      /Invalid gross weight/,
    );
    await assert.rejects(
      db.query("select public.request_shipment($1,$2,$3,$4::jsonb,$5,$6,$7)", [
        rate.id,
        100,
        todayNairobi(),
        '{"length":null,"width":5,"height":5,"pieces":1}',
        "",
        100,
        crypto.randomUUID(),
      ]),
      /Invalid package dimensions/,
    );
  });
  await db.query(
    "update public.rates set valid_until=now()-interval '1 second' where id=$1",
    [rate.id],
  );
  await assert.rejects(request({}), /unavailable or expired/);
  await db.query("update public.rates set valid_until=null where id=$1", [
    rate.id,
  ]);
});
test("request retries are idempotent", async () => {
  const requestId = crypto.randomUUID();
  const a = await request({ requestId });
  const b = await request({ requestId });
  assert.equal(a.id, b.id);
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from public.shipment_events where shipment_id=$1",
        [a.id],
      )
    ).rows[0].n,
    1,
  );
});
test("one customer cannot read another customer’s shipments, events or alter snapshots", async () => {
  await asUser(other, async () => {
    assert.equal(
      (await db.query("select * from public.shipments")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.shipment_events")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("update public.shipments set status='confirmed' where id=$1", [
        shipment.id,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      db.query("insert into public.shipments(id) values($1)", [
        crypto.randomUUID(),
      ]),
      /permission denied/,
    );
  });
});
test("user-editable metadata cannot grant staff privileges", async () => {
  await asUser(
    other,
    async () => {
      assert.equal(
        (await db.query("select * from public.shipments")).rows.length,
        0,
      );
      await assert.rejects(
        db.query("select public.update_shipment_status($1,$2,$3,$4)", [
          shipment.id,
          "confirmed",
          "Pretend approval",
          null,
        ]),
        /Staff access required/,
      );
    },
    "exporter",
    { user_metadata: { role: "admin" } },
  );
});
test("storage restricts upload and download to shipment ownership; files and review fields are protected", async () => {
  documentId = crypto.randomUUID();
  const path = `${owner}/${shipment.id}/${documentId}.pdf`;
  await asUser(other, async () => {
    await assert.rejects(
      db.query(
        "insert into storage.objects(bucket_id,name) values('shipment-documents',$1)",
        [path],
      ),
      /row-level security/,
    );
  });
  await asUser(owner, async () => {
    await db.query(
      "insert into storage.objects(bucket_id,name) values('shipment-documents',$1)",
      [path],
    );
    await db.query(
      "insert into public.documents(id,shipment_id,user_id,type,file_name,mime_type,byte_size,object_path) values($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        documentId,
        shipment.id,
        owner,
        "commercial_invoice",
        "invoice.pdf",
        "application/pdf",
        120,
        path,
      ],
    );
    const row = (
      await db.query("select * from public.documents where id=$1", [documentId])
    ).rows[0];
    assert.equal(row.review_status, "pending");
    assert.equal(row.extraction, null);
    const result = await db.query(
      "update public.documents set review_status='accepted' where id=$1 returning id",
      [documentId],
    );
    assert.equal(result.rows.length, 0);
    await assert.rejects(
      db.query(
        "update public.documents set extraction_status='completed' where id=$1",
        [documentId],
      ),
      /permission denied/,
    );
    const deleted = await db.query(
      "delete from storage.objects where name=$1 returning id",
      [path],
    );
    assert.equal(deleted.rows.length, 0);
  });
  await asUser(other, async () => {
    assert.equal(
      (await db.query("select * from public.documents")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select public.claim_document_intake($1)", [documentId]),
      /Document unavailable/,
    );
  });
});
test("a document record requires an actual stored object", async () => {
  await asUser(owner, async () => {
    const id = crypto.randomUUID();
    await assert.rejects(
      db.query(
        "insert into public.documents(id,shipment_id,user_id,type,file_name,mime_type,byte_size,object_path) values($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id,
          shipment.id,
          owner,
          "packing_list",
          "list.pdf",
          "application/pdf",
          100,
          `${owner}/${shipment.id}/${id}.pdf`,
        ],
      ),
      /row-level security/,
    );
  });
});
test("staff can review original files and save a review with an attributable timestamp", async () => {
  await asUser(
    staff,
    async () => {
      assert.ok(
        (await db.query("select * from public.shipments")).rows.length > 0,
      );
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        1,
      );
      await assert.rejects(
        db.query(
          "update public.documents set review_status='accepted' where id=$1",
          [documentId],
        ),
        /review notes/,
      );
      await db.query(
        "update public.documents set review_status='accepted',review_notes='Original invoice checked' where id=$1",
        [documentId],
      );
      const doc = (
        await db.query("select * from public.documents where id=$1", [
          documentId,
        ])
      ).rows[0];
      assert.equal(doc.reviewed_by, staff);
      assert.ok(doc.reviewed_at);
    },
    "staff",
  );
});
test("AI claims are scoped, rate limited, and cannot approve documents", async () => {
  await asUser(owner, async () => {
    const doc = (
      await db.query("select * from public.claim_document_intake($1)", [
        documentId,
      ])
    ).rows[0];
    assert.equal(doc.extraction_status, "processing");
    assert.equal(doc.extraction_attempts, 1);
    assert.ok(doc.ai_consented_at);
    assert.equal(doc.review_status, "accepted");
    await assert.rejects(
      db.query("select public.claim_document_intake($1)", [documentId]),
      /wait before retrying/,
    );
  });
});
test("staff lifecycle transitions are enforced and cannot invent an air waybill", async () => {
  await asUser(
    staff,
    async () => {
      await assert.rejects(
        db.query("select public.update_shipment_status($1,$2,$3,$4)", [
          shipment.id,
          "confirmed",
          "Carrier confirmed space",
          null,
        ]),
        /Invalid transition/,
      );
      await db.query("select public.update_shipment_status($1,$2,$3,$4)", [
        shipment.id,
        "reviewing",
        "Checking capacity with carrier",
        null,
      ]);
      await db.query("select public.update_shipment_status($1,$2,$3,$4)", [
        shipment.id,
        "confirmed",
        "Carrier has confirmed this request",
        null,
      ]);
      await assert.rejects(
        db.query("select public.update_shipment_status($1,$2,$3,$4)", [
          shipment.id,
          "dispatched",
          "Cargo departed today",
          null,
        ]),
        /air waybill reference/,
      );
      await db.query("select public.update_shipment_status($1,$2,$3,$4)", [
        shipment.id,
        "dispatched",
        "Cargo departed today",
        "123-12345678",
      ]);
    },
    "staff",
  );
});
