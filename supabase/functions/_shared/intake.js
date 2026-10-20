export const FIELD_TYPES = {
  exporter: "string",
  consignee: "string",
  commodity: "string",
  gross_weight_kg: "number",
  pieces: "number",
  invoice_number: "string",
  document_date: "string",
};
export const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["document_type", "fields", "warnings"],
  properties: {
    document_type: {
      type: "string",
      enum: [
        "commercial_invoice",
        "packing_list",
        "phytosanitary",
        "veterinary",
        "certificate_of_origin",
        "awb",
        "other",
      ],
    },
    fields: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(FIELD_TYPES),
      properties: Object.fromEntries(
        Object.entries(FIELD_TYPES).map(([key, type]) => [
          key,
          {
            type: "object",
            additionalProperties: false,
            required: ["value", "evidence", "page", "certainty"],
            properties: {
              value: { type: [type, "null"] },
              evidence: { type: ["string", "null"] },
              page: { type: ["integer", "null"] },
              certainty: {
                type: "string",
                enum: ["low", "medium", "high", "not_found"],
              },
            },
          },
        ]),
      ),
    },
    warnings: { type: "array", items: { type: "string" } },
  },
};
export function validateExtraction(value) {
  if (
    !value ||
    !extractionSchema.properties.document_type.enum.includes(
      value.document_type,
    ) ||
    !value.fields ||
    !Array.isArray(value.warnings) ||
    value.warnings.length > 20 ||
    value.warnings.some((v) => typeof v !== "string" || v.length > 1000)
  )
    throw new Error("The extraction returned an invalid document result.");
  for (const [key, type] of Object.entries(FIELD_TYPES)) {
    const field = value.fields[key];
    if (
      !field ||
      (field.value !== null && typeof field.value !== type) ||
      (type === "number" &&
        field.value !== null &&
        (!Number.isFinite(field.value) || field.value < 0)) ||
      (key === "pieces" &&
        field.value !== null &&
        !Number.isInteger(field.value)) ||
      (type === "string" &&
        field.value !== null &&
        field.value.length > 1000) ||
      (field.evidence !== null &&
        (typeof field.evidence !== "string" || field.evidence.length > 2000)) ||
      (field.page !== null &&
        (!Number.isInteger(field.page) || field.page < 1)) ||
      !["low", "medium", "high", "not_found"].includes(field.certainty)
    )
      throw new Error("The extraction returned an invalid field.");
    if (
      field.value !== null &&
      (!field.evidence || field.certainty === "not_found")
    )
      throw new Error("Extracted fields must include source evidence.");
  }
  return {
    document_type: value.document_type,
    fields: Object.fromEntries(
      Object.keys(FIELD_TYPES).map((k) => [k, value.fields[k]]),
    ),
    warnings: value.warnings,
  };
}
export function validFileSignature(bytes, mime) {
  if (mime === "application/pdf")
    return new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (mime === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  return false;
}
export function readResponse(response) {
  if (response.status !== "completed")
    throw new Error(
      "The AI could not finish reading this document. Use manual review or try again.",
    );
  const content = (response.output || []).flatMap((item) => item.content || []);
  if (content.some((item) => item.type === "refusal"))
    throw new Error(
      "This document could not be extracted. Please use manual review.",
    );
  const text = content
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("");
  return validateExtraction(JSON.parse(text));
}
