/**
 * Formatadores centralizados para o ERP Recepção.
 * Evita duplicação de lógica de formatação em 14+ componentes.
 */

export const formatCurrency = (value: number): string =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatCurrencyCompact = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const clean = String(dateStr).trim().split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr || '—';
  }
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T');
    if (parts.length === 2) {
      const dParts = parts[0].split('-');
      if (dParts.length === 3) {
        const timePart = parts[1].substring(0, 5);
        return `${dParts[2]}/${dParts[1]}/${dParts[0]} ${timePart}`;
      }
    }
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr || '—';
  }
};

export const formatPercent = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`;

export const formatNumber = (value: number, decimals = 0): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
