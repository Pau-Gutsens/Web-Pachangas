export const formatCurrency = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString('es-ES')} M€`;
  }
  return `${value.toLocaleString('es-ES')} M€`;
};

export const formatPoints = (value: number): string => {
  return `${value.toFixed(1)} pts`;
};
