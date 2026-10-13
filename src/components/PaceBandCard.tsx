"use client";

import React from "react";
import { X, Printer, Trophy, Download } from "lucide-react";
import { KmSplit, PredictionResult } from "@/lib/types";

interface PaceBandCardProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: PredictionResult;
  courseName: string;
}

export function PaceBandCard({
  isOpen,
  onClose,
  prediction,
  courseName,
}: PaceBandCardProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const splits = prediction.splits;
  // Agrupa a cada 2km ou 5km caso o percurso seja longo (maratona) para caber na pulseira
  const isMarathon = splits.length > 25;
  const filteredSplits = isMarathon
    ? splits.filter((s) => s.kmNumber % 2 === 0 || s.kmNumber === splits.length)
    : splits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl sm:rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden print:border-none print:bg-white print:max-h-none print:h-auto">
        {/* Header (oculto na impressão) */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 print:hidden">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
              <Trophy className="h-4 w-4 text-orange-400 shrink-0" />
              Pulseira de Ritmo (Pace Band)
            </h3>
            <p className="text-xs text-gray-400 truncate">
              Imprima ou consulte suas parciais no dia da prova
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white transition shadow-md shadow-orange-500/20"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Wristband Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-center print:p-0">
          <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900 p-5 print:border-solid print:border-black print:bg-white print:text-black print:shadow-none">
            {/* Header da pulseira */}
            <div className="border-b border-gray-800 pb-3 text-center print:border-gray-300">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 print:text-black">
                TABELA DE PASSAGEM OFICIAL
              </span>
              <h4 className="text-lg font-black text-white print:text-black">
                {courseName}
              </h4>
              <div className="mt-1 flex items-center justify-center gap-4 text-xs font-bold text-gray-300 print:text-black">
                <span>META: {prediction.predictedTimeFormatted}</span>
                <span>•</span>
                <span>RITMO MÉDIO: {prediction.averagePaceFormatted}/km</span>
              </div>
            </div>

            {/* Tabela de passagens */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="font-bold text-gray-400 py-1 border-b border-gray-800 print:text-black print:border-gray-300">
                KM
              </div>
              <div className="font-bold text-orange-400 py-1 border-b border-gray-800 print:text-black print:border-gray-300">
                RITMO
              </div>
              <div className="font-bold text-gray-200 py-1 border-b border-gray-800 print:text-black print:border-gray-300">
                TEMPO ACUM.
              </div>

              {filteredSplits.map((s) => (
                <React.Fragment key={s.kmNumber}>
                  <div className="py-1 font-black text-white print:text-black">
                    {s.kmNumber}k
                  </div>
                  <div className="py-1 font-mono font-semibold text-orange-400 print:text-black">
                    {s.targetPaceFormatted}
                  </div>
                  <div className="py-1 font-mono font-bold text-gray-200 print:text-black">
                    {s.cumulativeTimeFormatted}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Rodapé da pulseira */}
            <div className="mt-4 border-t border-gray-800 pt-2 text-center text-[10px] text-gray-400 print:border-gray-300 print:text-black">
              Hidrate-se a cada 2.5km • RacePredictor PRO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
