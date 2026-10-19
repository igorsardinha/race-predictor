"use client";

import React, { useState } from "react";
import { GpxAnalysis, GpxPoint } from "@/lib/types";
import { Map, Flag, Compass } from "lucide-react";

import { InfoTooltip } from "./InfoTooltip";

interface RouteMapProps {
  gpx: GpxAnalysis;
}

export function RouteMap({ gpx }: RouteMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<GpxPoint | null>(null);

  const points = gpx.points;
  if (!points || points.length === 0) return null;

  // Calcula Bounding Box geográfica
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }

  const latSpan = Math.max(0.001, maxLat - minLat);
  const lonSpan = Math.max(0.001, maxLon - minLon);

  const width = 600;
  const height = 350;
  const pad = 40;

  // Converte lat/lon para coordenadas de tela preservando aspect ratio
  const scale = Math.min((width - pad * 2) / lonSpan, (height - pad * 2) / latSpan);
  const offsetX = (width - lonSpan * scale) / 2;
  const offsetY = (height - latSpan * scale) / 2;

  const toScreen = (lat: number, lon: number) => {
    const x = offsetX + (lon - minLon) * scale;
    // Inverte Y porque coordenadas de tela crescem para baixo e latitude para cima
    const y = height - (offsetY + (lat - minLat) * scale);
    return { x, y };
  };

  const screenPoints = points.map((p) => {
    const s = toScreen(p.lat, p.lon);
    return { ...s, ...p };
  });

  const pathD = screenPoints.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, "");

  // Marcadores de KM (a cada 5 km)
  const kmIntervalM = 5000;
  const kmMarkers: { x: number; y: number; km: number }[] = [];
  let nextMarkM = 5000;

  for (let i = 1; i < screenPoints.length; i++) {
    const pt = screenPoints[i];
    if (pt.distFromStartMeters >= nextMarkM && nextMarkM < gpx.totalDistanceMeters - 500) {
      kmMarkers.push({
        x: pt.x,
        y: pt.y,
        km: Math.round(nextMarkM / 1000),
      });
      nextMarkM += kmIntervalM;
    }
  }

  const startPt = screenPoints[0];
  const endPt = screenPoints[screenPoints.length - 1];

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Traçado do Circuito</h3>
          <InfoTooltip
            title="Projeção Cartográfica Equirretangular"
            formula="x = R·(λ - λ₀)·cos(φ₀); y = R·(φ - φ₀)"
            explanation="Projeção cilíndrica simples normalizada para preservação da geometria planar e cálculo de azimute de deslocamento (bearing)."
            bibliography="Snyder, J. P. (1987). Map projections: A working manual. USGS Professional Paper 1395."
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Largada
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Chegada
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-center overflow-hidden rounded-xl bg-gray-950/70 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Grade de fundo sutil */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2937" strokeWidth="0.5" />
          </pattern>
          <rect width={width} height={height} fill="url(#grid)" />

          {/* Sombra / Glow do Traçado */}
          <path
            d={pathD}
            fill="none"
            stroke="#0284c7"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />

          {/* Traçado principal */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Marcadores de KM ao longo do percurso */}
          {kmMarkers.map((m) => (
            <g key={m.km}>
              <circle cx={m.x} cy={m.y} r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <text
                x={m.x}
                y={m.y + 3.5}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {m.km}
              </text>
            </g>
          ))}

          {/* Ponto de Largada */}
          <g>
            <circle cx={startPt.x} cy={startPt.y} r="10" fill="#10b981" opacity="0.3" />
            <circle cx={startPt.x} cy={startPt.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            <text x={startPt.x} y={startPt.y - 9} fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">
              LARGADA
            </text>
          </g>

          {/* Ponto de Chegada */}
          <g>
            <circle cx={endPt.x} cy={endPt.y} r="10" fill="#f43f5e" opacity="0.3" />
            <circle cx={endPt.x} cy={endPt.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
            <text x={endPt.x} y={endPt.y - 9} fill="#fb7185" fontSize="11" fontWeight="bold" textAnchor="middle">
              CHEGADA
            </text>
          </g>
        </svg>

        {/* Bússola no canto */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-gray-900/80 px-2 py-1 text-xs text-gray-400 border border-gray-800">
          <Compass className="h-3 w-3 text-sky-400" />
          <span>Norte ↑</span>
        </div>
      </div>
    </div>
  );
}
