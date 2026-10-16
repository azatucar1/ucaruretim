// Hız rengi, talep aciliyetinden farklıdır.
// Uyumsoft sayıları doğrulanmadan bu kurallarla otomatik üretim yapılmaz.
export function calculateVelocity(sales30d, greenMinimum = 30, yellowMinimum = 10) {
  if (!Number.isFinite(sales30d) || sales30d < 0) return 'unknown';
  if (sales30d >= greenMinimum) return 'green';
  if (sales30d >= yellowMinimum) return 'yellow';
  return 'red';
}

export function suggestProductionQuantity(sales30d, stock, coverageDays = 30) {
  if (!Number.isFinite(sales30d) || sales30d < 0 || !Number.isFinite(stock) || stock < 0) return null;
  if (!Number.isFinite(coverageDays) || coverageDays <= 0) return null;
  const targetStock = Math.ceil((sales30d / 30) * coverageDays);
  return Math.max(0, targetStock - stock);
}

export const statuses = ['pending_review', 'approved', 'in_production', 'completed', 'rejected'];
export const roles = ['sales', 'production', 'manager', 'admin'];

export function canChangeStatus(role, from, to) {
  if (from === 'pending_review' && ['approved', 'rejected'].includes(to)) {
    return ['manager', 'admin'].includes(role);
  }
  if (from === 'approved' && to === 'in_production') {
    return ['production', 'manager', 'admin'].includes(role);
  }
  if (from === 'in_production' && to === 'completed') {
    return ['production', 'manager', 'admin'].includes(role);
  }
  return false;
}
