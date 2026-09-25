# Google Drive yedekleri ve kurtarma

Bu özellik müşteri hesabı bağlanana kadar kapalıdır. İlk yerel ve sunucu dışı yedek, `Oldsocks Backups/Canli-Veri/2026-09-25` klasöründedir. O dosyaları bu özellik silmez.

## Müşteriyle kurulum

1. Google Cloud Console'da müşterinin hesabıyla proje açın. Google Drive API'yi etkinleştirin. OAuth consent ekranında `drive.file` kapsamını ekleyin. Web application türünde OAuth istemcisi oluşturun. Yetkili yönlendirme URI'si: `https://api.oldscks.com/api/v1/backups/google/callback`.
2. Consent ekranı **External / Testing** durumunda bırakılırsa Drive kapsamı için refresh token 7 gün sonra biter. Kalıcı günlük yedek için uygulamayı **In production** durumuna alın. Google'ın [OAuth belgesi](https://developers.google.com/identity/protocols/oauth2) bunu açıklar.
3. Sunucuda `restic` ve `rclone` kurulu olmalı. API ve medya/yedek işçisi aynı `oldscks` kullanıcısıyla çalışmalı ve `/srv/oldscks/media` ile `/srv/oldscks/backup` dizinlerine erişebilmeli. Kurulumdan önce `install -d -o oldscks -g oldscks -m 0700 /srv/oldscks/backup` ile anahtar dizinini hazırlayın. Örnek servis dosyasına ikinci `ReadWritePaths` yolu eklendi. Canlı systemd dosyasını ayrıca kontrol edin; bu depodaki örnek canlı sunucunun gerçek servis konumunu temsil etmeyebilir.
4. API ortamında `BACKEND_PUBLIC_URL=https://api.oldscks.com` ve `FRONTEND_ORIGIN=https://oldscks.com` olmalı. `MEDIA_ROOT` gerçek medya dizinini göstermeli. Anahtar varsayılan olarak medya dizininin kardeşi olan `backup/master.key` yolunda oluşur. Başka yol gerekiyorsa `BACKUP_KEY_FILE` ayarlayın. Anahtar dosyasının izni `0600`, üst dizinin izni `0700` olmalı.
5. Yönetim ekranında **Yedekler** sayfasına müşteri Client ID ve Client secret değerlerini girsin, sonra Google hesabını bağlasın. Değerleri sohbet, Git veya düz metin dosyasında paylaşmayın.
6. Yönetici parolasıyla şifreli kurtarma kitini indirin. İndirilen dosyayı yönetim ekranında seçip kit parolasıyla doğrulayın; doğrulama olmadan günlük veya elle yedekleme açılamaz. Kit dosyasını ve kit parolasını sunucu ile Drive'dan ayrı güvenli yerlerde tutun. Kit kaybolursa sunucunun tamamen kaybolduğu durumda Drive yedeğine erişilemez.
7. **Şimdi yedek al** ile ilk Drive yedeğini başlatın. İşlem geçmişinde tamamlandığını ve tarihli sürümün listelendiğini görün. Sonra günlük takvimi açın.

Google hesabı yeniden bağlanırsa takvim kapanır. Yeni bağlantı için yeni kurtarma kiti indirip doğruladıktan sonra takvimi tekrar açın. Yeni bir kit indirilmesi de doğrulama durumunu sıfırlar ve takvimi kapatır.

Google `drive.file` izni uygulamanın oluşturduğu dosyalarla sınırlıdır. Rclone için uygulamaya özel OAuth istemcisi kullanılır; [rclone Drive belgesi](https://rclone.org/drive/) kapsamı ve kurulum yolunu açıklar.

## Çalışma ve geri dönüş kuralları

- Günlük saat İstanbul saatidir. İşçi seçilen saatten sonra çalıştığında o güne ait tek otomatik işi sıraya alır. Sunucu bütün gün kapalıysa o gün yedek oluşmaz; son başarı tarihini yönetim ekranından izleyin.
- Veritabanı ve `assets`, `trash`, `quarantine` medya dizinleri restic ile şifrelenerek Drive'a aktarılır. Yedek tamamlanmadan önce medya ağacı ve hazır medya kayıtlarının tüm dosya referansları doğrulanır; tamamlandıktan sonra `restic check` çalışır.
- Normal sürümlerde 30 günlük, 8 haftalık, 12 aylık saklama politikası uygulanır. Geri yükleme öncesi alınan güvenlik sürümleri ayrı etiketle tutulur; bunlar bu otomatik politikaya dahil değildir. Drive alanını yönetim ekranından veya müşteri hesabından izleyin.
- Yönetim ekranındaki geri dönüş yalnızca **ürünler, kategoriler ve medya kayıtları/dosyaları** içindir. Siparişler, kullanıcılar, ödeme durumları, kampanyalar, bloglar ve diğer ayarlar korunur. Daha sonra eklenen ürün/kategoriler silinmez, mağazada gizlenir. Eşleşen ürünlerin güncel stokları korunur; geçmişten geri gelen ve artık mevcut olmayan ürünler sıfır stokla açılır.
- Önce etki raporu hazırlanır. Geri yükleme isteğinde yönetici parolası ve açık onay gerekir. Uygulama önce güncel durumun ayrıca Drive yedeğini alır, sonra katalogu veritabanı işlemi içinde değiştirir. Rapor sonrası katalog veya stok değişmişse geri yükleme durur ve yeni rapor gerekir.
- Medya dosyaları yalnızca eksikse geri konur. Aynı yoldaki mevcut dosya ile tarihsel dosyanın içeriği farklıysa işlem durur. Yeni medya dosyaları silinmez.

## Sunucu tamamen kaybolursa

Yeni sunucuda repo kodu, Node.js, `restic`, `rclone`, müşteri OAuth istemcisi ve kurtarma kiti gerekir. Kit dosyası ve parolasıyla mevcut sürümleri listeleyin:

```sh
node backend/scripts/recoverFromDrive.js list /guvenli/yol/oldsocks-kurtarma-kiti.json
```

Tam 64 karakterlik sürüm kimliğiyle boş bir hedefe çıkarın:

```sh
node backend/scripts/recoverFromDrive.js extract /guvenli/yol/oldsocks-kurtarma-kiti.json SURUM_KIMLIGI /guvenli/yol/acilan-yedek
```

Komut parolayı terminalde gizli ister. Çıktıda `mongodb.ejson.gz`, `media/` ve `master.key` olur. Çıktı dizinini özel erişimle saklayın. **Yalnızca boş bir MongoDB veritabanına ve yeni medya dizinine** aktarın. URI'yi kabuk geçmişine yazmamak için güvenli bir ortam dosyasından yükleyin:

```sh
export RECOVERY_DATABASE_NAME=oldsocks
export RECOVERY_MEDIA_ROOT=/srv/oldscks/media
export RECOVERY_BACKUP_KEY_FILE=/srv/oldscks/backup/master.key
# RECOVERY_MONGODB_URI değerini güvenli ortamınızdan yükleyin.
node backend/scripts/importRecoveredBackup.js /guvenli/yol/acilan-yedek
```

Aktarım mevcut veritabanında koleksiyon veya hedef dizinlerde dosya görürse durur. Yeni API ortamında MongoDB URI, `MEDIA_ROOT` ve `BACKUP_KEY_FILE` yollarını aktarım hedeflerine yönlendirin. DNS ve uygulama dağıtımı tamamlanmadan önce 25 koleksiyonun sayısını, medya dosyalarını ve yönetim girişini kontrol edin. Tam yıkım kurtarması bütün veritabanını geri getirir; tarihsel katalog dönüşünden farklı olarak siparişler de seçilen sürümün tarihine döner.

## Bu aşamadaki doğrulama

İlk gerçek arşiv EJSON/gzip olarak okundu; 25 koleksiyon ayrı MongoDB 8.0.4 test veritabanına aktarıldı. Arşivdeki 2.214 medya dosyası ve 330 hazır medya kaydının referansları doğrulandı. Ayrı replica set testinde sonraki ürün/kategori gizleme, güncel stokları ve sonradan eklenmiş siparişleri koruma doğrulandı. Google OAuth ve restic/rclone üzerinden gerçek Drive yedekleme/kurtarma, müşteri hesabı bağlanmadığı için henüz uçtan uca denenmedi.
