export const DOCUMENT_TYPES = {
  commercial_invoice: "Commercial invoice",
  packing_list: "Packing list",
  phytosanitary: "Phytosanitary certificate",
  veterinary: "Veterinary certificate",
  certificate_of_origin: "Certificate of origin",
  awb: "Air waybill",
  other: "Other supporting document",
};
// Preparation guidance; the cargo desk confirms the final route-specific requirements.
export const DOCUMENT_GUIDANCE = {
  commercial_invoice:
    "Your sales invoice showing the exporter, buyer, goods, quantities and declared value.",
  packing_list:
    "A breakdown of the cartons or pallets, contents, package counts and shipment weights.",
  phytosanitary:
    "The plant-health certificate for this produce consignment. The cargo desk confirms its applicability to your route.",
  veterinary:
    "The animal-health certificate for this meat or seafood consignment. The cargo desk confirms its applicability to your route.",
};
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export async function validateFile(file) {
  if (!file || !ALLOWED_MIME_TYPES.includes(file.type))
    throw new Error("Choose a PDF, JPG or PNG file.");
  if (!file.size || file.size > MAX_FILE_BYTES)
    throw new Error("Choose a nonempty file smaller than 10 MB.");
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const valid =
    file.type === "application/pdf"
      ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
      : file.type === "image/jpeg"
        ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        : bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47 &&
          bytes[4] === 0x0d &&
          bytes[5] === 0x0a &&
          bytes[6] === 0x1a &&
          bytes[7] === 0x0a;
  if (!valid)
    throw new Error(
      "The file contents do not match its type. Please export it as a PDF, JPG or PNG.",
    );
  return file.type === "application/pdf"
    ? "pdf"
    : file.type === "image/jpeg"
      ? "jpg"
      : "png";
}

export function requiredDocumentTypes(commodity) {
  return [
    "commercial_invoice",
    "packing_list",
    ...(["meat", "meat_regular", "meat_exports", "seafood"].includes(commodity)
      ? ["veterinary"]
      : ["phytosanitary"]),
  ];
}

export function documentWarnings(extraction, shipment) {
  if (!extraction) return [];
  const warnings = [...(extraction.warnings || [])];
  const gross = extraction.fields?.gross_weight_kg?.value;
  if (
    gross !== null &&
    gross !== undefined &&
    Math.abs(Number(gross) - Number(shipment.gross_weight)) > 0.1
  )
    warnings.push(
      `Document weight (${gross} kg) differs from shipment weight (${shipment.gross_weight} kg).`,
    );
  return warnings;
}
