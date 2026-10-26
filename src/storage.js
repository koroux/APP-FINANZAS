import { createClient } from "@supabase/supabase-js";
import { referenceTax } from "./finance";
export const configured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
export const supabase = configured
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  : null;
export const emptyData = () => ({
  salary: 0,
  tax: structuredClone(referenceTax),
  expenses: [],
  debts: [],
  budgets: [],
  goals: [],
  contributions: [],
});
export function readLocal() {
  try {
    return JSON.parse(localStorage.getItem("quincena-local")) || emptyData();
  } catch {
    return emptyData();
  }
}
export function saveLocal(data) {
  localStorage.setItem("quincena-local", JSON.stringify(data));
}
export async function fetchCloud(id) {
  const { data, error } = await supabase
    .from("finance_profiles")
    .select("data")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;
  return data?.data || emptyData();
}
export async function saveCloud(id, data) {
  const { error } = await supabase
    .from("finance_profiles")
    .upsert({ user_id: id, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}
