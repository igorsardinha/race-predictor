"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sun,
  MapPin,
  Search,
  Navigation,
  X,
} from "lucide-react";
import { CitySearchResult, WeatherData } from "@/lib/types";
import { InfoTooltip } from "./InfoTooltip";

interface WeatherCardProps {
  weather: WeatherData;
  isLoadingWeather: boolean;
  onUpdateDateTime: (dateTimeIso: string) => void;
  onSelectLocation: (lat: number, lon: number, locationName: string) => void;
  onResetToGpxLocation?: () => void;
  hasGpxCoords?: boolean;
}

const POPULAR_CITIES = [
  { name: "Rio de Janeiro", state: "RJ", lat: -22.9068, lon: -43.1729 },
  { name: "São Paulo", state: "SP", lat: -23.5505, lon: -46.6333 },
  { name: "Porto Alegre", state: "RS", lat: -30.0346, lon: -51.2177 },
  { name: "Curitiba", state: "PR", lat: -25.4284, lon: -49.2733 },
  { name: "Florianópolis", state: "SC", lat: -27.5954, lon: -48.548 },
  { name: "Belo Horizonte", state: "MG", lat: -19.9167, lon: -43.9345 },
  { name: "Buenos Aires", state: "ARG", lat: -34.6037, lon: -58.3816 },
  { name: "Berlim", state: "ALE", lat: 52.52, lon: 13.405 },
];

export function WeatherCard({
  weather,
  isLoadingWeather,
  onUpdateDateTime,
  onSelectLocation,
  onResetToGpxLocation,
  hasGpxCoords,
}: WeatherCardProps) {
  const [dateStr, setDateStr] = useState(weather.raceDateTime.split("T")[0]);
  const [timeStr, setTimeStr] = useState(
    weather.raceDateTime.split("T")[1]?.substring(0, 5) || "06:30"
  );

  // City Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const res = await fetch(`/api/weather/cities?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = (city: CitySearchResult) => {
    const fullName = `${city.name}${city.admin1 ? `, ${city.admin1}` : ""}${
      city.country ? ` (${city.country})` : ""
    }`;
    setSearchQuery("");
    setShowDropdown(false);
    onSelectLocation(city.latitude, city.longitude, fullName);
  };

  const handleApplyDateTime = () => {
    const combined = `${dateStr}T${timeStr}:00`;
    onUpdateDateTime(combined);
  };

  const stressColorMap = {
    ideal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    moderate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    severe: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  const stressTextMap = {
    ideal: "Condição Térmica Ideal (8°C a 12°C)",
    moderate: "Desconforto Moderado",
    high: "Estresse Térmico Elevado",
    severe: "Risco de Exaustão Térmica",
  };

  const stressTextMapShort = {
    ideal: "Térmica Ideal",
    moderate: "Desconforto",
    high: "Estresse Alto",
    severe: "Exaustão",
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <CloudSun className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm font-bold text-white truncate">
                Condições Meteorológicas
              </h3>
              <InfoTooltip
                title="Modelo de Impacto Fisiológico do Clima"
                formula="T_dew = b·α / (a - α); ΔPace% = f(T, T_dew, v_vento)"
                explanation="Modelagem da perda de velocidade em função do calor e ponto de orvalho, que limitam o resfriamento evaporativo corporal durante esforço aeróbico."
                bibliography="Ely, M. R. et al. (2007); Montain, S. J. et al. (2007); Alduchov, O. A. & Eskridge, R. E. (1996)."
              />
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Previsão horária de superfície
            </p>
          </div>
        </div>

        {/* Heat Stress Badge */}
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold border ${
            stressColorMap[weather.heatStressLevel]
          }`}
        >
          {weather.heatStressLevel === "ideal" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline">{stressTextMap[weather.heatStressLevel]}</span>
          <span className="sm:hidden">{stressTextMapShort[weather.heatStressLevel]}</span>
        </div>
      </div>

      {/* City / Location Picker Section */}
      <div className="mt-4 rounded-xl bg-gray-950/70 p-3 border border-gray-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold min-w-0 flex-1">
            <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="shrink-0">Local:</span>
            <span className="text-orange-400 font-bold truncate">
              {weather.locationName || "Largada do GPX"}
            </span>
          </div>

          {hasGpxCoords && onResetToGpxLocation && (
            <button
              onClick={onResetToGpxLocation}
              className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition"
            >
              <Navigation className="h-3 w-3" />
              Usar GPX
            </button>
          )}
        </div>

        {/* City Autocomplete Search Bar */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Pesquisar cidade..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-9 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-gray-400">
                  Pesquisando...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-gray-800/80">
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                        <span className="font-semibold truncate">{city.name}</span>
                        {city.admin1 && (
                          <span className="text-gray-400 text-xs truncate">
                            • {city.admin1}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-mono shrink-0 ml-2">
                        {city.country}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-gray-500">
                  Nenhuma cidade encontrada.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick popular city chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-gray-400 font-semibold">Cidades:</span>
          {POPULAR_CITIES.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelectLocation(c.lat, c.lon, `${c.name}, ${c.state}`)}
              className="rounded-lg bg-gray-900 hover:bg-gray-800 px-2.5 py-1 text-xs text-gray-300 hover:text-white border border-gray-800 transition"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time Picker */}
      <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 rounded-xl bg-gray-950/60 p-3.5 border border-gray-800">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-400 shrink-0">Data:</span>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-400 shrink-0">Hora:</span>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleApplyDateTime}
          disabled={isLoadingWeather}
          className="col-span-2 sm:col-span-1 sm:ml-auto w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition border border-gray-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoadingWeather ? "animate-spin text-orange-400" : ""}`}
          />
          Atualizar Previsão
        </button>
      </div>

      {/* Weather Metrics Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        {/* Temperatura */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-300 gap-1">
            <span className="text-xs sm:text-sm font-bold truncate">Temperatura</span>
            <InfoTooltip
              title="Temperatura do Ar e Faixa Ótima"
              formula="Faixa Ótima: 8°C - 12°C; Penalidade: ~0.45% por °C acima de 12°C"
              explanation="Estudos em milhares de maratonistas mostram que cada grau adicional acima de 12°C gera acúmulo térmico central e desvio de fluxo sanguíneo para a pele."
              bibliography="Ely, M. R. et al. (2007). Impact of weather on marathon running performance. MSSE."
              align="left"
            />
          </div>
          <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white font-mono truncate">
            {weather.temperatureC}°C
          </p>
          <span className="text-xs text-gray-400 font-mono block truncate mt-1">
            Sensação: {weather.apparentTemperatureC}°C
          </span>
        </div>

        {/* Ponto de Orvalho (Dew Point) */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-300 gap-1">
            <span className="text-xs sm:text-sm font-bold truncate">Ponto de Orvalho</span>
            <InfoTooltip
              title="Equação de Magnus-Tetens (Ponto de Orvalho)"
              formula="α = (17.27·T)/(237.7+T) + ln(RH/100); T_dew = (237.7·α)/(17.27 - α)"
              explanation="Mede a pressão absoluta de vapor de água. T_dew > 16°C prejudica a taxa de evaporação do suor, e T_dew > 20°C impõe forte estresse cardiovascular."
              bibliography="Alduchov, O. A. & Eskridge, R. E. (1996). Improved Magnus form approximation. J Appl Meteorol."
              align="center"
            />
          </div>
          <p className="mt-1.5 text-2xl sm:text-3xl font-black text-cyan-400 font-mono truncate">
            {weather.dewPointC}°C
          </p>
          <span className="text-xs text-gray-400 font-mono block truncate mt-1">
            Umidade: {weather.relativeHumidity}%
          </span>
        </div>

        {/* Vento */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-300 gap-1">
            <span className="text-xs sm:text-sm font-bold truncate">Vento</span>
            <InfoTooltip
              title="Velocidade e Azimute do Vento"
              formula="v_vento (km/h) a 10m de altitude; Rumo angular θ (0° a 360°)"
              explanation="Determina o vetor relativo em relação ao sentido de deslocamento do percurso GPX."
              bibliography="Pugh, L. G. (1970). Oxygen intake in track and treadmill running with air resistance."
              align="center"
            />
          </div>
          <p className="mt-1.5 text-2xl sm:text-3xl font-black text-white font-mono truncate">
            {weather.windSpeedKmh}{" "}
            <span className="text-xs font-semibold text-gray-400">km/h</span>
          </p>
          <span className="text-xs text-gray-400 font-mono block truncate mt-1">
            {weather.windDirectionDeg}° ({weather.weatherDescription})
          </span>
        </div>

        {/* Penalidade Fisiológica */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-300 gap-1">
            <span className="text-xs sm:text-sm font-bold truncate">Penalidade Térmica</span>
            <InfoTooltip
              title="Ajuste Percentual no Ritmo (Calor e Umidade)"
              formula="ΔPace% = [0.45% × max(0, T - 12°C)] + f(T_dew)"
              explanation="Penalidade percentual aplicada sobre o ritmo aeróbico plano para compensar a dissipação de calor ineficiente."
              bibliography="Montain, S. J. et al. (2007); Ely, M. R. et al. (2007)."
              align="right"
            />
          </div>
          <p className="mt-1.5 text-2xl sm:text-3xl font-black text-orange-400 font-mono truncate">
            +{weather.weatherPenaltyPercent}%
          </p>
          <span className="text-xs text-gray-400 block truncate mt-1">
            Ajuste no ritmo de prova
          </span>
        </div>
      </div>
    </div>
  );
}
