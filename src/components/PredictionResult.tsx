"use client";

import React from "react";
import {
  Trophy,
  Gauge,
  Zap,
  ShieldAlert,
  Star,
  FileSpreadsheet,
  Printer,
  Droplets,
} from "lucide-react";
import { PredictionResult as PredictionResultType } from "@/lib/types";
import { formatTimeSec } from "@/lib/predictorEngine";
import { InfoTooltip } from "./InfoTooltip";

interface PredictionResultProps {
  prediction: PredictionResultType;
  currentStrategy: "even-effort" | "even-pace" | "negative-split";
  onChangeStrategy: (strategy: "even-effort" | "even-pace" | "negative-split") => void;
  onViewSplits: () => void;
  onViewPaceBand: () => void;
}

export function PredictionResult({
  prediction,
  currentStrategy,
  onChangeStrategy,
  onViewSplits,
  onViewPaceBand,
}: PredictionResultProps) {
  const nutrition = prediction.nutritionPlan;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Header & Strategy selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              Estimativa de Tempo de Prova
            </h2>
            <InfoTooltip
              title="Modelo Integrado de Predição"
              formula="T_final = T_Riegel(D) + ΔT_Minetti(grade) + ΔT_Termico(T, T_dew) + ΔT_Vento(v_w) + ΔT_Alt"
              explanation="Fusão do tempo base pelo modelo de potência de Riegel calibrado pelo histórico de treinos com o custo mecânico em aclives/declives de Minetti (GAP) e penalidades meteorológicas de Ely/Montain."
              bibliography="Riegel, P. S. (1981); Minetti, A. E. et al. (2002); Ely, M. R. et al. (2007)."
            />
          </div>
        </div>

        {/* Strategy Switcher */}
        <div className="grid grid-cols-3 w-full sm:w-auto items-center gap-1 rounded-xl bg-gray-950 p-1 border border-gray-800">
          <button
            onClick={() => onChangeStrategy("even-effort")}
            className={`rounded-lg px-2 py-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-center transition ${
              currentStrategy === "even-effort"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="hidden sm:inline">Esforço Constante (Minetti)</span>
            <span className="sm:hidden">Constante</span>
          </button>
          <button
            onClick={() => onChangeStrategy("even-pace")}
            className={`rounded-lg px-2 py-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-center transition ${
              currentStrategy === "even-pace"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="hidden sm:inline">Ritmo Fixo (Even Pace)</span>
            <span className="sm:hidden">Ritmo Fixo</span>
          </button>
          <button
            onClick={() => onChangeStrategy("negative-split")}
            className={`rounded-lg px-2 py-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-center transition ${
              currentStrategy === "negative-split"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="hidden sm:inline">Split Negativo (-2%)</span>
            <span className="sm:hidden">Split Neg.</span>
          </button>
        </div>
      </div>

      {/* 3 PREDICTED TIMES: NO MOBILE O MÉDIO (ALVO) FICA EM DESTAQUE NO TOPO E OTIMISTA/PESSIMISTA LADO A LADO ABAIXO. NO DESKTOP FICAM 3 LADO A LADO */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch">
        {/* 1. CENÁRIO OTIMISTA */}
        <div className="min-w-0 flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 sm:p-5 order-2 sm:order-1 col-span-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
                Otimista
              </span>
              <InfoTooltip
                title="Intervalo Otimista (-2.5%)"
                formula="T_opt = T_estimado × 0.975"
                explanation="Considera eficiência máxima de corrida, temperatura favorável sem desacoplamento cardíaco acentuado e resposta neurofisiológica ideal no terço final."
                bibliography="Galloway, J. (2002); Tucker, R. & Noakes, T. (2009). The physiological regulation of pacing strategy."
              />
            </div>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
              -2.5%
            </span>
          </div>

          <div className="my-2.5 sm:my-4 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white font-mono">
              {prediction.confidenceRange.optimisticFormatted}
            </div>
            <div className="mt-1 sm:mt-2 text-xs font-semibold text-emerald-300 font-mono">
              <span className="hidden sm:inline">Ritmo: </span>
              <strong>{prediction.confidenceRange.optimisticPaceFormatted}</strong>/km
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 border-t border-emerald-500/20 pt-2 truncate">
            Dispersão favorável
          </div>
        </div>

        {/* 2. CENÁRIO MÉDIO / ESPERADO (DESTACADO) */}
        <div className="min-w-0 relative flex flex-col justify-between rounded-2xl border-2 border-orange-500 bg-gray-950 p-4 sm:p-6 shadow-xl shadow-orange-500/10 z-10 order-1 sm:order-2 col-span-2 sm:col-span-1">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-white shadow">
              <Star className="h-3 w-3 fill-current" />
              <span>Médio (Alvo Recomendado)</span>
            </span>
          </div>

          <div className="text-center pt-2 sm:pt-2">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Tempo Previsto
              </span>
              <InfoTooltip
                title="Tempo Nominal Previsto"
                formula="T_alvo = ∑ [Ritmo_km(i, T, w) × D_km]"
                explanation="Integração de cada quilômetro aplicando o custo biomecânico de Minetti para a inclinação daquele trecho somado à degradação aeróbica de temperatura e vento."
                bibliography="Minetti, A. E. (2002); Riegel, P. S. (1981)."
              />
            </div>

            <div className="mt-1.5 sm:mt-2 text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white font-mono drop-shadow-sm">
              {prediction.predictedTimeFormatted}
            </div>

            <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 rounded-lg bg-orange-500/15 px-3 py-1 text-xs sm:text-sm font-bold text-orange-200 border border-orange-500/30 font-mono">
              <Gauge className="h-4 w-4 text-orange-400 shrink-0" />
              <span>Ritmo Médio: </span>
              <strong className="text-white">{prediction.averagePaceFormatted}</strong>/km
            </div>
          </div>

          <div className="text-center text-xs text-gray-300 border-t border-gray-800 pt-2.5 mt-2.5">
            Potência fisiológica e VO₂ calculados
          </div>
        </div>

        {/* 3. CENÁRIO PESSIMISTA / CONSERVADOR */}
        <div className="min-w-0 flex flex-col justify-between rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 sm:p-5 order-3 sm:order-3 col-span-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-xs sm:text-xs font-bold uppercase tracking-wider text-rose-400">
                Pessimista
              </span>
              <InfoTooltip
                title="Intervalo Conservador (+3.5%)"
                formula="T_pes = T_estimado × 1.035"
                explanation="Projeta perda de rendimento por estresse térmico prolongado, desidratação (>2% massa corporal) ou esgotamento acelerado de glicogênio nos quilômetros finais."
                bibliography="Montain, S. J. & Coyle, E. F. (1992); Cheuvront, S. N. et al. (2010)."
              />
            </div>
            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-xs font-mono font-bold text-rose-400 border border-rose-500/20 shrink-0">
              +3.5%
            </span>
          </div>

          <div className="my-2.5 sm:my-4 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white font-mono">
              {prediction.confidenceRange.conservativeFormatted}
            </div>
            <div className="mt-1 sm:mt-2 text-xs font-semibold text-rose-300 font-mono">
              <span className="hidden sm:inline">Ritmo: </span>
              <strong>{prediction.confidenceRange.conservativePaceFormatted}</strong>/km
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 border-t border-rose-500/20 pt-2 truncate">
            Gestão de desgaste
          </div>
        </div>
      </div>

      {/* Factor Breakdown Grid */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        {/* Base Plano */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-gray-300">Base Plana</span>
            <InfoTooltip
              title="Equação de Potência de Pete Riegel"
              formula="T_2 = T_1 × (D_2 / D_1)^b"
              explanation="Prediz o tempo de prova extrapolando as melhores marcas do atleta em distâncias conhecidas. O expoente b varia entre 1.05 (alta resistência) e 1.12 (baixo volume)."
              bibliography="Riegel, P. S. (1981). Athletic records and endurance. American Scientist, 69(3), 285-290."
              align="left"
            />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-black text-white font-mono">
            {formatTimeSec(prediction.baselineFlatTimeSec)}
          </p>
          <span className="text-xs text-gray-400 block mt-0.5">Pete Riegel (1981)</span>
        </div>

        {/* Penalidade Altimetria */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-gray-300">Altimetria (D+)</span>
            <InfoTooltip
              title="Custo Mecânico de Altimetria (Minetti)"
              formula="C_r(i) = 155.4·i⁵ - 30.4·i⁴ - 43.3·i³ + 46.3·i² + 19.5·i + 3.6"
              explanation="Calcula a demanda de oxigênio em J/(kg·m) para a inclinação i (Δh/Δd). Razão em relação ao plano: C_r(i) / 3.6."
              bibliography="Minetti, A. E. et al. (2002). Energy cost of walking and running at extreme uphill and downhill slopes. J Appl Physiol, 93(3), 1039-1046."
              align="center"
            />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-black text-amber-400 font-mono">
            +{formatTimeSec(prediction.courseElevationPenaltySec)}
          </p>
          <span className="text-xs text-gray-400 block mt-0.5">Minetti et al. (2002)</span>
        </div>

        {/* Penalidade Clima */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-gray-300">Penalidade Térmica</span>
            <InfoTooltip
              title="Impacto do Clima e Ponto de Orvalho"
              formula="ΔPace% ≈ 0.45% × (T - 12°C) + f(T_dew)"
              explanation="Degradação do rendimento acima da temperatura ideal de maratona (8°C a 12°C) combinada com a redução da evaporação do suor (ponto de orvalho > 16°C)."
              bibliography="Ely, M. R., Cheuvront, S. N. et al. (2007). Impact of weather on marathon running performance. MSSE, 39(3), 587-593."
              align="center"
            />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-black text-orange-400 font-mono">
            +{formatTimeSec(prediction.weatherPenaltySec)}
          </p>
          <span className="text-xs text-gray-400 block mt-0.5">Ely et al. (2007)</span>
        </div>

        {/* Penalidade Vento */}
        <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-gray-300">Resistência do Ar</span>
            <InfoTooltip
              title="Resistência Aerodinâmica e Vetor de Vento"
              formula="v_efetivo = v_vento × cos(θ_rumo - θ_vento); P_aero ∝ (v_atleta + v_efetivo)²"
              explanation="Decomposição vetorial do rumo da rota contra o ângulo do vento. O custo de vento frontal é superior ao benefício proporcional de vento de cauda devido à turbulência."
              bibliography="Pugh, L. G. (1970); Davies, C. T. (1980). Effects of wind assistance and resistance on runners."
              align="right"
            />
          </div>
          <p className="mt-1.5 text-base sm:text-lg font-black text-sky-400 font-mono">
            {prediction.windPenaltySec >= 0 ? "+" : ""}
            {prediction.windPenaltySec}s
          </p>
          <span className="text-xs text-gray-400 block mt-0.5">Pugh / Davies</span>
        </div>
      </div>

      {/* Nutrition & Hydration Strategy Box */}
      <div className="mt-4 sm:mt-5 rounded-xl border border-gray-800 bg-gray-950/50 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-200">
            <Droplets className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Necessidade Hídrica e Energética</span>
          </div>
          <InfoTooltip
            title="Diretrizes de Hidratação e Carboidratos"
            formula="CHO = 30-60g/h (<2.5h) | 60-90g/h (>2.5h); Taxa Sudorese ≈ 0.4-1.2 L/h"
            explanation="Recomendações da Sociedade Internacional de Nutrição Esportiva e ACSM para reposição de carboidratos exógenos e prevenção de hiponatremia associada ao exercício."
            bibliography="Jeukendrup, A. (2014). Carbohydrate intake during exercise. Sports Med; ACSM Position Stand (2007)."
            align="right"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="min-w-0 rounded-lg bg-gray-900 p-3 border border-gray-800">
            <span className="text-gray-400 text-xs font-medium block">Hidratação</span>
            <p className="text-base font-black text-cyan-400 font-mono mt-0.5">
              {nutrition.fluidMlPerHour} ml / hora
            </p>
            <span className="text-xs text-gray-400 block mt-1">~150ml por posto (a cada 2.5km)</span>
          </div>

          <div className="min-w-0 rounded-lg bg-gray-900 p-3 border border-gray-800">
            <span className="text-gray-400 text-xs font-medium block">Carboidratos</span>
            <p className="text-base font-black text-amber-400 font-mono mt-0.5">
              {nutrition.carbsGramsPerHour}g CHO / hora
            </p>
            <span className="text-xs text-gray-400 block mt-1">
              Total: {nutrition.gelCount} géis de ~25g
            </span>
          </div>

          <div className="min-w-0 rounded-lg bg-gray-900 p-3 border border-gray-800">
            <span className="text-gray-400 text-xs font-medium block">Sódio / Eletrólitos</span>
            <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {nutrition.sodiumMgPerHour} mg / hora
            </p>
            <span className="text-xs text-gray-400 block mt-1">Manutenção osmolar plasmática</span>
          </div>
        </div>

        {nutrition.gelKilometers.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-300">
            <span className="text-gray-400 text-xs font-medium">Quilômetros para ingestão de gel:</span>
            {nutrition.gelKilometers.map((km) => (
              <span
                key={km}
                className="rounded bg-amber-500/10 px-2 py-0.5 font-bold font-mono text-amber-400 border border-amber-500/20 text-xs"
              >
                KM {km}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
        <button
          onClick={onViewPaceBand}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition border border-gray-700"
        >
          <Printer className="h-4 w-4 text-orange-400" />
          Pulseira de Passagens (Pace Band)
        </button>

        <button
          onClick={onViewSplits}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition active:scale-95 shadow-md shadow-orange-600/20"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Tabela Parciais Km a Km
        </button>
      </div>
    </div>
  );
}
