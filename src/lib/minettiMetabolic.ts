/**
 * Modelo Metabólico de Alberto Minetti (2002) para Custo Energético de Corrida em Gradientes.
 * "Energy cost of walking and running at extreme uphill and downhill slopes"
 * J Appl Physiol 93: 1039–1046, 2002.
 */

export function calculateMinettiCost(gradient: number): number {
  // gradient: decimal (ex: 0.05 para +5%, -0.03 para -3%)
  // Clampa entre -0.35 e +0.35 para evitar instabilidades polinomiais extremas
  const i = Math.max(-0.35, Math.min(0.35, gradient));

  // Fórmula polinomial Minetti para corrida (J / kg / m):
  const cost =
    155.4 * Math.pow(i, 5) -
    30.4 * Math.pow(i, 4) -
    43.3 * Math.pow(i, 3) +
    46.3 * Math.pow(i, 2) +
    19.5 * i +
    3.6;

  return Math.max(1.8, cost); // Custo mínimo de sustentação mecânica
}

/**
 * Razão de custo metabólico em relação ao terreno plano (gradient = 0).
 * Custo no plano: C_r(0) = 3.6 J/kg/m.
 */
export function getMinettiCostRatio(gradient: number): number {
  const flatCost = 3.6;
  const currentCost = calculateMinettiCost(gradient);
  return currentCost / flatCost;
}

/**
 * Converte o ritmo plano ideal (segundos por km) para o ritmo ajustado pelo gradiente,
 * mantendo o MESMO esforço fisiológico/metabólico (VO2 / potência metabólica constante).
 */
export function adjustPaceForGradient(flatPaceSecKm: number, gradient: number): number {
  const ratio = getMinettiCostRatio(gradient);
  // Se o custo metabólico é 1.3x do plano, a velocidade viável é v_plano / 1.3
  // Como pace = 1000 / v, o pace em seg/km é pace_plano * ratio
  // Em descidas muito íngremes (<-8%), há frenagem excêntrica e risco articular,
  // portanto limitamos o ganho de velocidade para segurança realista de prova.
  if (gradient < -0.08) {
    // Descidas muito íngremes não permitem correr infinitamente rápido
    const brakePenalty = Math.abs(gradient + 0.08) * 1.8;
    return flatPaceSecKm * (ratio + brakePenalty);
  }
  return flatPaceSecKm * ratio;
}

/**
 * Classifica a inclinação para visualizações e cards.
 */
export function classifySlope(gradientPercent: number): {
  category: "flat" | "mild-climb" | "steep-climb" | "mild-descent" | "steep-descent";
  label: string;
  color: string;
} {
  if (gradientPercent > 4.5) {
    return { category: "steep-climb", label: "Subida Íngreme", color: "#ef4444" };
  }
  if (gradientPercent > 1.5) {
    return { category: "mild-climb", label: "Subida Leve", color: "#f59e0b" };
  }
  if (gradientPercent < -4.5) {
    return { category: "steep-descent", label: "Descida Forte", color: "#3b82f6" };
  }
  if (gradientPercent < -1.5) {
    return { category: "mild-descent", label: "Descida Leve", color: "#06b6d4" };
  }
  return { category: "flat", label: "Plano / Neutro", color: "#10b981" };
}
