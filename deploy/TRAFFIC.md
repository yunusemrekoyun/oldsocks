# Trafik izlemesi ve güvenli sınırlar

Bu değişiklikler canlıya ancak diğer revizelerle birlikte planlanan dağıtımda alınır.

## Uygulama davranışı

- `GET /api/v1/products?view=compact` vitrinin ürün listesidir. Yönetimin kullandığı `GET /api/v1/products` yanıtı değişmez. Yeni liste ham medya belgelerini taşımaz; ürün, fiyat, stok ve kullanılacak medya adreslerini korur.
- Herkese açık vitrin okumaları oturum çerezi ve yetki başlığı göndermez. Başarılı genel GET yanıtlarının tarayıcı önbelleği 5 saniyedir. Sepet önizlemesi, ödeme, sipariş ve yönetim yanıtları bu önbelleğe girmez.
- API, son 10 ve 60 saniyedeki istekleri, 5xx/429 sayılarını, tamamlanma süresini ve sürmekte olan istekleri bellekte sayar. Yetkili yönetici `GET /api/v1/admin/traffic` ile anlık durumu okuyabilir. Sayaçlar süreç yeniden başlayınca sıfırlanır; eşsiz ziyaretçi sayısı değildir. Nginx'in doğrudan sunduğu medya ve önbellekten gelen istekler burada görünmez.
- İstek sayısı, eşzamanlılık veya ortalama yanıt süresi yükselirse yalnızca hero, duyuru ve mini kampanya verisinin sunucu içi önbelleği 15 saniyeden en fazla 45 saniyeye uzar. Yönetim değişiklikleri ilgili önbelleği hemen geçersiz kılar. Trafik düşünce yeni doldurmalar tekrar 15 saniye kullanır.
- `GET /readyz` Mongo bağlantısı yoksa 503, hazırsa 200 verir. Mevcut `/healthz` yolu değişmez.

## Dağıtım sonrası gözlem

1. Önce normal trafikte vitrin, giriş, sepet ve gerçek tutarlı ödeme akışını kontrol edin. PayTR callback akışı bu çalışmada değiştirilmedi.
2. Yönetici oturumuyla `/api/v1/admin/traffic` durumunu izleyin. Sürekli `busy`/`surge`, yükselen 5xx veya 429 ve artan yanıt süresi, sunucu ve Atlas ölçümleriyle birlikte incelenmelidir.
3. 100–500 eşzamanlı ziyaretçi için bu uygulama değişiklikleri kapasite garantisi vermez. Atlas Free kısıtları ve VPS CPU/bellek/ağ sınırları ayrıca ölçülmeli; gerekirse Atlas katmanı, Nginx önbelleği veya sunucu kapasitesi yükseltilmelidir. Canlı ödeme yoluna yük testi uygulanmamalıdır.
