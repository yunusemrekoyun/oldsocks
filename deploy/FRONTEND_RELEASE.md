# Arayüz sürüm geçişi

React sayfaları Vite ile ayrı, hash'li JS dosyalarına bölünür. Dağıtım sırasında açık kalan bir sekme eski ana dosyayı kullanmaya devam eder ve sonradan bir yönetim sayfasına geçince eski hash'li dosyayı ister. Eski `assets` dizini tamamen silinirse dinamik import 404 döner.

Arayüz dizinini değiştirmeden **önce**, canlı sürümün bütün `assets` dosyalarını hazırlanmış yeni derlemeye **üzerine yazmadan** ekleyin. Böylece dizin değişimi anında eski sekmelerin istediği dosyalar da hazır olur. Sunucudaki uygulama dizini Git checkout olmadığı için yardımcı betiği önce sunucuya kopyalayın:

```sh
scp deploy/scripts/keepPreviousAssets.sh root@82.25.117.135:/root/keepPreviousAssets.sh
ssh root@82.25.117.135 'bash /root/keepPreviousAssets.sh /home/oldscks/app/www /home/oldscks/deploy-stage/YENI_SURUM/frontend/dist'
```

Bu adım tamamlandıktan sonra canlı `www` dizinini geri dönüş klasörüne taşıyıp hazırlanmış `dist` dizinini `www` olarak yerleştirin. Aynı hash adı farklı içerikle üretilmişse kopyalama yeni sürümün dosyasını korur. Yeni `index.html` ve uygulama dosyaları değiştirilmez. Önceki sürümlerden taşınan hash'li dosyalar da bir sonraki geçişte aktarılır.

Yalnızca arayüz değiştiğinde daha kısa bir geçiş için önce mevcut `www` dizinini geri dönüş klasörüne kopyalayın, sonra yeni hash'li `assets` dosyalarını mevcut `www/assets` içine ekleyin. Diğer statik dosyaları yerleştirdikten **en son** yeni `index.html` dosyasını aynı dizinde geçici bir adla oluşturup `mv` ile değiştirin. Eski JS/CSS dosyaları yerinde kalır; geçiş sırasında eksik arayüz dizini oluşmaz.

Arayüzde `vite:preloadError` için bir defalık yenileme ve yükleme hatası ekranı vardır. Önceki dosyaları korumak açık sekmelerde kesintiyi önler; bir defalık yenileme ise dosya yine bulunamazsa güncel `index.html` dosyasını alır. Sunucu, HTML yanıtlarını yeniden doğrulanacak şekilde sunmalı; hash'li `assets` dosyaları uzun süre önbellekte kalabilir.

Canlı Nginx `www.oldscks.com` yapılandırmasında HTML'i karşılayan `location /` içinde `expires -1;`, hash'li statik dosyaları karşılayan uzantı kuralında `expires max;` bulunur. Sunucu yeniden kurulurken iki kuralı da taşıyın ve HTTP başlıklarını dışarıdan doğrulayın.

Dağıtım kontrolü: önceki sürümden bir hash'li yönetim sayfası JS dosyasının ve yeni sürümün ana JS dosyasının HTTP 200 döndüğünü doğrulayın. Yeniden yüklenmiş sekmede yönetim sayfaları arasında geçiş yapın.
