import { getSupabase } from "./supabase";

export interface StoredBrand {
  id: string;
  name: string | null;
  slug: string | null;
  domain: string | null;
  theme?: string;
  title?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  logo?: string;
  logoWidth?: string;
  logoHeight?: string;
  background?: string;
  backgroundMobile?: string;
  active?: boolean;
  cardPadding?: string;
  logoMarginBottom?: string;
  headingMarginBottom?: string;
  sellerMarginBottom?: string;
  ctaPadding?: string;
  logoOverflow?: string;
  logo_url?: string | null;
  background_url?: string | null;
  background_mobile_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  favicon_url?: string | null;
}

export interface StoredSucursal {
  id?: string;
  name: string;
  address: string;
  brand_id: string;
}

export interface StoredVendor {
  id: string;
  brand_id: string;
  sucursal_name?: string;
  name: string;
  phone: string;
  active: boolean;
  schedule: Record<string, { active: boolean; start?: string; end?: string }>;
}

interface DbBrand {
  id: string;
  name: string | null;
  slug: string | null;
  domain: string | null;
  logo_url: string | null;
  background_url: string | null;
  background_mobile_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  favicon_url: string | null;
}

type VendorInsert = {
  brand_id: string;
  sucursal_name?: string | null;
  name: string;
  phone: string;
  active: boolean;
  schedule: Record<string, unknown>;
};

interface DbVendor {
  id: string;
  brand_id: string;
  sucursal_name: string | null;
  name: string;
  phone: string;
  active: boolean;
  schedule: Record<string, { active: boolean; start?: string; end?: string }>;
}

interface DbSucursal {
  id: string;
  name: string;
  address: string;
  brand_id: string;
}

interface DbEvent {
  id: string;
  brand_id: string;
  vendor_id: string | null;
  ip: string;
  user_agent: string | null;
  created_at: string;
}

interface DbRotation {
  brand_id: string;
  last_vendor_index: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(s: string): boolean {
  return UUID_RE.test(s);
}

function isTableNotFound(error: any): boolean {
  return error?.code === "PGRST205";
}

function mapBrand(row: DbBrand): StoredBrand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain,
    logo_url: row.logo_url,
    background_url: row.background_url,
    background_mobile_url: row.background_mobile_url,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    og_image: row.og_image,
    favicon_url: row.favicon_url,
  };
}

function mapVendor(row: DbVendor): StoredVendor {
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

export async function getAllBrands(): Promise<StoredBrand[]> {
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .order("name", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(mapBrand);
}

export async function getBrandById(id: string): Promise<StoredBrand | null> {
  if (!isValidUUID(id)) return null;
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data ? mapBrand(data as DbBrand) : null;
}

export async function getBrandBySlug(slug: string): Promise<StoredBrand | null> {
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBrand(data as DbBrand) : null;
}

export async function getBrandByDomain(host: string): Promise<StoredBrand | null> {
  const clean = host.replace(/^www\./, "").toLowerCase();
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("domain", clean)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBrand(data as DbBrand) : null;
}

export async function createBrand(data: {
  name: string;
  slug: string;
  domain?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  favicon_url?: string | null;
}): Promise<StoredBrand> {
  const insertData: Record<string, unknown> = {
    name: data.name,
    slug: data.slug,
    domain: data.domain || null,
  };
  if (data.meta_title) insertData.meta_title = data.meta_title;
  if (data.meta_description) insertData.meta_description = data.meta_description;
  if (data.og_image) insertData.og_image = data.og_image;
  if (data.favicon_url) insertData.favicon_url = data.favicon_url;

  const { data: inserted, error } = await getSupabase()
    .from("brands")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return mapBrand(inserted as DbBrand);
}

const OPTIONAL_COLS = ["meta_title", "meta_description", "og_image", "favicon_url"] as const;

export async function updateBrand(id: string, updates: Record<string, unknown>): Promise<StoredBrand | null> {
  const dbUpdates: Record<string, unknown> = {};
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
    return retryData ? mapBrand(retryData as DbBrand) : null;
  }
  if (error) throw error;
  return data ? mapBrand(data as DbBrand) : null;
}

export async function deleteBrand(id: string): Promise<boolean> {
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

export async function getSucursalesByBrand(brandId: string): Promise<StoredSucursal[]> {
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

export async function getAllSucursales(): Promise<StoredSucursal[]> {
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

export async function createSucursal(data: StoredSucursal): Promise<StoredSucursal> {
  const { data: inserted, error } = await getSupabase()
    .from("sucursales")
    .insert({ name: data.name, address: data.address, brand_id: data.brand_id })
    .select()
    .single();
  if (error) throw error;
  return { id: inserted.id, name: inserted.name, address: inserted.address, brand_id: inserted.brand_id };
}

export async function updateSucursal(brandId: string, oldName: string, updates: Partial<StoredSucursal>): Promise<StoredSucursal | null> {
  const dbUpdates: Record<string, unknown> = {};
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

export async function deleteSucursal(brandId: string, name: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from("sucursales")
    .delete()
    .eq("brand_id", brandId)
    .eq("name", name);
  if (error) throw error;
  return true;
}

// ─── Vendors ───

export async function getAllVendors(): Promise<StoredVendor[]> {
  const { data, error } = await getSupabase()
    .from("vendors")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data || []).map(mapVendor);
}

export async function getVendorById(id: string): Promise<StoredVendor | null> {
  const { data, error } = await getSupabase()
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapVendor(data as DbVendor) : null;
}

export async function getVendorsByBrand(brandId: string, sucursalName?: string): Promise<StoredVendor[]> {
  let query = getSupabase().from("vendors").select("*").eq("brand_id", brandId);
  if (sucursalName) query = query.eq("sucursal_name", sucursalName);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data || []).map(mapVendor);
}

export async function createVendor(data: Omit<StoredVendor, "id">): Promise<StoredVendor> {
  const insertData: VendorInsert = {
    brand_id: data.brand_id,
    sucursal_name: data.sucursal_name || null,
    name: data.name,
    phone: data.phone,
    active: data.active,
    schedule: data.schedule as Record<string, unknown>,
  };
  const { data: inserted, error } = await getSupabase()
    .from("vendors")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return mapVendor(inserted as DbVendor);
}

export async function updateVendor(id: string, updates: Partial<StoredVendor>): Promise<StoredVendor | null> {
  const dbUpdates: Record<string, unknown> = {};
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
  return data ? mapVendor(data as DbVendor) : null;
}

export async function deleteVendor(id: string): Promise<boolean> {
  const { error } = await getSupabase().from("vendors").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ─── Events ───

export async function addEvent(event: {
  brand_id: string;
  vendor_id: string | null;
  ip: string;
  user_agent: string | null;
  created_at: string;
}): Promise<void> {
  const { error } = await getSupabase().from("events").insert({
    brand_id: event.brand_id,
    vendor_id: event.vendor_id,
    ip: event.ip,
    user_agent: event.user_agent,
    created_at: event.created_at,
  });
  if (error) throw error;
}

export async function getRecentEvents(brandId: string, ip: string, since: string): Promise<{ created_at: string }[]> {
  const { data, error } = await getSupabase()
    .from("events")
    .select("created_at")
    .eq("brand_id", brandId)
    .eq("ip", ip)
    .gte("created_at", since)
    .limit(10);
  if (error) throw error;
  return (data || []) as { created_at: string }[];
}

export async function getAllEvents(): Promise<{
  id: string;
  brand_id: string;
  vendor_id: string | null;
  ip: string;
  user_agent: string | null;
  created_at: string;
}[]> {
  const { data, error } = await getSupabase()
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []) as DbEvent[];
}

// ─── Rotation State ───

export async function getRotationState(brandId: string): Promise<{ brand_id: string; last_vendor_index: number } | null> {
  const { data, error } = await getSupabase()
    .from("rotation_state")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw error;
  return data as DbRotation | null;
}

export async function setRotationState(state: { brand_id: string; last_vendor_index: number }): Promise<void> {
  const { error } = await getSupabase()
    .from("rotation_state")
    .upsert(state, { onConflict: "brand_id" });
  if (error) throw error;
}
