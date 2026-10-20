import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRates } from "../context/RatesContext";
import { requireBackend, unwrap } from "../lib/supabase";
import { money } from "../lib/quote";
import catalogue from "../data/catalogue.json";
import { Modal } from "../ui/Modal";
const fees = [
  ["fuel_per_kg", "Fuel / kg"],
  ["min_charge", "Minimum freight"],
  ["handling_percent", "Handling multiplier"],
  ["security_percent", "Security multiplier"],
  ["board_fee", "Board fee"],
  ["tax_rate", "Local fee tax rate"],
];
const newRate = () => ({
  id: crypto.randomUUID(),
  origin: "NBO",
  destination: "DXB",
  commodity: "avocado",
  airline_id: catalogue.airlines[0].id,
  airline_name: catalogue.airlines[0].name,
  transit_time: "Confirm with cargo desk",
  tiers: { 45: "", 100: "", 300: "", 500: "", 1000: "" },
  fuel_per_kg: 0,
  min_charge: 0,
  handling_percent: 0,
  security_percent: 0,
  board_fee: 0,
  tax_rate: 0,
  status: "indicative",
  is_sample: false,
  source: "",
  valid_until: null,
});
export function RateManager() {
  const { rates, loadRates, notify, isStaff } = useRates();
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!isStaff) return null;
  const visible = rates.filter((r) =>
    `${r.destination} ${r.commodity} ${r.airline_name}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  function open(rate, isNew = false) {
    setEdit(structuredClone(rate));
    setAdding(isNew);
    setError("");
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = {
        origin: edit.origin,
        destination: edit.destination,
        commodity: edit.commodity,
        airline_id: edit.airline_id,
        airline_name: edit.airline_name,
        transit_time: edit.transit_time,
        tiers: Object.fromEntries(
          Object.entries(edit.tiers).map(([key, value]) => [
            key,
            Number(value),
          ]),
        ),
        status: edit.status,
        is_sample: edit.is_sample,
        source: edit.source.trim(),
        valid_until: edit.valid_until
          ? new Date(edit.valid_until).toISOString()
          : null,
        ...Object.fromEntries(fees.map(([key]) => [key, Number(edit[key])])),
      };
      if (
        values.status === "published" &&
        (!values.valid_until ||
          new Date(values.valid_until) <= new Date() ||
          values.is_sample)
      )
        throw new Error(
          "Publishing requires a future expiry and a real supplier rate. Clear the sample label only after verifying the supplier source.",
        );
      const client = requireBackend();
      unwrap(
        await (
          adding
            ? client.from("rates").insert({ id: edit.id, ...values })
            : client.from("rates").update(values).eq("id", edit.id)
        )
          .select("id")
          .single(),
      );
      await loadRates();
      setEdit(null);
      notify(
        "Rate saved. Existing shipment estimates keep their original snapshot.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <h2>Customer selling rates</h2>
        <button
          className="button secondary small"
          style={{ marginLeft: "auto" }}
          onClick={() => open(newRate(), true)}
        >
          <Plus size={15} />
          Add rate
        </button>
      </div>
      <p className="notice warning">
        Sample rates are for demonstration. Replace them with supplier-sourced
        selling rates before using the catalogue operationally. Internal buying
        prices and margins must stay outside this public catalogue.
      </p>
      <label style={{ margin: "20px 0" }}>
        Find a route or carrier
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. DXB, avocado or Qatar"
        />
      </label>
      <p className="field-hint" style={{ marginBottom: 15 }}>
        Showing {Math.min(visible.length, 30)} of {visible.length} matches.
        Search to narrow the list.
      </p>
      <div className="rate-list">
        {visible.slice(0, 30).map((rate) => (
          <article className="panel rate-row" key={rate.id}>
            <div>
              <h3>
                NBO → {rate.destination} · {rate.airline_name}
              </h3>
              <p>
                {rate.commodity} · {money(rate.tiers["1000"])}/kg at 1,000+ kg
              </p>
              <span className="status neutral">
                {rate.is_sample ? "Sample" : rate.status}
              </span>
            </div>
            <button
              className="button secondary small"
              onClick={() => open(rate)}
            >
              Edit rate
            </button>
          </article>
        ))}
      </div>
      {edit && (
        <Modal
          title={adding ? "Add selling rate" : "Edit selling rate"}
          wide
          onClose={() => !busy && setEdit(null)}
        >
          <form className="form-stack" onSubmit={save}>
            <div className="form-grid">
              <label>
                Destination
                <select
                  value={edit.destination}
                  onChange={(e) =>
                    setEdit({ ...edit, destination: e.target.value })
                  }
                >
                  {Object.values(catalogue.airports)
                    .filter((a) => a.code !== "NBO")
                    .map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.city} ({a.code})
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Commodity
                <select
                  value={edit.commodity}
                  onChange={(e) =>
                    setEdit({ ...edit, commodity: e.target.value })
                  }
                >
                  {catalogue.commodities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Carrier
              <select
                value={edit.airline_id}
                onChange={(e) => {
                  const airline = catalogue.airlines.find(
                    (a) => a.id === e.target.value,
                  );
                  setEdit({
                    ...edit,
                    airline_id: airline.id,
                    airline_name: airline.name,
                  });
                }}
              >
                {catalogue.airlines.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Selling rate in USD per kg</legend>
              <div className="dimensions-grid">
                {["45", "100", "300", "500", "1000"].map((tier) => (
                  <label key={tier}>
                    {tier}+ kg
                    <input
                      required
                      type="number"
                      min="0.01"
                      max="10000"
                      step="0.01"
                      value={edit.tiers[tier]}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          tiers: { ...edit.tiers, [tier]: e.target.value },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-grid">
              {fees.map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    required
                    type="number"
                    min="0"
                    max={
                      key.includes("percent") || key === "tax_rate"
                        ? 1
                        : key === "fuel_per_kg"
                          ? 1000
                          : 1000000
                    }
                    step={
                      key.includes("percent") || key === "tax_rate"
                        ? "0.000001"
                        : "0.01"
                    }
                    value={edit[key]}
                    onChange={(e) =>
                      setEdit({ ...edit, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              Supplier source / reference
              <input
                required
                minLength={5}
                maxLength={500}
                value={edit.source}
                onChange={(e) => setEdit({ ...edit, source: e.target.value })}
                placeholder="Supplier rate sheet reference and date"
              />
            </label>
            <label>
              Transit description
              <input
                required
                maxLength={160}
                value={edit.transit_time}
                onChange={(e) =>
                  setEdit({ ...edit, transit_time: e.target.value })
                }
              />
            </label>
            <div className="form-grid">
              <label>
                Status
                <select
                  value={edit.status}
                  onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                >
                  <option value="indicative">Indicative</option>
                  <option value="published">Published supplier rate</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>
              <label>
                Expiry (UTC)
                <input
                  type="datetime-local"
                  value={
                    edit.valid_until
                      ? new Date(edit.valid_until).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      valid_until: e.target.value
                        ? `${e.target.value}:00Z`
                        : null,
                    })
                  }
                />
              </label>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={edit.is_sample}
                onChange={(e) =>
                  setEdit({ ...edit, is_sample: e.target.checked })
                }
              />
              This is a sample rate
            </label>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? "Saving…" : "Save rate"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
