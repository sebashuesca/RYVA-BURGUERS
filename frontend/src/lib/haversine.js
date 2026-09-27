const RADIUS_KM = 6371.0088

export function haversineKm(lat1, lon1, lat2, lon2) {
  const coords = [lat1, lon1, lat2, lon2].map(Number)
  if (coords.some((value) => !Number.isFinite(value))) return null
  const [aLat, aLon, bLat, bLon] = coords.map((value) => value * Math.PI / 180)
  const deltaLat = bLat - aLat
  const deltaLon = bLon - aLon
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(aLat) * Math.cos(bLat) * Math.sin(deltaLon / 2) ** 2
  return 2 * RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
}

export function localDistance(lat, lon) {
  const kitchenLat = import.meta.env.VITE_KITCHEN_LATITUDE
  const kitchenLon = import.meta.env.VITE_KITCHEN_LONGITUDE
  if (!kitchenLat || !kitchenLon) return null
  return haversineKm(kitchenLat, kitchenLon, lat, lon)
}
