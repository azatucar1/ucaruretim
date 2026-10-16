import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { getAdminClient } from './supabase.js';

const demoRequests = [];
const demoEvents = [];

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function listRequests() {
  if (config.demo) return [...demoRequests].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return unwrap(await getAdminClient().from('production_requests')
    .select('*').order('created_at', { ascending: false }).limit(200));
}

export async function getRequest(id) {
  if (config.demo) return demoRequests.find(r => r.id === id) || null;
  return unwrap(await getAdminClient().from('production_requests').select('*').eq('id', id).maybeSingle());
}

export async function insertRequest(fields) {
  if (config.demo) {
    const now = new Date().toISOString();
    const row = { id: randomUUID(), status: 'pending_review', created_at: now, updated_at: now, decision_note: null, ...fields };
    demoRequests.unshift(row);
    demoEvents.push({ id: randomUUID(), request_id: row.id, actor_id: row.requested_by, event_type: 'created', details: { status: row.status }, created_at: now });
    return row;
  }
  return unwrap(await getAdminClient().from('production_requests').insert(fields).select('*').single());
}

export async function updateStatus(id, oldStatus, newStatus, actorId, note) {
  if (config.demo) {
    const row = demoRequests.find(r => r.id === id);
    if (!row || row.status !== oldStatus) return null;
    row.status = newStatus;
    row.updated_by = actorId;
    row.decision_note = note || null;
    row.updated_at = new Date().toISOString();
    demoEvents.push({
      id: randomUUID(), request_id: id, actor_id: actorId, event_type: 'status_changed',
      details: { from: oldStatus, to: newStatus, note: note || null }, created_at: row.updated_at
    });
    return row;
  }
  const rows = unwrap(await getAdminClient().from('production_requests')
    .update({ status: newStatus, updated_by: actorId, decision_note: note || null })
    .eq('id', id).eq('status', oldStatus).select('*'));
  return rows[0] || null;
}

export async function listEvents(id) {
  if (config.demo) return demoEvents.filter(e => e.request_id === id).sort((a,b)=>a.created_at.localeCompare(b.created_at));
  return unwrap(await getAdminClient().from('production_events')
    .select('*').eq('request_id', id).order('created_at', { ascending: true }).limit(500));
}
