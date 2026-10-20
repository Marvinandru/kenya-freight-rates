export const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const todayNairobi = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(
    new Date(),
  );
export const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("en-KE", {
        dateStyle: "medium",
        timeZone: "Africa/Nairobi",
      }).format(new Date(value))
    : "Not confirmed";
export const tierForWeight = (weight) =>
  weight < 100
    ? "45"
    : weight < 300
      ? "100"
      : weight < 500
        ? "300"
        : weight < 1000
          ? "500"
          : "1000";

export function shipmentWeights(input) {
  const gross = Number(input.grossWeight);
  if (!Number.isFinite(gross) || gross <= 0 || gross > 100000)
    throw new Error("Enter a weight between 0 and 100,000 kg.");
  let volume = 0;
  if (input.dimensionMode === "dimensions") {
    const values = [input.length, input.width, input.height, input.pieces].map(
      Number,
    );
    if (
      values.some((v) => !Number.isFinite(v) || v <= 0 || v > 100000) ||
      !Number.isInteger(values[3])
    )
      throw new Error("Enter valid dimensions and a whole number of pieces.");
    volume = (values[0] * values[1] * values[2] * values[3]) / 1000000;
  }
  const volumetric = Math.ceil(((volume * 1000000) / 6000) * 10) / 10;
  const chargeable = Math.ceil(Math.max(gross, volumetric) * 10) / 10;
  if (chargeable > 100000)
    throw new Error(
      "This shipment exceeds 100,000 kg. Contact the cargo desk.",
    );
  return { gross, volume, volumetric, chargeable };
}

// Preview only. The database independently recomputes and snapshots every request.
export function calculateQuote(rate, input, now = new Date()) {
  const weights = shipmentWeights(input);
  if (
    !rate ||
    rate.status === "withdrawn" ||
    (rate.valid_until && new Date(rate.valid_until) <= now)
  )
    throw new Error("This rate is no longer available. Please compare again.");
  const tier = tierForWeight(weights.chargeable);
  const perKg = Number(rate.tiers[tier]);
  if (!Number.isFinite(perKg) || perKg <= 0)
    throw new Error("A price is not available for this weight.");
  const freight = roundMoney(
    Math.max(Number(rate.min_charge), perKg * weights.chargeable),
  );
  const fuel = roundMoney(Number(rate.fuel_per_kg) * weights.chargeable);
  const handling = roundMoney(
    Number(rate.handling_percent) * perKg * weights.chargeable,
  );
  const security = roundMoney(
    Number(rate.security_percent) * perKg * weights.chargeable,
  );
  const board = Number(rate.board_fee);
  const tax = roundMoney((handling + security + board) * Number(rate.tax_rate));
  return {
    ...weights,
    tier,
    perKg,
    freight,
    fuel,
    handling,
    security,
    board,
    tax,
    total: roundMoney(freight + fuel + handling + security + board + tax),
    currency: "USD",
    weightEstimated: input.dimensionMode !== "dimensions",
  };
}

export const emptyShipment = () => ({
  destination: "DXB",
  commodity: "avocado",
  readyDate: todayNairobi(),
  grossWeight: "",
  dimensionMode: "actual",
  length: "",
  width: "",
  height: "",
  pieces: "1",
  notes: "",
});

export function validateShipment(input) {
  shipmentWeights(input);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.readyDate) ||
    input.readyDate < todayNairobi()
  )
    throw new Error("Choose today or a future cargo-ready date.");
  if (!input.destination || !input.commodity)
    throw new Error("Choose a destination and commodity.");
  if ((input.notes || "").length > 2000)
    throw new Error("Keep handling notes under 2,000 characters.");
}
