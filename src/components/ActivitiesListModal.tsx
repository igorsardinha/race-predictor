"use client";

import React, { useState } from "react";
import { X, Search, Calendar, Award, Zap, Heart, ArrowUpDown } from "lucide-react";
import { StravaActivity } from "@/lib/types";
import { formatPaceSecKm, formatTimeSec } from "@/lib/predictorEngine";

interface ActivitiesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: StravaActivity[];
}

export function ActivitiesListModal({
  isOpen,
  onClose,
  activities,
}: ActivitiesListModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "distance" | "pace">("date");
  const [sortAsc, setSortAsc] = useState(false);

  if (!isOpen) return null;

  const filtered = activities
    .filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "date") {
        const diff = new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        return sortAsc ? -diff : diff;
      }
      if (sortBy === "distance") {
        return sortAsc ? a.distance - b.distance : b.distance - a.distance;
      }
      if (sortBy === "pace") {
        const paceA = a.moving_time / (a.distance / 1000);
        const paceB = b.moving_time / (b.distance / 1000);
        return sortAsc ? paceA - paceB : paceB - paceA;
      }
      return 0;
    });

  const toggleSort = (field: "date" | "distance" | "pace") => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              Histórico de Corridas (Últimas 24 Semanas)
            </h3>
            <p className="text-xs text-gray-400 truncate">
              Corridas do ciclo de 24 semanas utilizadas para modelagem do seu VDOT e curva de fadiga
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Sort Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-gray-800/80 bg-gray-900/40 px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="relative flex-1 min-w-[160px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Filtrar por nome do treino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 py-1.5 sm:py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <span className="text-gray-400 hidden sm:inline">Ordenar:</span>
            <button
              onClick={() => toggleSort("date")}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 transition ${
                sortBy === "date"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              Data <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => toggleSort("distance")}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 transition ${
                sortBy === "distance"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              Distância <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => toggleSort("pace")}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 transition ${
                sortBy === "pace"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              Ritmo <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Activities Table */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="divide-y divide-gray-800/60">
            {filtered.map((activity) => {
              const distKm = parseFloat((activity.distance / 1000).toFixed(2));
              const paceSecKm = activity.moving_time / distKm;
              const dateStr = new Date(activity.start_date_local || activity.start_date).toLocaleDateString(
                "pt-BR",
                { day: "2-digit", month: "short", year: "numeric" }
              );

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2.5 sm:py-3 hover:bg-gray-900/40 px-2 rounded-lg transition gap-2"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight truncate">
                        {activity.name}
                      </h4>
                      <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {dateStr}
                        </span>
                        <span>•</span>
                        <span>D+ {activity.total_elevation_gain}m</span>
                        {activity.average_heartrate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-rose-400">
                              <Heart className="h-3 w-3" /> {activity.average_heartrate} bpm
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-white font-mono">{distKm} km</span>
                    <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                      <strong className="text-orange-400 font-semibold">
                        {formatPaceSecKm(paceSecKm)}
                      </strong>{" "}
                      /km
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-sm">
                Nenhuma corrida encontrada para o termo pesquisado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
