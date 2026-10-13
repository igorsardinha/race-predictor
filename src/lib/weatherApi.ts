import { CitySearchResult, WeatherData } from "./types";

/**
 * Mapeamento de códigos de tempo da OMM (Organização Meteorológica Mundial).
 */
export function getWeatherDescription(code: number): string {
  if (code === 0) return "Céu Limpo";
  if (code === 1) return "Predomínio de Sol";
  if (code === 2) return "Parcialmente Nublado";
  if (code === 3) return "Encoberto";
  if ([45, 48].includes(code)) return "Nevoeiro";
  if ([51, 53, 55].includes(code)) return "Garoa Leve";
  if ([61, 63, 65].includes(code)) return "Chuva";
  if ([71, 73, 75].includes(code)) return "Neve";
  if ([80, 81, 82].includes(code)) return "Pancadas de Chuva";
  if ([95, 96, 99].includes(code)) return "Tempestade com Trovões";
  return "Condições Normais";
}

/**
 * Calcula o ponto de orvalho (Dew Point) a partir da temperatura (°C) e umidade relativa (%)
 * utilizando a equação de Magnus-Tetens.
 */
export function calculateDewPoint(tempC: number, humidityPercent: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(Math.max(1, humidityPercent) / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return parseFloat(dewPoint.toFixed(1));
}

/**
 * Calcula o impacto fisiológico do calor e umidade na corrida (Penalidade percentual no ritmo).
 * Baseado no consenso de Ely et al. (2007) e Montain et al.
 */
export function calculateWeatherPenaltyPercent(tempC: number, dewPointC: number): {
  penaltyPercent: number;
  stressLevel: "ideal" | "moderate" | "high" | "severe";
} {
  let penalty = 0;

  // Temperatura ideal para corrida de longa distância: 8°C a 12°C
  if (tempC > 12) {
    // ~0.45% por grau acima de 12°C
    penalty += (tempC - 12) * 0.45;
  } else if (tempC < 4) {
    // Frio severo aumenta rigidez muscular e gasto térmico
    penalty += (4 - tempC) * 0.25;
  }

  // Ponto de orvalho (dificuldade de evaporação do suor)
  if (dewPointC >= 22) {
    penalty += 8.5; // Estresse térmico extremo
  } else if (dewPointC >= 19) {
    penalty += 5.0; // Umidade abafada severa
  } else if (dewPointC >= 16) {
    penalty += 2.8; // Desconforto moderado
  } else if (dewPointC >= 13) {
    penalty += 1.0;
  }

  // Clampa a penalidade máxima para evitar distorções irreais
  const finalPenalty = Math.max(0, Math.min(22, penalty));

  let stressLevel: "ideal" | "moderate" | "high" | "severe" = "ideal";
  if (finalPenalty >= 8) {
    stressLevel = "severe";
  } else if (finalPenalty >= 4.5) {
    stressLevel = "high";
  } else if (finalPenalty >= 1.5) {
    stressLevel = "moderate";
  }

  return {
    penaltyPercent: parseFloat(finalPenalty.toFixed(1)),
    stressLevel,
  };
}

/**
 * Busca cidades pelo nome usando a API de Geocoding aberta do Open-Meteo.
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=8&language=pt&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || "",
      admin1: item.admin1 || "",
    }));
  } catch (err) {
    console.error("Erro ao buscar cidades:", err);
    return [];
  }
}

/**
 * Busca dados meteorológicos da API gratuita Open-Meteo para a coordenada e data/hora.
 */
export async function fetchWeatherData(
  lat: number,
  lon: number,
  raceDateTimeStr: string, // Formato ISO ou YYYY-MM-DDTHH:mm
  locationName?: string
): Promise<WeatherData> {
  const targetDate = new Date(raceDateTimeStr);
  const targetHour = targetDate.getHours();
  const dateFormatted = raceDateTimeStr.split("T")[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto&start_date=${dateFormatted}&end_date=${dateFormatted}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo respondeu com status ${res.status}`);
    }

    const data = await res.json();
    const hourly = data.hourly;

    if (!hourly || !hourly.time || hourly.time.length === 0) {
      throw new Error("Sem dados horários disponíveis para a data especificada.");
    }

    // Encontra o índice da hora mais próxima da largada
    const hourIndex = Math.min(Math.max(0, targetHour), hourly.time.length - 1);

    const tempC = hourly.temperature_2m[hourIndex] ?? 20;
    const humidity = hourly.relative_humidity_2m[hourIndex] ?? 65;
    const dewPoint = hourly.dew_point_2m ? hourly.dew_point_2m[hourIndex] : calculateDewPoint(tempC, humidity);
    const apparentTemp = hourly.apparent_temperature ? hourly.apparent_temperature[hourIndex] : tempC;
    const windSpeed = hourly.wind_speed_10m ? hourly.wind_speed_10m[hourIndex] : 10;
    const windDir = hourly.wind_direction_10m ? hourly.wind_direction_10m[hourIndex] : 0;
    const precipProb = hourly.precipitation_probability ? hourly.precipitation_probability[hourIndex] : 0;
    const code = hourly.weather_code ? hourly.weather_code[hourIndex] : 0;

    const { penaltyPercent, stressLevel } = calculateWeatherPenaltyPercent(tempC, dewPoint);

    return {
      locationName,
      raceDateTime: raceDateTimeStr,
      temperatureC: parseFloat(tempC.toFixed(1)),
      apparentTemperatureC: parseFloat(apparentTemp.toFixed(1)),
      relativeHumidity: Math.round(humidity),
      dewPointC: parseFloat(dewPoint.toFixed(1)),
      windSpeedKmh: parseFloat(windSpeed.toFixed(1)),
      windDirectionDeg: Math.round(windDir),
      precipitationProb: Math.round(precipProb),
      weatherCode: code,
      weatherDescription: getWeatherDescription(code),
      heatStressLevel: stressLevel,
      weatherPenaltyPercent: penaltyPercent,
      isForecast: true,
    };
  } catch (error) {
    console.warn("Falha ao buscar previsão do tempo (usando fallback sazonal/padrão):", error);
    // Retorna estimativa realista padrão de manhã amena
    const defaultTemp = 20;
    const defaultHumidity = 70;
    const defaultDew = calculateDewPoint(defaultTemp, defaultHumidity);
    const { penaltyPercent, stressLevel } = calculateWeatherPenaltyPercent(defaultTemp, defaultDew);

    return {
      locationName,
      raceDateTime: raceDateTimeStr,
      temperatureC: defaultTemp,
      apparentTemperatureC: 21,
      relativeHumidity: defaultHumidity,
      dewPointC: defaultDew,
      windSpeedKmh: 12,
      windDirectionDeg: 90,
      precipitationProb: 15,
      weatherCode: 1,
      weatherDescription: "Condições Típicas (Estimativa)",
      heatStressLevel: stressLevel,
      weatherPenaltyPercent: penaltyPercent,
      isForecast: false,
    };
  }
}

/**
 * Retorna condições climáticas ideais/favoráveis (10°C, baixa umidade, sem vento).
 */
export function createFavorableWeather(): WeatherData {
  return {
    locationName: "Condição Favorável (10°C, Sem Vento)",
    raceDateTime: new Date().toISOString().split("T")[0] + "T07:00:00",
    temperatureC: 10,
    apparentTemperatureC: 10,
    relativeHumidity: 60,
    dewPointC: 3.5,
    windSpeedKmh: 0,
    windDirectionDeg: 0,
    precipitationProb: 0,
    weatherCode: 0,
    weatherDescription: "Clima Favorável",
    heatStressLevel: "ideal",
    weatherPenaltyPercent: 0,
    isForecast: false,
  };
}
