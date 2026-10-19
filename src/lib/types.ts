export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  start_date: string;
  start_date_local: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  has_heartrate?: boolean;
  suffer_score?: number;
}

export interface AthleteFitnessMetrics {
  totalRunsAnalyzed: number;
  weeksAnalyzed: number;
  activeWeeksCount?: number;
  totalDistanceKm: number;
  avgWeeklyDistanceKm: number;
  longestRunKm: number;
  avgPaceSecKm: number;
  best5kTimeSec?: number;
  best10kTimeSec?: number;
  bestHalfTimeSec?: number;
  bestFullTimeSec?: number;
  estimatedVdot: number;
  fatigueExponent: number; // Pete Riegel exponent 'b', typically 1.05 - 1.12
  aerobicBaseScore: number; // 0 - 100
  avgHeartRate?: number;
  recentFormTrend: "building" | "peaked" | "maintaining" | "declining";
}

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number;
  distFromStartMeters: number;
}

export interface KmSplit {
  kmNumber: number;
  distanceMeters: number;
  startElevation: number;
  endElevation: number;
  elevationChangeMeters: number;
  avgGradientPercent: number;
  slopeCategory: "flat" | "mild-climb" | "steep-climb" | "mild-descent" | "steep-descent";
  minettiCostRatio: number;
  targetPaceSecKm: number;
  targetPaceFormatted: string;
  splitDurationSec: number;
  cumulativeTimeSec: number;
  cumulativeTimeFormatted: string;
  bearingDeg?: number;
  headwindKmh?: number;
  windAdjustmentSec?: number;
}

export interface GpxAnalysis {
  name: string;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  minElevationMeters: number;
  maxElevationMeters: number;
  avgGradientPercent: number;
  maxGradientPercent: number;
  startCoords: { lat: number; lon: number };
  points: GpxPoint[];
  splits: KmSplit[];
}

export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface WeatherData {
  locationName?: string;
  raceDateTime: string;
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidity: number;
  dewPointC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipitationProb: number;
  weatherCode: number;
  weatherDescription: string;
  heatStressLevel: "ideal" | "moderate" | "high" | "severe";
  weatherPenaltyPercent: number;
  isForecast: boolean;
}

export interface NutritionPlan {
  fluidMlPerHour: number;
  sodiumMgPerHour: number;
  carbsGramsPerHour: number;
  gelCount: number;
  gelKilometers: number[];
  recommendations: string[];
}

export interface PredictionResult {
  predictedTimeSec: number;
  predictedTimeFormatted: string;
  confidenceRange: {
    optimisticTimeSec: number;
    optimisticFormatted: string;
    optimisticPaceFormatted: string;
    conservativeTimeSec: number;
    conservativeFormatted: string;
    conservativePaceFormatted: string;
  };
  averagePaceSecKm: number;
  averagePaceFormatted: string;
  baselineFlatTimeSec: number;
  courseElevationPenaltySec: number;
  weatherPenaltySec: number;
  windPenaltySec: number;
  altitudePenaltySec: number;
  pacingStrategy: "even-effort" | "even-pace" | "negative-split";
  splits: KmSplit[];
  nutritionPlan: NutritionPlan;
}

export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  profile?: string;
  profile_medium?: string;
  city?: string;
  country?: string;
}

export interface StravaAuthState {
  connected: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  athlete?: StravaAthlete | null;
}

export interface StravaRoute {
  id: string;
  name: string;
  distanceMeters: number;
  distanceKm: number;
  elevationGainMeters: number;
  starred: boolean;
  type: number;
  subType: number;
  summaryPolyline?: string;
  createdAt?: string;
  estimatedMovingTimeSec?: number;
}
