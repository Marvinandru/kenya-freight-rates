import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuote,
  shipmentWeights,
  tierForWeight,
} from "../src/lib/quote.js";
import {
  validateFile,
  requiredDocumentTypes,
  documentWarnings,
} from "../src/lib/documents.js";
import {
  FIELD_TYPES,
  validateExtraction,
  readResponse,
  validFileSignature,
} from "../supabase/functions/_shared/intake.js";
const rate = {
  tiers: { 45: 3, 100: 2.8, 300: 2.6, 500: 2.4, 1000: 2 },
  min_charge: 100,
  fuel_per_kg: 0,
  handling_percent: 0.08,
  security_percent: 0.07,
  board_fee: 17,
  tax_rate: 0.16,
  status: "indicative",
};
test("tier boundaries and minimum freight are explicit", () => {
  assert.deepEqual([40, 100, 300, 500, 1000].map(tierForWeight), [
    "45",
    "100",
    "300",
    "500",
    "1000",
  ]);
  const quote = calculateQuote(rate, {
    grossWeight: 10,
    dimensionMode: "actual",
  });
  assert.equal(quote.freight, 100);
  assert.equal(quote.fuel, 0);
  assert.equal(quote.total, 124.94);
});
test("volumetric weight preserves gross weight and rounds chargeable up", () => {
  assert.deepEqual(
    shipmentWeights({
      grossWeight: 100,
      dimensionMode: "dimensions",
      length: 120,
      width: 100,
      height: 160,
      pieces: 2,
    }),
    { gross: 100, volume: 3.84, volumetric: 640, chargeable: 640 },
  );
  assert.equal(shipmentWeights({ grossWeight: 1.01 }).chargeable, 1.1);
});
test("invalid weights, dimensions, and expired rates fail closed", () => {
  for (const grossWeight of [0, -1, NaN, Infinity, 100001])
    assert.throws(() => calculateQuote(rate, { grossWeight }));
  assert.throws(() =>
    shipmentWeights({
      grossWeight: 10,
      dimensionMode: "dimensions",
      length: 5,
      width: 5,
      height: 5,
      pieces: 1.5,
    }),
  );
  assert.throws(
    () =>
      calculateQuote(
        { ...rate, valid_until: "2020-01-01" },
        { grossWeight: 10 },
      ),
    /no longer available/,
  );
});
test("uploads validate contents as well as extension/type", async () => {
  assert.equal(
    await validateFile(
      new File(["%PDF-1.7\nexample"], "invoice.pdf", {
        type: "application/pdf",
      }),
    ),
    "pdf",
  );
  await assert.rejects(
    validateFile(
      new File(["not a PDF"], "fake.pdf", { type: "application/pdf" }),
    ),
    /do not match/,
  );
  await assert.rejects(
    validateFile(new File(["<script>"], "file.html", { type: "text/html" })),
    /PDF, JPG or PNG/,
  );
  await assert.rejects(
    validateFile(new File([], "empty.pdf", { type: "application/pdf" })),
    /nonempty/,
  );
  assert.equal(
    validFileSignature(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
    true,
  );
});
test("checklists distinguish plant and animal cargo and flag mismatched weight", () => {
  assert.ok(requiredDocumentTypes("avocado").includes("phytosanitary"));
  assert.ok(requiredDocumentTypes("meat").includes("veterinary"));
  assert.equal(
    documentWarnings(
      { fields: { gross_weight_kg: { value: 100 } }, warnings: [] },
      { gross_weight: 200 },
    ).length,
    1,
  );
});
const extraction = () => ({
  document_type: "commercial_invoice",
  fields: Object.fromEntries(
    Object.keys(FIELD_TYPES).map((key) => [
      key,
      { value: null, evidence: null, page: null, certainty: "not_found" },
    ]),
  ),
  warnings: [],
});
test("AI output rejects incomplete results, ungrounded fields, refusals and malformed shapes", () => {
  assert.deepEqual(validateExtraction(extraction()), extraction());
  const invalid = extraction();
  invalid.fields.exporter.value = "Invented exporter";
  assert.throws(() => validateExtraction(invalid), /source evidence/);
  assert.throws(
    () => readResponse({ status: "incomplete", output: [] }),
    /could not finish/,
  );
  assert.throws(
    () =>
      readResponse({
        status: "completed",
        output: [{ content: [{ type: "refusal" }] }],
      }),
    /manual review/,
  );
  assert.throws(() => validateExtraction({}), /invalid document/);
  const valid = extraction();
  valid.fields.gross_weight_kg = {
    value: 600,
    evidence: "Gross weight: 600 kg",
    page: 1,
    certainty: "high",
  };
  assert.equal(
    readResponse({
      status: "completed",
      output: [
        { content: [{ type: "output_text", text: JSON.stringify(valid) }] },
      ],
    }).fields.gross_weight_kg.value,
    600,
  );
});
