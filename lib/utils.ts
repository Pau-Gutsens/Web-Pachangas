/**
 * Utilidades de formateo para EGOL Fantasy según EGOL_FANTASY.md (Sección 7)
 * Todas las cifras de dinero se manejan como enteros en miles de euros (K€).
 * Ej: 20 M€ = 20.000 K€
 */

export const formatCurrency = (kEuros: number): string => {
  const isNegative = kEuros < 0;
  const abs = Math.abs(kEuros);

  if (abs >= 1000) {
    const millions = abs / 1000;
    const rounded = Number(millions.toFixed(2));
    const formatted = rounded.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return `${isNegative ? '-' : ''}${formatted} M€`;
  }

  const formatted = Math.round(abs).toLocaleString('es-ES');
  return `${isNegative ? '-' : ''}${formatted} K€`;
};

export const formatPercent = (pct: number): string => {
  const rounded = Number(pct.toFixed(2));
  const sign = rounded > 0 ? '+' : '';
  const formatted = rounded.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${sign}${formatted} %`;
};

export const formatPoints = (value: number, decimals: number = 0): string => {
  if (decimals === 0) {
    return `${Math.round(value)} pts`;
  }
  return `${Number(value.toFixed(decimals)).toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} pts`;
};
