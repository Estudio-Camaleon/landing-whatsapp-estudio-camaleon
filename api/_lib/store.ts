interface Event {
  brand_id: string;
  vendor_id: string;
  ip: string;
  user_agent: string | null;
  created_at: string;
}

interface RotationState {
  brand_id: string;
  last_vendor_index: number;
}

export interface StoredBrand {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
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
}

export interface StoredSucursal {
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

const events: Event[] = [];
const rotationStates = new Map<string, RotationState>();
let brandsStore: StoredBrand[] = [];
let sucursalesStore: StoredSucursal[] = [];
let vendorsStore: StoredVendor[] = [];
let seeded = false;

let seedFn: (() => void) | null = null;

export function isSeeded() { return seeded; }

export function onSeed(fn: () => void) {
  seedFn = fn;
}

function ensureSeeded() {
  if (!seeded && seedFn) {
    seedFn();
    seeded = true;
  }
}

export function seedData(staticBrands: StoredBrand[], staticSucursales: StoredSucursal[], staticVendors: StoredVendor[]) {
  if (seeded) return;
  brandsStore = staticBrands;
  sucursalesStore = staticSucursales;
  vendorsStore = staticVendors;
  seeded = true;
}

// ─── Events ───
export function addEvent(event: Event): void {
  events.push(event);
  if (events.length > 1000) events.splice(0, events.length - 200);
}

export function getRecentEvents(brandId: string, ip: string, since: string): Event[] {
  const sinceDate = new Date(since).getTime();
  return events.filter(e => e.brand_id === brandId && e.ip === ip && new Date(e.created_at).getTime() >= sinceDate);
}

export function getRotationState(brandId: string): RotationState | undefined {
  return rotationStates.get(brandId);
}

export function setRotationState(state: RotationState): void {
  rotationStates.set(state.brand_id, state);
}

export function getAllEvents(): Event[] {
  return events.slice();
}

// ─── Brands ───
export function getAllBrands(): StoredBrand[] {
  ensureSeeded();
  return brandsStore.slice();
}

export function getBrandById(id: string): StoredBrand | undefined {
  ensureSeeded();
  return brandsStore.find(b => b.id === id);
}

export function getBrandBySlug(slug: string): StoredBrand | undefined {
  ensureSeeded();
  return brandsStore.find(b => b.slug === slug);
}

export function getBrandByDomain(host: string): StoredBrand | undefined {
  ensureSeeded();
  const clean = host.replace(/^www\./, "").toLowerCase();
  return brandsStore.find(b => b.domain === clean);
}

export function createBrand(data: StoredBrand): StoredBrand {
  brandsStore.push(data);
  return data;
}

export function updateBrand(id: string, data: Partial<StoredBrand>): StoredBrand | undefined {
  const idx = brandsStore.findIndex(b => b.id === id);
  if (idx === -1) return;
  brandsStore[idx] = { ...brandsStore[idx], ...data };
  return brandsStore[idx];
}

export function deleteBrand(id: string): boolean {
  const idx = brandsStore.findIndex(b => b.id === id);
  if (idx === -1) return false;
  brandsStore.splice(idx, 1);
  sucursalesStore = sucursalesStore.filter(s => s.brand_id !== id);
  vendorsStore = vendorsStore.filter(v => v.brand_id !== id);
  return true;
}

// ─── Sucursales ───
export function getSucursalesByBrand(brandId: string): StoredSucursal[] {
  ensureSeeded();
  return sucursalesStore.filter(s => s.brand_id === brandId);
}

export function getAllSucursales(): StoredSucursal[] {
  ensureSeeded();
  return sucursalesStore.slice();
}

export function createSucursal(data: StoredSucursal): StoredSucursal {
  sucursalesStore.push(data);
  return data;
}

export function updateSucursal(brandId: string, oldName: string, data: Partial<StoredSucursal>): StoredSucursal | undefined {
  const idx = sucursalesStore.findIndex(s => s.brand_id === brandId && s.name === oldName);
  if (idx === -1) return;
  sucursalesStore[idx] = { ...sucursalesStore[idx], ...data };
  return sucursalesStore[idx];
}

export function deleteSucursal(brandId: string, name: string): boolean {
  const idx = sucursalesStore.findIndex(s => s.brand_id === brandId && s.name === name);
  if (idx === -1) return false;
  sucursalesStore.splice(idx, 1);
  vendorsStore = vendorsStore.filter(v => !(v.brand_id === brandId && v.sucursal_name === name));
  return true;
}

// ─── Vendors ───
export function getAllVendors(): StoredVendor[] {
  ensureSeeded();
  return vendorsStore.slice();
}

export function getVendorById(id: string): StoredVendor | undefined {
  ensureSeeded();
  return vendorsStore.find(v => v.id === id);
}

export function getVendorsByBrand(brandId: string, sucursalName?: string): StoredVendor[] {
  ensureSeeded();
  let filtered = vendorsStore.filter(v => v.brand_id === brandId);
  if (sucursalName) filtered = filtered.filter(v => v.sucursal_name === sucursalName);
  return filtered;
}

export function createVendor(data: StoredVendor): StoredVendor {
  vendorsStore.push(data);
  return data;
}

export function updateVendor(id: string, data: Partial<StoredVendor>): StoredVendor | undefined {
  const idx = vendorsStore.findIndex(v => v.id === id);
  if (idx === -1) return;
  vendorsStore[idx] = { ...vendorsStore[idx], ...data };
  return vendorsStore[idx];
}

export function deleteVendor(id: string): boolean {
  const idx = vendorsStore.findIndex(v => v.id === id);
  if (idx === -1) return false;
  vendorsStore.splice(idx, 1);
  return true;
}
