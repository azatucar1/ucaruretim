import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Activity, AlertTriangle, ArrowRight, Bell, Check, CheckCircle2, ClipboardList,
  Clock3, Database, Factory, History, LayoutDashboard, LogOut, Menu, Package,
  PlayCircle, Plus, RefreshCw, Search, ShieldCheck, TrendingUp, X, XCircle
} from 'lucide-react';
import { apiFetch } from './api.js';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = !DEMO_MODE && SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const roleOptions = [
  { value: 'sales', label: 'Satış (Naif / Abdül)' },
  { value: 'production', label: 'Üretim (Narin Hanım)' },
  { value: 'manager', label: 'Yönetici' }
];
const roleLabels = { sales: 'Satış', production: 'Üretim', manager: 'Yönetici', admin: 'Sistem yöneticisi' };
const statusLabels = {
  pending_review: 'Onay bekliyor', approved: 'Onaylandı',
  in_production: 'Üretimde', completed: 'Tamamlandı', rejected: 'Reddedildi'
};
const statusStyle = {
  pending_review: 'pending', approved: 'approved',
  in_production: 'production', completed: 'completed', rejected: 'rejected'
};
const velocityLabels = { green: 'Hızlı dönen', yellow: 'Orta hız', red: 'Yavaş dönen', unknown: 'Veri bekleniyor' };
const priorityLabels = { urgent: 'Acil', normal: 'Normal', low: 'Düşük' };

function formatNumber(value) {
  return value === null || value === undefined ? '—' : new Intl.NumberFormat('tr-TR').format(value);
}
function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatusTag({ status }) {
  return <span className={'pill status-' + (statusStyle[status] || 'pending')}>{statusLabels[status] || status}</span>;
}
function VelocityTag({ velocity }) {
  return <span className={'pill velocity-' + (velocity || 'unknown')}><span className="pill-dot" />{velocityLabels[velocity] || velocityLabels.unknown}</span>;
}
function PriorityTag({ priority }) {
  return <span className={'priority priority-' + priority}>{priorityLabels[priority] || priority}</span>;
}

function Logo({ small = false }) {
  return <div className="brand-lockup">
    <span className="brand-symbol"><Factory size={small ? 19 : 22} strokeWidth={2.2} /></span>
    <span className="brand-type"><strong>UÇAR</strong><small>ÜRETİM</small></span>
  </div>;
}

const navLinks = [
  { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'requests', label: 'Üretim Talepleri', icon: ClipboardList },
  { id: 'new', label: 'Yeni Talep Oluştur', icon: Plus },
  { id: 'integration', label: 'Bağlantılar', icon: Database }
];

function Sidebar({ active, setActive, open, close, totalPending }) {
  return <>
    {open && <button className="sidebar-scrim" aria-label="Menüyü kapat" onClick={close} />}
    <aside className={'sidebar ' + (open ? 'sidebar-open' : '')}>
      <div className="sidebar-logo"><Logo /></div>
      <div className="sidebar-caption">ÜRETİM YÖNETİMİ</div>
      <nav className="sidebar-nav" aria-label="Ana menü">
        {navLinks.map(({ id, label, icon: Icon }) =>
          <button key={id} className={'sidebar-link ' + (active === id ? 'active' : '')}
            onClick={() => { setActive(id); close(); }}>
            <Icon size={19} /><span>{label}</span>
            {id === 'requests' && totalPending > 0 && <span className="nav-counter">{totalPending}</span>}
          </button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help-icon"><ShieldCheck size={19} /></div>
        <strong>Kontrollü üretim</strong>
        <p>Her talep, onay ve üretim aşaması kayıt altında tutulur.</p>
        <small>v0.1 • İlk sürüm</small>
      </div>
    </aside>
  </>;
}

function KpiCard({ label, value, icon: Icon, note, tone }) {
  return <div className="kpi-card">
    <div className="kpi-top"><span className={'kpi-icon tone-' + tone}><Icon size={21} /></span><span className="kpi-eyebrow">{note}</span></div>
    <div className="kpi-value">{formatNumber(value)}</div><div className="kpi-label">{label}</div>
  </div>;
}

function EmptyState({ onNew, title = 'Henüz üretim talebi yok', description = 'Yeni bir talep açtığınızda burada görünecek.' }) {
  return <div className="empty-state">
    <span className="empty-icon"><Package size={30} /></span>
    <h3>{title}</h3><p>{description}</p>
    {onNew && <button className="btn btn-accent" onClick={onNew}><Plus size={16} /> Yeni talep aç</button>}
  </div>;
}

function Dashboard({ requests, overview, openNew, openRequests, openDetails, health }) {
  const pending = overview?.byStatus?.pending_review || 0;
  const producing = overview?.byStatus?.in_production || 0;
  const completed = overview?.byStatus?.completed || 0;
  const latest = requests.slice(0, 5);
  return <>
    <div className="page-heading"><div><div className="eyebrow">OPERASYON MERKEZİ</div><h1>Genel Bakış</h1>
      <p>Satış taleplerinden üretim tamamlanana kadar bütün süreç tek ekranda.</p></div>
      <button className="btn btn-accent" onClick={openNew}><Plus size={18} /> Yeni Üretim Talebi</button>
    </div>
    <div className="kpi-grid">
      <KpiCard label="Toplam Talep" value={overview?.total || 0} icon={ClipboardList} tone="navy" note="Son 200 kayıt" />
      <KpiCard label="Onay Bekliyor" value={pending} icon={Clock3} tone="orange" note="Yönetici kararı" />
      <KpiCard label="Üretimde" value={producing} icon={Factory} tone="blue" note="Aktif işler" />
      <KpiCard label="Tamamlanan" value={completed} icon={CheckCircle2} tone="green" note="Bitirilen işler" />
    </div>
    <div className="dashboard-grid">
      <section className="panel panel-tall">
        <div className="panel-heading"><div><h2>Son Üretim Talepleri</h2><p>En son oluşturulan talepler</p></div>
          <button className="link-button" onClick={openRequests}>Tümünü Gör <ArrowRight size={16} /></button></div>
        {latest.length ? <div className="latest-list">{latest.map(row =>
          <button className="latest-row" key={row.id} onClick={() => openDetails(row)}>
            <div className="latest-item-icon"><Package size={19} /></div>
            <div className="latest-body"><strong>{row.product_name || row.product_code}</strong><span>{row.product_code} · {formatDate(row.created_at)}</span></div>
            <div className="latest-meta"><StatusTag status={row.status} /><span>{formatNumber(row.requested_quantity)} adet</span></div>
          </button>
        )}</div> : <EmptyState onNew={openNew} />}
      </section>
      <section className="panel tip-panel">
        <div className="panel-heading"><div><h2>Üretim Karar Desteği</h2><p>Renklerin anlamı</p></div><TrendingUp size={20} className="muted-icon" /></div>
        <div className="legend-row"><VelocityTag velocity="green" /><p>Hızlı dönen ürün, tekrar üretime aday.</p></div>
        <div className="legend-row"><VelocityTag velocity="yellow" /><p>Orta hız, yönetici değerlendirmeli.</p></div>
        <div className="legend-row"><VelocityTag velocity="red" /><p>Yavaş dönen ürün, yönetici kararı şart.</p></div>
        <div className="legend-note"><AlertTriangle size={17} /> Talep aciliyeti bu satış hızı renginden ayrıdır.</div>
        <div className="integration-mini"><div className="integration-mini-icon"><Database size={18} /></div>
          <div><strong>{health?.mode === 'demo' ? 'Demo çalışma modu' : (health?.uyumsoftConfigured ? 'Uyumsoft ayarlandı' : 'Uyumsoft bekleniyor')}</strong>
          <small>{health?.mode === 'demo' ? 'Örnek verilerle test' : 'Gerçek entegrasyonu ayrıca doğrulamak gerekir'}</small></div></div>
      </section>
    </div>
  </>;
}

function ActionButtons({ row, role, onChange }) {
  const canApprove = ['manager','admin'].includes(role) && row.status === 'pending_review';
  const canStart = ['production','manager','admin'].includes(role) && row.status === 'approved';
  const canFinish = ['production','manager','admin'].includes(role) && row.status === 'in_production';
  if (!canApprove && !canStart && !canFinish) return null;
  return <div className="table-actions">
    {canApprove && <>
      <button className="mini-action mini-success" onClick={() => onChange(row, 'approved')}><Check size={15} /> Onayla</button>
      <button className="mini-action mini-danger" onClick={() => onChange(row, 'rejected')}><X size={15} /> Reddet</button>
    </>}
    {canStart && <button className="mini-action mini-primary" onClick={() => onChange(row, 'in_production')}><PlayCircle size={15} /> Üretime al</button>}
    {canFinish && <button className="mini-action mini-success" onClick={() => onChange(row, 'completed')}><CheckCircle2 size={15} /> Tamamla</button>}
  </div>;
}

function RequestsPage({ requests, openNew, onStatusChange, onDetails, role, refreshing, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const filtered = useMemo(() => requests.filter(row =>
    (filter === 'all' || row.status === filter) &&
    (urgency === 'all' || row.priority === urgency) &&
    (row.product_code + ' ' + row.product_name).toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))
  ), [requests, search, filter, urgency]);
  return <>
    <div className="page-heading"><div><div className="eyebrow">TALEP YÖNETİMİ</div><h1>Üretim Talepleri</h1>
      <p>Talep durumlarını, önceliği ve ürünün satış hızını takip edin.</p></div>
      <button className="btn btn-accent" onClick={openNew}><Plus size={18} /> Talep Oluştur</button></div>
    <section className="panel">
      <div className="filters">
        <div className="search-field"><Search size={19} /><input aria-label="Ürün ara" placeholder="Stok kodu veya ürün adı ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="form-select filter-select" aria-label="Durum filtresi" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">Tüm durumlar</option>{Object.entries(statusLabels).map(([code,label])=><option key={code} value={code}>{label}</option>)}
        </select>
        <select className="form-select filter-select" aria-label="Öncelik filtresi" value={urgency} onChange={e=>setUrgency(e.target.value)}>
          <option value="all">Tüm öncelikler</option>{Object.entries(priorityLabels).map(([code,label])=><option key={code} value={code}>{label}</option>)}
        </select>
        <button className="btn btn-outline-soft btn-icon-only" onClick={onRefresh} aria-label="Listeyi yenile" disabled={refreshing}><RefreshCw size={18} /></button>
      </div>
      {filtered.length ? <div className="table-responsive"><table className="table production-table">
        <thead><tr><th>ÜRÜN</th><th>SATIŞ HIZI</th><th>ÖNCELİK</th><th>ADET</th><th>DURUM</th><th>TALEP TARİHİ</th><th>İŞLEM</th></tr></thead>
        <tbody>{filtered.map(row=><tr key={row.id}>
          <td><div className="product-cell"><strong>{row.product_name || 'Ürün adı bekleniyor'}</strong><small>{row.product_code}</small></div></td>
          <td><VelocityTag velocity={row.velocity} /></td>
          <td><PriorityTag priority={row.priority} /></td>
          <td><strong>{formatNumber(row.requested_quantity)}</strong></td>
          <td><StatusTag status={row.status} /></td>
          <td className="date-cell">{formatDate(row.created_at)}</td>
          <td><div className="cell-controls"><button className="mini-action" onClick={()=>onDetails(row)}>Detay</button>
            <ActionButtons row={row} role={role} onChange={onStatusChange} /></div></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState onNew={openNew} title="Bu filtrede talep bulunamadı" description="Filtreleri değiştirebilir veya yeni talep oluşturabilirsiniz." />}
      <div className="panel-footer">Gösterilen: {filtered.length} talep · İlk sürümde en son 200 kayıt listelenir.</div>
    </section>
  </>;
}

function InfoStat({ label, value }) {
  return <div className="insight-stat"><small>{label}</small><strong>{value}</strong></div>;
}

function NewRequest({ onLookup, onSave, saving, demo }) {
  const [code,setCode] = useState('');
  const [name,setName] = useState('');
  const [quantity,setQuantity] = useState('');
  const [priority,setPriority] = useState('normal');
  const [notes,setNotes] = useState('');
  const [insight,setInsight] = useState(null);
  const [lookupError,setLookupError] = useState('');
  const [searching,setSearching] = useState(false);
  async function lookup(e) {
    e?.preventDefault();
    if (!code.trim()) return;
    setSearching(true); setLookupError(''); setInsight(null);
    try {
      const result = await onLookup(code.trim());
      setInsight(result.product);
      if (result.product.name) setName(result.product.name);
      if (result.product.suggestedQuantity > 0) setQuantity(String(result.product.suggestedQuantity));
    } catch (error) { setLookupError(error.message); }
    finally { setSearching(false); }
  }
  async function submit(e) {
    e.preventDefault();
    await onSave({
      product_code: code.trim(), product_name: name.trim(),
      requested_quantity: Number(quantity), priority, notes: notes.trim()
    });
  }
  return <>
    <div className="page-heading"><div><div className="eyebrow">SATIŞ EKİBİ</div><h1>Yeni Üretim Talebi</h1>
      <p>Stok kodunu girin, satış hızını kontrol edin ve üretim talebini oluşturun.</p></div></div>
    <div className="form-layout">
      <section className="panel form-panel">
        <div className="step-header"><span className="step-number">1</span><div><h2>Ürün Bilgileri</h2><p>Ürün kodu Uyumsoft üzerinden sorgulanır.</p></div></div>
        {demo && <div className="demo-helper"><strong>Deneme kodları:</strong>
          {['ORNEK-001','ORNEK-002','ORNEK-003'].map(item=><button type="button" key={item}
            onClick={()=>{setCode(item);setInsight(null);setLookupError('');}}>{item}</button>)}</div>}
        <form onSubmit={submit}>
          <div className="mb-3"><label className="form-label">Stok Kodu <span className="required">*</span></label>
            <div className="lookup-field"><input className="form-control" required value={code}
              onChange={e=>{setCode(e.target.value);setInsight(null);}} placeholder="Örn. ORNEK-001" maxLength={80} />
              <button type="button" onClick={lookup} disabled={searching || !code.trim()} className="btn btn-dark-search">
                {searching ? 'Sorgulanıyor...' : <><Search size={16} /> Sorgula</>}</button></div>
          </div>
          {lookupError && <div className="alert alert-warning small">{lookupError} Ürünü manuel girerek talep açabilirsiniz.</div>}
          {insight && <div className="insight-box">
            <div className="insight-heading"><span><CheckCircle2 size={17} /> Ürün bilgisi getirildi</span><VelocityTag velocity={insight.velocity} /></div>
            <div className="insight-grid">
              <InfoStat label="Mevcut stok" value={formatNumber(insight.stock)} />
              <InfoStat label="Son 30 gün satış" value={formatNumber(insight.sales30d)} />
              <InfoStat label="Son giriş adedi" value={formatNumber(insight.lastReceiptQuantity)} />
              <InfoStat label="Son giriş tarihi" value={formatDate(insight.lastReceiptDate)} />
              <InfoStat label="Önerilen üretim" value={formatNumber(insight.suggestedQuantity)} />
            </div>
          </div>}
          <div className="mb-3"><label className="form-label">Ürün Adı</label><input className="form-control" value={name}
            onChange={e=>setName(e.target.value)} maxLength={160} placeholder="Ürün adı (opsiyonel)" /></div>
          <div className="step-header section-spacing"><span className="step-number">2</span><div><h2>Talep Detayları</h2><p>Adet ve öncelik satış ekibi tarafından belirlenir.</p></div></div>
          <div className="row g-3">
            <div className="col-sm-5"><label className="form-label">İstenen Üretim Adedi <span className="required">*</span></label>
              <div className="input-group"><input required type="number" className="form-control" min="1" max="100000" step="1" value={quantity}
                onChange={e=>setQuantity(e.target.value)} placeholder="Örn. 50"/><span className="input-group-text">adet</span></div></div>
            <div className="col-sm-7"><label className="form-label">Talep Önceliği</label><select className="form-select" value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="urgent">Acil</option><option value="normal">Normal</option><option value="low">Düşük</option></select></div>
          </div>
          <div className="mt-3 mb-4"><label className="form-label">Açıklama / Not</label><textarea className="form-control"
            rows="3" maxLength={1000} placeholder="Talep gerekçesi veya üretim notu..." value={notes} onChange={e=>setNotes(e.target.value)} /></div>
          <button className="btn btn-accent w-100 justify-content-center py-3" type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : <><Check size={18} /> Üretim Talebini Kaydet</>}</button>
        </form>
      </section>
      <aside className="side-tips">
        <div className="side-tips-icon"><Activity size={23} /></div>
        <h3>Nasıl Çalışır?</h3>
        <div className="tip-step"><span>01</span><div><strong>Ürünü sorgula</strong><p>Uyumsoft'taki stok, satış ve giriş bilgileri değerlendirilir.</p></div></div>
        <div className="tip-step"><span>02</span><div><strong>Talebi oluştur</strong><p>Adet ve aciliyet girilir. Ürün hızı ayrıca sınıflandırılır.</p></div></div>
        <div className="tip-step"><span>03</span><div><strong>Yönetici onayı</strong><p>Onaylanan işler Narin Hanım'ın üretim listesine düşer.</p></div></div>
        <div className="side-warning"><AlertTriangle size={18} /> Stok ve satış sayıları doğrulanmadığında ürün hızı bilinmiyor kabul edilir; otomatik üretim yapılmaz.</div>
      </aside>
    </div>
  </>;
}

function Integrations({ health, demo }) {
  return <>
    <div className="page-heading"><div><div className="eyebrow">SİSTEM DURUMU</div><h1>Bağlantılar</h1>
      <p>Uçar Üretim'in veri kaynakları ve bağlantı hazırlıkları.</p></div></div>
    <div className="connection-grid">
      <div className="panel connection-card"><span className="connection-icon"><Database size={24} /></span><h2>Supabase</h2>
        <p>Üretim talepleri, kullanıcı rollerı, olay geçmişi ve onay kayıtları.</p>
        <div className="connection-status"><span className={'status-indicator ' + (demo ? 'warn' : health?.databaseConfigured ? 'success' : 'warn')} />
          {demo ? 'Demo: Geçici kayıtlar' : (health?.databaseConfigured ? 'Ayarlar tanımlı, bağlantı testi gerekli' : 'Bağlantı ayarları bekleniyor')}</div></div>
      <div className="panel connection-card"><span className="connection-icon"><TrendingUp size={24} /></span><h2>Uyumsoft</h2>
        <p>Gerçek stok, 30 günlük satış ve son mal girişi bilgileri.</p>
        <div className="connection-status"><span className="status-indicator warn" />
          {demo ? 'Demo: Yalnızca örnek ürünler' : (health?.uyumsoftConfigured ? 'Endpoint tanımlı, saha doğrulaması gerekli' : 'Web servis bilgileri bekleniyor')}</div></div>
      <div className="panel connection-card"><span className="connection-icon"><ShieldCheck size={24} /></span><h2>Kullanıcı Yetkileri</h2>
        <p>Satış, üretim ve yönetici işlemleri farklı erişim seviyelerine sahiptir.</p>
        <div className="connection-status"><span className={'status-indicator ' + (demo ? 'warn' : 'success')} />
          {demo ? 'Demo roller: Gerçek yetki değildir' : 'Supabase Auth ile doğrulanır'}</div></div>
    </div>
    <div className="info-panel"><AlertTriangle size={19} /><div><strong>Canlıya geçmeden önce</strong>
      <p>Uyumsoft web servisinin gerçek adresleri, alan adları ve şirket yetkileri doğrulanmalı; Supabase'de SQL şeması uygulanmalı, kullanıcılar oluşturulmalı ve gerçek firma verisiyle test edilmelidir.</p></div></div>
  </>;
}

function DetailModal({ record, events, loading, onClose, onStatusChange, role }) {
  useEffect(() => {
    function esc(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return <div className="modal-backdrop-custom" onMouseDown={e=>{if(e.target === e.currentTarget)onClose();}}>
    <div className="detail-dialog" role="dialog" aria-modal="true" aria-label="Üretim talebi detayları">
      <div className="detail-header"><div><div className="eyebrow">TALEP DETAYI</div><h2>{record.product_name || record.product_code}</h2><small>{record.product_code}</small></div>
        <button className="close-button" onClick={onClose} aria-label="Kapat"><X size={22} /></button></div>
      <div className="detail-content">
        <div className="detail-tags"><StatusTag status={record.status}/><VelocityTag velocity={record.velocity}/><PriorityTag priority={record.priority}/></div>
        <div className="detail-stats">
          <InfoStat label="İstenen adet" value={formatNumber(record.requested_quantity)}/>
          <InfoStat label="Önerilen adet" value={formatNumber(record.suggested_quantity)}/>
          <InfoStat label="Mevcut stok" value={formatNumber(record.stock_on_hand)}/>
          <InfoStat label="30 günlük satış" value={formatNumber(record.sales_30d)}/>
          <InfoStat label="Son giriş" value={formatDate(record.last_receipt_date)}/>
          <InfoStat label="Giriş miktarı" value={formatNumber(record.last_receipt_quantity)}/>
        </div>
        {record.notes && <div className="detail-note"><strong>Talep notu</strong><p>{record.notes}</p></div>}
        {record.decision_note && <div className="detail-note"><strong>Son işlem notu</strong><p>{record.decision_note}</p></div>}
        <div className="detail-title"><History size={18}/> İşlem Geçmişi</div>
        {loading ? <p className="text-muted small">Yükleniyor...</p> :
          events?.length ? <div className="timeline">{events.map(event=>
            <div className="timeline-item" key={event.id}><span className="timeline-point"/><div>
              <strong>{event.event_type === 'created' ? 'Talep oluşturuldu' : 'Durum değiştirildi'}</strong>
              <small>{event.event_type === 'status_changed'
                ? (statusLabels[event.details?.from] || event.details?.from) + ' → ' + (statusLabels[event.details?.to] || event.details?.to)
                : 'İlk kayıt'}</small>
              <time>{formatDateTime(event.created_at)}</time>
            </div></div>
          )}</div> : <p className="text-muted small">Henüz log bulunmuyor.</p>}
      </div>
      <div className="detail-footer"><ActionButtons row={record} role={role} onChange={onStatusChange}/>
        <button className="btn btn-outline-soft" onClick={onClose}>Kapat</button></div>
    </div>
  </div>;
}

function SignIn({ onSignIn, error, busy }) {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  return <div className="signin-page"><div className="signin-card">
    <Logo /><div className="signin-title"><h1>Üretim yönetimine giriş</h1><p>Satış ve üretim süreçlerinize güvenli erişim.</p></div>
    {!supabase ? <div className="alert alert-warning">Supabase Auth yapılandırılmamış. apps/web/.env dosyasını doldurun veya yerel demo modunu açın.</div> :
    <form onSubmit={e=>{e.preventDefault();onSignIn(email,password);}}>
      <label className="form-label">E-posta</label><input className="form-control mb-3" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <label className="form-label">Şifre</label><input className="form-control mb-3" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      {error && <div className="alert alert-danger small">{error}</div>}
      <button className="btn btn-accent w-100 justify-content-center" type="submit" disabled={busy}>{busy ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
    </form>}
    <p className="signin-foot">Hesap açma ve rol atama firma yöneticisi tarafından yapılır.</p>
  </div></div>;
}

export default function App() {
  const [session,setSession] = useState(null);
  const [authReady,setAuthReady] = useState(DEMO_MODE);
  const [authError,setAuthError] = useState('');
  const [authBusy,setAuthBusy] = useState(false);
  const [demoRole,setDemoRole] = useState('sales');
  const [me,setMe] = useState(null);
  const [screen,setScreen] = useState('dashboard');
  const [mobileMenu,setMobileMenu] = useState(false);
  const [requests,setRequests] = useState([]);
  const [overview,setOverview] = useState(null);
  const [health,setHealth] = useState(null);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState(null);
  const [detail,setDetail] = useState(null);
  const [events,setEvents] = useState([]);
  const [eventsLoading,setEventsLoading] = useState(false);

  useEffect(() => {
    if (DEMO_MODE || !supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    }).catch(()=>setAuthReady(true));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession)=>setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  const api = useCallback((path, options = {}) => apiFetch(path, {
    ...options, token: session?.access_token,
    demoRole: DEMO_MODE ? demoRole : undefined
  }), [session?.access_token, demoRole]);

  const loadData = useCallback(async () => {
    if (!DEMO_MODE && !session?.access_token) return;
    setLoading(true);
    try {
      const [requestsResult, overviewResult, meResult, healthResult] = await Promise.all([
        api('/requests'), api('/overview'), api('/me'), api('/health')
      ]);
      setRequests(requestsResult.requests);
      setOverview(overviewResult);
      setMe(meResult.user);
      setHealth(healthResult);
      setNotice(current => current?.type === 'error' ? null : current);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally { setLoading(false); }
  }, [api, session?.access_token]);

  useEffect(() => { if (authReady) loadData(); }, [loadData, authReady]);

  async function login(email, password) {
    if (!supabase) return;
    setAuthBusy(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthBusy(false);
  }

  async function saveRequest(data) {
    setSaving(true); setNotice(null);
    try {
      await api('/requests', { method: 'POST', body: data });
      setNotice({ type: 'success', text: 'Üretim talebi kaydedildi. Yönetici onayına gönderildi.' });
      setScreen('requests');
      await loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally { setSaving(false); }
  }

  async function changeStatus(row, to) {
    const confirmText = statusLabels[to] + ': ' + row.product_code + ' talebini değiştirmek istiyor musunuz?';
    if (!window.confirm(confirmText)) return;
    try {
      await api('/requests/' + encodeURIComponent(row.id) + '/status', {
        method: 'PATCH', body: { status: to }
      });
      setDetail(null);
      setNotice({ type: 'success', text: 'Talep durumu güncellendi: ' + statusLabels[to] });
      await loadData();
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  async function openDetails(row) {
    setDetail(row); setEventsLoading(true); setEvents([]);
    try {
      const response = await api('/requests/' + encodeURIComponent(row.id) + '/events');
      setEvents(response.events);
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setEventsLoading(false); }
  }

  if (!authReady) return <div className="app-loading">Uçar Üretim yükleniyor...</div>;
  if (!DEMO_MODE && !session) return <SignIn onSignIn={login} error={authError} busy={authBusy} />;

  const role = me?.role || (DEMO_MODE ? demoRole : 'sales');
  return <div className="app-shell">
    <Sidebar active={screen} setActive={setScreen} totalPending={overview?.byStatus?.pending_review || 0}
      open={mobileMenu} close={()=>setMobileMenu(false)}/>
    <main className="main-shell">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-toggle" aria-label="Menüyü aç" onClick={()=>setMobileMenu(true)}><Menu size={23}/></button>
          <div className="topbar-breadcrumb">Uçar Üretim <span>/</span> <strong>{navLinks.find(n=>n.id===screen)?.label}</strong></div></div>
        <div className="topbar-right">
          {DEMO_MODE && <span className="demo-flag">DEMO</span>}
          {DEMO_MODE ? <select className="role-select" value={demoRole} aria-label="Demo rolü"
            onChange={e=>setDemoRole(e.target.value)}>{roleOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
            : <button className="btn signout-button" onClick={()=>supabase?.auth.signOut()}><LogOut size={17}/> Çıkış</button>}
          <div className="avatar-circle">{(me?.display_name?.[0] || 'U').toLocaleUpperCase('tr')}</div>
        </div>
      </header>
      <div className="main-content">
        {DEMO_MODE && <div className="demo-banner"><AlertTriangle size={18}/>
          <span><strong>Demo çalışma modu:</strong> Veriler örnektir, Supabase'e kalıcı kayıt yapılmaz. Test için ORNEK-001, ORNEK-002 ve ORNEK-003 kodlarını kullanın.</span></div>}
        {notice && <div className={'flash-message flash-' + notice.type} role="status">
          {notice.type === 'success' ? <CheckCircle2 size={19}/> : <AlertTriangle size={19}/>}
          <span>{notice.text}</span><button onClick={()=>setNotice(null)} aria-label="Mesajı kapat"><X size={18}/></button></div>}
        {screen === 'dashboard' && <Dashboard requests={requests} overview={overview} health={health}
          openNew={()=>setScreen('new')} openRequests={()=>setScreen('requests')} openDetails={openDetails}/>}
        {screen === 'requests' && <RequestsPage requests={requests} role={role} onStatusChange={changeStatus}
          openNew={()=>setScreen('new')} onDetails={openDetails} refreshing={loading} onRefresh={loadData}/>}
        {screen === 'new' && <NewRequest onLookup={code=>api('/products/' + encodeURIComponent(code))}
          onSave={saveRequest} saving={saving} demo={DEMO_MODE}/>}
        {screen === 'integration' && <Integrations health={health} demo={DEMO_MODE}/>}
        <footer className="page-footer"><span>© 2026 Uçar Doğaltaş · Üretim Yönetimi</span>
          <span><span className="footer-dot"/> {DEMO_MODE ? 'Demo ortamı' : 'Canlı ortam'} · {roleLabels[role] || 'Kullanıcı'}</span></footer>
      </div>
    </main>
    {detail && <DetailModal record={detail} events={events} loading={eventsLoading}
      role={role} onClose={()=>setDetail(null)} onStatusChange={changeStatus}/>}
  </div>;
}
