import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Package,
  Plane,
  Scale,
} from "lucide-react";
import { useRates } from "../context/RatesContext";
import {
  calculateQuote,
  emptyShipment,
  money,
  todayNairobi,
  validateShipment,
} from "../lib/quote";
import catalogue from "../data/catalogue.json";

function readDraft() {
  try {
    return {
      ...emptyShipment(),
      ...JSON.parse(sessionStorage.getItem("spedire-quote-draft") || "{}"),
    };
  } catch {
    return emptyShipment();
  }
}
export function QuoteBreakdown({ quote }) {
  return (
    <dl className="breakdown">
      {[
        ["Air freight", quote.freight],
        ["Fuel surcharge", quote.fuel],
        ["Handling", quote.handling],
        ["Security", quote.security],
        ["Board fee", quote.board],
        ["Tax on local fees", quote.tax],
      ].map(([label, amount]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{money(amount)}</dd>
        </div>
      ))}
      <div className="total">
        <dt>Estimated total</dt>
        <dd>{money(quote.total)}</dd>
      </div>
    </dl>
  );
}
export function QuotePage() {
  const {
    rates,
    ratesLoading,
    ratesError,
    loadRates,
    user,
    authLoading,
    setAuthDialog,
    isConfigured,
    requestShipment,
  } = useRates();
  const [form, setForm] = useState(readDraft);
  const [step, setStep] = useState("details");
  const headingRef = useRef(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);
  function editShipment() {
    setSelected(null);
    setStep("details");
  }
  function backToEstimates() {
    setSelected(null);
    setRequestError("");
    setStep("estimates");
  }
  const [search, setSearch] = useState(null);
  const [selected, setSelected] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  function update(key, value) {
    const next = { ...form, [key]: value };
    setForm(next);
    try {
      sessionStorage.setItem("spedire-quote-draft", JSON.stringify(next));
    } catch {
      /* Draft saving is optional. */
    }
  }
  function compare(event) {
    event.preventDefault();
    setError("");
    try {
      validateShipment(form);
      setSearch({ ...form });
      setStep("estimates");
    } catch (err) {
      setError(err.message);
    }
  }
  const options = [];
  if (search)
    for (const rate of rates.filter(
      (r) =>
        r.origin === "NBO" &&
        r.destination === search.destination &&
        r.commodity === search.commodity,
    )) {
      try {
        options.push({ rate, quote: calculateQuote(rate, search) });
      } catch {
        /* Expired and unavailable rates are omitted. */
      }
    }
  options.sort((a, b) => a.quote.total - b.quote.total);
  const destinationCodes = [...new Set(rates.map((r) => r.destination))].sort(
    (a, b) =>
      (catalogue.airports[a]?.city || a).localeCompare(
        catalogue.airports[b]?.city || b,
      ),
  );
  async function confirm() {
    setBusy(true);
    setRequestError("");
    try {
      validateShipment(search);
      const result = await requestShipment(
        selected.rate,
        search,
        selected.quote.total,
        requestId,
      );
      setSelected(null);
      window.location.hash = `/shipments/${result.id}`;
    } catch (err) {
      setRequestError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">
          {step === "details"
            ? "NAIROBI TO THE WORLD"
            : step === "estimates"
              ? "STEP 2 · COMPARE"
              : "STEP 3 · REQUEST"}
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="quote-step-heading">
          {step === "details"
            ? "A simpler way to move your cargo."
            : step === "estimates"
              ? "Compare your estimates."
              : "Review your booking request."}
        </h1>
        <p>
          {step === "details"
            ? "Tell us what you’re shipping. Next, you’ll compare estimates and choose a carrier."
            : step === "estimates"
              ? "Your shipment details are ready. Choose an estimate to review before requesting space."
              : "Check your shipment and estimated total, then send your request to the cargo desk."}
        </p>
      </div>
      <ol className="journey-strip" aria-label="Booking journey">
        {[
          ["details", "Shipment details"],
          ["estimates", "Compare estimates"],
          ["request", "Review & request"],
        ].map(([value, label], index) => {
          const current = step === value;
          const completed =
            index < ["details", "estimates", "request"].indexOf(step);
          return (
            <li
              key={value}
              className={current ? "current" : completed ? "completed" : ""}
              aria-current={current ? "step" : undefined}
            >
              <i>
                {completed ? (
                  <Check size={11} aria-label="Completed" />
                ) : (
                  index + 1
                )}
              </i>
              {label}
            </li>
          );
        })}
      </ol>
      {step === "details" && (
        <div className="quote-layout">
          <section className="panel shipment-form">
            <div className="section-heading">
              <Package size={20} />
              <h2>Your shipment</h2>
              <span className="subtle-pill">From Nairobi · NBO</span>
            </div>
            <form onSubmit={compare} className="form-stack">
              <div className="form-grid">
                <label>
                  Destination
                  <select
                    value={form.destination}
                    onChange={(e) => update("destination", e.target.value)}
                  >
                    {destinationCodes.map((code) => (
                      <option key={code} value={code}>
                        {catalogue.airports[code]?.city || code} ({code})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  What are you shipping?
                  <select
                    value={form.commodity}
                    onChange={(e) => update("commodity", e.target.value)}
                  >
                    {catalogue.commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Gross weight <span className="label-unit">kg</span>
                  <input
                    required
                    type="number"
                    min="0.1"
                    max="100000"
                    step="0.1"
                    placeholder="e.g. 600"
                    value={form.grossWeight}
                    onChange={(e) => update("grossWeight", e.target.value)}
                  />
                </label>
                <label>
                  Cargo ready date
                  <input
                    required
                    type="date"
                    min={todayNairobi()}
                    value={form.readyDate}
                    onChange={(e) => update("readyDate", e.target.value)}
                  />
                </label>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={form.dimensionMode === "dimensions"}
                  onChange={(e) =>
                    update(
                      "dimensionMode",
                      e.target.checked ? "dimensions" : "actual",
                    )
                  }
                />
                <span>
                  I know my package dimensions
                  <span className="field-hint">
                    Add dimensions for a more accurate chargeable weight.
                  </span>
                </span>
              </label>
              {form.dimensionMode === "dimensions" && (
                <fieldset>
                  <legend>Dimensions of each identical package</legend>
                  <div className="dimensions-grid">
                    {[
                      ["length", "Length (cm)"],
                      ["width", "Width (cm)"],
                      ["height", "Height (cm)"],
                      ["pieces", "Pieces"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          required
                          type="number"
                          min={key === "pieces" ? "1" : "0.1"}
                          max="100000"
                          step={key === "pieces" ? "1" : "0.1"}
                          value={form[key]}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <details>
                <summary>
                  Special handling notes <ChevronDown size={15} />
                </summary>
                <label className="sr-only" htmlFor="handling-notes">
                  Special handling notes
                </label>
                <textarea
                  id="handling-notes"
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Temperature needs, packaging, or anything the cargo desk should know."
                />
              </details>
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              {ratesError && (
                <div className="notice error" role="alert">
                  Could not load rates. {ratesError}
                  <button
                    type="button"
                    className="text-button"
                    onClick={loadRates}
                  >
                    Try again
                  </button>
                </div>
              )}
              <button
                className="button primary full"
                disabled={ratesLoading || Boolean(ratesError)}
              >
                {ratesLoading ? "Loading rates…" : "Compare estimates"}
                <ArrowRight size={18} />
              </button>
              <p className="field-hint centered">
                No account needed to compare. All estimates are in USD.
              </p>
            </form>
          </section>
          <aside className="quote-aside">
            <div className="aside-kicker">
              <Plane size={23} />
              <span>FRESH CARGO. CLEARER JOURNEYS.</span>
            </div>
            <h2>
              From first estimate
              <br />
              to ready for departure.
            </h2>
            <p>
              A single place for your quote, export documents, and shipment
              updates.
            </p>
            <ul className="benefit-list">
              <li>
                <Check size={18} />
                See your estimated total upfront
              </li>
              <li>
                <Check size={18} />
                Keep documents with each shipment
              </li>
              <li>
                <Check size={18} />
                Know what needs your attention
              </li>
            </ul>
            <div className="aside-note">
              <Scale size={18} />
              <p>
                Air freight uses the higher of actual and volumetric weight.
                Final weights, rates, and flight space need cargo desk
                confirmation.
              </p>
            </div>
          </aside>
        </div>
      )}
      {step === "estimates" && search && (
        <section
          className="results quote-step-results"
          aria-label="Compare estimates"
        >
          <div className="panel estimate-shipment-summary">
            <div className="summary-route">
              <Package size={20} />
              <div>
                <strong>
                  Nairobi →{" "}
                  {catalogue.airports[search.destination]?.city ||
                    search.destination}
                </strong>
                <p>
                  {
                    catalogue.commodities.find((c) => c.id === search.commodity)
                      ?.name
                  }
                </p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Gross weight</dt>
                <dd>{search.grossWeight} kg</dd>
              </div>
              <div>
                <dt>Cargo ready</dt>
                <dd>{search.readyDate}</dd>
              </div>
            </dl>
            <button className="button secondary small" onClick={editShipment}>
              <ArrowLeft size={15} />
              Edit shipment
            </button>
          </div>
          <div className="results-heading">
            <div className="eyebrow">YOUR OPTIONS</div>
            <h2>
              {options.length
                ? `${options.length} estimates for ${catalogue.airports[search.destination]?.city || search.destination}`
                : "No estimate available for this shipment"}
            </h2>
            <p>
              {search.grossWeight} kg · Ready {search.readyDate} ·{" "}
              {search.dimensionMode === "actual"
                ? "Weight estimate — dimensions not supplied"
                : "Actual and volumetric weight compared"}
            </p>
          </div>
          {!options.length && (
            <div className="panel empty-state">
              <Package size={28} />
              <h3>Try another destination or commodity</h3>
              <p>
                The current catalogue does not include a valid rate for this
                combination.
              </p>
              <button className="button secondary" onClick={editShipment}>
                Edit shipment details
              </button>
            </div>
          )}
          <div className="quote-results">
            {options.map(({ rate, quote }, index) => (
              <article className="panel quote-option" key={rate.id}>
                <div className="carrier-mark">{rate.airline_id}</div>
                <div className="carrier-info">
                  <h3>{rate.airline_name}</h3>
                  <p>
                    NBO → {rate.destination} · {rate.transit_time}
                  </p>
                  <span className="status neutral">
                    {rate.is_sample
                      ? "Sample estimate"
                      : rate.status === "published"
                        ? "Published rate · space unconfirmed"
                        : "Indicative rate"}
                  </span>
                  {index === 0 && (
                    <span className="lowest-label">Lowest estimated total</span>
                  )}
                </div>
                <div className="quote-price">
                  <strong>{money(quote.total)}</strong>
                  <span>
                    {quote.chargeable} kg chargeable · {money(quote.perKg)}/kg
                    freight
                  </span>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSelected({ rate, quote });
                      setRequestId(crypto.randomUUID());
                      setRequestError("");
                      setStep("request");
                    }}
                  >
                    Review estimate
                    <ArrowRight size={16} />
                  </button>
                </div>
                <details className="quote-details">
                  <summary>
                    Price breakdown & source
                    <ChevronDown size={15} />
                  </summary>
                  <QuoteBreakdown quote={quote} />
                  <p className="field-hint">
                    Source: {rate.source}.{" "}
                    {rate.valid_until
                      ? `Expires ${new Date(rate.valid_until).toLocaleString("en-KE")}.`
                      : "No supplier-confirmed validity."}{" "}
                    Destination handling, duties, insurance and delivery are
                    excluded. Local fees are indicative and need confirmation.
                  </p>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
      {step === "request" && selected && (
        <section
          className="panel quote-request-step"
          aria-label="Review your booking request"
        >
          <button
            className="back-link"
            disabled={busy}
            onClick={backToEstimates}
          >
            <ArrowLeft size={16} />
            Back to estimates
          </button>
          <div className="review-route">
            <span className="eyebrow">{selected.rate.airline_name}</span>
            <h3>Nairobi → {catalogue.airports[search.destination]?.city}</h3>
            <p>
              {
                catalogue.commodities.find((c) => c.id === search.commodity)
                  ?.name
              }{" "}
              · {search.grossWeight} kg gross · {selected.quote.chargeable} kg
              chargeable · Ready {search.readyDate}
            </p>
          </div>
          <QuoteBreakdown quote={selected.quote} />
          <div className="notice warning">
            This is an estimated price and a request for space. The cargo desk
            must confirm the rate, flight and final chargeable weight before you
            make payment.
          </div>
          {!isConfigured && (
            <p className="notice">
              This preview uses sample rates. Connect the database to save real
              requests.
            </p>
          )}
          {requestError && (
            <div className="notice error" role="alert">
              <p>{requestError}</p>
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  await loadRates();
                  backToEstimates();
                }}
              >
                Refresh estimates
              </button>
            </div>
          )}
          {user ? (
            <button
              className="button primary full"
              disabled={busy || !isConfigured}
              onClick={confirm}
            >
              {busy ? "Saving request…" : "Send booking request"}
              <ArrowRight size={17} />
            </button>
          ) : (
            <div className="request-sign-in">
              <p>
                Sign in to save this request to your shipments. Your selected
                estimate and shipment details will stay here.
              </p>
              <button
                className="button primary full"
                disabled={!isConfigured || authLoading}
                onClick={() => setAuthDialog("login")}
              >
                {authLoading ? "Checking account…" : "Sign in to send request"}
                <ArrowRight size={17} />
              </button>
              <button
                className="text-button"
                disabled={!isConfigured || authLoading}
                onClick={() => setAuthDialog("signup")}
              >
                New to Spedire? Create an account
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
