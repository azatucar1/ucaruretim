# Uyumsoft bağlantı sözleşmesi

## Durum: Henüz gerçek Uyumsoft servisine bağlı değil

Uçar Üretim uygulamasında stok, mal girişi ve satış hareketlerinin doğru kaynağı Uyumsoft'tur. Bu depoda gerçek servis adresi, kullanıcı adı veya şifre tutulmaz. Entegrasyon sunucu tarafındaki Node.js API üzerinden yapılacaktır.

## Beklenen bilgiler

| Alan | Anlam |
| --- | --- |
| code | Ürün / stok kodu |
| name | Stok kartı adı |
| stock | Güncel satılabilir stok miktarı (hangi depolar dahil, netleştirilecek) |
| sales30d | Son 30 gün net satış adedi (iadeler dahil olup olmadığı netleştirilecek) |
| lastReceiptDate | Son stok girişi tarihi |
| lastReceiptQuantity | Son stok giriş miktarı |

API adaptörünün şu an **beklediği örnek JSON** (Uyumsoft'un gerçek yanıtı olduğu iddia edilmez):

\`\`\`json
{
  "code": "ORNEK-KOD",
  "name": "Ürün adı",
  "stock": 12,
  "sales30d": 83,
  "lastReceiptDate": "2026-10-01",
  "lastReceiptQuantity": 120
}
\`\`\`

## Teknik yapı

- Yer: apps/api/src/uyumsoft.js
- Örnek adapter: GET isteğinde stockCode query parametresi kullanılır.
- Uyumsoft endpoint adresi: UYUMSOFT_INSIGHT_URL
- Opsiyonel API token: UYUMSOFT_API_TOKEN (sadece API sunucusunda)
- Gerçek servisin URL, kimlik doğrulama, pagination, yanıt şeması ve depo filtreleri henüz bilinmiyor. **Bilmeden gerçek endpoint yazmayın.**
- Giriş/satış hareketleri tek endpoint ile alınamıyorsa adapter ayrı sorgular ve birleştirme için genişletilecek.
- Endpoint yoksa manuel ürün koduyla talep oluşturulabilir; hız rengi unknown kalır.

## İş kuralları (taslak)

- Yeşil: 30 günde en az 30 adet satılan stok.
- Sarı: 30 günde 10–29 adet satılan stok.
- Kırmızı: 30 günde 0–9 adet satılan stok.
- Bilinmiyor: satış verisi yoksa, sıfır sayılmaz.
- Önerilen miktar = max(0, ceil(sales30d × hedef_gün / 30) − mevcut_stok). Bu hesap **karar önerisidir**, satın alma/üretim emri değildir.
- Bu eşikler örnek başlangıç değerleridir; yönetici ve Narin Hanım ile doğrulanacak.
- Otomatik onay varsayılan olarak kapalıdır.

## Gerçek entegrasyon öncesi kontrol

1. Uyumsoft'un yetkili web servisinin sözleşmesini veya çalışan örnek istek/yanıtını temin edin.
2. Stok ve satış adedi birimlerini (paket, adet, metre, gram) doğrulayın.
3. İptal/iade/stok transferi nasıl sayılıyor netleştirin.
4. Bir örnek hızlı dönen, bir yavaş dönen ve sıfır stoklu ürünün verilerini Uyumsoft'ta karşılaştırın.
5. Web servis kullanıcı şifresi ve token'ı yalnızca sunucuda tutulmalı.
