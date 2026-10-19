"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  MapPin,
  TrendingUp,
  ArrowDownRight,
  Compass,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";
import { GpxAnalysis } from "@/lib/types";
import { parseGpxFile } from "@/lib/gpxParser";
import { InfoTooltip } from "./InfoTooltip";

interface GpxUploaderProps {
  currentGpx: GpxAnalysis | null;
  isCustomGpx: boolean;
  selectedFlatDistanceKm: number;
  onSelectFlatDistance: (km: number) => void;
  onGpxParsed: (gpx: GpxAnalysis) => void;
  onResetToFlat: () => void;
}

const DISTANCE_PRESETS = [
  { label: "5 KM", km: 5 },
  { label: "10 KM", km: 10 },
  { label: "21.1 KM (Meia)", km: 21.0975 },
  { label: "42.2 KM (Maratona)", km: 42.195 },
];

export function GpxUploader({
  currentGpx,
  isCustomGpx,
  selectedFlatDistanceKm,
  onSelectFlatDistance,
  onGpxParsed,
  onResetToFlat,
}: GpxUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [customDistanceInput, setCustomDistanceInput] = useState<string>("");

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setParseError("Envie um arquivo válido com extensão .gpx");
      return;
    }

    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const analysis = parseGpxFile(text, file.name);
        onGpxParsed(analysis);
      } catch (err) {
        setParseError(
          err instanceof Error
            ? err.message
            : "Falha ao processar arquivo GPX."
        );
      }
    };
    reader.onerror = () => {
      setParseError("Erro ao ler o arquivo selecionado.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleCustomDistanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customDistanceInput.replace(",", "."));
    if (!isNaN(val) && val > 0 && val <= 250) {
      onSelectFlatDistance(val);
      setCustomDistanceInput("");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm font-bold text-white truncate">
                Percurso da Prova (GPX ou Plano)
              </h3>
              <InfoTooltip
                title="Topografia e Distância Geodésica"
                formula="d = ∑ Haversine(p_i, p_{i+1}); D+ = ∑ max(0, Δele)"
                explanation="Sem arquivo GPX, assume-se percurso perfeitamente plano (D+ 0m, custo Minetti = 1.0). Com arquivo GPX, decompõe a altimetria real km a km."
                bibliography="Sinnott, R. W. (1984); Minetti, A. E. et al. (2002)."
              />
            </div>
            <p className="text-xs text-gray-400 font-mono truncate">
              {isCustomGpx ? "Arquivo GPX carregado" : "Percurso plano padrão ativo"}
            </p>
          </div>
        </div>

        {isCustomGpx && (
          <button
            onClick={onResetToFlat}
            className="flex shrink-0 items-center gap-1 rounded-md bg-gray-800 hover:bg-gray-700 px-2.5 py-1 text-xs text-gray-300 hover:text-white border border-gray-700 transition"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
            Remover GPX (Voltar ao Plano)
          </button>
        )}
      </div>

      {/* Se não enviou GPX: Seletor de Distância para o percurso plano */}
      {!isCustomGpx && (
        <div className="mt-4 rounded-xl bg-gray-950/70 p-3.5 sm:p-4 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-gray-200">
              Distância Alvo (Percurso Plano):
            </span>
            <span className="text-sm font-mono font-black text-orange-400">
              {currentGpx?.totalDistanceKm || selectedFlatDistanceKm} km
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DISTANCE_PRESETS.map((p) => {
              const isSelected =
                Math.abs(selectedFlatDistanceKm - p.km) < 0.1;
              return (
                <button
                  key={p.label}
                  onClick={() => onSelectFlatDistance(p.km)}
                  className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold transition ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            {/* Custom Distance input */}
            <form
              onSubmit={handleCustomDistanceSubmit}
              className="flex items-center gap-1.5"
            >
              <input
                type="number"
                step="0.1"
                min="1"
                max="250"
                placeholder="Outro km..."
                value={customDistanceInput}
                onChange={(e) => setCustomDistanceInput(e.target.value)}
                className="w-24 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-xs sm:text-sm font-bold text-white border border-gray-700 transition"
              >
                Definir
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
          isDragging
            ? "border-orange-500 bg-orange-500/10"
            : isCustomGpx
            ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500"
            : "border-gray-800 bg-gray-950/40 hover:border-gray-700"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
          accept=".gpx"
          className="hidden"
        />

        {isCustomGpx && currentGpx ? (
          <div className="flex items-center gap-3 min-w-0 max-w-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <span className="text-sm sm:text-base font-bold text-white font-mono block truncate">
                {currentGpx.name}
              </span>
              <p className="text-xs text-gray-400 truncate">
                Arquivo GPX carregado • Clique para substituir
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-gray-400">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white">
                Enviar arquivo .GPX (Opcional)
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Se não enviar, cálculo assume percurso plano com clima favorável
              </p>
            </div>
          </div>
        )}
      </div>

      {parseError && (
        <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs sm:text-sm text-rose-300 font-medium">
          {parseError}
        </div>
      )}

      {/* Course Stats KPI Grid */}
      {currentGpx && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-300">
              <span className="truncate">Distância Total</span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-black text-white font-mono truncate">
              {currentGpx.totalDistanceKm}{" "}
              <span className="text-xs font-semibold text-gray-400">km</span>
            </p>
            <span className="text-xs text-gray-400 font-mono mt-0.5">
              {(currentGpx.totalDistanceMeters).toLocaleString()} m
            </span>
          </div>

          <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-300 gap-1">
              <span className="flex items-center gap-1 truncate">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                Ganho (D+)
              </span>
              <InfoTooltip
                title="Ganho Cumulativo de Altimetria (D+)"
                formula="D+ = ∑ max(0, ele[i] - ele[i-1])"
                explanation="Soma dos aclives positivos. Em percurso plano padrão, D+ = 0m."
                bibliography="Minetti, A. E. (2002)."
                align="center"
              />
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-black text-amber-400 font-mono truncate">
              +{currentGpx.elevationGainMeters}{" "}
              <span className="text-xs font-semibold text-gray-400">m</span>
            </p>
            <span className="text-xs text-gray-400 font-mono mt-0.5">
              Subida acumulada
            </span>
          </div>

          <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-300">
              <span className="flex items-center gap-1 truncate">
                <ArrowDownRight className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                Perda (D-)
              </span>
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-black text-sky-400 font-mono truncate">
              -{currentGpx.elevationLossMeters}{" "}
              <span className="text-xs font-semibold text-gray-400">m</span>
            </p>
            <span className="text-xs text-gray-400 font-mono mt-0.5">
              Descida acumulada
            </span>
          </div>

          <div className="min-w-0 rounded-xl border border-gray-800 bg-gray-950/60 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-300">
              <span className="flex items-center gap-1 truncate">
                <Compass className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                Altitude
              </span>
            </div>
            <p className="mt-1.5 text-sm sm:text-base font-black text-white font-mono truncate">
              {currentGpx.minElevationMeters}m / {currentGpx.maxElevationMeters}m
            </p>
            <span className="text-xs text-gray-400 font-mono block truncate mt-0.5">
              Inclinação Máx: {currentGpx.maxGradientPercent}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
