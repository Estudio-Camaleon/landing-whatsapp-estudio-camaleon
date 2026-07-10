function getToken() {
  return localStorage.getItem("wa-admin-token") || ""
}

function authHeaders() {
  return { "Authorization": `Bearer ${getToken()}` }
}

export async function getStats(brand) {
  const query = brand ? `?brand=${brand}` : ""
  const res = await fetch(`/get-stats${query}`, {
    headers: authHeaders()
  })
  if (res.status === 401) {
    localStorage.removeItem("wa-admin-token")
    window.location.href = "/login"
    throw new Error("unauthorized")
  }
  return res.json()
}

export async function getVendors(brand) {
  const query = brand ? `?brand=${brand}` : ""
  const res = await fetch(`/get-vendors${query}`, {
    headers: authHeaders()
  })
  if (res.status === 401) {
    localStorage.removeItem("wa-admin-token")
    window.location.href = "/login"
    throw new Error("unauthorized")
  }
  return res.json()
}

export async function toggleVendor(id, active) {
  const res = await fetch("/update-vendor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({ id, active })
  })
  if (res.status === 401) {
    localStorage.removeItem("wa-admin-token")
    window.location.href = "/login"
    throw new Error("unauthorized")
  }
  return res.json()
}
