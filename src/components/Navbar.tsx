"use client";

import React from "react";
import { Activity, RefreshCw, CheckCircle2, LogOut } from "lucide-react";
import { StravaAthlete } from "@/lib/types";

interface NavbarProps {
  athlete: StravaAthlete | null;
  isConnected: boolean;
  totalRunsCount: number;
  isLoadingRuns: boolean;
  onConnectStrava: () => void;
  onRefreshRuns: () => void;
  onDisconnectStrava: () => void;
}

export function Navbar({
  athlete,
  isConnected,
  totalRunsCount,
  isLoadingRuns,
  onConnectStrava,
  onRefreshRuns,
  onDisconnectStrava,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white font-black text-xs sm:text-sm">
            RP
          </div>
          <div className="min-w-0 flex items-center">
            <span className="text-sm sm:text-base font-black tracking-tight text-white truncate">
              Race Predictor
            </span>
            <span className="ml-1.5 text-xs text-gray-500 font-mono hidden sm:inline">v1.2</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && athlete ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Athlete pill with sync button */}
              <div className="flex items-center gap-2 sm:gap-2.5 bg-gray-900 border border-gray-800 rounded-full py-1 px-2 sm:px-3 min-w-0">
                {athlete.profile ? (
                  <img
                    src={athlete.profile}
                    alt={athlete.firstname}
                    className="h-6 w-6 shrink-0 rounded-full object-cover border border-orange-500/50"
                  />
                ) : (
                  <div className="h-6 w-6 shrink-0 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                    {athlete.firstname[0]}
                  </div>
                )}
                <div className="flex flex-col text-left min-w-0 max-w-[85px] sm:max-w-none">
                  <span className="text-xs font-semibold text-white leading-tight truncate">
                    {athlete.firstname} <span className="hidden sm:inline">{athlete.lastname}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono truncate">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline">{totalRunsCount} corridas (24 sem)</span>
                    <span className="sm:hidden">{totalRunsCount} runs (24s)</span>
                  </span>
                </div>
                <button
                  onClick={onRefreshRuns}
                  disabled={isLoadingRuns}
                  title="Sincronizar histórico do Strava"
                  className="p-1 shrink-0 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition disabled:opacity-50"
                  aria-label="Sincronizar histórico"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isLoadingRuns ? "animate-spin text-orange-500" : ""}`}
                  />
                </button>
              </div>

              {/* Botão Sair / Desconectar */}
              <button
                onClick={onDisconnectStrava}
                title="Desconectar conta do Strava (Sair)"
                className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/80 hover:bg-rose-500/10 hover:border-rose-500/40 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-rose-400 transition"
                aria-label="Sair da conta"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-semibold">Sair</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onConnectStrava}
                className="flex items-center gap-1.5 rounded-lg bg-[#FC4C02] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e04402] transition active:scale-95"
              >
                <Activity className="h-3.5 w-3.5 shrink-0" />
                <span>Conectar Strava</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
