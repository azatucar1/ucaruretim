# Uyumsoft Swagger incelemesi (16 Ekim 2026)

Kaynak: Kullanıcının paylaştığı Swagger 2.0 JSON dosyası.
Toplam: 332 endpoint ve 524 model. Bu dosya endpoint tanımlarını içerir, gerçek kullanıcı hesabı veya canlı yanıt içermez.

## Kimlik doğrulama

- Host: api-ucardogaltas.eko.uyumcloud.com:443
- Swagger 'schemes: http' yazıyor; 443 üzerinden şifre aktarımı için HTTPS doğrulanmadan canlı oturum açılmamalı.
- Giriş: POST /UyumApi/v1/GNL/UyumLogin
- Giriş isteği: username ve password alanları. Bu kullanıcı Uyumsoft'ta Web Servis Kullanıcısı olarak yetkili olmalı.
- Swagger açıklamasına göre giriş yanıtı Token ve UyumSecretKey üretir.
- Diğer çağrılar Authorization: Bearer <token> ile UyumSecretKey başlıklarını birlikte kullanır.
- Genel yanıt: ArmoniResponse (statusCode, message, responseException, result, pageIndex, pageSize, totalPages, totalCount).
- Result içeriği System.Object olduğu için gerçek yanıt örnekleriyle alan eşleştirmesi şarttır.

## Üretim ekranının ihtiyaç duyduğu endpoint'ler

| Amaç | POST endpoint | Request alanları / uyarı |
| --- | --- | --- |
| Stok kartı | INV/GetItem | GetService.value.code / itemId |
| Ürün listesi | INV/GetItemList | GetSrvItemContext: branchCode zorunlu; internet açık işyeri/depolar |
| Depo stok detayları | INV/GetBwhItemDetail | GetService; depo bazında çıktı örneği gerekir |
| Stok hareketleri | INV/GetItemM | GetService: itemId/startDate/endDate modelde mevcut |
| Satış faturaları | PSM/GetInvoice | GetService: tarih/işyeri filtresi; iade ayrımı doğrulanmalı |
| Perakende satış detayı | MRC/GetVoucherDItemList | coCode, branchCode, itemId, startDate, endDate, summary |
| Mağaza satış/iade detayları | MRC/GetVoucherMToDList | VoucherMToDListIn; içerik örneği gerekir |
| İş emri sorgulama | PRD/GetPrdWorderM | GetService; PRD modülü kullanılıyorsa |
| Ürün ağacı | PRD/GetPrdBomM | GetService; reçete modeli |
| İşyeri listesi | GNL/GetBranchList | GetService |

## Eksik bilgiler

1. Yetkili Uyumsoft WEB SERVİS kullanıcı adı/şifresi. Yalnızca sunucu secret ayarına girilmeli, GitHub'a veya sohbet ekranına yazılmamalı.
2. Firma kodu (coCode), işyeri kodu (branchCode) ve üretim stokları için depo kodları (whouseCode).
3. Login sonuç JSON'undaki alan isimleri (token ve secret'ın gerçek değerleri maskeli).
4. GetItem, GetItemList, GetBwhItemDetail, GetItemM, GetVoucherDItemList ve GetInvoice servislerinden en az birer gerçek ama hassas bilgileri kapatılmış result örneği.
5. Satış: son 30 gün net adedi iade/iptal sonrası mı; POS, toptan, web dahil mi? Aynı hareketler iki serviste mükerrer olabilir.
6. Stok: hangi depo ve rezerve stoklar hesaba katılacak, paket/adet birim dönüşümü nasıl olacak?
7. Gerçekte ERP PRD iş emri kullanılıyor mu; yoksa Uçar Üretim sadece ayrı üretim talep ve planlama mı yapacak?

## Uygulanan teknik hazırlık

- apps/api/src/uyumsoftClient.js: Swagger'a uygun POST gövdeleri, kimlik doğrulama, HTTPS kontrolü, Bearer + UyumSecretKey başlıkları.
- apps/api/src/uyumsoft.js: stok kodu ve adını okumaya hazırlanmıştır; stok, net satış ve son giriş NULL olarak kalır. Yanlış stok sayılarını hesaba katmaz.
- Yalnızca izinli okuma uçları açık, SQL/Insert/Update/Delete Uyumsoft API çağrısı yok.
- Otomatik üretim onayı kapalı, Uyumsoft'a canlı iş emri gönderilmez.
- API ortamı: UYUMSOFT_ENABLE_READS=false varsayılandır; canlı örnek olmadan true yapılmamalı.
- Ayrı Supabase UCARuretim projesi kuruldu; mobil uygulama projesinde değişiklik yok.

## Önemli teknik notlar

- GetItemList yalnızca internete açık stok/depo tanımlarını listeliyor: bütün stoklar gelmeyebilir.
- Swagger scheme alanı HTTP olduğu için HTTPS sunucu erişilebilirliği ayrıca sınanacak.
- Swagger'da tablo/result şeması generic tanımlandığından 30 günlük satış hesaplama servis çıktısının görülmesini gerektirir.
- API istemcisinin yapısal testleri GitHub Actions'ta çalıştırılır; bunlar canlı Uyumsoft bağlantı testi değildir.
