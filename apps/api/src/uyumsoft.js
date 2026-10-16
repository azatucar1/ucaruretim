import { config } from './config.js';
import { calculateVelocity, suggestProductionQuantity } from './logic.js';

// BUNLAR GERÇEK UYUMSOFT ÜRÜN VERİLERİ DEĞİLDİR.
// Sadece DEMO_MODE=true ortamında iş akışını göstermek için kullanılır.
const demoProducts = {
  'ORNEK-001': { code: 'ORNEK-001', name: 'Örnek 8 mm boncuk', stock: 12, sales30d: 83, lastReceiptDate: '2026-10-01', lastReceiptQuantity: 120 },
  'ORNEK-002': { code: 'ORNEK-002', name: 'Örnek bileklik', stock: 30, sales30d: 17, lastReceiptDate: '2026-09-20', lastReceiptQuantity: 36 },
  'ORNEK-003': { code: 'ORNEK-003', name: 'Örnek kolye', stock: 55, sales30d: 2, lastReceiptDate: '2026-08-15', lastReceiptQuantity: 72 }
};

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Buradaki alan adları bir entegrasyon sözleşmesidir, gerçek Uyumsoft formatı
// GELDİĞİNDE birlikte eşleştirilecektir. Hiçbir tahmini değeri sıfır saymayız.
function normalize(record, requestedCode) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Uyumsoft verisi beklenen JSON nesnesi değil.');
  }
  return {
    code: String(record.code ?? record.stockCode ?? requestedCode),
    name: String(record.name ?? record.stockName ?? ''),
    stock: nullableNumber(record.stock ?? record.onHand),
    sales30d: nullableNumber(record.sales30d ?? record.sales_30_days),
    lastReceiptDate: record.lastReceiptDate ?? null,
    lastReceiptQuantity: nullableNumber(record.lastReceiptQuantity)
  };
}

function decorate(insight) {
  return {
    ...insight,
    velocity: calculateVelocity(insight.sales30d, config.greenMinSales, config.yellowMinSales),
    suggestedQuantity: suggestProductionQuantity(insight.sales30d, insight.stock, config.targetStockDays)
  };
}

export function isUyumsoftConfigured() {
  return config.demo || Boolean(config.uyumsoftInsightUrl);
}

export async function lookupProduct(productCode) {
  if (config.demo) {
    const product = demoProducts[productCode.toUpperCase()];
    return product ? decorate(product) : null;
  }

  if (!config.uyumsoftInsightUrl) return null;

  const url = new URL(config.uyumsoftInsightUrl);
  if (url.protocol !== 'https:') throw new Error('Uyumsoft web servisi HTTPS olmalı.');
  url.searchParams.set('stockCode', productCode);
  const headers = { Accept: 'application/json' };
  if (config.uyumsoftApiToken) headers.Authorization = 'Bearer ' + config.uyumsoftApiToken;

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error('Uyumsoft ürün sorgusu başarısız (HTTP ' + response.status + ').');
  }
  const payload = await response.json();
  // Tek ürün için bir JSON nesnesi veya { data: { ... } } bekler.
  // Gerçek Uyumsoft yanıtı farklı ise adaptör güncellenmelidir.
  return decorate(normalize(payload.data ?? payload, productCode));
}
