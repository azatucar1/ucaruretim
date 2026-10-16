import test from 'node:test';
import assert from 'node:assert/strict';
import { UyumsoftClient, extractLogin, normalizeItem, unwrapUyumsoft } from '../src/uyumsoftClient.js';

test('Login token ve UyumSecretKey ayrıştırılır', () => {
  assert.deepEqual(extractLogin({ result: { Token: 'token-test', UyumSecretKey: 'secret-test' } }),
    { token: 'token-test', secretKey: 'secret-test' });
  assert.equal(extractLogin({ result: { unknown: true } }), null);
});

test('ArmoniResponse result zorunludur', () => {
  assert.deepEqual(unwrapUyumsoft({ statusCode: 200, result: [] }), []);
  assert.throws(() => unwrapUyumsoft({ data: [] }), /result/);
});

test('Şüpheli qty stok sayılmaz', () => {
  const item = normalizeItem({ result: [{ itemCode: 'U-100', itemName: 'Taş', itemId: 21, qty: 9999 }] }, 'U-100');
  assert.equal(item.name, 'Taş');
  assert.equal(item.itemId, 21);
  assert.equal(item.stock, null);
  assert.equal(item.sales30d, null);
  assert.equal(normalizeItem({ result: [{ itemCode: 'Y-200' }] }, 'U-100'), null);
});

test('POST login ve GetItem Bearer + UyumSecretKey header', async () => {
  const requests = [];
  const requestFetch = async (url, options) => {
    requests.push({url,options});
    return {
      ok: true, status: 200,
      async json() {
        return requests.length === 1
          ? { result: { token: 't', uyumSecretKey: 's' } }
          : { result: [{ itemCode: 'T-500', itemName: 'Boncuk' }] };
      }
    };
  };
  const client = new UyumsoftClient({
    baseUrl: 'https://api-ucardogaltas.eko.uyumcloud.com',
    username: 'test', password: 'test', branchCode: 'TEST', requestFetch
  });
  const item = await client.getItem('T-500');
  assert.equal(item.result[0].itemCode, 'T-500');
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /GNL\/UyumLogin$/);
  assert.match(requests[1].url, /INV\/GetItem$/);
  assert.equal(requests[1].options.headers.Authorization, 'Bearer t');
  assert.equal(requests[1].options.headers.UyumSecretKey, 's');
  assert.equal(JSON.parse(requests[1].options.body).value.code, 'T-500');
  await assert.rejects(() => client.read('/INV/InsertItem', {}), /İzin verilmeyen/);
});

test('HTTPS ve Swagger hostu zorunlu', () => {
  assert.throws(() => new UyumsoftClient({ baseUrl: 'http://api-ucardogaltas.eko.uyumcloud.com' }), /HTTPS/);
  assert.throws(() => new UyumsoftClient({ baseUrl: 'https://wrong.example.com' }), /eşleşmiyor/);
});
