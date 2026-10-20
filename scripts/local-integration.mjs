// Explicit local-only smoke test. Creates disposable users/files, then removes them.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { calculateQuote, todayNairobi } from "../src/lib/quote.js";
const config = JSON.parse(
  readFileSync(process.argv[2] || "/tmp/freight-local-status.json", "utf8"),
);
const url = config.API_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url))
  throw new Error("This test only runs against the local development stack.");
const key = config.PUBLISHABLE_KEY || config.ANON_KEY;
const admin = createClient(url, config.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const clients = [0, 1].map(() =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
const ids = [];
const objects = [];
const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};
async function confirmFromMailpit(email, client) {
  const mailUrl =
    config.MAILPIT_URL || config.INBUCKET_URL || "http://127.0.0.1:54324";
  for (let attempt = 0; attempt < 15; attempt++) {
    const messages = await (await fetch(`${mailUrl}/api/v1/messages`)).json();
    const message = messages.messages?.find((message) =>
      message.To?.some((to) => to.Address === email),
    );
    if (message) {
      const contents = await (
        await fetch(`${mailUrl}/api/v1/message/${message.ID}`)
      ).json();
      const link = (contents.HTML || contents.Text)
        .match(/https?:[^"\s<>]*\/auth\/v1\/verify\?[^"\s<>]+/)?.[0]
        ?.replaceAll("&amp;", "&");
      if (!link)
        throw new Error("Confirmation message had no verification link.");
      const verification = await fetch(link, { redirect: "manual" });
      const location = verification.headers.get("location");
      const tokens = new URLSearchParams(new URL(location).hash.slice(1));
      if (!tokens.get("access_token"))
        throw new Error("Email confirmation did not issue a session.");
      check(
        await client.auth.setSession({
          access_token: tokens.get("access_token"),
          refresh_token: tokens.get("refresh_token"),
        }),
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Confirmation email did not arrive in local Mailpit.");
}
try {
  for (const client of clients) {
    const email = `smoke-${crypto.randomUUID()}@example.test`;
    const password = `Export-${crypto.randomUUID()}!`;
    const data = check(
      await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: "Local smoke test",
            company_name: "Disposable test account",
          },
        },
      }),
    );
    ids.push(data.user.id);
    assert.equal(data.session, null, "Email confirmation should be required");
    await confirmFromMailpit(email, client);
    check(await client.auth.signOut());
    const invalid = await client.auth.signInWithPassword({
      email,
      password: "incorrect-password",
    });
    assert.ok(invalid.error);
    const signedIn = check(
      await client.auth.signInWithPassword({ email, password }),
    );
    assert.equal(signedIn.user.id, data.user.id);
    check(
      await client.from("profiles").insert({
        id: data.user.id,
        full_name: "Smoke test",
        company_name: "Disposable",
      }),
    );
  }
  const rate = check(
    await clients[0].from("rates").select("*").limit(1).single(),
  );
  const quote = calculateQuote(rate, {
    grossWeight: 600,
    dimensionMode: "actual",
  });
  const request = {
    p_rate_id: rate.id,
    p_gross_weight: 600,
    p_ready_date: todayNairobi(),
    p_dimensions: null,
    p_notes: "Disposable local test",
    p_expected_total: quote.total,
    p_request_id: crypto.randomUUID(),
  };
  const shipment = check(await clients[0].rpc("request_shipment", request));
  assert.equal(
    check(await clients[0].rpc("request_shipment", request)).id,
    shipment.id,
  );
  assert.equal(
    check(await clients[1].from("shipments").select("*").eq("id", shipment.id))
      .length,
    0,
  );
  const documentId = crypto.randomUUID();
  const path = `${ids[0]}/${shipment.id}/${documentId}.pdf`;
  const bytes = new TextEncoder().encode(
    "%PDF-1.7\nOriginal smoke-test document\n%%EOF",
  );
  check(
    await clients[0].storage
      .from("shipment-documents")
      .upload(path, bytes, { contentType: "application/pdf" }),
  );
  objects.push(path);
  check(
    await clients[0].from("documents").insert({
      id: documentId,
      shipment_id: shipment.id,
      user_id: ids[0],
      type: "commercial_invoice",
      file_name: "smoke-invoice.pdf",
      mime_type: "application/pdf",
      byte_size: bytes.length,
      object_path: path,
    }),
  );
  const doc = check(
    await clients[0]
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single(),
  );
  assert.equal(doc.review_status, "pending");
  const download = check(
    await clients[0].storage.from("shipment-documents").download(path),
  );
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), bytes);
  const otherDownload = await clients[1].storage
    .from("shipment-documents")
    .download(path);
  assert.ok(otherDownload.error);
  assert.equal(check(await clients[1].from("documents").select("*")).length, 0);
  assert.equal(
    check(
      await clients[0]
        .from("documents")
        .update({ review_status: "accepted" })
        .eq("id", documentId)
        .select("id"),
    ).length,
    0,
  );
  const claimed = check(
    await clients[0].rpc("claim_document_intake", {
      p_document_id: documentId,
    }),
  );
  const claim = Array.isArray(claimed) ? claimed[0] : claimed;
  assert.equal(claim.extraction_status, "processing");
  assert.equal(claim.review_status, "pending");
  console.log(
    "Local integration passed: signup → Mailpit confirmation → login, invalid-password rejection, server-side quotes, idempotency, customer isolation, original-file upload/download, protected reviews and intake claims.",
  );
} finally {
  if (objects.length)
    check(await admin.storage.from("shipment-documents").remove(objects));
  for (const id of ids) check(await admin.auth.admin.deleteUser(id));
  await Promise.all(clients.map((client) => client.auth.signOut()));
}
