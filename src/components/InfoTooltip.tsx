"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";

interface InfoTooltipProps {
  title: string;
  formula?: string;
  bibliography: string;
  explanation?: string;
  align?: "left" | "right" | "center";
}

export function InfoTooltip({
  title,
  formula,
  bibliography,
  explanation,
  align = "center",
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const alignClasses =
    align === "right"
      ? "sm:right-0 sm:left-auto sm:translate-x-0"
      : align === "left"
      ? "sm:left-0 sm:right-auto sm:translate-x-0"
      : "sm:left-1/2 sm:-translate-x-1/2";

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center text-left"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-orange-400 hover:bg-gray-800 transition focus:outline-none"
        title="Ver fórmula e bibliografia"
        aria-label="Ver fórmula e bibliografia"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop to prevent background interactions and tap outside to dismiss */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs sm:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* Tooltip Card: anchored fixed at bottom on mobile, absolute popover on desktop */}
          <div
            className={`fixed inset-x-3 bottom-4 z-50 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:inset-auto sm:absolute sm:bottom-full sm:mb-2 sm:w-80 rounded-xl border border-gray-700 bg-gray-900/98 p-3.5 text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150 ${alignClasses}`}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h5 className="font-bold text-white text-[12px]">{title}</h5>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1 text-gray-400 hover:text-white rounded sm:hidden"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formula && (
              <div className="mt-2 rounded-lg bg-gray-950 p-2 border border-gray-800/80 font-mono text-[11px] text-orange-400 break-words">
                <span className="text-[10px] text-gray-500 block uppercase font-sans font-semibold mb-0.5">
                  Fórmula Matemática:
                </span>
                {formula}
              </div>
            )}

            {explanation && (
              <div className="mt-2 text-gray-300 text-[11px] leading-relaxed">
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                  Aplicação:
                </span>
                {explanation}
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-gray-800 text-[10px] text-gray-400 leading-normal">
              <strong className="text-gray-300">Bibliografia:</strong> {bibliography}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
