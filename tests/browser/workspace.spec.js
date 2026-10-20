import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { calculateQuote, todayNairobi } from "../../src/lib/quote.js";
const sampleRates = JSON.parse(
  readFileSync("src/data/sampleRates.json", "utf8"),
);
const userId = "11111111-1111-4111-8111-111111111111";
const shipmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const future = Math.floor(Date.now() / 1000) + 3600;
const jwt = (role = "exporter") =>
  `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: userId, exp: future, role: "authenticated", app_metadata: { role } })).toString("base64url")}.test`;
const pdf = Buffer.from("%PDF-1.7\nOriginal customer invoice\n%%EOF");
async function mockBackend(
  page,
  {
    staff = false,
    hasShipment = false,
    commodity = "avocado",
    documents = [],
  } = {},
) {
  let rate = structuredClone(
    sampleRates.find(
      (r) => r.destination === "DXB" && r.commodity === "avocado",
    ),
  );
  const user = {
    id: userId,
    email: "exporter@example.com",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { role: staff ? "staff" : "exporter" },
    user_metadata: {
      full_name: "Amina Exporter",
      company_name: "Fresh Farm Ltd",
    },
  };
  const token = {
    access_token: jwt(staff ? "staff" : "exporter"),
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: future,
    token_type: "bearer",
    user,
  };
  let shipments = hasShipment
    ? [
        {
          id: shipmentId,
          user_id: userId,
          reference: "REQ-TEST123",
          destination: "DXB",
          origin: "NBO",
          commodity,
          airline_name: rate.airline_name,
          rate_id: rate.id,
          gross_weight: 600,
          chargeable_weight: 600,
          ready_date: todayNairobi(),
          quote: calculateQuote(rate, { grossWeight: 600 }),
          notes: "Keep cool",
          status: "requested",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          documents,
        },
      ]
    : [];
  await page.route("https://freight-test.supabase.co/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "content-type": "application/json",
    };
    const respond = (data, status = 200) =>
      route.fulfill({ status, headers, body: JSON.stringify(data) });
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (path === "/auth/v1/token") {
      if (req.postDataJSON()?.password === "wrong-password")
        return respond(
          {
            error: "invalid_grant",
            error_description: "Invalid login credentials",
          },
          400,
        );
      return respond(token);
    }
    if (path === "/auth/v1/user") return respond(user);
    if (path === "/auth/v1/signup")
      return respond({ user: { ...user, identities: [] }, session: null });
    if (path === "/auth/v1/recover" || path === "/auth/v1/logout")
      return respond({});
    if (path === "/rest/v1/rates") {
      if (method === "PATCH" || method === "POST")
        return respond({ id: rate.id });
      return respond([rate]);
    }
    if (path === "/rest/v1/profiles")
      return respond([
        {
          id: userId,
          full_name: "Amina Exporter",
          company_name: "Fresh Farm Ltd",
        },
      ]);
    if (path === "/rest/v1/shipments") return respond(shipments);
    if (path === "/rest/v1/shipment_events")
      return respond(
        shipments.length
          ? [
              {
                id: 1,
                shipment_id: shipmentId,
                status: "requested",
                note: "Request awaiting cargo desk confirmation.",
                created_at: new Date().toISOString(),
              },
            ]
          : [],
      );
    if (path === "/rest/v1/rpc/request_shipment") {
      const body = req.postDataJSON();
      const form = {
        grossWeight: body.p_gross_weight,
        dimensionMode: body.p_dimensions ? "dimensions" : "actual",
        ...(body.p_dimensions || {}),
      };
      const quote = calculateQuote(rate, form);
      expect(body.p_expected_total).toBe(quote.total);
      shipments = [
        {
          id: shipmentId,
          user_id: userId,
          reference: "REQ-TEST123",
          destination: rate.destination,
          origin: rate.origin,
          commodity: rate.commodity,
          airline_name: rate.airline_name,
          rate_id: rate.id,
          gross_weight: body.p_gross_weight,
          chargeable_weight: quote.chargeable,
          ready_date: body.p_ready_date,
          quote,
          notes: body.p_notes,
          status: "requested",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          documents: [],
        },
      ];
      return respond({ id: shipmentId, reference: "REQ-TEST123" });
    }
    if (path.startsWith("/storage/v1/object/")) {
      if (method === "POST")
        return respond({ Key: path, Id: crypto.randomUUID() });
      if (method === "GET")
        return route.fulfill({
          status: 200,
          contentType: "application/pdf",
          body: pdf,
        });
      return respond({});
    }
    if (path === "/rest/v1/documents") {
      if (method === "POST") {
        const doc = {
          ...req.postDataJSON(),
          review_status: "pending",
          review_notes: "",
          extraction_status: "not_started",
          created_at: new Date().toISOString(),
        };
        shipments[0].documents.push(doc);
        return respond({}, 201);
      }
      return respond({ id: shipments[0].documents[0].id });
    }
    if (path === "/functions/v1/document-intake") {
      const body = req.postDataJSON();
      expect(body.consent).toBe(true);
      const doc = shipments[0].documents.find((d) => d.id === body.documentId);
      doc.extraction_status = "completed";
      doc.extraction_model = "test-model";
      doc.extracted_at = new Date().toISOString();
      doc.extraction = {
        fields: {
          gross_weight_kg: {
            value: 600,
            evidence: "Gross weight: 600 kg",
            page: 1,
          },
        },
        warnings: [],
      };
      return respond({ documentId: doc.id, extraction: doc.extraction });
    }
    return respond({ error: `Unhandled test route ${method} ${path}` }, 501);
  });
  return { rate, user, token };
}
async function signIn(page) {
  // Use the topbar sign-up entry, which is available at both screen sizes.
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("exporter@example.com");
  await page.getByLabel(/^Password/).fill("correct-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("preview explains sample data, compares an estimate, and never fakes a booking", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByText("Preview workspace", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Gross weight").fill("600");
  await page.getByRole("button", { name: "Compare estimates" }).click();
  await expect(
    page.getByRole("heading", { name: /estimates for Dubai/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review estimate" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Review your booking request." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in to send request" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Back to estimates" }).click();
  await expect(
    page.getByRole("heading", { name: "Compare your estimates." }),
  ).toBeFocused();
  await expect(page.getByLabel("Gross weight")).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("quote-results.png"),
    fullPage: true,
  });
});

test("registration handles confirmation and login rejects invalid credentials", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("http://127.0.0.1:5174");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Amina Exporter");
  await page.getByLabel("Company or farm").fill("Fresh Farm Ltd");
  await page.getByLabel("Email address").fill("exporter@example.com");
  await page.getByLabel(/^Password/).fill("a-safe-password");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText(/Check your inbox for a confirmation link/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await page.getByLabel(/^Password/).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid login credentials",
  );
  await page.getByLabel(/^Password/).fill("correct-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("signed-in request saves a quote, uploads the original file, and keeps AI separate from approval", async ({
  page,
}, testInfo) => {
  await mockBackend(page);
  await page.goto("http://127.0.0.1:5174");
  await signIn(page);
  await page.getByLabel("Gross weight").fill("600");
  await page.getByRole("button", { name: "Compare estimates" }).click();
  await page.getByRole("button", { name: "Review estimate" }).click();
  await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(
    page.getByRole("heading", { name: "Shipment documents" }),
  ).toBeVisible();
  await expect(
    page.getByText("Booking requested", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Upload commercial invoice", exact: true })
    .click();
  await page.getByLabel("File PDF, JPG, PNG").setInputFiles({
    name: "original-invoice.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page
    .getByRole("button", { name: "Upload document", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Commercial invoice", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Awaiting staff review", { exact: true }).first(),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download original-invoice.pdf" })
    .click();
  const download = await downloadEvent;
  expect(readFileSync(await download.path())).toEqual(pdf);
  await expect(
    page.getByRole("button", { name: "Extract document fields" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /Allow this file/ }).check();
  await page.getByRole("button", { name: "Extract document fields" }).click();
  await page.getByText("AI-extracted fields").click();
  await expect(
    page.getByText("Gross weight: 600 kg", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Awaiting staff review", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Work queue", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Shipment documents" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("shipment-documents.png"),
    fullPage: true,
  });
});

test("staff have a separate work queue and rate management", async ({
  page,
}, testInfo) => {
  await mockBackend(page, { staff: true, hasShipment: true });
  await page.goto("http://127.0.0.1:5174");
  await signIn(page);
  await page.goto("http://127.0.0.1:5174/#/operations");
  await expect(
    page.getByRole("heading", { name: "Work queue", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rate management", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Customer selling rates" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit rate" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Supplier source / reference")).toHaveValue(
    /Sample catalogue/,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Shipment queue" }).click();
  await page.getByRole("link", { name: /REQ-TEST123/ }).click();
  await expect(
    page.getByRole("heading", { name: "Cargo desk actions" }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("staff-workspace.png"),
    fullPage: true,
  });
});

test("estimate step replaces the form and editing keeps shipment details", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("http://127.0.0.1:5174");
  await page.getByLabel("Gross weight").fill("600");
  await page
    .getByRole("checkbox", { name: "I know my package dimensions" })
    .check();
  await page.getByLabel("Length (cm)").fill("120");
  await page.getByLabel("Width (cm)").fill("100");
  await page.getByLabel("Height (cm)").fill("160");
  await page.getByLabel("Pieces", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Compare estimates", exact: true })
    .click();
  const heading = page.getByRole("heading", {
    name: "Compare your estimates.",
  });
  await expect(heading).toBeFocused();
  await expect(page.getByLabel("Destination", { exact: true })).toHaveCount(0);
  await expect(page.locator('[aria-current="step"]')).toContainText(
    "Compare estimates",
  );
  expect(
    await heading.evaluate((el) => el.getBoundingClientRect().top),
  ).toBeLessThan(350);
  await page
    .getByRole("button", { name: "Edit shipment", exact: true })
    .click();
  await expect(page.getByLabel("Gross weight")).toHaveValue("600");
  await expect(page.getByLabel("Length (cm)")).toHaveValue("120");
  await expect(page.getByLabel("Pieces", { exact: true })).toHaveValue("2");
  await page.getByLabel("Gross weight").fill("1000");
  await page
    .getByRole("button", { name: "Compare estimates", exact: true })
    .click();
  await expect(page.getByText("1000 kg", { exact: true })).toBeVisible();
});

test("signing in at the request step retains the selected estimate", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("http://127.0.0.1:5174");
  await page.getByLabel("Gross weight").fill("600");
  await page
    .getByRole("button", { name: "Compare estimates", exact: true })
    .click();
  await page.getByRole("button", { name: "Review estimate" }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText(
    "Review & request",
  );
  await page.getByRole("button", { name: "Sign in to send request" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("exporter@example.com");
  await page.getByLabel(/^Password/).fill("correct-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Review your booking request." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(
    page.getByRole("heading", { name: "Shipment documents" }),
  ).toBeVisible();
});

test("shipment checklist names each required file and uploads to the selected requirement", async ({
  page,
}, testInfo) => {
  await mockBackend(page, { hasShipment: true });
  await page.goto("http://127.0.0.1:5174");
  await signIn(page);
  await page.goto(`http://127.0.0.1:5174/#/shipments/${shipmentId}`);
  await expect(
    page.getByRole("heading", { name: "Documents you need to upload" }),
  ).toBeVisible();
  for (const name of [
    "Commercial invoice",
    "Packing list",
    "Phytosanitary certificate",
  ]) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Upload ${name.toLowerCase()}`,
        exact: true,
      }),
    ).toBeVisible();
  }
  await expect(page.getByText("Not uploaded", { exact: true })).toHaveCount(3);
  await expect(
    page.getByText("0 of 3 uploaded", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Upload packing list", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Upload packing list", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("combobox")).toHaveCount(0);
  await page.getByLabel("File PDF, JPG, PNG").setInputFiles({
    name: "packing-list.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  const saved = page.waitForRequest(
    (request) =>
      request.url().includes("/rest/v1/documents") &&
      request.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Upload document", exact: true })
    .click();
  expect((await saved).postDataJSON().type).toBe("packing_list");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("1 of 3 uploaded", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("0 of 3 reviewed", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Not uploaded", { exact: true })).toHaveCount(2);
  await expect(
    page.getByRole("button", {
      name: "Upload updated packing list",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add supporting document", exact: true })
    .click();
  const options = page
    .getByRole("dialog")
    .getByRole("combobox")
    .locator("option");
  await expect(options).toHaveText([
    "Certificate of origin",
    "Other supporting document",
  ]);
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("required-documents.png"),
    fullPage: true,
  });
});

function existingDocument(type, status = "pending") {
  return {
    id: crypto.randomUUID(),
    shipment_id: shipmentId,
    user_id: userId,
    type,
    file_name: `${type}.pdf`,
    mime_type: "application/pdf",
    byte_size: 2048,
    object_path: `${userId}/${shipmentId}/${type}.pdf`,
    review_status: status,
    review_notes:
      status === "needs_changes"
        ? "Please include the buyer address on the invoice."
        : "",
    extraction_status: "not_started",
    created_at: new Date().toISOString(),
  };
}

test("all uploaded documents ask the exporter to wait for review", async ({
  page,
}) => {
  await mockBackend(page, {
    hasShipment: true,
    documents: ["commercial_invoice", "packing_list", "phytosanitary"].map(
      (type) => existingDocument(type),
    ),
  });
  await page.goto("http://127.0.0.1:5174");
  await signIn(page);
  await page.goto(`http://127.0.0.1:5174/#/shipments/${shipmentId}`);
  await expect(
    page.getByText("3 of 3 uploaded", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("0 of 3 reviewed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /You do not need to upload them again unless corrections are requested/,
    ),
  ).toBeVisible();
  await expect(page.getByText("Not uploaded", { exact: true })).toHaveCount(0);
});

test("animal cargo has its own certificate and corrections have a direct upload action", async ({
  page,
}) => {
  await mockBackend(page, {
    hasShipment: true,
    commodity: "meat",
    documents: [existingDocument("commercial_invoice", "needs_changes")],
  });
  await page.goto("http://127.0.0.1:5174");
  await signIn(page);
  await page.goto(`http://127.0.0.1:5174/#/shipments/${shipmentId}`);
  await expect(
    page.getByRole("heading", { name: "Veterinary certificate", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Phytosanitary certificate",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Please include the buyer address/),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Upload corrected commercial invoice",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Upload commercial invoice", exact: true }),
  ).toBeVisible();
});
