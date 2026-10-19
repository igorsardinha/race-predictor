"use client";

import React from "react";

interface ConnectWithStravaButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "orange" | "light";
}

/**
 * Botão oficial "Connect with Strava" em total conformidade
 * com as Diretrizes Oficiais de Marca da API do Strava (Strava API Brand Guidelines).
 * https://developers.strava.com/guidelines/
 */
export function ConnectWithStravaButton({
  onClick,
  className = "",
  size = "default",
  variant = "orange",
}: ConnectWithStravaButtonProps) {
  const isLight = variant === "light";

  const sizeClasses =
    size === "sm"
      ? "h-9 px-3 text-xs"
      : size === "lg"
      ? "h-12 px-5 text-sm sm:text-base"
      : "h-10 sm:h-11 px-4 text-xs sm:text-sm";

  const iconSizes =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2.5 rounded font-sans font-bold transition select-none shrink-0 ${
        isLight
          ? "bg-white hover:bg-gray-100 text-[#FC4C02] border border-gray-200 shadow-sm"
          : "bg-[#FC4C02] hover:bg-[#e04402] text-white shadow-md shadow-orange-600/20 active:bg-[#c93d01]"
      } ${sizeClasses} ${className}`}
      aria-label="Connect with Strava"
    >
      {/* Símbolo Oficial do Strava (vetor oficial) */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${iconSizes} shrink-0`}
        aria-hidden="true"
      >
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      <span className="whitespace-nowrap font-bold tracking-tight">
        Connect with Strava
      </span>
    </button>
  );
}

/**
 * Ícone oficial do Strava reutilizável
 */
export function StravaLogoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}
