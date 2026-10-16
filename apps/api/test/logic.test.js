import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateVelocity, suggestProductionQuantity, canChangeStatus } from '../src/logic.js';

test('30 günlük satışa göre renkler', () => {
  assert.equal(calculateVelocity(31), 'green');
  assert.equal(calculateVelocity(10), 'yellow');
  assert.equal(calculateVelocity(9), 'red');
  assert.equal(calculateVelocity(null), 'unknown');
  assert.equal(calculateVelocity(undefined), 'unknown');
});

test('stok eksiği için pozitif üretim önerisi', () => {
  assert.equal(suggestProductionQuantity(50, 12), 38);
  assert.equal(suggestProductionQuantity(2, 12), 0);
  assert.equal(suggestProductionQuantity(undefined, 12), null);
});

test('onay ve üretim izinleri', () => {
  assert.equal(canChangeStatus('sales','pending_review','approved'), false);
  assert.equal(canChangeStatus('manager','pending_review','approved'), true);
  assert.equal(canChangeStatus('production','approved','in_production'), true);
  assert.equal(canChangeStatus('production','in_production','completed'), true);
  assert.equal(canChangeStatus('sales','approved','completed'), false);
});
