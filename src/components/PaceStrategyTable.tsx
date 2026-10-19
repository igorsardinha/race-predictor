"use client";

import React, { useState } from "react";
import { X, TrendingUp, ArrowDownRight, Wind, Download, FileText } from "lucide-react";
import { KmSplit } from "@/lib/types";

import { InfoTooltip } from "./InfoTooltip";

interface PaceStrategyTableProps {
  isOpen: boolean;
  onClose: () => void;
  splits: KmSplit[];
  courseName: string;
}

export function PaceStrategyTable({
  isOpen,
  onClose,
  splits,
  courseName,
}: PaceStrategyTableProps) {
  if (!isOpen) return null;

  const exportCsv = () => {
    let csv = "KM,Distancia (m),Altimetria Inicio (m),Altimetria Fim (m),Variacao (m),Inclinacao (%),Categoria,Ritmo Alvo (min/km),Tempo Acumulado\n";
    for (const s of splits) {
      csv += `${s.kmNumber},${s.distanceMeters},${s.startElevation},${s.endElevation},${s.elevationChangeMeters},${s.avgGradientPercent}%,${s.slopeCategory},${s.targetPaceFormatted},${s.cumulativeTimeFormatted}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parciais_${courseName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[92vh] sm:max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl sm:rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Parciais Km a Km
              </h3>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">({courseName})</span>
              <InfoTooltip
                title="Cálculo de Ritmo por Km (GAP)"
                formula="Pace_alvo = Pace_plano × [C_r(i) / 3.6] × Fator_vento"
                explanation="Para cada km, a inclinação média (Δh/Δd) é convertida no custo energético de Minetti (J/kg/m), mantendo o esforço cardiovascular constante."
                bibliography="Minetti, A. E. (2002); Margaria, R. et al. (1963)."
              />
            </div>
            <p className="text-xs text-gray-400 font-mono truncate">
              Grade Adjusted Pace para potência fisiológica constante
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1 rounded-lg bg-gray-800 hover:bg-gray-700 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white transition border border-gray-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar</span> CSV
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Splits Table */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-3 sm:py-4">
          <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-left text-xs sm:text-sm text-gray-200 min-w-[700px]">
              <thead className="bg-gray-900/95 text-xs uppercase tracking-wider text-gray-300 sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="py-3.5 px-3">KM</th>
                  <th className="py-3.5 px-3">Altimetria</th>
                  <th className="py-3.5 px-3">Inclinação</th>
                  <th className="py-3.5 px-3">Classificação</th>
                  <th className="py-3.5 px-3">Custo Minetti</th>
                  <th className="py-3.5 px-3 text-orange-400 font-bold">Ritmo Alvo</th>
                  <th className="py-3.5 px-3">Tempo Parcial</th>
                  <th className="py-3.5 px-3 text-right">Tempo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {splits.map((s) => {
                  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  let label = "Plano";

                  if (s.slopeCategory === "steep-climb") {
                    badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                    label = "Subida Forte";
                  } else if (s.slopeCategory === "mild-climb") {
                    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    label = "Subida Leve";
                  } else if (s.slopeCategory === "steep-descent") {
                    badgeColor = "bg-sky-500/10 text-sky-400 border-sky-500/20";
                    label = "Descida Forte";
                  } else if (s.slopeCategory === "mild-descent") {
                    badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                    label = "Descida Leve";
                  }

                  return (
                    <tr key={s.kmNumber} className="hover:bg-gray-900/60 transition">
                      <td className="py-3 px-3 font-black text-white font-mono">KM {s.kmNumber}</td>
                      <td className="py-3 px-3 font-mono">
                        {s.startElevation}m → {s.endElevation}m ({s.elevationChangeMeters > 0 ? "+" : ""}
                        {s.elevationChangeMeters}m)
                      </td>
                      <td className="py-3 px-3 font-bold font-mono">
                        {s.avgGradientPercent > 0 ? "+" : ""}
                        {s.avgGradientPercent}%
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${badgeColor}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-300 font-mono font-medium">
                        {s.minettiCostRatio}x
                      </td>
                      <td className="py-3 px-3 font-black text-orange-400 font-mono text-sm sm:text-base">
                        {s.targetPaceFormatted} /km
                      </td>
                      <td className="py-3 px-3 text-gray-200 font-mono font-medium">
                        {Math.floor(s.splitDurationSec / 60)}:
                        {(s.splitDurationSec % 60).toString().padStart(2, "0")}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-white font-mono">
                        {s.cumulativeTimeFormatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
