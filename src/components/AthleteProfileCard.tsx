"use client";

import React from "react";
import {
  Activity,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  Layers,
  Heart,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { AthleteFitnessMetrics, StravaAthlete } from "@/lib/types";
import { formatPaceSecKm, formatTimeSec } from "@/lib/predictorEngine";
import { InfoTooltip } from "./InfoTooltip";

interface AthleteProfileCardProps {
  athlete: StravaAthlete | null;
  metrics: AthleteFitnessMetrics;
  onOpenActivities: () => void;
  onDisconnectStrava?: () => void;
}

export function AthleteProfileCard({
  athlete,
  metrics,
  onOpenActivities,
  onDisconnectStrava,
}: AthleteProfileCardProps) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm font-bold text-white truncate">
                Métricas Fisiológicas
              </h2>
              <span className="text-xs text-gray-500 font-mono shrink-0">
                ({metrics.totalRunsAnalyzed} corridas • 24 sem)
              </span>
              <InfoTooltip
                title="Modelagem do Ciclo de 24 Semanas"
                formula="VDOT = VO₂ / %VO₂max; b = ln(T₂/T₁) / ln(D₂/D₁)"
                explanation="Determinação de potência aeróbica pelo modelo de Jack Daniels e calibração da curva de fadiga de Pete Riegel com base no histórico das últimas 24 semanas de treinamento."
                bibliography="Daniels, J. & Gilbert, J. (1979); Riegel, P. S. (1981)."
              />
            </div>
            <p className="text-xs text-gray-400 truncate">
              {athlete
                ? `${athlete.firstname} ${athlete.lastname}`
                : "Aguardando conexão com o Strava"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenActivities}
            disabled={metrics.totalRunsAnalyzed === 0}
            className="flex items-center gap-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition border border-gray-700/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Layers className="h-3.5 w-3.5 text-orange-400" />
            Ver Corridas (24 Semanas)
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>

          {athlete && onDisconnectStrava && (
            <button
              onClick={onDisconnectStrava}
              title="Desconectar conta do Strava (Sair)"
              className="flex items-center gap-1 rounded-lg bg-gray-800/80 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400 px-2.5 py-1.5 text-xs text-gray-400 transition border border-gray-700/60"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        {/* VDOT */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 text-gray-400">
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold text-gray-200">VDOT</span>
              <span className="block text-xs text-gray-400">Jack Daniels</span>
            </div>
            <InfoTooltip
              title="Índice VDOT (Daniels & Gilbert)"
              formula="VO₂ = -4.60 + 0.182·v + 0.000104·v²; %VO₂ = 0.8 + 0.189·e^(-0.0128·t) + 0.299·e^(-0.193·t)"
              explanation="Expressa a velocidade máxima em estado de equilíbrio de consumo de oxigênio a partir das melhores marcas de 5K e 10K."
              bibliography="Daniels, J., & Gilbert, J. (1979). Oxygen Power: Performance Tables for Distance Runners."
              align="left"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{metrics.estimatedVdot}</span>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
              {metrics.estimatedVdot >= 50
                ? "Avançado"
                : metrics.estimatedVdot >= 42
                ? "Intermediário"
                : "Base"}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-mono">VO₂max equiv.</p>
        </div>

        {/* Expoente de Fadiga Riegel */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 text-gray-400">
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold text-gray-200">Fadiga (b)</span>
              <span className="block text-xs text-gray-400">Pete Riegel</span>
            </div>
            <InfoTooltip
              title="Expoente de Fadiga de Pete Riegel"
              formula="b = ln(T₂ / T₁) / ln(D₂ / D₁); Padrão = 1.06"
              explanation="Mede a taxa de queda de velocidade com o aumento da distância. Corredores de alto volume semanal atingem b ≈ 1.05-1.06; atletas sem base de rodagem longa sofrem b > 1.10."
              bibliography="Riegel, P. S. (1981). Athletic records and endurance. American Scientist, 69(3), 285-290."
              align="center"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{metrics.fatigueExponent}</span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              {metrics.fatigueExponent <= 1.06
                ? "Alta Resist."
                : metrics.fatigueExponent <= 1.08
                ? "Equilibrado"
                : "Fadiga Precoce"}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-mono">Curva Riegel</p>
        </div>

        {/* Volume Semanal */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 text-gray-400">
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold text-gray-200">Volume</span>
              <span className="block text-xs text-gray-400">Média Semanal</span>
            </div>
            <Calendar className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{metrics.avgWeeklyDistanceKm}</span>
            <span className="text-xs font-semibold text-gray-400">km/sem</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-mono">Total: {metrics.totalDistanceKm} km</p>
        </div>

        {/* Maior Rodagem */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/50 p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 text-gray-400">
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold text-gray-200">Longão</span>
              <span className="block text-xs text-gray-400">Maior Rodagem</span>
            </div>
            <TrendingUp className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{metrics.longestRunKm}</span>
            <span className="text-xs font-semibold text-gray-400">km</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-mono">
            {metrics.longestRunKm >= 28 ? "Base Maratona Ok" : "Base < 28km"}
          </p>
        </div>
      </div>

      {/* Benchmarks & Aerobic Base Bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Melhores marcas identificadas */}
        <div className="min-w-0 rounded-xl border border-gray-800/80 bg-gray-950/40 p-3.5">
          <span className="text-xs sm:text-sm font-bold text-gray-200 block">
            Melhores Marcas Identificadas (Pista Plana)
          </span>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="min-w-0 rounded-lg bg-gray-900 p-2 sm:p-2.5 border border-gray-800">
              <span className="text-xs uppercase font-black text-orange-400 font-mono block">5 KM</span>
              <p className="text-sm sm:text-base font-black text-white mt-1 font-mono truncate">
                {metrics.best5kTimeSec ? formatTimeSec(metrics.best5kTimeSec) : "--"}
              </p>
              <span className="text-xs text-gray-300 font-mono block mt-0.5 truncate">
                {metrics.best5kTimeSec ? `${formatPaceSecKm(metrics.best5kTimeSec / 5)}/km` : ""}
              </span>
            </div>

            <div className="min-w-0 rounded-lg bg-gray-900 p-2 sm:p-2.5 border border-gray-800">
              <span className="text-xs uppercase font-black text-orange-400 font-mono block">10 KM</span>
              <p className="text-sm sm:text-base font-black text-white mt-1 font-mono truncate">
                {metrics.best10kTimeSec ? formatTimeSec(metrics.best10kTimeSec) : "--"}
              </p>
              <span className="text-xs text-gray-300 font-mono block mt-0.5 truncate">
                {metrics.best10kTimeSec ? `${formatPaceSecKm(metrics.best10kTimeSec / 10)}/km` : ""}
              </span>
            </div>

            <div className="min-w-0 rounded-lg bg-gray-900 p-2 sm:p-2.5 border border-gray-800">
              <span className="text-xs uppercase font-black text-orange-400 font-mono block">21.1 KM</span>
              <p className="text-sm sm:text-base font-black text-white mt-1 font-mono truncate">
                {metrics.bestHalfTimeSec ? formatTimeSec(metrics.bestHalfTimeSec) : "--"}
              </p>
              <span className="text-xs text-gray-300 font-mono block mt-0.5 truncate">
                {metrics.bestHalfTimeSec ? `${formatPaceSecKm(metrics.bestHalfTimeSec / 21.0975)}/km` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Pontuação da Base Aeróbica */}
        <div className="min-w-0 rounded-xl border border-gray-800/80 bg-gray-950/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-gray-200 truncate">
                Índice de Base Aeróbica
              </span>
              <InfoTooltip
                title="Pontuação de Consistência Aeróbica (0-100)"
                formula="Score = (Vol_sem / 70)·50 + (Longão / 32)·30 + (Semanas_Ativas / 24)·20"
                explanation="Pondera a suficiência de volume nas últimas 24 semanas e a maior rodagem contínua para prevenir a depleção precoce de glicogênio muscular em provas acima de 21 km."
                bibliography="Noakes, T. (2003). Lore of Running (4th ed.). Human Kinetics."
                align="right"
              />
            </div>
            <span className="text-sm sm:text-base font-black text-orange-400 font-mono shrink-0">
              {metrics.aerobicBaseScore} / 100
            </span>
          </div>
          <div className="mt-2.5 h-2.5 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, metrics.aerobicBaseScore))}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-1 text-xs text-gray-300">
            <span className="flex items-center gap-1.5 font-mono">
              <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              FC Média: <strong>{metrics.avgHeartRate ? `${metrics.avgHeartRate} bpm` : "N/D"}</strong>
            </span>
            <span className="capitalize">
              Tendência: <strong className="text-emerald-400 font-semibold">{metrics.recentFormTrend}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
