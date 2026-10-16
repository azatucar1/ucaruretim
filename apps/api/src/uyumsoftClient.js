// Swagger: Uyumsoft Web ERP v1. Yalnızca read-only servisler kullanılır.
const PREFIX = '/UyumApi/v1';
const READ_ONLY = new Set([
  '/INV/GetItem', '/INV/GetItemList', '/INV/GetBwhItemDetail',
  '/INV/GetItemM', '/PSM/GetInvoice', '/MRC/GetVoucherDItemList',
  '/MRC/GetVoucherMToDList', '/PRD/GetPrdWorderM',
  '/PRD/GetPrdBomM', '/GNL/GetBranchList'
]);

function getField(obj, names) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  for (const name of names) {
    const found = Object.entries(obj).find(([key]) =>
      key.toLowerCase().replace(/[_-]/g, '') === name.toLowerCase().replace(/[_-]/g, '')
    );
    if (found && typeof found[1] === 'string' && found[1]) return found[1];
  }
  return undefined;
}

function nestedObjects(value, depth = 0) {
  if (depth > 3 || !value) return [];
  if (typeof value === 'string') {
    if (!value.trim().startsWith('{')) return [];
    try { return nestedObjects(JSON.parse(value), depth + 1); }
    catch { return []; }
  }
  if (Array.isArray(value)) return value.flatMap(obj => nestedObjects(obj, depth + 1));
  if (typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(v => nestedObjects(v, depth + 1))];
}

export function extractLogin(payload) {
  // Swagger result: System.Object. Canlı örnekle alan adları kesinleştirilecek.
  for (const obj of nestedObjects(payload)) {
    const token = getField(obj, ['accessToken', 'token', 'bearerToken']);
    const secretKey = getField(obj, ['uyumSecretKey', 'secretKey']);
    if (token && secretKey) return { token, secretKey };
  }
  return null;
}

export function unwrapUyumsoft(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Uyumsoft beklenen JSON yanıtını göndermedi.');
  }
  if ('result' in payload) return payload.result;
  if ('Result' in payload) return payload.Result;
  throw new Error('Uyumsoft ArmoniResponse.result alanı bulunamadı.');
}

export function normalizeItem(payload, wantedCode) {
  const result = unwrapUyumsoft(payload);
  const rows = nestedObjects(result);
  const row = rows.find(x => {
    const code = getField(x, ['itemCode', 'code']);
    return code && code.toLocaleUpperCase('tr') === wantedCode.toLocaleUpperCase('tr');
  });
  if (!row) return null;
  const rawId = row.itemId ?? row.ItemId ?? row.id ?? row.Id;
  const itemId = rawId !== null && rawId !== undefined && Number.isSafeInteger(Number(rawId))
    && Number(rawId) > 0 ? Number(rawId) : null;
  return {
    code: getField(row, ['itemCode', 'code']),
    name: getField(row, ['itemName', 'name']) || '',
    itemId,
    // qty alanının depo stok toplamı olduğu doğrulanmadı.
    // Eksik satış bilgisi 0 değil null olarak döner.
    stock: null,
    sales30d: null,
    lastReceiptDate: null,
    lastReceiptQuantity: null
  };
}

export class UyumsoftClient {
  constructor({ baseUrl, username, password, coCode, branchCode, whouseCode, requestFetch = fetch }) {
    const base = new URL(baseUrl);
    if (base.protocol !== 'https:') throw new Error('Uyumsoft bağlantısı HTTPS olmalıdır.');
    if (base.hostname !== 'api-ucardogaltas.eko.uyumcloud.com') {
      throw new Error('Uyumsoft sunucu adı Swagger belgesi ile eşleşmiyor.');
    }
    this.baseUrl = base.origin;
    this.username = username;
    this.password = password;
    this.coCode = coCode || '';
    this.branchCode = branchCode || '';
    this.whouseCode = whouseCode || '';
    this.requestFetch = requestFetch;
    this.session = null;
    this.sessionUntil = 0;
    this.loginPromise = null;
  }

  async request(path, body, headers = {}) {
    const response = await this.requestFetch(this.baseUrl + PREFIX + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) {
      // Şifre, token veya response içeriği loga girmez.
      throw new Error('Uyumsoft HTTP hata kodu: ' + response.status);
    }
    try { return await response.json(); }
    catch { throw new Error('Uyumsoft JSON formatında yanıt göndermedi.'); }
  }

  async login(force = false) {
    if (!force && this.session && Date.now() < this.sessionUntil) return this.session;
    if (this.loginPromise) return this.loginPromise;
    this.loginPromise = (async () => {
      if (!this.username || !this.password) throw new Error('Uyumsoft web servis kullanıcı bilgisi eksik.');
      const payload = await this.request('/GNL/UyumLogin', {
        username: this.username, password: this.password
      });
      const credentials = extractLogin(payload);
      if (!credentials) throw new Error('Uyumsoft login sonucu Token/UyumSecretKey alanları doğrulanamadı.');
      this.session = credentials;
      this.sessionUntil = Date.now() + 10 * 60 * 1000;
      return credentials;
    })();
    try { return await this.loginPromise; }
    finally { this.loginPromise = null; }
  }

  async read(path, body) {
    if (!READ_ONLY.has(path)) throw new Error('İzin verilmeyen Uyumsoft metodu.');
    const send = async force => {
      const auth = await this.login(force);
      return this.request(path, body, {
        Authorization: 'Bearer ' + auth.token,
        UyumSecretKey: auth.secretKey
      });
    };
    try { return unwrapUyumsoft(await send(false)); }
    catch (error) {
      if (!/HTTP hata kodu: 401\b/.test(error.message)) throw error;
      this.session = null;
      return unwrapUyumsoft(await send(true));
    }
  }

  async getItem(code) {
    // Swagger: ArmoniRequest<GetService>, value.code
    const value = { code };
    if (this.coCode) value.coCode = this.coCode;
    if (this.branchCode) value.branchCode = this.branchCode;
    const result = await this.read('/INV/GetItem', { value, pageIndex: 1, pageSize: 20 });
    return { result };
  }

  async getItemList(code, pageIndex = 1) {
    if (!this.branchCode) throw new Error('Stok listesi için işyeri kodu gerekli.');
    const value = {
      branchCode: this.branchCode,
      itemCode: code,
      dontWants: 'ItemImage,ItemEditor,ItemAttribute,PriceList,ItemLang'
    };
    if (this.whouseCode) value.whouseCode = this.whouseCode;
    return this.read('/INV/GetItemList', { value, pageIndex, pageSize: 20 });
  }

  async getWarehouseStock(itemId) {
    const value = { itemId };
    if (this.coCode) value.coCode = this.coCode;
    if (this.branchCode) value.branchCode = this.branchCode;
    return this.read('/INV/GetBwhItemDetail', { value, pageIndex: 1, pageSize: 50 });
  }

  async getStockMovements(itemId, startDate, endDate) {
    const value = { itemId, startDate, endDate };
    if (this.coCode) value.coCode = this.coCode;
    if (this.branchCode) value.branchCode = this.branchCode;
    return this.read('/INV/GetItemM', { value, pageIndex: 1, pageSize: 50 });
  }

  async getRetailSales(itemId, startDate, endDate) {
    if (!this.coCode || !this.branchCode) throw new Error('Firma ve işyeri kodu eksik.');
    const value = { coCode: this.coCode, branchCode: this.branchCode, itemId, startDate, endDate, summary: false };
    if (this.whouseCode) value.whouseCode = this.whouseCode;
    return this.read('/MRC/GetVoucherDItemList', { value, pageIndex: 1, pageSize: 50 });
  }

  async getProductionOrders(workOrderCode) {
    const value = { code: workOrderCode };
    if (this.coCode) value.coCode = this.coCode;
    return this.read('/PRD/GetPrdWorderM', { value, pageIndex: 1, pageSize: 20 });
  }
}
