# Uçar Üretim Yol Haritası (taslak)

İki haftalık ilk sürüm hedefi, Uyumsoft erişimi ve kullanıcı testlerinin zamanında sağlanmasına bağlıdır.

| Aşama | İş |
| --- | --- |
| 1. gün | GitHub depo, React panel, API iskeleti, Supabase SQL |
| 2–3. gün | Gerçek Supabase projesi, Auth kullanıcı ve rol ayarları |
| 3–5. gün | Uyumsoft stok/giriş/satış servislerini alan bazında bağlama |
| 5–6. gün | Satış hızı eşiği, önerilen adet, yanlış tekrar üretim kontrolleri |
| 6–8. gün | Satış ekibi ve Narin Hanım ile gerçek senaryolar üzerinden test |
| 8–10. gün | Hata düzeltmeleri, hosting, HTTPS, erişim yetkileri, pilot kullanım |

## İlk sürüm kapsamı

- Satış talebi oluşturma
- Stok kodu sorgusu için servis adaptörü
- Hız rengi (yeşil / sarı / kırmızı / veri yok)
- Acil / normal / düşük öncelik
- Yönetici onayı / reddi
- Üretime al / tamamla
- Talep geçmişi (audit)
- Web arayüzü ve mobil uyum

## Sonraki sürümlere bırakılanlar

- Karmaşık Narin Hanım Excel hesaplarının tüm istisnaları
- Geçmiş satışlara göre dönemsel mevsimsellik modeli
- Bildirimler, WhatsApp entegrasyonu
- Üretimde sarf malzeme / reçete / parti / fire takibi
- Çok depo ve varyant bazlı ayrıntılı algoritmalar

Bu özelliklerin kuralları kullanıcı görüşmesi ve örnek gerçek hareket verileri olmadan uydurulmayacak.
