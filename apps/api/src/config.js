import 'dotenv/config';

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export const config = {
  port: positiveNumber(process.env.PORT, 4000),
  demo: process.env.DEMO_MODE === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  uyumsoftBaseUrl: process.env.UYUMSOFT_BASE_URL || 'https://api-ucardogaltas.eko.uyumcloud.com',
  uyumsoftUsername: process.env.UYUMSOFT_USERNAME || '',
  uyumsoftPassword: process.env.UYUMSOFT_PASSWORD || '',
  uyumsoftCoCode: process.env.UYUMSOFT_COCODE || '',
  uyumsoftBranchCode: process.env.UYUMSOFT_BRANCHCODE || '',
  uyumsoftWhouseCode: process.env.UYUMSOFT_WHOUSECODE || '',
  uyumsoftReadsEnabled: process.env.UYUMSOFT_ENABLE_READS === 'true',
  greenMinSales: positiveNumber(process.env.GREEN_MIN_SALES_30D, 30),
  yellowMinSales: positiveNumber(process.env.YELLOW_MIN_SALES_30D, 10),
  targetStockDays: positiveNumber(process.env.TARGET_STOCK_DAYS, 30),
  autoApproveGreen: process.env.AUTO_APPROVE_GREEN === 'true'
};

if (process.env.NODE_ENV === 'production' && config.demo) {
  throw new Error('DEMO_MODE=true üretimde güvenlik nedeniyle yasak.');
}

if (config.yellowMinSales > config.greenMinSales) {
  throw new Error('YELLOW_MIN_SALES_30D, GREEN_MIN_SALES_30D değerinden büyük olamaz.');
}
