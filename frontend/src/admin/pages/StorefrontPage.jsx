import { useEffect, useMemo, useState } from "react";
import api from "../../../api";

const sectionNames = { new: "İlk ürün alanı", featured: "Orta ürün alanı", popular: "Son ürün alanı" };
const sources = [
  ["latest", "Son eklenen ürünler"],
  ["best_selling", "Gerçek satışlara göre çok satanlar"],
  ["category", "Seçilen kategorinin ürünleri"],
  ["manual", "Tek tek seçtiğim ürünler"],
  ["random", "Tüm ürünlerden rastgele"],
];
const fonts = [
  { value: "classic", label: "Klasik", detail: "Mevcut görünüm · Playfair başlık, sade metin", heading: '"Playfair Display", Georgia, serif', body: "Arial, sans-serif" },
  { value: "modern", label: "Modern", detail: "Manrope başlık ve metin", heading: '"Manrope", Arial, sans-serif', body: '"Manrope", Arial, sans-serif' },
  { value: "fashion", label: "Moda", detail: "Bodoni başlık, Manrope metin", heading: '"Bodoni Moda", Georgia, serif', body: '"Manrope", Arial, sans-serif' },
];

export default function StorefrontPage() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/storefront/admin"), api.get("/products"), api.get("/categories")])
      .then(([settingsResponse, productsResponse, categoriesResponse]) => {
        if (!active) return;
        setSettings(settingsResponse.data);
        setProducts(productsResponse.data || []);
        setCategories((categoriesResponse.data || []).flatMap((root) => [root, ...(root.children || [])]));
      })
      .catch(() => { if (active) setNotice({ type: "error", text: "Ayarlar yüklenemedi. Sayfayı yenileyin." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const matchingProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return products.filter((product) => product.name.toLocaleLowerCase("tr-TR").includes(query));
  }, [products, search]);

  const setSection = (key, patch) => setSettings((current) => ({
    ...current,
    sections: { ...current.sections, [key]: { ...current.sections[key], ...patch } },
  }));

  const toggleProduct = (key, id) => {
    const current = settings.sections[key].productIds || [];
    const exists = current.includes(id);
    if (!exists && current.length >= 40) {
      setNotice({ type: "error", text: "Bir alan için en fazla 40 ürün seçilebilir." });
      return;
    }
    setSection(key, { productIds: exists ? current.filter((item) => item !== id) : [...current, id] });
  };

  const save = async () => {
    for (const [key, section] of Object.entries(settings.sections)) {
      if (!section.heading.trim()) {
        setNotice({ type: "error", text: `${sectionNames[key]} için başlık girin.` });
        return;
      }
      if (section.source === "category" && !section.categoryId) {
        setNotice({ type: "error", text: `${sectionNames[key]} için kategori seçin.` });
        return;
      }
      if (section.source === "manual" && !section.productIds.length) {
        setNotice({ type: "error", text: `${sectionNames[key]} için ürün seçin.` });
        return;
      }
    }
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await api.put("/storefront/admin", settings);
      setSettings(data);
      setNotice({ type: "success", text: "Ana sayfa ayarları kaydedildi." });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Ayarlar kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Ana sayfa ayarları yükleniyor…</div>;
  if (!settings) return <div className="p-6 text-red-700">{notice?.text || "Ayarlar açılamadı."}</div>;

  return <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 sm:p-6">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Ana Sayfa Düzeni</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Ürün alanlarının başlığını ve hangi ürünlerin gösterileceğini seçin. Her alanda dört ürün görünür.</p>
    </div>

    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">Mağaza yazı ailesi</h2>
      <p className="mt-1 text-sm text-gray-600">Seçim mağaza, sepet ve ödeme sayfalarındaki başlık ve metinlere uygulanır. Yönetim panelinin okunabilirliği korunur.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {fonts.map((font) => <label key={font.value} className={`cursor-pointer rounded-lg border p-4 transition-colors ${settings.fontPreset === font.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}>
          <span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="fontPreset" checked={settings.fontPreset === font.value} onChange={() => setSettings((current) => ({ ...current, fontPreset: font.value }))} />{font.label}</span>
          <span className="mt-3 block text-2xl text-gray-900" style={{ fontFamily: font.heading }}>Yeni Koleksiyon</span>
          <span className="mt-1 block text-sm text-gray-700" style={{ fontFamily: font.body }}>{font.detail}</span>
        </label>)}
      </div>
    </section>

    {Object.entries(sectionNames).map(([key, label]) => {
      const section = settings.sections[key];
      return <section key={key} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
          <span className="text-xs text-gray-500">Ana sayfadaki sırası sabit</span>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-800">Görünen başlık
            <input className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900" maxLength={80} value={section.heading} onChange={(event) => setSection(key, { heading: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-gray-800">Ürün kaynağı
            <select className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base outline-none focus:border-gray-900" value={section.source} onChange={(event) => setSection(key, { source: event.target.value })}>
              {sources.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>
        </div>

        {section.source === "category" && <label className="mt-5 block text-sm font-medium text-gray-800">Kategori
          <select className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base outline-none focus:border-gray-900" value={section.categoryId || ""} onChange={(event) => setSection(key, { categoryId: event.target.value || null })}>
            <option value="">Kategori seçin</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.parent ? "— " : ""}{category.name}</option>)}
          </select>
        </label>}

        {section.source === "manual" && <div className="mt-5">
          <label className="block text-sm font-medium text-gray-800">Ürün havuzu ({section.productIds.length}/40)
            <input type="search" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900" placeholder="Ürün ara" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {matchingProducts.map((product) => <label key={product._id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={section.productIds.includes(product._id)} onChange={() => toggleProduct(key, product._id)} />
              {product.media?.images?.[0] || product.images?.[0] ? <img src={product.media?.images?.[0] || product.images[0]} alt="" className="h-12 w-10 shrink-0 rounded object-cover" loading="lazy" /> : <span className="h-12 w-10 shrink-0 rounded bg-gray-100" />}
              <span className="min-w-0"><span className="block truncate font-medium">{product.name}</span><span className="block text-xs text-gray-600">{product.color || "Renk belirtilmemiş"} · ₺{Number(product.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></span>
            </label>)}
            {!matchingProducts.length && <p className="p-3 text-sm text-gray-600">Ürün bulunamadı.</p>}
          </div>
          <p className="mt-2 text-xs text-gray-600">Rastgele gösterim kapalıysa ilk seçilen dört ürün görünür.</p>
        </div>}

        {section.source !== "random" && <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-gray-800">
          <input type="checkbox" checked={Boolean(section.shuffle)} onChange={(event) => setSection(key, { shuffle: event.target.checked })} />
          Bu kaynaktaki ürünleri rastgele döndür
        </label>}
      </section>;
    })}

    {notice && <div role="status" className={`rounded-lg p-3 text-sm ${notice.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{notice.text}</div>}
    <div className="flex justify-end"><button type="button" onClick={save} disabled={saving} className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50">{saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}</button></div>
  </div>;
}
