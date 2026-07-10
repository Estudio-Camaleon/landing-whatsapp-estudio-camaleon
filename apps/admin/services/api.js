export async function getStats(brand) {
  const query = brand ? `?brand=${brand}` : ""
  const res = await fetch(`/get-stats${query}`)
  return res.json()
}

export async function getVendors(brand) {
  const query = brand ? `?brand=${brand}` : ""
  const res = await fetch(`/get-vendors${query}`)
  return res.json()
}

export async function toggleVendor(id, active) {
  const res = await fetch("/update-vendor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, active })
  })
  return res.json()
}
