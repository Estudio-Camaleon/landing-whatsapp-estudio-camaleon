import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws"; // 1. Importamos la librería que acabamos de instalar

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let client = null;
let serviceClient = null;

export function getSupabase() {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    }
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      // 2. Le indicamos explícitamente a Supabase qué motor de WebSockets usar
      realtime: {
        transport: WebSocket,
      },
    });
  }
  return client;
}

export function getSupabaseService() {
  if (!serviceClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      // Repetimos la configuración aquí
      realtime: {
        transport: WebSocket,
      },
    });
  }
  return serviceClient;
}
