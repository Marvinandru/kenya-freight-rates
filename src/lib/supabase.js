import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isConfigured = Boolean(url && key);
export const supabase = isConfigured ? createClient(url, key) : null;

export function requireBackend() {
  if (!supabase)
    throw new Error(
      "Accounts and uploads will be available once the database is connected.",
    );
  return supabase;
}

export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}
