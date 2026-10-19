"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { AthleteProfileCard } from "@/components/AthleteProfileCard";
import { ActivitiesListModal } from "@/components/ActivitiesListModal";
import { GpxUploader } from "@/components/GpxUploader";
import { ElevationChart } from "@/components/ElevationChart";
import { RouteMap } from "@/components/RouteMap";
import { WeatherCard } from "@/components/WeatherCard";
import { PredictionResult } from "@/components/PredictionResult";
import { PaceStrategyTable } from "@/components/PaceStrategyTable";
import { PaceBandCard } from "@/components/PaceBandCard";
import { StravaRoutesModal } from "@/components/StravaRoutesModal";
import { ConnectWithStravaButton } from "@/components/ConnectWithStravaButton";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

import {
  AthleteFitnessMetrics,
  GpxAnalysis,
  PredictionResult as PredictionResultType,
  StravaActivity,
  StravaAuthState,
  WeatherData,
} from "@/lib/types";
import {
  analyzeStravaActivities,
  runRacePrediction,
} from "@/lib/predictorEngine";
import { createFlatCourse } from "@/lib/gpxParser";
import { createFavorableWeather, fetchWeatherData } from "@/lib/weatherApi";
import { AlertCircle, Activity } from "lucide-react";

export default function RacePredictorPage() {
  // 1. Strava Auth & Activities State (Inicia limpo, sem nenhum dado fictício)
  const [authState, setAuthState] = useState<StravaAuthState>({
    connected: false,
    accessToken: "",
    athlete: null,
  });
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. Modais
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isSplitsModalOpen, setIsSplitsModalOpen] = useState(false);
  const [isPaceBandModalOpen, setIsPaceBandModalOpen] = useState(false);
  const [isStravaRoutesModalOpen, setIsStravaRoutesModalOpen] = useState(false);

  // 3. Percurso State: Padrão é Percurso Plano (21.1 km) sem elevação
  const [selectedFlatDistanceKm, setSelectedFlatDistanceKm] = useState<number>(21.0975);
  const [isCustomGpx, setIsCustomGpx] = useState<boolean>(false);
  const [currentGpx, setCurrentGpx] = useState<GpxAnalysis>(() =>
    createFlatCourse(21.0975, "Percurso Plano (Padrão)")
  );

  // 4. Clima State: Padrão é Clima Favorável (10°C, baixa umidade, sem vento)
  const [weather, setWeather] = useState<WeatherData>(() => createFavorableWeather());
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Coordenadas ativas da meteorologia
  const [weatherCoords, setWeatherCoords] = useState<{ lat: number; lon: number }>({
    lat: -22.9068,
    lon: -43.1729,
  });

  // 5. Estratégia de Ritmo
  const [strategy, setStrategy] = useState<"even-effort" | "even-pace" | "negative-split">("even-effort");

  // Renova o token OAuth expirado do Strava via refresh_token
  const refreshStravaToken = async (rToken: string): Promise<StravaAuthState | null> => {
    try {
      const res = await fetch("/api/strava/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantType: "refresh_token",
          refreshToken: rToken,
        }),
      });
      const data = await res.json();
      if (data.accessToken) {
        const newAuth: StravaAuthState = {
          connected: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || rToken,
          expiresAt: data.expiresAt,
          athlete: data.athlete || authState.athlete,
        };
        setAuthState(newAuth);
        localStorage.setItem("racepredictor_strava_auth", JSON.stringify(newAuth));
        return newAuth;
      }
    } catch {
      // falha silenciosa na tentativa de renovação
    }
    return null;
  };

  // Desconecta e limpa a sessão do Strava
  const handleDisconnectStrava = () => {
    setAuthState({
      connected: false,
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
      athlete: null,
    });
    setActivities([]);
    localStorage.removeItem("racepredictor_strava_auth");
    localStorage.removeItem("racepredictor_activities_cache");
    setErrorMessage(null);
  };

  // Verifica se há sessão salva do Strava no localStorage e trata retorno de OAuth (?code=...)
  useEffect(() => {
    const savedAuth = localStorage.getItem("racepredictor_strava_auth");
    const savedActivities = localStorage.getItem("racepredictor_activities_cache");

    if (savedAuth) {
      try {
        const parsed: StravaAuthState = JSON.parse(savedAuth);
        if (parsed.accessToken) {
          setAuthState(parsed);
          if (savedActivities) {
            setActivities(JSON.parse(savedActivities));
          }
          // Se o token estiver expirado (ou prestes a expirar em 5 min), renova silenciosamente
          if (parsed.refreshToken && parsed.expiresAt && Date.now() / 1000 >= parsed.expiresAt - 300) {
            refreshStravaToken(parsed.refreshToken).then((newAuth) => {
              if (newAuth && !savedActivities) {
                fetchActivitiesFromStrava(newAuth.accessToken, newAuth.refreshToken);
              }
            });
          } else if (!savedActivities) {
            fetchActivitiesFromStrava(parsed.accessToken, parsed.refreshToken);
          }
        }
      } catch {
        // ignore
      }
    }

    // Trata retorno de OAuth do Strava (?code=...)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        exchangeStravaCode(code);
      }
    }
  }, []);

  // Troca o código do Strava pelo Access Token
  const exchangeStravaCode = async (code: string) => {
    setIsLoadingRuns(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/strava/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.accessToken) {
        const auth: StravaAuthState = {
          connected: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          athlete: data.athlete,
        };
        setAuthState(auth);
        localStorage.setItem("racepredictor_strava_auth", JSON.stringify(auth));
        await fetchActivitiesFromStrava(data.accessToken, data.refreshToken);
      } else {
        setErrorMessage(data.error || "Erro ao conectar com sua conta do Strava.");
      }
    } catch {
      setErrorMessage("Falha de conexão ao autorizar Strava.");
    } finally {
      setIsLoadingRuns(false);
    }
  };

  // Baixa as corridas das últimas 24 semanas do Strava (com auto-renovação de token)
  const fetchActivitiesFromStrava = async (token?: string, rToken?: string) => {
    let activeToken = token || authState.accessToken;
    let activeRefreshToken = rToken || authState.refreshToken;

    // Se o token estiver expirado ou perto de expirar e houver refresh token, renova previamente
    if (
      activeRefreshToken &&
      authState.expiresAt &&
      Date.now() / 1000 >= authState.expiresAt - 300
    ) {
      const refreshed = await refreshStravaToken(activeRefreshToken);
      if (refreshed) {
        activeToken = refreshed.accessToken;
        activeRefreshToken = refreshed.refreshToken;
      }
    }

    setIsLoadingRuns(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/strava/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: activeToken,
          refreshToken: activeRefreshToken,
        }),
      });
      const data = await res.json();

      // Se a API renovou o token automaticamente:
      if (data.newAuth) {
        const updatedAuth: StravaAuthState = {
          ...authState,
          accessToken: data.newAuth.accessToken,
          refreshToken: data.newAuth.refreshToken,
          expiresAt: data.newAuth.expiresAt,
        };
        setAuthState(updatedAuth);
        localStorage.setItem("racepredictor_strava_auth", JSON.stringify(updatedAuth));
      }

      if (data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities);
        localStorage.setItem("racepredictor_activities_cache", JSON.stringify(data.activities));
      } else if (res.status === 401 || data.unauthorized) {
        // Tenta renovar pelo cliente e repetir uma vez
        if (activeRefreshToken) {
          const refreshed = await refreshStravaToken(activeRefreshToken);
          if (refreshed) {
            await fetchActivitiesFromStrava(refreshed.accessToken, refreshed.refreshToken);
            return;
          }
        }
        // Se não conseguiu renovar, desconecta e pede novo login
        handleDisconnectStrava();
        setErrorMessage("Sua sessão do Strava expirou. Por favor, conecte-se novamente.");
      } else {
        setErrorMessage(data.error || "Não foi possível carregar as corridas do Strava.");
      }
    } catch {
      setErrorMessage("Falha ao comunicar com a API do Strava.");
    } finally {
      setIsLoadingRuns(false);
    }
  };

  // Redireciona para o fluxo oficial de autorização do Strava
  const handleConnectStrava = async () => {
    try {
      const res = await fetch("/api/strava/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Erro ao gerar URL de autorização.");
      }
    } catch {
      setErrorMessage("Erro ao conectar com Strava.");
    }
  };

  // Altera a distância quando em modo de percurso plano
  const handleSelectFlatDistance = (km: number) => {
    setSelectedFlatDistanceKm(km);
    if (!isCustomGpx) {
      setCurrentGpx(createFlatCourse(km, `Percurso Plano (${km} km)`));
    }
  };

  // Quando o usuário envia um arquivo GPX real
  const handleGpxParsed = (gpx: GpxAnalysis) => {
    setIsCustomGpx(true);
    setCurrentGpx(gpx);
    setWeatherCoords(gpx.startCoords);
    // Busca previsão meteorológica real para o local e horário da largada
    fetchWeatherData(gpx.startCoords.lat, gpx.startCoords.lon, weather.raceDateTime, gpx.name)
      .then((data) => setWeather(data))
      .catch(() => {});
  };

  // Remove GPX e retorna ao padrão (Percurso Plano + Clima Favorável)
  const handleResetToFlat = () => {
    setIsCustomGpx(false);
    setCurrentGpx(createFlatCourse(selectedFlatDistanceKm, `Percurso Plano (${selectedFlatDistanceKm} km)`));
    setWeather(createFavorableWeather());
  };

  // Atualiza meteorologia quando a data ou coordenadas mudam
  const handleUpdateWeatherDateTime = async (dateTimeIso: string) => {
    setIsLoadingWeather(true);
    try {
      const data = await fetchWeatherData(
        weatherCoords.lat,
        weatherCoords.lon,
        dateTimeIso,
        weather.locationName
      );
      setWeather(data);
    } catch {
      // mantém anterior
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Seleciona uma nova cidade para cálculo do clima
  const handleSelectLocation = async (lat: number, lon: number, locationName: string) => {
    setWeatherCoords({ lat, lon });
    setIsLoadingWeather(true);
    try {
      const data = await fetchWeatherData(lat, lon, weather.raceDateTime, locationName);
      setWeather(data);
    } catch {
      // mantém anterior
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Reseta localização para a largada do GPX (se disponível)
  const handleResetToGpxLocation = async () => {
    if (!currentGpx || !isCustomGpx) return;
    const lat = currentGpx.startCoords.lat;
    const lon = currentGpx.startCoords.lon;
    const locationName = currentGpx.name;
    setWeatherCoords({ lat, lon });
    setIsLoadingWeather(true);
    try {
      const data = await fetchWeatherData(lat, lon, weather.raceDateTime, locationName);
      setWeather(data);
    } catch {
      // mantém anterior
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Cálculo das métricas fisiológicas do corredor a partir dos dados do Strava
  const athleteMetrics: AthleteFitnessMetrics = useMemo(() => {
    return analyzeStravaActivities(activities);
  }, [activities]);

  // Execução do Motor de Predição Científica
  const prediction: PredictionResultType = useMemo(() => {
    return runRacePrediction(athleteMetrics, currentGpx, weather, strategy);
  }, [athleteMetrics, currentGpx, weather, strategy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Barra de Navegação Superior */}
      <Navbar
        athlete={authState.athlete || null}
        isConnected={authState.connected}
        totalRunsCount={activities.length}
        isLoadingRuns={isLoadingRuns}
        onConnectStrava={handleConnectStrava}
        onRefreshRuns={() => fetchActivitiesFromStrava(authState.accessToken, authState.refreshToken)}
        onDisconnectStrava={handleDisconnectStrava}
      />

      {/* Alerta de erro */}
      {errorMessage && (
        <div className="mx-auto mt-4 max-w-7xl px-3 sm:px-6 w-full">
          <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full space-y-4 sm:space-y-6">
        {/* Banner se o Strava ainda não estiver conectado */}
        {!authState.connected && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-300">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-white block">
                Nenhuma conta do Strava conectada
              </span>
              <span className="text-gray-400 text-xs block mt-0.5">
                Conecte seu Strava oficial para baixar suas corridas das últimas 24 semanas e calibrar sua curva de fadiga individual.
              </span>
            </div>
            <ConnectWithStravaButton
              onClick={handleConnectStrava}
              size="default"
              className="w-full sm:w-auto"
            />
          </div>
        )}

        {/* 1. HERO PREDICTION CARD */}
        <PredictionResult
          prediction={prediction}
          currentStrategy={strategy}
          onChangeStrategy={setStrategy}
          onViewSplits={() => setIsSplitsModalOpen(true)}
          onViewPaceBand={() => setIsPaceBandModalOpen(true)}
        />

        {/* 2. LINHA DE CARDS: ATLETA & CLIMA */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Card do Perfil Fisiológico do Atleta */}
          <AthleteProfileCard
            athlete={authState.athlete || null}
            metrics={athleteMetrics}
            onOpenActivities={() => setIsActivitiesModalOpen(true)}
            onDisconnectStrava={handleDisconnectStrava}
          />

          {/* Card do Clima / Meteorologia */}
          <WeatherCard
            weather={weather}
            isLoadingWeather={isLoadingWeather}
            onUpdateDateTime={handleUpdateWeatherDateTime}
            onSelectLocation={handleSelectLocation}
            onResetToGpxLocation={handleResetToGpxLocation}
            hasGpxCoords={isCustomGpx}
          />
        </div>

        {/* 3. UPLOADER DE GPX OU PERCURSO PLANO */}
        <GpxUploader
          currentGpx={currentGpx}
          isCustomGpx={isCustomGpx}
          selectedFlatDistanceKm={selectedFlatDistanceKm}
          onSelectFlatDistance={handleSelectFlatDistance}
          onGpxParsed={handleGpxParsed}
          onResetToFlat={handleResetToFlat}
          isConnectedStrava={authState.connected}
          onOpenStravaRoutes={() => setIsStravaRoutesModalOpen(true)}
        />

        {/* 4. VISUALIZAÇÕES GRÁFICAS: ALTIMETRIA E MAPA VETORIAL */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Gráfico Interativo de Altimetria */}
          <ElevationChart
            gpx={currentGpx}
            splits={prediction.splits}
          />

          {/* Mapa do Traçado */}
          <RouteMap gpx={currentGpx} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-900 bg-gray-950 py-6 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-center sm:text-left">
          <p>
            Fundamentação Teórica: Daniels & Gilbert (1979) • Riegel (1981) • Minetti et al. (2002) • Ely et al. (2007) • ACSM (2007)
          </p>
          <p className="text-gray-500 font-mono text-xs">
            Race Predictor
          </p>
        </div>
      </footer>

      {/* Modais */}
      <ActivitiesListModal
        isOpen={isActivitiesModalOpen}
        onClose={() => setIsActivitiesModalOpen(false)}
        activities={activities}
      />

      <PaceStrategyTable
        isOpen={isSplitsModalOpen}
        onClose={() => setIsSplitsModalOpen(false)}
        splits={prediction.splits}
        courseName={currentGpx.name}
      />

      <PaceBandCard
        isOpen={isPaceBandModalOpen}
        onClose={() => setIsPaceBandModalOpen(false)}
        prediction={prediction}
        courseName={currentGpx.name}
      />

      {/* Modal de Rotas Salvas / Favoritas do Strava */}
      <StravaRoutesModal
        isOpen={isStravaRoutesModalOpen}
        onClose={() => setIsStravaRoutesModalOpen(false)}
        accessToken={authState.accessToken}
        athleteId={authState.athlete?.id}
        onSelectRoute={handleGpxParsed}
      />

      {/* PWA Banner Prompt de Instalação */}
      <PwaInstallPrompt />
    </div>
  );
}
