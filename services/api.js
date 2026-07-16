export async function assignVendor(sucursal, brand) {
  var url = "/assign-vendor?sucursal=" + encodeURIComponent(sucursal)
  if (brand) url += "&brand=" + encodeURIComponent(brand)

  const res = await fetch(url)

  if (!res.ok) {
    const err = await res.json()
    throw err
  }

  return res.json()
}
