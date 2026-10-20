import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  isConfigured,
  requireBackend,
  supabase,
  unwrap,
} from "../lib/supabase";
import { validateFile } from "../lib/documents";
import sampleRates from "../data/sampleRates.json";

const RatesContext = createContext(null);
export const useRates = () => useContext(RatesContext);
export function RatesProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isConfigured);
  const [authDialog, setAuthDialog] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rates, setRates] = useState(isConfigured ? [] : sampleRates);
  const [ratesLoading, setRatesLoading] = useState(isConfigured);
  const [ratesError, setRatesError] = useState("");
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsError, setShipmentsError] = useState("");
  const [notification, setNotification] = useState(null);
  const userRef = useRef(null);
  const timer = useRef(null);
  const user = session?.user ?? null;
  const isStaff = ["staff", "admin"].includes(user?.app_metadata?.role);
  // Update at render time so requests from a previous session cannot populate this one.
  userRef.current = user?.id ?? null;
  const notify = useCallback((message, type = "success") => {
    clearTimeout(timer.current);
    setNotification({ message, type });
    timer.current = setTimeout(() => setNotification(null), 6000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    // Remove insecure prototype credentials and records; never import them into real accounts.
    try {
      Object.keys(localStorage)
        .filter((key) =>
          /^spedire_(auth|clients|shipments|profit|rates|today|last_)/.test(
            key,
          ),
        )
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      /* Storage may be disabled; hosted auth will report its own errors. */
    }
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (event === "PASSWORD_RECOVERY") setAuthDialog("recovery");
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadRates = useCallback(async () => {
    if (!supabase) return;
    setRatesLoading(true);
    setRatesError("");
    try {
      setRates(
        unwrap(
          await supabase
            .from("rates")
            .select("*")

            .order("airline_name"),
        ),
      );
    } catch (error) {
      setRatesError(error.message);
    } finally {
      setRatesLoading(false);
    }
  }, []);
  useEffect(() => {
    loadRates();
  }, [loadRates, isStaff]);

  const refreshShipments = useCallback(async () => {
    const userId = userRef.current;
    if (!userId || !supabase) return;
    setShipmentsLoading(true);
    setShipmentsError("");
    try {
      const rows = unwrap(
        await supabase
          .from("shipments")
          .select("*, documents(*)")
          .order("created_at", { ascending: false }),
      );
      if (userRef.current === userId) setShipments(rows);
    } catch (error) {
      if (userRef.current === userId) setShipmentsError(error.message);
    } finally {
      if (userRef.current === userId) setShipmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setShipments([]);
    setShipmentsError("");
    setShipmentsLoading(false);
    if (!user || !supabase) return;
    async function load() {
      try {
        let record = unwrap(
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),
        );
        if (!record) {
          record = unwrap(
            await supabase
              .from("profiles")
              .upsert(
                {
                  id: user.id,
                  full_name: user.user_metadata?.full_name || "",
                  company_name: user.user_metadata?.company_name || "",
                },
                { onConflict: "id" },
              )
              .select()
              .single(),
          );
        }
        if (!cancelled) setProfile(record);
      } catch (error) {
        if (!cancelled)
          notify(
            `Account profile could not be loaded: ${error.message}`,
            "error",
          );
      }
    }
    load();
    refreshShipments();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isStaff, refreshShipments, notify]);

  async function login(email, password) {
    unwrap(
      await requireBackend().auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
    );
    setAuthDialog(null);
    notify("You’re signed in.");
  }
  async function signup({ email, password, name, company }) {
    const data = unwrap(
      await requireBackend().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          data: { full_name: name.trim(), company_name: company.trim() },
        },
      }),
    );
    if (data.session) {
      setAuthDialog(null);
      notify("Your account is ready.");
    }
    return Boolean(data.session);
  }
  async function logout() {
    unwrap(await requireBackend().auth.signOut());
    setShipments([]);
    setProfile(null);
    setAuthDialog(null);
    window.location.hash = "/quote";
    notify("You’re signed out.");
  }
  async function requestShipment(rate, form, expectedTotal, requestId) {
    if (!user) throw new Error("Sign in before requesting a booking.");
    const result = unwrap(
      await requireBackend().rpc("request_shipment", {
        p_rate_id: rate.id,
        p_gross_weight: Number(form.grossWeight),
        p_ready_date: form.readyDate,
        p_dimensions:
          form.dimensionMode === "dimensions"
            ? {
                length: Number(form.length),
                width: Number(form.width),
                height: Number(form.height),
                pieces: Number(form.pieces),
              }
            : null,
        p_notes: form.notes || "",
        p_expected_total: expectedTotal,
        p_request_id: requestId,
      }),
    );
    await refreshShipments();
    notify(
      "Request saved. The cargo desk still needs to confirm space and the final price.",
    );
    return result;
  }
  async function uploadDocument(shipment, file, type) {
    const client = requireBackend();
    if (!user || shipment.user_id !== user.id)
      throw new Error("Only the shipment owner can upload documents.");
    const extension = await validateFile(file);
    const id = crypto.randomUUID();
    const path = `${user.id}/${shipment.id}/${id}.${extension}`;
    unwrap(
      await client.storage
        .from("shipment-documents")
        .upload(path, file, { contentType: file.type, upsert: false }),
    );
    try {
      unwrap(
        await client.from("documents").insert({
          id,
          shipment_id: shipment.id,
          user_id: user.id,
          type,
          file_name: file.name,
          mime_type: file.type,
          byte_size: file.size,
          object_path: path,
        }),
      );
    } catch (error) {
      const { error: cleanupError } = await client.storage
        .from("shipment-documents")
        .remove([path]);
      if (cleanupError)
        throw new Error(
          `${error.message}. An unattached file remains in storage; please contact support.`,
        );
      throw error;
    }
    await refreshShipments();
    notify("Document uploaded. It is awaiting staff review.");
  }
  async function downloadDocument(doc) {
    const blob = unwrap(
      await requireBackend()
        .storage.from("shipment-documents")
        .download(doc.object_path),
    );
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = doc.file_name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  async function extractDocument(doc) {
    const { data, error } = await requireBackend().functions.invoke(
      "document-intake",
      { body: { documentId: doc.id, consent: true } },
    );
    if (error) {
      let message = error.message;
      try {
        message = (await error.context.json()).error || message;
      } catch {
        /* transport errors do not have a body */
      }
      await refreshShipments();
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    await refreshShipments();
    notify("Fields extracted. Check the source document before using them.");
  }
  async function reviewDocument(docId, status, notes) {
    unwrap(
      await requireBackend()
        .from("documents")
        .update({ review_status: status, review_notes: notes })
        .eq("id", docId)
        .select("id")
        .single(),
    );
    await refreshShipments();
    notify("Document review saved.");
  }
  async function updateShipment(shipmentId, status, notes, awbNumber) {
    unwrap(
      await requireBackend().rpc("update_shipment_status", {
        p_shipment_id: shipmentId,
        p_status: status,
        p_note: notes,
        p_awb_number: awbNumber || null,
      }),
    );
    await refreshShipments();
    notify("Shipment updated.");
  }
  return (
    <RatesContext.Provider
      value={{
        isConfigured,
        session,
        user,
        isStaff,
        authLoading,
        authDialog,
        setAuthDialog,
        profile,
        rates,
        ratesLoading,
        ratesError,
        loadRates,
        shipments,
        shipmentsLoading,
        shipmentsError,
        refreshShipments,
        login,
        signup,
        logout,
        requestShipment,
        uploadDocument,
        downloadDocument,
        extractDocument,
        reviewDocument,
        updateShipment,
        notification,
        notify,
      }}
    >
      {children}
    </RatesContext.Provider>
  );
}
