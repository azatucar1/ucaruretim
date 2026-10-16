import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { config } from './config.js';
import { requireAuth } from './auth.js';
import { canChangeStatus, statuses } from './logic.js';
import { isUyumsoftConfigured, lookupProduct } from './uyumsoft.js';
import { getRequest, insertRequest, listEvents, listRequests, updateStatus } from './store.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.corsOrigin.split(',').map(s => s.trim()) }));
app.use(express.json({ limit: '32kb' }));

function handle(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
}

const requestSchema = z.object({
  product_code: z.string().trim().min(1).max(80),
  product_name: z.string().trim().max(160).optional(),
  requested_quantity: z.number().int().min(1).max(100000),
  priority: z.enum(['urgent', 'normal', 'low']),
  notes: z.string().trim().max(1000).optional()
}).strict();

const transitionSchema = z.object({
  status: z.enum(statuses),
  note: z.string().trim().max(1000).optional()
}).strict();

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: config.demo ? 'demo' : 'live',
    databaseConfigured: Boolean(config.supabaseUrl && config.supabaseServiceRoleKey),
    uyumsoftConfigured: isUyumsoftConfigured(),
    caution: config.demo ? 'Yalnızca örnek veriler. Gerçek stok/satış değildir.' : undefined
  });
});

app.use('/api', requireAuth);

app.get('/api/me', (req, res) => {
  res.json({ user: req.actor, demo: config.demo });
});

app.get('/api/products/:code', handle(async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code || code.length > 80) return res.status(400).json({ error: 'Geçerli stok kodu girin.' });
  if (!isUyumsoftConfigured()) {
    return res.status(503).json({ error: 'Uyumsoft bağlantısı henüz yapılmadı. Manuel talep açabilirsiniz.' });
  }
  const insight = await lookupProduct(code);
  if (!insight) return res.status(404).json({ error: 'Ürün bulunamadı.' });
  res.json({ product: insight, demo: config.demo });
}));

app.get('/api/requests', handle(async (_req, res) => {
  const requests = await listRequests();
  res.json({ requests });
}));

app.get('/api/overview', handle(async (_req, res) => {
  const requests = await listRequests();
  const byStatus = Object.fromEntries(statuses.map(status => [status, requests.filter(r => r.status === status).length]));
  const urgent = requests.filter(r => r.priority === 'urgent' && !['completed','rejected'].includes(r.status)).length;
  res.json({ total: requests.length, byStatus, urgent, limitedToLast: 200 });
}));

app.post('/api/requests', handle(async (req, res) => {
  if (!['sales','production','manager','admin'].includes(req.actor.role)) {
    return res.status(403).json({ error: 'Talep açma yetkiniz yok.' });
  }
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Talep bilgileri geçersiz.', details: parsed.error.flatten() });
  const input = parsed.data;
  const insight = await lookupProduct(input.product_code);
  const velocity = insight?.velocity || 'unknown';

  // Gerçek veri kuralları doğrulanana kadar otomatik onay yapılmaz.
  const autoApproved = false;
  const row = await insertRequest({
    product_code: input.product_code,
    product_name: insight?.name || input.product_name || '',
    requested_quantity: input.requested_quantity,
    suggested_quantity: insight?.suggestedQuantity ?? null,
    stock_on_hand: insight?.stock ?? null,
    sales_30d: insight?.sales30d ?? null,
    last_receipt_date: insight?.lastReceiptDate ?? null,
    last_receipt_quantity: insight?.lastReceiptQuantity ?? null,
    velocity,
    priority: input.priority,
    notes: input.notes || '',
    requested_by: req.actor.id,
    status: autoApproved ? 'approved' : 'pending_review'
  });
  res.status(201).json({ request: row });
}));

app.get('/api/requests/:id/events', handle(async (req, res) => {
  const existing = await getRequest(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Talep bulunamadı.' });
  const events = await listEvents(req.params.id);
  res.json({ events });
}));

app.patch('/api/requests/:id/status', handle(async (req, res) => {
  const parsed = transitionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Geçersiz durum değişikliği.' });
  const existing = await getRequest(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Talep bulunamadı.' });
  if (!canChangeStatus(req.actor.role, existing.status, parsed.data.status)) {
    return res.status(403).json({ error: 'Bu durum geçişi için yetkiniz yok.' });
  }

  const updated = await updateStatus(req.params.id, existing.status, parsed.data.status, req.actor.id, parsed.data.note);
  if (!updated) return res.status(409).json({ error: 'Talep başka biri tarafından güncellenmiş. Sayfayı yenileyin.' });
  res.json({ request: updated });
}));

app.use((error, _req, res, _next) => {
  // Servis token'ları veya veritabanı bağlantı dizesi istemciye döndürülmez.
  console.error('[api]', error?.message || error);
  res.status(500).json({ error: 'Sunucu işlemi tamamlayamadı. API kayıtlarını kontrol edin.' });
});

app.listen(config.port, config.demo ? '127.0.0.1' : '0.0.0.0', () => {
  console.log('Uçar Üretim API http://localhost:' + config.port + (config.demo ? ' (DEMO)' : ''));
});
