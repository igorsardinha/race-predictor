"use client";

import React, { useState, useId } from "react";
import { GpxAnalysis, KmSplit } from "@/lib/types";
import { TrendingUp, Activity } from "lucide-react";

import { InfoTooltip } from "./InfoTooltip";

interface ElevationChartProps {
  gpx: GpxAnalysis;
  splits: KmSplit[];
}

export function ElevationChart({ gpx, splits }: ElevationChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = gpx.points;
  if (!points || points.length === 0) return null;

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };

  const minEle = gpx.minElevationMeters - 10;
  const maxEle = gpx.maxElevationMeters + 15;
  const eleSpan = Math.max(20, maxEle - minEle);
  const totalDist = gpx.totalDistanceMeters;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Mapeamento das coordenadas X e Y
  const svgPoints = points.map((p) => {
    const x = padding.left + (p.distFromStartMeters / totalDist) * chartW;
    const y = padding.top + chartH - ((p.ele - minEle) / eleSpan) * chartH;
    return { x, y, ele: p.ele, distM: p.distFromStartMeters };
  });

  // Linha poligonal e área de preenchimento
  const pathD = svgPoints.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, "");

  const areaD = `${pathD} L ${(padding.left + chartW).toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${padding.left.toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`;

  // Ticks do eixo X (a cada 5 km ou proporcional)
  const distKmTotal = gpx.totalDistanceKm;
  const stepKm = distKmTotal > 30 ? 10 : distKmTotal > 15 ? 5 : 2;
  const xTicks: number[] = [];
  for (let k = 0; k <= distKmTotal; k += stepKm) {
    xTicks.push(k);
  }

  // Ticks do eixo Y (altimetria)
  const yTicks = [
    Math.round(minEle + 10),
    Math.round(minEle + eleSpan * 0.5),
    Math.round(maxEle - 10),
  ];

  // Ponto ativo no hover
  const activePt = hoverIndex !== null ? svgPoints[hoverIndex] : null;
  const activeKm = activePt ? (activePt.distM / 1000).toFixed(1) : null;
  const activeSplit =
    activeKm !== null
      ? splits.find((s) => s.kmNumber === Math.ceil(parseFloat(activeKm)))
      : null;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-bold text-white">
            Perfil Altimétrico
          </h3>
          <InfoTooltip
            title="Curva Altimétrica e Gradiente Contínuo"
            formula="i = (ele[k] - ele[k-1]) / Δd; C_r(i) / C_r(0) (Minetti)"
            explanation="Projeção contínua da elevação barométrica com mapeamento do custo metabólico relativo instantâneo."
            bibliography="Minetti, A. E. (2002); Margaria, R. (1963)."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Plano
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Subida Leve
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Subida Íngreme
          </span>
        </div>
      </div>

      <div className="relative mt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            if (relX >= padding.left && relX <= padding.left + chartW) {
              const fraction = (relX - padding.left) / chartW;
              const idx = Math.min(
                svgPoints.length - 1,
                Math.max(0, Math.round(fraction * (svgPoints.length - 1)))
              );
              setHoverIndex(idx);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches && e.touches[0]) {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
              if (relX >= padding.left && relX <= padding.left + chartW) {
                const fraction = (relX - padding.left) / chartW;
                const idx = Math.min(
                  svgPoints.length - 1,
                  Math.max(0, Math.round(fraction * (svgPoints.length - 1)))
                );
                setHoverIndex(idx);
              }
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#f97316" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines Y */}
          {yTicks.map((val) => {
            const y = padding.top + chartH - ((val - minEle) / eleSpan) * chartH;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#374151"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#9ca3af"
                  fontSize="10"
                  textAnchor="end"
                >
                  {val}m
                </text>
              </g>
            );
          })}

          {/* Grid lines X (km) */}
          {xTicks.map((km) => {
            const x = padding.left + (km / distKmTotal) * chartW;
            return (
              <g key={km}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartH}
                  stroke="#1f2937"
                  strokeWidth="0.8"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  fill="#9ca3af"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {km}km
                </text>
              </g>
            );
          })}

          {/* Área sombreada */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Linha do traçado */}
          <path
            d={pathD}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Indicador de cursor interativo */}
          {activePt && (
            <g>
              <line
                x1={activePt.x}
                y1={padding.top}
                x2={activePt.x}
                y2={padding.top + chartH}
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle
                cx={activePt.x}
                cy={activePt.y}
                r="5"
                fill="#f97316"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {activePt && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-gray-700 bg-gray-900/95 p-2.5 text-xs shadow-2xl backdrop-blur-md"
            style={{
              left: `${Math.min(75, Math.max(10, ((activePt.x - padding.left) / chartW) * 100))}%`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-white">KM {activeKm}</span>
              <span className="text-gray-400">•</span>
              <span className="font-bold text-amber-400">{Math.round(activePt.ele)}m altitude</span>
            </div>
            {activeSplit && (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-300">
                <span>
                  Inclinação:{" "}
                  <strong
                    className={
                      activeSplit.avgGradientPercent > 2
                        ? "text-rose-400"
                        : activeSplit.avgGradientPercent < -2
                        ? "text-sky-400"
                        : "text-emerald-400"
                    }
                  >
                    {activeSplit.avgGradientPercent > 0 ? "+" : ""}
                    {activeSplit.avgGradientPercent}%
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Ritmo: <strong className="text-orange-400">{activeSplit.targetPaceFormatted}</strong>/km
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
