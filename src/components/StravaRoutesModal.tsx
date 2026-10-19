"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Search,
  Route as RouteIcon,
  TrendingUp,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  Compass,
} from "lucide-react";
import { GpxAnalysis, StravaRoute } from "@/lib/types";
import { parseGpxFile } from "@/lib/gpxParser";

interface StravaRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  athleteId?: number;
  onSelectRoute: (gpx: GpxAnalysis) => void;
}

export function StravaRoutesModal({
  isOpen,
  onClose,
  accessToken,
  athleteId,
  onSelectRoute,
}: StravaRoutesModalProps) {
  const [routes, setRoutes] = useState<StravaRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "starred">("starred");
  const [importingRouteId, setImportingRouteId] = useState<string | null>(null);

  // Carrega as rotas da API quando o modal abre
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchRoutes();
    }
  }, [isOpen, accessToken]);

  const fetchRoutes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strava/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, athleteId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao buscar rotas no Strava.");
      }

      const loadedRoutes: StravaRoute[] = data.routes || [];
      setRoutes(loadedRoutes);

      // Se o usuário não tiver rotas com estrela, abre a aba de todas
      const hasStarred = loadedRoutes.some((r) => r.starred);
      if (!hasStarred && loadedRoutes.length > 0) {
        setActiveTab("all");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com as rotas do Strava.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportRoute = async (route: StravaRoute) => {
    setImportingRouteId(route.id);
    setError(null);
    try {
      const res = await fetch(`/api/strava/routes/${route.id}/gpx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao baixar arquivo GPX do Strava.");
      }

      // Analisa o arquivo GPX baixado usando o motor da aplicação
      const analysis = parseGpxFile(data.gpxXml, route.name);
      onSelectRoute(analysis);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao processar rota do Strava.");
    } finally {
      setImportingRouteId(null);
    }
  };

  if (!isOpen) return null;

  const starredRoutes = routes.filter((r) => r.starred);
  const displayedRoutes = routes
    .filter((r) => (activeTab === "starred" ? r.starred : true))
    .filter((r) =>
      searchQuery.trim()
        ? r.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-full max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl sm:rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <RouteIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Rotas Salvas no Strava
              </h3>
              <p className="text-xs text-gray-400 truncate">
                Selecione uma rota para carregar altimetria e traçado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchRoutes}
              disabled={isLoading}
              title="Recarregar rotas"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-orange-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="border-b border-gray-800/80 bg-gray-900/40 p-3 sm:p-4 space-y-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("starred")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "starred"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>Favoritas ({starredRoutes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <span>Todas as Rotas ({routes.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar rota por nome..."
              className="w-full rounded-xl border border-gray-800 bg-gray-900/90 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-3 sm:m-4 flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400 mb-2" />
              <p className="text-sm font-semibold text-white">Carregando rotas do Strava...</p>
              <p className="text-xs text-gray-400 mt-1">Buscando percursos salvos no seu perfil</p>
            </div>
          ) : displayedRoutes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <Compass className="h-10 w-10 text-gray-600 mb-2" />
              <p className="text-sm font-bold text-gray-300">
                {activeTab === "starred" && starredRoutes.length === 0
                  ? "Nenhuma rota marcada como favorita (estrela) no Strava."
                  : "Nenhuma rota encontrada."}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {activeTab === "starred" && starredRoutes.length === 0
                  ? "Dica: No Strava, clique na estrela de uma rota para favoritá-la ou alterne para a aba 'Todas as Rotas'."
                  : "Crie ou salve percursos na sua conta do Strava para carregá-los diretamente aqui."}
              </p>
              {activeTab === "starred" && routes.length > 0 && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-3 rounded-lg bg-gray-800 hover:bg-gray-700 px-3.5 py-1.5 text-xs font-bold text-white transition"
                >
                  Ver Todas as Rotas ({routes.length})
                </button>
              )}
            </div>
          ) : (
            displayedRoutes.map((route) => {
              const isImporting = importingRouteId === route.id;
              return (
                <div
                  key={route.id}
                  className="rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-gray-900/90 hover:border-gray-700 p-3 sm:p-4 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {route.starred && (
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        {route.name}
                      </h4>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                      <span className="flex items-center gap-1 font-mono font-bold text-white">
                        <MapPin className="h-3.5 w-3.5 text-orange-400" />
                        {route.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1 font-mono text-amber-400 font-semibold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +{route.elevationGainMeters}m D+
                      </span>
                      {route.starred && (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                          Favorita
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportRoute(route)}
                    disabled={isImporting || importingRouteId !== null}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md transition disabled:opacity-50 shrink-0"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Baixando GPX...</span>
                      </>
                    ) : (
                      <>
                        <RouteIcon className="h-3.5 w-3.5" />
                        <span>Carregar Percurso</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 bg-gray-950 px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
          <span>Sincronizado via API oficial do Strava</span>
          <span>{routes.length} rotas disponíveis</span>
        </div>
      </div>
    </div>
  );
}
