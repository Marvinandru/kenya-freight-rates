import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  Package,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useRates } from "../context/RatesContext";
import { supabase } from "../lib/supabase";
import { dateLabel, money } from "../lib/quote";
import {
  DOCUMENT_TYPES,
  DOCUMENT_GUIDANCE,
  documentWarnings,
  requiredDocumentTypes,
} from "../lib/documents";
import catalogue from "../data/catalogue.json";
import { Modal } from "../ui/Modal";
import { QuoteBreakdown } from "./QuotePage";

export const STATUS_LABELS = {
  requested: "Booking requested",
  reviewing: "Cargo desk reviewing",
  confirmed: "Space confirmed",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
};
const REVIEW_LABELS = {
  pending: "Awaiting staff review",
  accepted: "Reviewed by staff",
  needs_changes: "Changes requested",
};
const fieldLabel = (value) => value.replaceAll("_", " ");

function DocumentCard({ doc, shipment, showType = true }) {
  const { downloadDocument, extractDocument, reviewDocument, isStaff, user } =
    useRates();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notes, setNotes] = useState(doc.review_notes || "");
  const [decision, setDecision] = useState("accepted");
  const warnings = documentWarnings(doc.extraction, shipment);
  const isOwner = shipment.user_id === user?.id;
  const aiEnabled = import.meta.env.VITE_ENABLE_DOCUMENT_AI === "true";
  async function run(action, task) {
    setBusy(action);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <article className="document-card">
      <div className="document-top">
        <div className="file-icon">
          <FileText size={23} />
        </div>
        <div className="document-name">
          {showType ? (
            <>
              <h3>{DOCUMENT_TYPES[doc.type] || doc.type}</h3>
              <p>{doc.file_name}</p>
            </>
          ) : (
            <h4>{doc.file_name}</h4>
          )}
          <span className="field-hint">
            {(doc.byte_size / 1024).toFixed(0)} KB · {dateLabel(doc.created_at)}
          </span>
        </div>
        <button
          aria-label={`Download ${doc.file_name}`}
          className="icon-button"
          disabled={Boolean(busy)}
          onClick={() => run("download", () => downloadDocument(doc))}
        >
          <Download size={19} />
        </button>
      </div>
      <div className="document-status">
        <span
          className={`status ${doc.review_status === "accepted" ? "positive" : doc.review_status === "needs_changes" ? "attention" : "neutral"}`}
        >
          {doc.review_status === "accepted" ? (
            <Check size={13} />
          ) : (
            <Clock3 size={13} />
          )}{" "}
          {REVIEW_LABELS[doc.review_status]}
        </span>
      </div>
      {doc.review_notes && (
        <p className="review-note">
          <strong>Cargo desk feedback:</strong> {doc.review_notes}
        </p>
      )}
      {doc.reviewed_at && (
        <p className="field-hint">
          Reviewed {dateLabel(doc.reviewed_at)}. Staff review does not
          authenticate an issuing authority.
        </p>
      )}
      {doc.extraction && (
        <details className="extracted-fields" open={warnings.length > 0}>
          <summary>AI-extracted fields · check against original</summary>
          <dl>
            {Object.entries(doc.extraction.fields || {}).map(([key, field]) => (
              <div key={key}>
                <dt>{fieldLabel(key)}</dt>
                <dd>
                  {field.value === null ? "Not found" : String(field.value)}
                  <span className="field-hint">
                    {field.evidence || "No source evidence"}
                    {field.page ? ` · page ${field.page}` : ""}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          {warnings.map((warning, index) => (
            <p className="notice warning" key={index}>
              {warning}
            </p>
          ))}
          <p className="field-hint">
            Extracted {dateLabel(doc.extracted_at)} · {doc.extraction_model}. AI
            results may be wrong and do not change shipment details or certify
            documents.
          </p>
        </details>
      )}
      {doc.extraction_status === "failed" && (
        <p className="notice warning">
          Extraction failed. The original file is safe; staff can still review
          it.
        </p>
      )}
      {doc.extraction_status === "processing" && (
        <p className="field-hint">
          Extraction is processing. Refresh shortly to check the result.
        </p>
      )}
      {aiEnabled && isOwner && doc.extraction_status !== "completed" && (
        <div className="ai-intake">
          <label className="check-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Allow this file to be sent to OpenAI for field extraction. Staff
              review is still required.
            </span>
          </label>
          <button
            className="button secondary small"
            disabled={
              !consent ||
              Boolean(busy) ||
              (doc.extraction_status === "processing" &&
                Date.now() - new Date(doc.extraction_started_at).getTime() <
                  120000)
            }
            onClick={() => run("extract", () => extractDocument(doc))}
          >
            {busy === "extract"
              ? "Extracting fields…"
              : "Extract document fields"}
          </button>
        </div>
      )}
      {isStaff && (
        <button className="text-button" onClick={() => setReviewOpen(true)}>
          Review this document
          <ArrowRight size={14} />
        </button>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {reviewOpen && (
        <Modal
          title="Review document"
          onClose={() => !busy && setReviewOpen(false)}
        >
          <p className="muted">
            Download and check the original document. Extracted values are
            suggestions, not proof of authenticity.
          </p>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              run("review", async () => {
                await reviewDocument(doc.id, decision, notes);
                setReviewOpen(false);
              });
            }}
          >
            <label>
              Decision
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option value="accepted">
                  Accept for shipment preparation
                </option>
                <option value="needs_changes">Request changes</option>
              </select>
            </label>
            <label>
              Review notes
              <textarea
                required
                minLength={5}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you check, or what needs correcting?"
              />
            </label>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={Boolean(busy)}>
              {busy ? "Saving…" : "Save review"}
            </button>
          </form>
        </Modal>
      )}
    </article>
  );
}

function UploadForm({ shipment, fixedType, onUploaded, onBusyChange }) {
  const { uploadDocument } = useRates();
  const [type, setType] = useState(fixedType || "certificate_of_origin");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inputKey, setInputKey] = useState(0);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      await uploadDocument(shipment, file, type);
      setFile(null);
      setInputKey((v) => v + 1);
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <form className="upload-form targeted-upload" onSubmit={submit}>
      <p className="muted">
        {fixedType
          ? DOCUMENT_GUIDANCE[fixedType]
          : "Add an extra file only if the cargo desk has asked for it. These do not replace the documents in your checklist."}
      </p>
      <div className={fixedType ? "" : "form-stack"}>
        {!fixedType && (
          <label>
            Supporting document type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {["certificate_of_origin", "other"].map((value) => (
                <option value={value} key={value}>
                  {DOCUMENT_TYPES[value]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          File <span className="label-unit">PDF, JPG, PNG · up to 10 MB</span>
          <input
            key={inputKey}
            required
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>
      <p className="field-hint">
        Files are private to your account and the cargo team. Uploading does not
        verify or approve a document.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={!file || busy}>
        {busy ? "Uploading…" : "Upload document"}
        <Upload size={16} />
      </button>
    </form>
  );
}

function ShipmentDocuments({ shipment, docs, required, complete }) {
  const { user } = useRates();
  const [uploadType, setUploadType] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const canUpload =
    shipment.user_id === user.id &&
    !["cancelled", "dispatched"].includes(shipment.status);
  const uploaded = required.filter((type) =>
    docs.some((doc) => doc.type === type),
  ).length;
  const additional = docs.filter((doc) => !required.includes(doc.type));
  return (
    <section className="panel documents-section">
      <div className="section-heading">
        <FolderOpen size={20} />
        <h2>Shipment documents</h2>
      </div>
      <div className="required-documents-intro">
        <h3>Documents you need to upload</h3>
        <p>
          Prepare the files below for cargo desk review. Each document has its
          own upload button.
        </p>
        <div className="document-progress-label">
          <strong>
            {uploaded} of {required.length} uploaded
          </strong>
          <span>
            {complete} of {required.length} reviewed
          </span>
        </div>
        <progress
          className="document-progress"
          max={required.length}
          value={uploaded}
          aria-label="Required documents uploaded"
        />
        <p className="field-hint">
          This checklist is based on your cargo type. The cargo desk will
          confirm the final requirements for your destination and request any
          extra files here.
        </p>
      </div>
      <ol className="required-documents-list">
        {required.map((type, index) => {
          const versions = docs.filter((doc) => doc.type === type);
          const latest = versions[0];
          const needsChanges = latest?.review_status === "needs_changes";
          const buttonLabel = !latest
            ? `Upload ${DOCUMENT_TYPES[type].toLowerCase()}`
            : needsChanges
              ? `Upload corrected ${DOCUMENT_TYPES[type].toLowerCase()}`
              : `Upload updated ${DOCUMENT_TYPES[type].toLowerCase()}`;
          return (
            <li
              className={`required-document ${needsChanges ? "requires-correction" : ""}`}
              key={type}
            >
              <div className="required-document-heading">
                <span
                  className={`requirement-number ${latest?.review_status === "accepted" ? "done" : ""}`}
                >
                  {latest?.review_status === "accepted" ? (
                    <Check size={15} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div>
                  <h3>{DOCUMENT_TYPES[type]}</h3>
                  <span className="requirement-label">Required for review</span>
                </div>
                {!latest && (
                  <span className="status attention">Not uploaded</span>
                )}
              </div>
              <p className="document-description">{DOCUMENT_GUIDANCE[type]}</p>
              {latest && (
                <DocumentCard
                  doc={latest}
                  shipment={shipment}
                  showType={false}
                />
              )}
              {canUpload && (
                <button
                  className={`button ${!latest || needsChanges ? "primary" : "secondary"} small requirement-upload`}
                  onClick={() => setUploadType(type)}
                >
                  <Upload size={15} />
                  {buttonLabel}
                </button>
              )}
              {versions.length > 1 && (
                <details className="document-history">
                  <summary>Previous uploads ({versions.length - 1})</summary>
                  <div className="document-grid">
                    {versions.slice(1).map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        shipment={shipment}
                        showType={false}
                      />
                    ))}
                  </div>
                </details>
              )}
            </li>
          );
        })}
      </ol>
      <div className="additional-documents">
        <h3>Additional supporting documents</h3>
        <p className="muted">
          Only upload these if requested by the cargo desk, such as a
          certificate of origin or other supporting paperwork.
        </p>
        {canUpload && (
          <button
            className="button secondary small"
            onClick={() => setUploadType("supporting")}
          >
            <Plus size={15} />
            Add supporting document
          </button>
        )}
        {additional.length > 0 && (
          <div className="document-grid">
            {additional.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} shipment={shipment} />
            ))}
          </div>
        )}
      </div>
      <p className="document-carrier-note">
        <PlaneIcon />
        The cargo desk provides your carrier-issued air waybill reference when
        it is available. You do not need to create one.
      </p>
      {uploadType && (
        <Modal
          title={
            uploadType === "supporting"
              ? "Add supporting document"
              : `Upload ${DOCUMENT_TYPES[uploadType].toLowerCase()}`
          }
          onClose={() => !uploadBusy && setUploadType(null)}
        >
          <UploadForm
            key={uploadType}
            shipment={shipment}
            fixedType={uploadType === "supporting" ? undefined : uploadType}
            onBusyChange={setUploadBusy}
            onUploaded={() => setUploadType(null)}
          />
        </Modal>
      )}
    </section>
  );
}

function StaffActions({ shipment }) {
  const { updateShipment } = useRates();
  const [status, setStatus] = useState(shipment.status);
  const [note, setNote] = useState("");
  const [awb, setAwb] = useState(shipment.awb_number || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setStatus(shipment.status), [shipment.status]);
  return (
    <section className="panel staff-actions">
      <h2>Cargo desk actions</h2>
      <p className="muted">
        Only confirm space after checking with the carrier. Record the actual
        air waybill when available.
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await updateShipment(shipment.id, status, note, awb);
            setNote("");
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Shipment status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Air waybill reference
            <input
              value={awb}
              maxLength={60}
              onChange={(e) => setAwb(e.target.value)}
              placeholder="Carrier-issued reference only"
            />
          </label>
        </div>
        <label>
          Update for the exporter
          <textarea
            required
            minLength={5}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save shipment update"}
        </button>
      </form>
    </section>
  );
}

export function ShipmentsPage({ shipmentId, operations = false }) {
  const {
    user,
    isStaff,
    authLoading,
    setAuthDialog,
    shipments,
    shipmentsLoading,
    shipmentsError,
    refreshShipments,
  } = useRates();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState("");
  const [eventReload, setEventReload] = useState(0);
  const shipment = shipments.find((s) => s.id === shipmentId);
  useEffect(() => {
    let active = true;
    setEvents([]);
    setEventsError("");
    if (shipmentId && user)
      (async () => {
        const { data, error } = await supabase
          .from("shipment_events")
          .select("*")
          .eq("shipment_id", shipmentId)
          .order("created_at", { ascending: false });
        if (active) {
          if (error) setEventsError(error.message);
          else setEvents(data);
        }
      })();
    return () => {
      active = false;
    };
  }, [shipmentId, user?.id, shipment?.updated_at, eventReload]);
  if (authLoading)
    return (
      <div className="panel empty-state" role="status">
        Checking your account…
      </div>
    );
  if (!user)
    return (
      <section className="panel empty-state">
        <FolderOpen size={38} />
        <h1>Your shipments, together.</h1>
        <p>
          Sign in to track your booking requests and manage your private export
          documents.
        </p>
        <button
          className="button primary"
          onClick={() => setAuthDialog("login")}
        >
          Sign in
          <ArrowRight size={17} />
        </button>
        <button className="text-button" onClick={() => setAuthDialog("signup")}>
          Create an account
        </button>
      </section>
    );
  if (operations && !isStaff)
    return (
      <div className="notice error">
        This workspace is only available to cargo staff.
      </div>
    );
  if (shipmentsLoading && !shipments.length)
    return (
      <div className="panel empty-state" role="status">
        Loading shipments…
      </div>
    );
  if (shipmentsError)
    return (
      <div className="notice error" role="alert">
        Could not load shipments: {shipmentsError}
        <button className="text-button" onClick={refreshShipments}>
          Try again
        </button>
      </div>
    );
  if (shipmentId && !shipment)
    return (
      <section className="panel empty-state">
        <h1>Shipment unavailable</h1>
        <p>This shipment may not exist, or you may not have access to it.</p>
        <a className="button secondary" href="#/shipments">
          Back to shipments
        </a>
      </section>
    );
  if (shipment) {
    const required = requiredDocumentTypes(shipment.commodity);
    const docs = [...(shipment.documents || [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    const complete = required.filter(
      (type) => docs.find((d) => d.type === type)?.review_status === "accepted",
    ).length;
    const missing = required.filter(
      (type) => !docs.some((doc) => doc.type === type),
    ).length;
    const corrections = required.filter(
      (type) =>
        docs.find((doc) => doc.type === type)?.review_status ===
        "needs_changes",
    ).length;
    const next =
      shipment.status === "cancelled"
        ? "This request has been cancelled. Start a new quote when you’re ready."
        : shipment.status === "dispatched"
          ? "Your cargo has been dispatched. Check the latest update below."
          : corrections > 0
            ? `The cargo desk requested corrections to ${corrections} document${corrections === 1 ? "" : "s"}. Read the feedback below and upload the corrected files.${missing ? ` You also have ${missing} missing document${missing === 1 ? "" : "s"}.` : ""}`
            : missing > 0
              ? `Upload the ${missing} missing document${missing === 1 ? "" : "s"} in the checklist below so the cargo desk can review your shipment paperwork.`
              : complete < required.length
                ? "All checklist documents have been uploaded and are awaiting cargo desk review. You do not need to upload them again unless corrections are requested."
                : "Your preparation documents have been reviewed. Check the cargo desk’s latest update.";
    return (
      <>
        <a
          href={isStaff ? "#/operations" : "#/shipments"}
          className="back-link"
        >
          <ArrowLeft size={16} />
          Back to {isStaff ? "work queue" : "shipments"}
        </a>
        <div className="page-heading compact">
          <div className="eyebrow">{shipment.reference}</div>
          <h1>
            Nairobi →{" "}
            {catalogue.airports[shipment.destination]?.city ||
              shipment.destination}
          </h1>
          <p>
            {catalogue.commodities.find((c) => c.id === shipment.commodity)
              ?.name || shipment.commodity}{" "}
            · {shipment.gross_weight} kg gross · Ready {shipment.ready_date}
          </p>
        </div>
        <div className="shipment-summary">
          <span
            className={`status ${shipment.status === "confirmed" || shipment.status === "dispatched" ? "positive" : "neutral"}`}
          >
            {STATUS_LABELS[shipment.status]}
          </span>
          <span>
            Estimated total <strong>{money(shipment.quote.total)}</strong>
          </span>
          {shipment.awb_number && (
            <span>
              AWB <strong>{shipment.awb_number}</strong>
            </span>
          )}
          <button
            className="text-button"
            disabled={shipmentsLoading}
            onClick={() => {
              refreshShipments();
              setEventReload((v) => v + 1);
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <div className="next-action">
          <span className="eyebrow">YOUR NEXT STEP</span>
          <p>{next}</p>
        </div>
        <div className="shipment-layout">
          <div className="form-stack">
            <ShipmentDocuments
              key={shipment.id}
              shipment={shipment}
              docs={docs}
              required={required}
              complete={complete}
            />
            {isStaff && <StaffActions shipment={shipment} />}
          </div>
          <aside className="form-stack">
            <section className="panel">
              <h2>Request details</h2>
              <dl className="detail-list">
                <div>
                  <dt>Carrier requested</dt>
                  <dd>{shipment.airline_name}</dd>
                </div>
                <div>
                  <dt>Chargeable weight</dt>
                  <dd>{shipment.chargeable_weight} kg</dd>
                </div>
                <div>
                  <dt>Weight basis</dt>
                  <dd>
                    {shipment.dimensions
                      ? "Actual and volumetric"
                      : "Actual only · estimate"}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{dateLabel(shipment.created_at)}</dd>
                </div>
              </dl>
              {shipment.notes && (
                <p className="review-note">{shipment.notes}</p>
              )}
              <details>
                <summary>Saved price breakdown</summary>
                <QuoteBreakdown quote={shipment.quote} />
                <p className="field-hint">
                  Estimate saved at request time. Rates, final weights,
                  destination charges, duties, insurance and delivery require
                  confirmation.
                </p>
              </details>
            </section>
            <section className="panel">
              <h2>Shipment activity</h2>
              {eventsError && (
                <p className="notice error">
                  Could not load activity: {eventsError}
                </p>
              )}
              <ol className="timeline">
                {events.map((event) => (
                  <li key={event.id}>
                    <span className="timeline-dot" />
                    <strong>
                      {STATUS_LABELS[event.status] || event.status}
                    </strong>
                    <p>{event.note}</p>
                    <small>{dateLabel(event.created_at)}</small>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </>
    );
  }
  const own = operations
    ? shipments
    : shipments.filter((s) => s.user_id === user.id);
  const needsAction = (s) =>
    !["cancelled", "dispatched"].includes(s.status) &&
    requiredDocumentTypes(s.commodity).some(
      (type) =>
        [...(s.documents || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .find((d) => d.type === type)?.review_status !== "accepted",
    );
  const visible = own.filter(
    (s) =>
      (filter === "all" ||
        (filter === "action" ? needsAction(s) : s.status === filter)) &&
      `${s.reference} ${s.destination} ${s.commodity} ${s.awb_number || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading compact heading-with-action">
        <div>
          <div className="eyebrow">
            {operations ? "CARGO DESK" : "YOUR EXPORT WORKSPACE"}
          </div>
          <h1>{operations ? "Work queue" : "My shipments"}</h1>
          <p>
            {operations
              ? "Review requests, check documents and keep exporters informed."
              : "Every request, document and next step in one place."}
          </p>
        </div>
        <a className="button primary" href="#/quote">
          <Plus size={17} />
          New quote
        </a>
      </div>
      <div className="list-toolbar">
        <div className="segmented">
          {[
            ["all", "All shipments"],
            ["action", "Needs attention"],
            ["confirmed", "Confirmed"],
          ].map(([value, label]) => (
            <button
              className={filter === value ? "selected" : ""}
              aria-pressed={filter === value}
              key={value}
              onClick={() => setFilter(value)}
            >
              {label}
              {value === "action" && (
                <span>{own.filter(needsAction).length}</span>
              )}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="shipment-search">
          Search shipments
        </label>
        <input
          id="shipment-search"
          className="search-input"
          placeholder="Search reference or destination"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="icon-button"
          aria-label="Refresh shipments"
          disabled={shipmentsLoading}
          onClick={refreshShipments}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {!visible.length ? (
        <section className="panel empty-state">
          <Package size={36} />
          <h2>
            {own.length ? "No shipments match" : "Your next export starts here"}
          </h2>
          <p>
            {own.length
              ? "Try a different search or filter."
              : "Compare an estimate, send a booking request, then add your documents."}
          </p>
          {!own.length && (
            <a href="#/quote" className="button primary">
              Get your first estimate
              <ArrowRight size={17} />
            </a>
          )}
        </section>
      ) : (
        <div className="shipment-list">
          {visible.map((s) => (
            <a
              href={`#/shipments/${s.id}`}
              className="panel shipment-row"
              key={s.id}
            >
              <div className="shipment-route-icon">
                <PlaneIcon />
              </div>
              <div>
                <span className="eyebrow">{s.reference}</span>
                <h3>
                  Nairobi →{" "}
                  {catalogue.airports[s.destination]?.city || s.destination}
                </h3>
                <p>
                  {s.gross_weight} kg · {s.airline_name} · Ready {s.ready_date}
                </p>
              </div>
              <div className="shipment-row-status">
                <span className="status neutral">
                  {STATUS_LABELS[s.status]}
                </span>
                <small>
                  {needsAction(s)
                    ? "Documents need attention"
                    : "No document action needed"}
                </small>
              </div>
              <strong className="shipment-total">
                {money(s.quote.total)}
                <small>Estimated</small>
              </strong>
              <ArrowRight size={19} />
            </a>
          ))}
        </div>
      )}
    </>
  );
}
function PlaneIcon() {
  return <Package size={23} />;
}
