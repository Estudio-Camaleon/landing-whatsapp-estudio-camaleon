export async function assignVendor(sucursal) {
  var url = "/assign-vendor"
  if (sucursal) url += "?sucursal=" + encodeURIComponent(sucursal)

  const res = await fetch(url)

  if (!res.ok) {
    const err = await res.json()
    throw err
  }

  return res.json()
}
