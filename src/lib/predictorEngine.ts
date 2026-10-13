import {
  AthleteFitnessMetrics,
  GpxAnalysis,
  KmSplit,
  NutritionPlan,
  PredictionResult,
  StravaActivity,
  WeatherData,
} from "./types";
import { adjustPaceForGradient, classifySlope, getMinettiCostRatio } from "./minettiMetabolic";

/**
 * Formata segundos em HH:MM:SS ou MM:SS
 */
export function formatTimeSec(seconds: number): string {
  const rounded = Math.round(seconds);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  }
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/**
 * Formata ritmo em M:SS /km
 */
export function formatPaceSecKm(secKm: number): string {
  if (isNaN(secKm) || secKm <= 0) return "0:00";
  const m = Math.floor(secKm / 60);
  const s = Math.round(secKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Analisa as corridas das últimas 24 semanas do Strava e extrai métricas fisiológicas do atleta.
 * O macrociclo de 24 semanas (~6 meses) reflete com precisão o bloco de treinamento atual.
 */
export function analyzeStravaActivities(
  activities: StravaActivity[],
  targetWeeks: number = 24
): AthleteFitnessMetrics {
  const WEEKS_CYCLE = targetWeeks;
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const CYCLE_DURATION_MS = WEEKS_CYCLE * MS_PER_WEEK;

  // Filtra apenas corridas válidas (Run / VirtualRun com ao menos 1km e 5min)
  const allRuns = activities.filter((a) => {
    const type = (a.sport_type || a.type || "").toLowerCase();
    return (type === "run" || type === "virtualrun") && a.distance >= 1000 && a.moving_time >= 300;
  });

  if (allRuns.length === 0) {
    // Retorno padrão de corredor amador se não houver dados suficientes
    return {
      totalRunsAnalyzed: 0,
      weeksAnalyzed: WEEKS_CYCLE,
      activeWeeksCount: 0,
      totalDistanceKm: 0,
      avgWeeklyDistanceKm: 30,
      longestRunKm: 15,
      avgPaceSecKm: 330, // 5:30/km
      best5kTimeSec: 1500, // 25:00
      best10kTimeSec: 3120, // 52:00
      estimatedVdot: 40,
      fatigueExponent: 1.07,
      aerobicBaseScore: 50,
      avgHeartRate: 150,
      recentFormTrend: "maintaining",
    };
  }

  // Ordena por data (mais recente primeiro)
  allRuns.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  // Janela temporal estrita das últimas 24 semanas
  const newestTime = new Date(allRuns[0].start_date).getTime();
  const referenceTime = Math.max(Date.now(), newestTime);
  const cutoffTime = referenceTime - CYCLE_DURATION_MS;

  // Filtra corridas dentro das 24 semanas
  let runs = allRuns.filter((r) => new Date(r.start_date).getTime() >= cutoffTime);

  // Se por acaso as corridas forem anteriores à data de hoje, pega as 24 semanas a partir da mais recente
  if (runs.length === 0) {
    const fallbackCutoff = newestTime - CYCLE_DURATION_MS;
    runs = allRuns.filter((r) => new Date(r.start_date).getTime() >= fallbackCutoff);
    if (runs.length === 0) runs = allRuns;
  }

  const totalDistMeters = runs.reduce((acc, r) => acc + r.distance, 0);
  const totalMovingSec = runs.reduce((acc, r) => acc + r.moving_time, 0);
  const totalDistKm = parseFloat((totalDistMeters / 1000).toFixed(1));

  // Volume semanal médio no ciclo de 24 semanas
  const avgWeeklyKm = parseFloat((totalDistKm / WEEKS_CYCLE).toFixed(1));

  // Semanas ativas (semanas em que o atleta realizou pelo menos 1 treino no ciclo de 24)
  const activeWeeksSet = new Set<number>();
  for (const r of runs) {
    const runTime = new Date(r.start_date).getTime();
    const weekIdx = Math.floor((referenceTime - runTime) / MS_PER_WEEK);
    if (weekIdx >= 0 && weekIdx < WEEKS_CYCLE) {
      activeWeeksSet.add(weekIdx);
    }
  }
  const activeWeeksCount = Math.min(WEEKS_CYCLE, Math.max(1, activeWeeksSet.size));

  // Maior rodagem contínua no ciclo das 24 semanas
  const longestRunMeters = Math.max(...runs.map((r) => r.distance));
  const longestRunKm = parseFloat((longestRunMeters / 1000).toFixed(1));

  // Ritmo médio global no ciclo (seg/km)
  const avgPace = totalMovingSec / (totalDistMeters / 1000);

  // Procura melhores desempenhos em distâncias padrão nas últimas 24 semanas
  let best5kTime: number | undefined;
  let best10kTime: number | undefined;
  let bestHalfTime: number | undefined;
  let bestFullTime: number | undefined;

  let totalHr = 0;
  let hrCount = 0;

  for (const r of runs) {
    const distKm = r.distance / 1000;
    const pace = r.moving_time / distKm;

    if (r.average_heartrate) {
      totalHr += r.average_heartrate;
      hrCount++;
    }

    // ~5km (4.8km a 7.5km)
    if (distKm >= 4.8 && distKm <= 7.5) {
      const estimated5k = pace * 5;
      if (!best5kTime || estimated5k < best5kTime) best5kTime = estimated5k;
    }

    // ~10km (9.5km a 14km)
    if (distKm >= 9.5 && distKm <= 14) {
      const estimated10k = pace * 10;
      if (!best10kTime || estimated10k < best10kTime) best10kTime = estimated10k;
    }

    // ~21km (20km a 25km)
    if (distKm >= 20 && distKm <= 25) {
      const estimatedHalf = pace * 21.0975;
      if (!bestHalfTime || estimatedHalf < bestHalfTime) bestHalfTime = estimatedHalf;
    }

    // ~42km (> 40km)
    if (distKm >= 40) {
      const estimatedFull = pace * 42.195;
      if (!bestFullTime || estimatedFull < bestFullTime) bestFullTime = estimatedFull;
    }
  }

  // Estima VDOT a partir dos melhores desempenhos do ciclo das 24 semanas
  let calculatedVdot = 42;
  const benchmarkTime = best10kTime || (best5kTime ? best5kTime * 2.08 : (bestHalfTime ? bestHalfTime / 2.22 : avgPace * 10));
  const benchmarkDistMeters = 10000;

  if (benchmarkTime > 0) {
    const velocityMPerMin = benchmarkDistMeters / (benchmarkTime / 60);
    const durationMin = benchmarkTime / 60;
    const vo2Cost = -4.60 + 0.182258 * velocityMPerMin + 0.000104 * Math.pow(velocityMPerMin, 2);
    const pctVo2 =
      0.8 +
      0.1894393 * Math.exp(-0.012778 * durationMin) +
      0.2989558 * Math.exp(-0.1932605 * durationMin);
    calculatedVdot = parseFloat((vo2Cost / pctVo2).toFixed(1));
  }

  // Cálculo individualizado do expoente de fadiga de Riegel 'b'
  // Calibrado pelo histórico recente de 24 semanas
  let fatigueExp = 1.07;
  if (best5kTime && best10kTime) {
    const empiricalB = Math.log(best10kTime / best5kTime) / Math.log(10 / 5);
    if (empiricalB >= 1.03 && empiricalB <= 1.15) {
      fatigueExp = empiricalB;
    }
  }

  // Ajuste do expoente baseado no volume semanal e rodagem longa do ciclo
  if (avgWeeklyKm < 35 || longestRunKm < 18) {
    fatigueExp += 0.02; // maior penalidade de fadiga para distâncias maiores
  } else if (avgWeeklyKm > 65 && longestRunKm >= 28) {
    fatigueExp = Math.max(1.05, fatigueExp - 0.015); // alta resistência aeróbica
  }

  // Aerobic Base Score (0-100) ponderando volume, maior rodagem e consistência semanal em 24 semanas
  const volumeScore = Math.min(50, (avgWeeklyKm / 70) * 50);
  const longRunScore = Math.min(30, (longestRunKm / 32) * 30);
  const consistencyScore = Math.min(20, (activeWeeksCount / WEEKS_CYCLE) * 20);
  const aerobicBaseScore = Math.round(volumeScore + longRunScore + consistencyScore);

  // Análise de tendência das últimas 4 semanas vs anteriores no ciclo
  let formTrend: "building" | "peaked" | "maintaining" | "declining" = "maintaining";
  if (runs.length >= 8) {
    const recent4Pace = runs.slice(0, 4).reduce((acc, r) => acc + r.moving_time / (r.distance / 1000), 0) / 4;
    const older4Pace = runs.slice(4, 8).reduce((acc, r) => acc + r.moving_time / (r.distance / 1000), 0) / 4;
    if (recent4Pace < older4Pace * 0.97) formTrend = "building";
    else if (recent4Pace > older4Pace * 1.03) formTrend = "declining";
    else formTrend = "peaked";
  }

  return {
    totalRunsAnalyzed: runs.length,
    weeksAnalyzed: WEEKS_CYCLE,
    activeWeeksCount,
    totalDistanceKm: totalDistKm,
    avgWeeklyDistanceKm: avgWeeklyKm,
    longestRunKm: longestRunKm,
    avgPaceSecKm: Math.round(avgPace),
    best5kTimeSec: best5kTime ? Math.round(best5kTime) : undefined,
    best10kTimeSec: best10kTime ? Math.round(best10kTime) : undefined,
    bestHalfTimeSec: bestHalfTime ? Math.round(bestHalfTime) : undefined,
    bestFullTimeSec: bestFullTime ? Math.round(bestFullTime) : undefined,
    estimatedVdot: calculatedVdot,
    fatigueExponent: parseFloat(fatigueExp.toFixed(3)),
    aerobicBaseScore,
    avgHeartRate: hrCount > 0 ? Math.round(totalHr / hrCount) : undefined,
    recentFormTrend: formTrend,
  };
}

/**
 * Prediz o tempo base plano (sem altimetria ou clima) usando o modelo Riegel calibrado pelo atleta.
 */
export function predictFlatBaseTimeSec(
  metrics: AthleteFitnessMetrics,
  targetDistanceKm: number
): number {
  // Encontra a melhor âncora de referência
  let anchorDistKm = 10;
  let anchorTimeSec = metrics.best10kTimeSec || (metrics.best5kTimeSec ? metrics.best5kTimeSec * 2.08 : metrics.avgPaceSecKm * 10);

  if (targetDistanceKm > 25 && metrics.bestHalfTimeSec) {
    anchorDistKm = 21.0975;
    anchorTimeSec = metrics.bestHalfTimeSec;
  } else if (metrics.best5kTimeSec && !metrics.best10kTimeSec) {
    anchorDistKm = 5;
    anchorTimeSec = metrics.best5kTimeSec;
  }

  // Pete Riegel: T2 = T1 * (D2 / D1)^b
  let b = metrics.fatigueExponent;

  // Se o alvo for Maratona (>35km) e o corredor nunca fez rodagem longa > 26km,
  // aplica penalidade pelo esgotamento de glicogênio muscular ("muro")
  if (targetDistanceKm >= 38 && metrics.longestRunKm < 28) {
    const deficitKm = 28 - metrics.longestRunKm;
    b += deficitKm * 0.004; // Adiciona exponencial de fadiga gradual
  }

  const predictedSec = anchorTimeSec * Math.pow(targetDistanceKm / anchorDistKm, b);
  return Math.round(predictedSec);
}

/**
 * Gera o Plano Nutricional e de Hidratação personalizado
 */
export function generateNutritionPlan(
  raceDurationSec: number,
  targetDistanceKm: number,
  weather: WeatherData
): NutritionPlan {
  const durationHours = raceDurationSec / 3600;

  // Taxa de sudorese estimada (L/h)
  let sweatRateLPerHour = 0.7;
  if (weather.temperatureC > 20) sweatRateLPerHour += (weather.temperatureC - 20) * 0.04;
  if (weather.dewPointC > 18) sweatRateLPerHour += 0.2;

  const fluidMlPerHour = Math.min(900, Math.round(sweatRateLPerHour * 800)); // Reposição de 80% das perdas
  const sodiumMgPerHour = weather.temperatureC > 22 ? 650 : 450;

  // Necessidade de carboidratos
  let carbsGramsPerHour = 30;
  if (targetDistanceKm > 15 && targetDistanceKm <= 25) {
    carbsGramsPerHour = 45;
  } else if (targetDistanceKm > 25) {
    carbsGramsPerHour = 60; // 60g a 75g/h para maratonas
  }

  const totalGels = Math.max(0, Math.floor((durationHours - 0.4) * (carbsGramsPerHour / 25)));

  // Distribuição dos géis por quilometragem
  const gelKilometers: number[] = [];
  if (totalGels > 0 && targetDistanceKm >= 10) {
    const intervalKm = Math.floor(targetDistanceKm / (totalGels + 1));
    for (let i = 1; i <= totalGels; i++) {
      gelKilometers.push(i * intervalKm);
    }
  }

  const recommendations: string[] = [];
  recommendations.push(`Hidratação: Beber aproximadamente ${fluidMlPerHour} ml de água/isotônico por hora (150ml a cada posto).`);
  if (totalGels > 0) {
    recommendations.push(`Carboidratos: Consumir 1 gel (${Math.round(25)}g carboidrato) aproximadamente a cada 35-45 min (sugestão: KMs ${gelKilometers.join(", ")}).`);
  }
  if (weather.temperatureC >= 22 || weather.dewPointC >= 18) {
    recommendations.push(`Sódio/Eletrólitos: Devido ao calor (${weather.temperatureC}°C, orvalho ${weather.dewPointC}°C), suplementar cápsula de sal a cada hora.`);
  }

  return {
    fluidMlPerHour,
    sodiumMgPerHour,
    carbsGramsPerHour,
    gelCount: totalGels,
    gelKilometers,
    recommendations,
  };
}

/**
 * MOTOR PRINCIPAL: Executa a fusão completa entre Dados do Atleta, Topografia GPX e Clima
 */
export function runRacePrediction(
  metrics: AthleteFitnessMetrics,
  gpx: GpxAnalysis,
  weather: WeatherData,
  strategy: "even-effort" | "even-pace" | "negative-split" = "even-effort"
): PredictionResult {
  const targetDistKm = gpx.totalDistanceKm;

  // 1. Tempo base plano em condições ideais (10°C, sem altimetria)
  const baselineFlatTimeSec = predictFlatBaseTimeSec(metrics, targetDistKm);
  const baselineFlatPaceSecKm = baselineFlatTimeSec / targetDistKm;

  // 2. Fator climático global (calor e umidade)
  const weatherMult = 1 + weather.weatherPenaltyPercent / 100;

  // 3. Fator de altitude do percurso (> 1000m perde ~1% VO2max por 100m)
  let altitudePenaltySec = 0;
  if (gpx.minElevationMeters > 900) {
    const avgElev = (gpx.minElevationMeters + gpx.maxElevationMeters) / 2;
    if (avgElev > 1000) {
      const hypoxiaLossPct = ((avgElev - 1000) / 100) * 0.008;
      altitudePenaltySec = Math.round(baselineFlatTimeSec * hypoxiaLossPct);
    }
  }

  // 4. Cálculo Km a Km (Topografia Minetti + Vento individual + Estratégia)
  const splits: KmSplit[] = [];
  let cumulativeTimeSec = 0;
  let totalWindAdjustmentSec = 0;

  const totalSplits = gpx.splits.length;
  const halfSplitIndex = Math.floor(totalSplits / 2);

  for (let idx = 0; idx < totalSplits; idx++) {
    const baseSplit = gpx.splits[idx];
    const kmDistKm = baseSplit.distanceMeters / 1000;

    // Fator de estratégia de ritmo
    let strategyFactor = 1.0;
    if (strategy === "negative-split") {
      // 1ª metade 2% mais lenta, 2ª metade 2% mais rápida
      strategyFactor = idx < halfSplitIndex ? 1.02 : 0.98;
    }

    // Ritmo plano ajustado pelo clima e estratégia
    let splitPace = baselineFlatPaceSecKm * weatherMult * strategyFactor;

    // Ajuste topográfico
    if (strategy === "even-effort") {
      // Ajuste Minetti completo: mantém esforço fisiológico estável
      const gradient = baseSplit.avgGradientPercent / 100;
      splitPace = adjustPaceForGradient(splitPace, gradient);
    } else {
      // Em ritmo uniforme rígido (even-pace), o atleta ainda sofre penalidade física em subidas
      const minettiRatio = baseSplit.minettiCostRatio;
      splitPace = splitPace * (1 + (minettiRatio - 1) * 0.7);
    }

    // Componente de Vento (Vetor de azimute vs direção do vento)
    let windAdjustment = 0;
    let headwindKmh = 0;

    if (weather.windSpeedKmh > 5 && baseSplit.bearingDeg !== undefined) {
      // Direção do vento do Open-Meteo é de onde o vento sopra (0° = sopra de Norte para Sul)
      // O atleta corre na direção baseSplit.bearingDeg
      const angleDiffRad = ((baseSplit.bearingDeg - weather.windDirectionDeg) * Math.PI) / 180;
      headwindKmh = parseFloat((-weather.windSpeedKmh * Math.cos(angleDiffRad)).toFixed(1));

      // Vento contra (headwindKmh > 0) penaliza mais do que vento a favor ajuda (headwindKmh < 0)
      if (headwindKmh > 0) {
        windAdjustment = (headwindKmh / 10) * 1.5 * kmDistKm; // +1.5s por cada 10 km/h de vento contra
      } else {
        windAdjustment = (headwindKmh / 10) * 0.7 * kmDistKm; // -0.7s por cada 10 km/h de vento favorável
      }
    }

    totalWindAdjustmentSec += windAdjustment;
    splitPace = Math.max(160, splitPace + windAdjustment / kmDistKm); // limite físico mínimo 2:40/km

    const splitDuration = Math.round(splitPace * kmDistKm);
    cumulativeTimeSec += splitDuration;

    splits.push({
      ...baseSplit,
      targetPaceSecKm: Math.round(splitPace),
      targetPaceFormatted: formatPaceSecKm(splitPace),
      splitDurationSec: splitDuration,
      cumulativeTimeSec: cumulativeTimeSec,
      cumulativeTimeFormatted: formatTimeSec(cumulativeTimeSec),
      headwindKmh,
      windAdjustmentSec: parseFloat(windAdjustment.toFixed(1)),
    });
  }

  const finalPredictedTimeSec = cumulativeTimeSec + altitudePenaltySec;
  const avgPredictedPaceSecKm = finalPredictedTimeSec / targetDistKm;

  // Decomposição dos impactos em segundos para exibição no card
  const weatherPenaltySec = Math.round(baselineFlatTimeSec * (weather.weatherPenaltyPercent / 100));
  const courseElevationPenaltySec = Math.max(0, Math.round(finalPredictedTimeSec - baselineFlatTimeSec - weatherPenaltySec - totalWindAdjustmentSec - altitudePenaltySec));

  // Intervalo de Confiança (Otimista -2.5% a Conservador +3.5%)
  const optimisticSec = Math.round(finalPredictedTimeSec * 0.975);
  const conservativeSec = Math.round(finalPredictedTimeSec * 1.035);

  const nutritionPlan = generateNutritionPlan(finalPredictedTimeSec, targetDistKm, weather);

  return {
    predictedTimeSec: finalPredictedTimeSec,
    predictedTimeFormatted: formatTimeSec(finalPredictedTimeSec),
    confidenceRange: {
      optimisticTimeSec: optimisticSec,
      optimisticFormatted: formatTimeSec(optimisticSec),
      optimisticPaceFormatted: formatPaceSecKm(optimisticSec / targetDistKm),
      conservativeTimeSec: conservativeSec,
      conservativeFormatted: formatTimeSec(conservativeSec),
      conservativePaceFormatted: formatPaceSecKm(conservativeSec / targetDistKm),
    },
    averagePaceSecKm: Math.round(avgPredictedPaceSecKm),
    averagePaceFormatted: formatPaceSecKm(avgPredictedPaceSecKm),
    baselineFlatTimeSec,
    courseElevationPenaltySec,
    weatherPenaltySec,
    windPenaltySec: Math.round(totalWindAdjustmentSec),
    altitudePenaltySec,
    pacingStrategy: strategy,
    splits,
    nutritionPlan,
  };
}
