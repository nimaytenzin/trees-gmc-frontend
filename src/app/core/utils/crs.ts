export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Convert DRUKREF 03 / Sarpang TM (EPSG:5304) projected coordinates (meters)
 * into WGS84 geographic coordinates (lat/lng in degrees).
 *
 * Based on inverse Transverse Mercator with:
 * - lat_0 = 0
 * - lon_0 = 90.2666666666667
 * - k = 1
 * - x_0 = 250000
 * - y_0 = -2500000
 * - ellps = GRS80
 *
 * This is an approximate implementation intended for map visualisation.
 */
export function sarpangTmToWgs84(x: number, y: number): LatLng {
  // GRS80 ellipsoid parameters
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const e2 = 2 * f - f * f;

  const lon0 = (90.2666666666667 * Math.PI) / 180; // central meridian in radians
  const k0 = 1.0;
  const x0 = 250000.0;
  const y0 = -2500000.0;

  // Remove false origin
  const xAdj = x - x0;
  const yAdj = y - y0;

  // Inverse Transverse Mercator (approximation)
  const M = yAdj / k0;
  const mu =
    M /
    (a *
      (1 -
        e2 / 4 -
        (3 * e2 * e2) / 64 -
        (5 * e2 * e2 * e2) / 256));

  const e1 =
    (1 -
      Math.sqrt(1 - e2)) /
    (1 + Math.sqrt(1 - e2));

  const J1 = (3 * e1) / 2 - (27 * e1 ** 3) / 32;
  const J2 = (21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32;
  const J3 = (151 * e1 ** 3) / 96;
  const J4 = (1097 * e1 ** 4) / 512;

  const fp =
    mu +
    J1 * Math.sin(2 * mu) +
    J2 * Math.sin(4 * mu) +
    J3 * Math.sin(6 * mu) +
    J4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const C1 = (e2 / (1 - e2)) * cosFp * cosFp;
  const T1 = tanFp * tanFp;
  const N1 = a / Math.sqrt(1 - e2 * sinFp * sinFp);
  const R1 =
    (a * (1 - e2)) /
    Math.pow(1 - e2 * sinFp * sinFp, 1.5);
  const D = xAdj / (N1 * k0);

  const lat =
    fp -
    ((N1 * tanFp) / R1) *
      (D * D / 2 -
        (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * (e2 / (1 - e2))) *
          Math.pow(D, 4) /
          24 +
        (61 +
          90 * T1 +
          298 * C1 +
          45 * T1 * T1 -
          252 * (e2 / (1 - e2)) -
          3 * C1 * C1) *
          Math.pow(D, 6) /
          720);

  const lng =
    lon0 +
    (D -
      (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 +
      (5 -
        2 * C1 +
        28 * T1 -
        3 * C1 * C1 +
        8 * (e2 / (1 - e2)) +
        24 * T1 * T1) *
        Math.pow(D, 5) /
        120) /
      cosFp;

  return {
    lat: (lat * 180) / Math.PI,
    lng: (lng * 180) / Math.PI,
  };
}

