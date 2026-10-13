import { GpxAnalysis, GpxPoint, KmSplit } from "./types";
import { classifySlope, getMinettiCostRatio } from "./minettiMetabolic";

/**
 * Distância Haversine entre 2 coordenadas em metros.
 */
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Azimute / Direção (em graus de 0 a 360) entre duas coordenadas.
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * Filtro de suavização por média móvel para ruídos de altimetria de GPS/barômetro.
 */
function smoothElevations(points: { ele: number }[], windowSize = 5): number[] {
  const result: number[] = [];
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < points.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(points.length - 1, i + half); j++) {
      sum += points[j].ele;
      count++;
    }
    result.push(count > 0 ? sum / count : points[i].ele);
  }
  return result;
}

/**
 * Parser de arquivos GPX (XML).
 * Funciona de forma agnóstica no Navegador (DOMParser) e no Node.js (Regex fallback).
 */
export function parseGpxFile(gpxText: string, fileName = "Percurso GPX"): GpxAnalysis {
  const rawPoints: { lat: number; lon: number; ele: number }[] = [];

  // Tenta usar DOMParser se estiver em ambiente de navegador
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxText, "text/xml");
      const trkpts = xmlDoc.getElementsByTagName("trkpt");

      for (let i = 0; i < trkpts.length; i++) {
        const pt = trkpts[i];
        const lat = parseFloat(pt.getAttribute("lat") || "0");
        const lon = parseFloat(pt.getAttribute("lon") || "0");
        const eleNode = pt.getElementsByTagName("ele")[0];
        const ele = eleNode ? parseFloat(eleNode.textContent || "0") : 0;
        if (!isNaN(lat) && !isNaN(lon)) {
          rawPoints.push({ lat, lon, ele: isNaN(ele) ? 0 : ele });
        }
      }
    } catch {
      // Fallback para regex
    }
  }

  // Fallback Regex caso DOMParser não encontre pontos ou ambiente SSR
  if (rawPoints.length === 0) {
    const trkptRegex = /<trkpt\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi;
    let match: RegExpExecArray | null;

    while ((match = trkptRegex.exec(gpxText)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const innerContent = match[3];
      const eleMatch = /<ele>([^<]+)<\/ele>/i.exec(innerContent);
      const ele = eleMatch ? parseFloat(eleMatch[1]) : 0;
      if (!isNaN(lat) && !isNaN(lon)) {
        rawPoints.push({ lat, lon, ele: isNaN(ele) ? 0 : ele });
      }
    }
  }

  // Se ainda estiver vazio, tenta pontos de rota (<rtept>)
  if (rawPoints.length === 0) {
    const rteptRegex = /<rtept\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/rtept>/gi;
    let match: RegExpExecArray | null;
    while ((match = rteptRegex.exec(gpxText)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const innerContent = match[3];
      const eleMatch = /<ele>([^<]+)<\/ele>/i.exec(innerContent);
      const ele = eleMatch ? parseFloat(eleMatch[1]) : 0;
      if (!isNaN(lat) && !isNaN(lon)) {
        rawPoints.push({ lat, lon, ele: isNaN(ele) ? 0 : ele });
      }
    }
  }

  if (rawPoints.length === 0) {
    throw new Error("Nenhum ponto de coordenada válido (<trkpt> ou <rtept>) foi encontrado no arquivo GPX.");
  }

  // Suaviza elevações para eliminar pequenas oscilações de 1-2m causadas por ruído barométrico
  const smoothedEle = smoothElevations(rawPoints, 7);

  // Calcula distâncias acumuladas e altimetria total
  const gpxPoints: GpxPoint[] = [];
  let totalDistMeters = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minEle = smoothedEle[0];
  let maxEle = smoothedEle[0];

  gpxPoints.push({
    lat: rawPoints[0].lat,
    lon: rawPoints[0].lon,
    ele: smoothedEle[0],
    distFromStartMeters: 0,
  });

  for (let i = 1; i < rawPoints.length; i++) {
    const prev = rawPoints[i - 1];
    const curr = rawPoints[i];
    const segDist = calculateHaversineMeters(prev.lat, prev.lon, curr.lat, curr.lon);

    totalDistMeters += segDist;

    const eleDiff = smoothedEle[i] - smoothedEle[i - 1];
    if (eleDiff > 0.4) {
      elevationGain += eleDiff;
    } else if (eleDiff < -0.4) {
      elevationLoss += Math.abs(eleDiff);
    }

    if (smoothedEle[i] < minEle) minEle = smoothedEle[i];
    if (smoothedEle[i] > maxEle) maxEle = smoothedEle[i];

    gpxPoints.push({
      lat: curr.lat,
      lon: curr.lon,
      ele: smoothedEle[i],
      distFromStartMeters: totalDistMeters,
    });
  }

  // Segmenta em divisões de 1 KM (Splits)
  const splits: KmSplit[] = [];
  const targetKmTotal = Math.ceil(totalDistMeters / 1000);
  let currentKmTarget = 1000;
  let splitStartDist = 0;
  let splitStartEle = gpxPoints[0].ele;
  let splitStartPoint = gpxPoints[0];
  let currentKmIndex = 1;

  for (let i = 0; i < gpxPoints.length; i++) {
    const pt = gpxPoints[i];
    const isLastPoint = i === gpxPoints.length - 1;

    if (pt.distFromStartMeters >= currentKmTarget || isLastPoint) {
      const splitDist = pt.distFromStartMeters - splitStartDist;
      if (splitDist > 50) {
        // Ignora segmentos microscópicos de menos de 50 metros
        const eleDiff = pt.ele - splitStartEle;
        const gradient = splitDist > 0 ? (eleDiff / splitDist) : 0;
        const gradientPercent = gradient * 100;
        const slopeInfo = classifySlope(gradientPercent);
        const minettiRatio = getMinettiCostRatio(gradient);
        const bearing = calculateBearingDeg(
          splitStartPoint.lat,
          splitStartPoint.lon,
          pt.lat,
          pt.lon
        );

        splits.push({
          kmNumber: currentKmIndex,
          distanceMeters: Math.round(splitDist),
          startElevation: Math.round(splitStartEle),
          endElevation: Math.round(pt.ele),
          elevationChangeMeters: Math.round(eleDiff),
          avgGradientPercent: parseFloat(gradientPercent.toFixed(1)),
          slopeCategory: slopeInfo.category,
          minettiCostRatio: parseFloat(minettiRatio.toFixed(3)),
          targetPaceSecKm: 0, // calculado pelo predictor engine
          targetPaceFormatted: "0:00",
          splitDurationSec: 0,
          cumulativeTimeSec: 0,
          cumulativeTimeFormatted: "00:00:00",
          bearingDeg: Math.round(bearing),
        });

        currentKmIndex++;
        splitStartDist = pt.distFromStartMeters;
        splitStartEle = pt.ele;
        splitStartPoint = pt;
        currentKmTarget += 1000;
      }
    }
  }

  const avgGradient = totalDistMeters > 0 ? (elevationGain / totalDistMeters) * 100 : 0;
  const maxGradient = splits.reduce((max, s) => Math.max(max, Math.abs(s.avgGradientPercent)), 0);

  return {
    name: fileName.replace(/\.gpx$/i, ""),
    totalDistanceMeters: Math.round(totalDistMeters),
    totalDistanceKm: parseFloat((totalDistMeters / 1000).toFixed(2)),
    elevationGainMeters: Math.round(elevationGain),
    elevationLossMeters: Math.round(elevationLoss),
    minElevationMeters: Math.round(minEle),
    maxElevationMeters: Math.round(maxEle),
    avgGradientPercent: parseFloat(avgGradient.toFixed(1)),
    maxGradientPercent: parseFloat(maxGradient.toFixed(1)),
    startCoords: { lat: gpxPoints[0].lat, lon: gpxPoints[0].lon },
    points: gpxPoints,
    splits,
  };
}

/**
 * Cria uma representação de percurso totalmente plano para quando o usuário não fornecer arquivo GPX.
 */
export function createFlatCourse(distanceKm: number = 21.0975, name = "Percurso Plano"): GpxAnalysis {
  const totalDistanceMeters = Math.round(distanceKm * 1000);
  const splits: KmSplit[] = [];
  const totalSplits = Math.ceil(distanceKm);

  for (let k = 1; k <= totalSplits; k++) {
    const isLast = k === totalSplits;
    const splitDistanceMeters = isLast
      ? totalDistanceMeters - (k - 1) * 1000
      : 1000;

    splits.push({
      kmNumber: k,
      distanceMeters: splitDistanceMeters,
      startElevation: 10,
      endElevation: 10,
      elevationChangeMeters: 0,
      avgGradientPercent: 0,
      slopeCategory: "flat",
      minettiCostRatio: 1.0,
      targetPaceSecKm: 0,
      targetPaceFormatted: "0:00",
      splitDurationSec: 0,
      cumulativeTimeSec: 0,
      cumulativeTimeFormatted: "00:00:00",
      bearingDeg: 0,
      headwindKmh: 0,
      windAdjustmentSec: 0,
    });
  }

  // Gera pontos virtuais a cada 500m para renderização do perfil plano
  const points: GpxPoint[] = [];
  const stepCount = Math.max(10, Math.round(distanceKm * 2));
  for (let i = 0; i <= stepCount; i++) {
    const fraction = i / stepCount;
    points.push({
      lat: -22.9068 + fraction * 0.05,
      lon: -43.1729 + fraction * 0.05,
      ele: 10,
      distFromStartMeters: Math.round(fraction * totalDistanceMeters),
    });
  }

  return {
    name,
    totalDistanceMeters,
    totalDistanceKm: parseFloat(distanceKm.toFixed(2)),
    elevationGainMeters: 0,
    elevationLossMeters: 0,
    minElevationMeters: 10,
    maxElevationMeters: 10,
    avgGradientPercent: 0,
    maxGradientPercent: 0,
    startCoords: { lat: -22.9068, lon: -43.1729 },
    points,
    splits,
  };
}
