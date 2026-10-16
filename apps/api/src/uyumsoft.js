import { config } from './config.js';
import { calculateVelocity, suggestProductionQuantity } from './logic.js';
import { UyumsoftClient, normalizeItem } from './uyumsoftClient.js';

// Kesinlikle gerçek stok/satış verisi değildir.
const demoProducts = {
  'ORNEK-001': { code: 'ORNEK-001', name: 'Örnek 8 mm boncuk', stock: 12, sales30d: 83, lastReceiptDate: '2026-10-01', lastReceiptQuantity: 120 },
  'ORNEK-002': { code: 'ORNEK-002', name: 'Örnek bileklik', stock: 30, sales30d: 17, lastReceiptDate: '2026-09-20', lastReceiptQuantity: 36 },
  'ORNEK-003': { code: 'ORNEK-003', name: 'Örnek kolye', stock: 55, sales30d: 2, lastReceiptDate: '2026-08-15', lastReceiptQuantity: 72 }
};

function decorate(insight) {
  return {
    ...insight,
    velocity: calculateVelocity(insight.sales30d, config.greenMinSales, config.yellowMinSales),
    suggestedQuantity: suggestProductionQuantity(insight.sales30d, insight.stock, config.targetStockDays)
  };
}

let client;
function getClient() {
  if (!client) client = new UyumsoftClient({
    baseUrl: config.uyumsoftBaseUrl, username: config.uyumsoftUsername,
    password: config.uyumsoftPassword, coCode: config.uyumsoftCoCode,
    branchCode: config.uyumsoftBranchCode, whouseCode: config.uyumsoftWhouseCode
  });
  return client;
}

export function isUyumsoftConfigured() {
  return config.demo || Boolean(config.uyumsoftReadsEnabled &&
    config.uyumsoftUsername && config.uyumsoftPassword && config.uyumsoftBranchCode);
}

export async function lookupProduct(productCode) {
  if (config.demo) {
    const product = demoProducts[productCode.toUpperCase()];
    return product ? decorate(product) : null;
  }
  if (!isUyumsoftConfigured()) return null;
  const response = await getClient().getItem(productCode);
  const item = normalizeItem(response, productCode);
  // Ürün adı ve kodu alınabilir. Stok / net satış / son giriş için canlı örnek
  // ve depo-fatura eşleştirmeleri gelmeden sayı hesaplaması yapılmaz.
  return item ? decorate(item) : null;
}
