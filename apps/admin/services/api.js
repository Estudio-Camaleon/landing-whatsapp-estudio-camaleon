const TOKEN_KEY = "wa-admin-token"

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ""
}

function authHeaders() {
  return {
    "Authorization": `Bearer ${getToken()}`,
    "Content-Type": "application/json"
  }
}

async function req(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...opts.headers } })
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.href = "/login"
    throw new Error("unauthorized")
  }
  return res.json()
}

// ─── Stats ───
export async function getStats(brand) {
  const query = brand ? `?brand=${brand}` : ""
  return req(`/get-stats${query}`)
}

// ─── Brands ───
export async function listBrands() {
  return req("/api/brands")
}

export async function getBrand(id) {
  return req(`/api/brands?id=${id}`)
}

export async function createBrand(data) {
  return req("/api/brands", { method: "POST", body: JSON.stringify(data) })
}

export async function updateBrand(data) {
  return req("/api/brands", { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteBrand(id) {
  return req("/api/brands", { method: "DELETE", body: JSON.stringify({ id }) })
}

// ─── Vendors ───
export async function listVendors(brandId) {
  const query = brandId ? `?brand_id=${brandId}` : ""
  return req(`/api/vendors${query}`)
}

export async function getVendor(id) {
  return req(`/api/vendors?id=${id}`)
}

export async function createVendor(data) {
  return req("/api/vendors", { method: "POST", body: JSON.stringify(data) })
}

export async function updateVendor(data) {
  return req("/api/vendors", { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteVendor(id) {
  return req("/api/vendors", { method: "DELETE", body: JSON.stringify({ id }) })
}

// ─── Events ───
export async function listEvents(filters = {}) {
  const params = new URLSearchParams()
  if (filters.brand_id) params.set("brand_id", filters.brand_id)
  if (filters.vendor_id) params.set("vendor_id", filters.vendor_id)
  if (filters.days) params.set("days", filters.days)
  if (filters.page) params.set("page", filters.page)
  if (filters.limit) params.set("limit", filters.limit)
  return req(`/api/events?${params.toString()}`)
}

// ─── Upload ───
export async function uploadAsset(brandId, assetType, fileBase64, mimeType) {
  return req("/api/upload-asset", {
    method: "POST",
    body: JSON.stringify({ brand_id: brandId, asset_type: assetType, file_base64: fileBase64, mime_type: mimeType })
  })
}
