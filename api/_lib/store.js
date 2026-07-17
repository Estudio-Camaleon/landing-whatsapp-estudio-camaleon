import { getSupabase } from "./supabase.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(s) {
  return UUID_RE.test(s);
}

function isTableNotFound(error) {
  return error?.code === "PGRST205";
}

function mapBrand(row) {
  const r = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain,
    active: row.active,
    logo_url: row.logo_url,
    background_url: row.background_url,
    background_mobile_url: row.background_mobile_url,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    og_image: row.og_image,
    favicon_url: row.favicon_url,
    theme: row.theme || null,
    heading: row.heading || null,
    button_text: row.button_text || null,
    logo_width: row.logo_width || null,
    logo_height: row.logo_height || null,
    card_padding: row.card_padding || null,
    logo_margin_bottom: row.logo_margin_bottom || null,
    heading_margin_bottom: row.heading_margin_bottom || null,
    seller_margin_bottom: row.seller_margin_bottom || null,
    cta_padding: row.cta_padding || null,
    logo_overflow: row.logo_overflow || null,
    accent: row.accent || null,
  };
  return r;
}

function mapVendor(row) {
  return {
    id: row.id,
    brand_id: row.brand_id,
    sucursal_name: row.sucursal_name || undefined,
    name: row.name,
    phone: row.phone,
    active: row.active,
    schedule: row.schedule || {},
  };
}

// ─── Brands ───

export async function getAllBrands() {
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .order("name", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(mapBrand);
}

export async function getBrandById(id) {
  if (!isValidUUID(id)) return null;
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data ? mapBrand(data) : null;
}

export async function getBrandBySlug(slug) {
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBrand(data) : null;
}

export async function getBrandByDomain(host) {
  const clean = host.replace(/^www\./, "").toLowerCase();
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("domain", clean)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBrand(data) : null;
}

const PRESENTATION_COLS = [
  "theme", "heading", "button_text", "logo_width", "logo_height",
  "card_padding", "logo_margin_bottom", "heading_margin_bottom",
  "seller_margin_bottom", "cta_padding", "logo_overflow", "accent"
];

export async function createBrand(data) {
  const insertData = {
    name: data.name,
    slug: data.slug,
    domain: data.domain || null,
  };
  for (const col of ["meta_title", "meta_description", "og_image", "favicon_url", "logo_url", "background_url", "background_mobile_url", ...PRESENTATION_COLS]) {
    if (data[col] !== undefined) insertData[col] = data[col];
  }

  const { data: inserted, error } = await getSupabase()
    .from("brands")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return mapBrand(inserted);
}

const OPTIONAL_COLS = ["meta_title", "meta_description", "og_image", "favicon_url"];

export async function updateBrand(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.domain !== undefined) dbUpdates.domain = updates.domain;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.logo_url !== undefined) dbUpdates.logo_url = updates.logo_url;
  if (updates.background_url !== undefined) dbUpdates.background_url = updates.background_url;
  if (updates.background_mobile_url !== undefined) dbUpdates.background_mobile_url = updates.background_mobile_url;
  if (updates.meta_title) dbUpdates.meta_title = updates.meta_title;
  if (updates.meta_description) dbUpdates.meta_description = updates.meta_description;
  if (updates.og_image) dbUpdates.og_image = updates.og_image;
  if (updates.favicon_url) dbUpdates.favicon_url = updates.favicon_url;
  for (const col of PRESENTATION_COLS) {
    if (updates[col] !== undefined) dbUpdates[col] = updates[col];
  }

  const { data, error } = await getSupabase()
    .from("brands")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error && error.code === "PGRST116") return null;
  if (error && error.code === "PGRST204") {
    // Column not found in schema cache → remove optional columns and retry
    for (const col of OPTIONAL_COLS) delete dbUpdates[col];
    const { data: retryData, error: retryError } = await getSupabase()
      .from("brands")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    if (retryError && retryError.code === "PGRST116") return null;
    if (retryError) throw retryError;
    return retryData ? mapBrand(retryData) : null;
  }
  if (error) throw error;
  return data ? mapBrand(data) : null;
}

export async function deleteBrand(id) {
  // Delete child records first (FK constraints may lack CASCADE in existing DB)
  await getSupabase().from("vendors").delete().eq("brand_id", id);
  await getSupabase().from("sucursales").delete().eq("brand_id", id);
  await getSupabase().from("rotation_state").delete().eq("brand_id", id);
  await getSupabase().from("events").delete().eq("brand_id", id);
  const { error } = await getSupabase().from("brands").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ─── Sucursales ───

export async function getSucursalesByBrand(brandId) {
  try {
    const { data, error } = await getSupabase()
      .from("sucursales")
      .select("*")
      .eq("brand_id", brandId)
      .order("name");
    if (error && isTableNotFound(error)) return [];
    if (error) throw error;
    return (data || []).map(s => ({ id: s.id, name: s.name, address: s.address, brand_id: s.brand_id }));
  } catch {
    return [];
  }
}

export async function getAllSucursales() {
  try {
    const { data, error } = await getSupabase()
      .from("sucursales")
      .select("*")
      .order("name");
    if (error && isTableNotFound(error)) return [];
    if (error) throw error;
    return (data || []).map(s => ({ id: s.id, name: s.name, address: s.address, brand_id: s.brand_id }));
  } catch {
    return [];
  }
}

export async function createSucursal(data) {
  const { data: inserted, error } = await getSupabase()
    .from("sucursales")
    .insert({ name: data.name, address: data.address, brand_id: data.brand_id })
    .select()
    .single();
  if (error) throw error;
  return { id: inserted.id, name: inserted.name, address: inserted.address, brand_id: inserted.brand_id };
}

export async function updateSucursal(brandId, oldName, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.address !== undefined) dbUpdates.address = updates.address;

  const { data, error } = await getSupabase()
    .from("sucursales")
    .update(dbUpdates)
    .eq("brand_id", brandId)
    .eq("name", oldName)
    .select()
    .single();
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data ? { id: data.id, name: data.name, address: data.address, brand_id: data.brand_id } : null;
}

export async function deleteSucursal(brandId, name) {
  const { error } = await getSupabase()
    .from("sucursales")
    .delete()
    .eq("brand_id", brandId)
    .eq("name", name);
  if (error) throw error;
  return true;
}

// ─── Vendors ───

export async function getAllVendors() {
  const { data, error } = await getSupabase()
    .from("vendors")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data || []).map(mapVendor);
}

export async function getVendorById(id) {
  const { data, error } = await getSupabase()
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapVendor(data) : null;
}

export async function getVendorsByBrand(brandId, sucursalName) {
  let query = getSupabase().from("vendors").select("*").eq("brand_id", brandId);
  if (sucursalName) query = query.eq("sucursal_name", sucursalName);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data || []).map(mapVendor);
}

export async function createVendor(data) {
  const insertData = {
    brand_id: data.brand_id,
    sucursal_name: data.sucursal_name || null,
    name: data.name,
    phone: data.phone,
    active: data.active,
    schedule: data.schedule,
  };
  const { data: inserted, error } = await getSupabase()
    .from("vendors")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return mapVendor(inserted);
}

export async function updateVendor(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.sucursal_name !== undefined) dbUpdates.sucursal_name = updates.sucursal_name;
  if (updates.schedule !== undefined) dbUpdates.schedule = updates.schedule;

  const { data, error } = await getSupabase()
    .from("vendors")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data ? mapVendor(data) : null;
}

export async function deleteVendor(id) {
  const { error } = await getSupabase().from("vendors").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ─── Events ───

export async function addEvent(event) {
  const { error } = await getSupabase().from("events").insert({
    brand_id: event.brand_id,
    vendor_id: event.vendor_id,
    ip: event.ip,
    user_agent: event.user_agent,
    created_at: event.created_at,
  });
  if (error) throw error;
}

export async function getRecentEvents(brandId, ip, since) {
  const { data, error } = await getSupabase()
    .from("events")
    .select("created_at")
    .eq("brand_id", brandId)
    .eq("ip", ip)
    .gte("created_at", since)
    .limit(10);
  if (error) throw error;
  return (data || []);
}

export async function getAllEvents() {
  const { data, error } = await getSupabase()
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []);
}

// ─── Rotation State ───

export async function getRotationState(brandId) {
  const { data, error } = await getSupabase()
    .from("rotation_state")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setRotationState(state) {
  const { error } = await getSupabase()
    .from("rotation_state")
    .upsert(state, { onConflict: "brand_id" });
  if (error) throw error;
}
