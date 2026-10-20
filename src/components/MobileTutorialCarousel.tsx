"use client";

import React, { useState, useRef } from "react";
import {
  Trophy,
  Activity,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  CloudSun,
  ShieldCheck,
} from "lucide-react";
import { ConnectWithStravaButton, StravaLogoIcon } from "./ConnectWithStravaButton";

interface MobileTutorialCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectStrava: () => void;
}

export function MobileTutorialCarousel({
  isOpen,
  onClose,
  onConnectStrava,
}: MobileTutorialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const totalCards = 4;

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setCurrentIndex(Math.min(totalCards - 1, Math.max(0, index)));
    }
  };

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: index * width,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const nextCard = () => {
    if (currentIndex < totalCards - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:hidden backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[92vh] flex flex-col rounded-3xl border border-orange-500/40 bg-gradient-to-b from-gray-900/98 via-gray-950 to-gray-950 shadow-2xl shadow-orange-500/10 overflow-hidden">
        {/* Header com indicador de progresso e botão de fechar */}
        <div className="flex items-center justify-between border-b border-gray-800/80 px-4 py-3 bg-gray-950/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-orange-400">
              Tutorial ({currentIndex + 1} de {totalCards})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentIndex < totalCards - 1 && (
              <button
                onClick={() => scrollToIndex(totalCards - 1)}
                className="text-xs font-bold text-gray-400 hover:text-white px-2 py-0.5 rounded transition"
              >
                Pular
              </button>
            )}
            <button
              onClick={onClose}
              title="Fechar tutorial"
              className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition bg-gray-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Carrossel de Cards com Scroll-Snap Touch Nativo */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto flex snap-x snap-mandatory scrollbar-none scroll-smooth touch-pan-x select-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* CARD 1: Como Funciona */}
          <div className="w-full min-w-full shrink-0 snap-center p-4 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md">
                  <Trophy className="h-6 w-6 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                    Passo 1 • Predição Científica
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    Descubra seu Tempo Real de Prova
                  </h3>
                </div>
              </div>

              <p className="mt-3.5 text-xs text-gray-300 leading-relaxed">
                Esqueça calculadoras genéricas da internet. O <strong>Race Predictor PRO</strong> cruza seus treinos com a topografia da prova e o clima da largada para estimar seu resultado com precisão matemática.
              </p>

              <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                <div className="rounded-xl bg-gray-900/90 border border-gray-800 p-2.5 text-gray-200">
                  <span className="block text-base mb-0.5">🏃‍♂️</span>
                  24 Semanas Strava
                </div>
                <div className="rounded-xl bg-gray-900/90 border border-gray-800 p-2.5 text-gray-200">
                  <span className="block text-base mb-0.5">⛰️</span>
                  Relevo GPX Minetti
                </div>
                <div className="rounded-xl bg-gray-900/90 border border-gray-800 p-2.5 text-gray-200">
                  <span className="block text-base mb-0.5">🌤️</span>
                  Clima da Largada
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 animate-pulse">
                <span>Arraste para o lado</span>
                <ArrowRight className="h-4 w-4" />
              </span>
              <button
                onClick={nextCard}
                className="flex items-center gap-1 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition"
              >
                <span>Avançar</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CARD 2: Fisiologia (Daniels & Riegel) */}
          <div className="w-full min-w-full shrink-0 snap-center p-4 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md">
                  <Activity className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Passo 2 • Fisiologia Individual
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    Curva de Fadiga e VDOT Pessoal
                  </h3>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-300 leading-relaxed">
                Analisamos cada corrida das suas últimas <strong>24 semanas</strong> para calibrar:
              </p>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 rounded-xl bg-gray-900/80 p-2.5 border border-gray-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Jack Daniels VDOT:</strong>
                    <p className="text-gray-400 text-[11px] mt-0.5">Sua velocidade de limiar aeróbico e melhores marcas em pista plana.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-gray-900/80 p-2.5 border border-gray-800">
                  <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Expoente de Fadiga (b) de Riegel:</strong>
                    <p className="text-gray-400 text-[11px] mt-0.5">Calcula exatamente o quanto seu ritmo cai conforme a distância da prova aumenta.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <button
                onClick={prevCard}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white px-2 py-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
              <button
                onClick={nextCard}
                className="flex items-center gap-1 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition"
              >
                <span>Avançar</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CARD 3: Altimetria & Clima */}
          <div className="w-full min-w-full shrink-0 snap-center p-4 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-md">
                  <MapPin className="h-6 w-6 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                    Passo 3 • Percurso e Clima
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    Altimetria Minetti e Meteorologia
                  </h3>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-300 leading-relaxed">
                Você pode enviar um <strong>arquivo GPX</strong> ou puxar suas <strong>Rotas Salvas do Strava</strong> com 1 clique.
              </p>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 rounded-xl bg-gray-900/80 p-2.5 border border-gray-800">
                  <TrendingUp className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Custo Mecânico de Minetti:</strong>
                    <p className="text-gray-400 text-[11px] mt-0.5">Ajusta o ritmo quilômetro a quilômetro compensando subidas e descidas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-gray-900/80 p-2.5 border border-gray-800">
                  <CloudSun className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Clima da Largada (Open-Meteo):</strong>
                    <p className="text-gray-400 text-[11px] mt-0.5">Ajusta o desgaste por temperatura, ponto de orvalho e vento no dia da prova.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <button
                onClick={prevCard}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white px-2 py-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
              <button
                onClick={nextCard}
                className="flex items-center gap-1 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition"
              >
                <span>Último Passo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CARD 4: Conectar ao Strava (CTA Oficial) */}
          <div className="w-full min-w-full shrink-0 snap-center p-4 flex flex-col justify-between min-h-[340px] bg-gradient-to-br from-gray-950 via-[#FC4C02]/10 to-gray-950">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FC4C02] text-white shadow-lg shadow-orange-600/30">
                  <StravaLogoIcon className="h-6 w-6 fill-current" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                    Passo 4 • Conexão Oficial
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    Tudo Pronto para Começar!
                  </h3>
                </div>
              </div>

              <p className="mt-3.5 text-xs text-gray-300 leading-relaxed">
                Conecte sua conta do <strong>Strava</strong> para calibrar seu perfil e gerar seus tempos <strong>Médio (Alvo)</strong>, <strong>Otimista</strong> e <strong>Conservador</strong> instantaneamente.
              </p>

              <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-gray-900/90 p-3 border border-gray-800 text-xs text-gray-300">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Conexão oficial segura. Seus treinos são calculados localmente.</span>
              </div>
            </div>

            {/* Botão Oficial do Strava */}
            <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2">
              <ConnectWithStravaButton
                onClick={onConnectStrava}
                size="lg"
                className="w-full shadow-lg shadow-orange-500/25 py-3"
              />
              <p className="text-[11px] text-center text-gray-500">
                100% gratuito • Gráficos, estratégia e altimetria
              </p>
            </div>
          </div>
        </div>

        {/* Dots de Paginação e Navegação */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-950/90 border-t border-gray-900 shrink-0">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalCards }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "w-6 bg-orange-500 shadow-sm shadow-orange-500/50"
                    : "w-2 bg-gray-700 hover:bg-gray-500"
                }`}
                aria-label={`Ir para o card ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[11px] text-gray-500 font-mono">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>
      </div>
    </div>
  );
}
