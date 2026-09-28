// Mappls/MapmyIndia API config
/**
 * Haversine Formula for distance calculation between two (Lat, Lng) points in kilometers
 */
exports.calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2)); // Returns distance in KM rounded to 2 decimals
};

/**
 * Estimate transit time assuming average city travel speed of 25 km/h
 */
exports.estimateTravelTimeMinutes = (distanceKm) => {
  const avgSpeedKmH = 25;
  const hours = distanceKm / avgSpeedKmH;
  return Math.ceil(hours * 60); // Returns minutes
};