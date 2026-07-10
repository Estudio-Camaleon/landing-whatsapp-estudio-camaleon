export async function assignVendor() {
  const res = await fetch("/assign-vendor")

  if (!res.ok) {
    const err = await res.json()
    throw err
  }

  return res.json()
}
