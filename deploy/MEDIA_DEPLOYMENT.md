# Oldscks medya canlı kurulum notları

Bu dosya bir `.env.example` değildir ve gizli değer içermez. Sunucu yolları şu varsayımla
hazırlanmıştır:

- Uygulama: `/srv/oldscks/app`
- Medya: `/srv/oldscks/media`
- Servis kullanıcısı: `oldscks`
- Medya alan adı: `media.oldscks.com`

Farklı bir dizin veya kullanıcı seçilirse Nginx ve systemd dosyaları birlikte güncellenmelidir.

## Canlı ortam değişkenleri

Backend `.env` içinde canlıda aşağıdaki anahtarlar tanımlanmalıdır:

```text
NODE_ENV=production
MEDIA_ROOT=/srv/oldscks/media
MEDIA_PUBLIC_BASE_URL=https://media.oldscks.com
MEDIA_INLINE_WORKER=false
MEDIA_SERVE_STATIC=false
MEDIA_SHARED_VOLUME=true
MEDIA_CHUNK_BYTES=16777216
MEDIA_ADMIN_INFLIGHT_BYTES=536870912
MEDIA_GLOBAL_STAGING_BYTES=2147483648
MEDIA_ADMIN_HOURLY_BYTES=2147483648
MEDIA_ADMIN_DAILY_BYTES=10737418240
MEDIA_OPERATION_MARGIN_BYTES=2147483648
```

`MEDIA_SHARED_VOLUME=true`, VPS diskinin uygulama/veritabanı/loglarla paylaşıldığını belirtir.
Bu durumda sistem diskin yüzde 20'sini veya 20 GiB'ı (hangisi büyükse) dokunulmaz rezerv
olarak bırakır. Buna ek olarak 2 GiB işleme payı ve devam eden yükleme rezervleri düşülür.
Güvenli alan kalmadığında yeni yükleme 507 ile durur; mevcut medya sunulmaya devam eder.

## Sunucu hazırlığı

1. Node.js sürümünü proje sürümüyle uyumlu kurun; `ffmpeg` ve `ffprobe` paketlerini yükleyin.
2. `oldscks` servis kullanıcısını oluşturun. `/srv/oldscks/media` dizininin sahibi bu kullanıcı,
   Nginx'in ise yalnızca okuma erişimi olmalıdır. Önerilen dizin modu `0750`, dosya modu
   `0640`'tır; Nginx kullanıcısını `oldscks` grubuna eklemek yeterlidir.
3. Backend bağımlılıklarını kilit dosyasıyla kurun (`npm ci --omit=dev`).
4. Node web sürecinde `MEDIA_INLINE_WORKER=false` kullanın. Video/görsel işlemesini yalnızca
   ayrı `oldscks-media-worker.service` yürütmelidir.
5. Systemd örneğini `/etc/systemd/system/` altına alın, yolları doğrulayın, daemon-reload
   sonrasında servisi etkinleştirin.
6. Nginx medya virtual host'unu etkinleştirin. Ana API virtual host'una parçalı yükleme
   location dosyasındaki ayarları ekleyin.
7. TLS sertifikasını hazırladıktan sonra `nginx -t` çalıştırın ve yalnızca başarılıysa reload
   edin.

## Cloudflare ayarı

- DNS: `media` kaydı VPS'e yönlenmeli ve proxy açık olmalı.
- SSL/TLS: `Full (strict)`.
- Cache Rule 1: hostname `media.oldscks.com`, path `/profile_image/*`; origin cache-control'a
  uy veya Edge TTL'i en fazla 1 gün yap.
- Cache Rule 2: hostname `media.oldscks.com`; cache eligibility `Eligible for cache`, origin
  cache-control'a uy. Diğer medya immutable olarak 1 yıl sunulur.
- Query string cache anahtarında tutulabilir; uygulama normalde medya URL'lerine query eklemez.
- Tiered Cache kullanılabilir. Cloudflare görsel dönüştürmesi zorunlu değildir; varyantları
  uygulama zaten üretir.

Profil görseli kalıcı silinse bile daha önce CDN'e alınmış kopya en fazla kısa TTL süresince
erişilebilir olabilir. Ürün/banner yolları içerik kimliğiyle versiyonlandığından yeni medya eski
cache'i ezmez.

## Yayına geçmeden önce kapılar

1. `/api/v1/media/maintenance/summary` içinde `ffmpeg`, `ffprobe`, `heic`, `hevcDecode`,
   `h264Encode` ve `aacEncode` değerleri `true` olmalı. HDR tonemap yoksa HDR videolar SDR'a
   daha basit dönüşür; VPS FFmpeg paketinde `zscale` + `tonemap` bulunması tercih edilir.
2. Admin panelinde Medya Bakımı → Dosya–veritabanı kontrolü sonucu sıfır olmalı.
3. iPhone'dan gerçek HEIC fotoğraf, HEVC/MOV video, normal JPEG ve MP4 ile yükleme testi yapın.
4. Ürün liste/detay varyantlarını, mobil/masaüstü hero kaynaklarını ve video Range yanıtlarını
   Cloudflare üzerinden doğrulayın.
5. Disk uyarı eşiğini ve systemd/Nginx loglarını izlemeye alın.
6. Yedekleme servisi devreye girene kadar medya tek fiziksel kopyadır; bu nedenle ilk ürün
   yüklemesinden önce en az VPS snapshot/volume snapshot koruması açılmalıdır.

Google Drive yedek servisinin API sözleşmesi ayrı fazdır. Tasarım gereği yedek servisi dosyayı
ana siteden yetkili, kısa ömürlü bir erişimle okuyacak; kendi VPS diskine kalıcı kopya yazmadan
Drive'a akıtacak ve geçici dosya oluşursa başarılı/başarısız sonuçta hemen silecektir.
