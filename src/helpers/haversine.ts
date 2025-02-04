const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const psi1 = lat1 * Math.PI/180; // φ, λ in radians
  const psi2 = lat2 * Math.PI/180;
  const deltaPsi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPsi/2) * Math.sin(deltaPsi/2) +
    Math.cos(psi1) * Math.cos(psi2) *
    Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

export default haversine;
