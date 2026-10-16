# Uçar Üretim

Uçar Doğaltaş için üretim talep ve takip sistemi.

## Amaç

Satış ekibinin ürün koduyla üretim talebi açması; Narin Hanım'ın üretim havuzunu izlemesi; yöneticinin tekrar üretime karar vermesi. Stok, giriş ve satış rakamlarında ana kaynak **Uyumsoft** olacaktır. Talep, kullanıcı, karar ve işlem geçmişi **Supabase** üzerinden yönetilecektir.

## Durum

**İlk sürüm altyapısı kuruluyor.** Uyumsoft web servisinin gerçek endpoint'i ve yanıt şeması bağlanana kadar satış/stok verileri gerçek sayılmaz. Demo verileri yalnızca test içindir. Üretim onayına dair otomasyonlar gerçek verilere bağlanmadan canlıya alınmamalıdır.

## Teknoloji

- Web: React + Vite + Bootstrap (mobil uyumlu)
- API: Node.js + Express
- Veritabanı ve audit kayıtları: Supabase / PostgreSQL
- Kimlik doğrulama: Supabase Auth
- Uyumsoft: sunucu taraflı, ayarlanabilir API adaptörü

## Kurulum

Depodaki `apps/api/.env.example` ve `apps/web/.env.example` dosyalarını örnek alıp ayrı `.env` dosyaları hazırlayın. Geliştirme sırasında iki tarafı birlikte çalıştırmak için:

```bash
npm install
npm run dev
```

- Web arayüzü: http://localhost:5173
- API: http://localhost:4000/api/health

Veritabanı tabloları için `supabase/migrations/001_initial.sql` dosyasını Supabase SQL Editor'da çalıştırın.

## Güvenlik

**Depo başlangıçta Public açılmıştır.** Gerçek firma verisi, müşteri bilgisi, Supabase service-role anahtarı ve Uyumsoft API şifresi depoya yazılmamalıdır. Canlı kullanım öncesi depoyu Private yapın. Demo modu üretimde devre dışı bırakılır.

## İş akışı

1. Satış personeli ürün kodu, öncelik ve adetle talep açar.
2. Uyumsoft entegrasyonu varsa son satış, giriş ve stok verileri incelenir.
3. Sistem satış hızına göre yeşil / sarı / kırmızı öneri üretir; öncelik bu renkten ayrı bir alandır.
4. Yönetici talebi onaylar veya reddeder. Onaylanan işler üretime geçer.
5. Narin Hanım üretimde/ tamamlandı durumlarını takip eder; tüm hareketler loglanır.

## Geliştirme notları

Proje aşamalı ilerler. İlk öncelik çalışan talep ekranı ve audit kaydı, ardından gerçek Uyumsoft alan eşleştirmesi ve üretim miktarı kurallarının netleştirilmesidir.