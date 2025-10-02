import React from "react";

export default function CookiePolicyPage() {
  return (
    <section className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Çerez Politikası</h1>
      <p className="text-gray-700 mb-4">
        Bu web sitesinde; oturum açma, sepet yönetimi ve ödeme işlemlerinin
        sağlıklı çalışması için zorunlu çerezler kullanılmaktadır. Bu çerezler
        site işlevselliği için gereklidir ve devre dışı bırakılamaz.
      </p>

      <h2 className="text-xl font-medium mt-8 mb-2">Kullandığımız Çerezler</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-700">
        <li>
          <b>Zorunlu/Oturum Çerezleri:</b> Kimlik doğrulama (auth), sepet ve
          ödeme oturumunun yürütülmesi.
        </li>
        <li>
          <b>Performans/Analitik:</b> Kullanılmamaktadır.
        </li>
        <li>
          <b>Pazarlama:</b> Kullanılmamaktadır.
        </li>
      </ul>

      <h2 className="text-xl font-medium mt-8 mb-2">Saklama Süresi</h2>
      <p className="text-gray-700">
        Zorunlu çerezler oturum süresince veya yasal/işlemsel gereklilikler
        kapsamında makul süre boyunca saklanır.
      </p>

      <h2 className="text-xl font-medium mt-8 mb-2">Onay / Reddetme</h2>
      <p className="text-gray-700">
        Sayfanın altında görünen bildirim aracılığıyla çerez kullanımını kabul
        edebilir ya da reddedebilirsiniz. Zorunlu çerezler reddedildiğinde,
        oturum, sepet ve ödeme işlevlerinde kısıtlamalar oluşabilir.
      </p>

      <h2 className="text-xl font-medium mt-8 mb-2">İletişim</h2>
      <p className="text-gray-700">
        Sorularınız için:{" "}
        <a className="text-blue-600 underline" href="mailto:info@example.com">
          oldscks@gmail.com
        </a>
      </p>
    </section>
  );
}
