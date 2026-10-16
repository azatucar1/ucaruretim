# İlk sürüm kabul testi

## Yerel çalıştırma

1. apps/api/.env.example -> apps/api/.env kopyalayın.
2. apps/web/.env.example -> apps/web/.env kopyalayın.
3. Her iki env dosyasında demo modu true kalsın.
4. npm install ve npm run dev çalıştırın.
5. http://localhost:5173 adresine girin.

## Senaryolar

| No | Rol | Eylem | Beklenen |
| --- | --- | --- | --- |
| 1 | Satış | Yeni talep > ORNEK-001 > Sorgula | Yeşil, stok 12, 30 gün satış 83 |
| 2 | Satış | 20 adet, Acil seç, Kaydet | Talep Onay bekliyor, Acil önceliği görünür |
| 3 | Satış | Onay vermeyi dene | Onay/Reddet butonları görünmemeli |
| 4 | Yönetici | Üst sağ rolü Yönetici yap, talebi Onayla | Durum Onaylandı |
| 5 | Üretim | Üst sağ rolü Üretim yap, Üretime al | Durum Üretimde |
| 6 | Üretim | Tamamla | Durum Tamamlandı |
| 7 | Her rol | Detay > İşlem Geçmişi | Created ve status_changed logları |
| 8 | Satış | ORNEK-003 sorgula | Kırmızı (yavaş dönen) |
| 9 | Satış | İstenmeyen / hiç olmayan stok kodu sorgula | Bulunamadı; manuel talep açılabilir |
| 10 | API | npm test | Geçiş kuralları ve üretim önerisi testleri başarılı |

Demo içeriği RAM'de tutulur; API yeniden başlatılırsa silinir. Canlı sistem için ayrı Supabase testi ve gerçek Uyumsoft mutabakatı gereklidir.

## Canlı öncesi zorunlu kontroller

- GitHub deposu Private.
- Supabase Auth kullanıcıları oluşturuldu, doğru roller atandı.
- SQL migration başarıyla uygulandı.
- Gerçek Uyumsoft web servis kodları doğrulandı.
- API HTTPS ve güvenli deployment altında.
- Demo modu kapalı, servis anahtarı yalnızca API ortam değişkeninde.
- Üretim onay yetkileri ve audit verisi gerçek personelle denendi.
