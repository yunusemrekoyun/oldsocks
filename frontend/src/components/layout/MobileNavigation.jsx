import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Heart, House, LayoutGrid, ShoppingBag, UserRound, X } from "lucide-react";
import { useCart } from "../../context/useCart";
import useCategoriesCache from "../../hooks/useCategoriesCache";
import { getResponsiveImageProps } from "../../utils/media";

const categoryId = (value) => String(value?._id || value || "");

function CategoryRow({ category, categories, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const children = category.children?.length
    ? category.children
    : categories.filter((child) => categoryId(child.parent) === categoryId(category));
  const image = getResponsiveImageProps(category.image, { widths: [96, 160], defaultWidth: 96, sizes: "52px" });
  const destination = `/shop?kategori=${encodeURIComponent(category._id)}`;
  return (
    <div className="border-b border-black/[0.07] last:border-0">
      <div className="flex items-center gap-3 py-3">
        <Link to={destination} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/5">
            {image.src ? <img {...image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <LayoutGrid size={22} aria-hidden="true" />}
          </span>
          <span className="text-[15px] font-semibold text-dark1">{category.name}</span>
        </Link>
        {children.length > 0 ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={`${category.name} alt kategorilerini ${expanded ? "gizle" : "göster"}`} aria-expanded={expanded} aria-controls={`mobile-category-${category._id}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-dark2 transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1">
            <ChevronDown size={18} aria-hidden="true" className={`transition-transform motion-reduce:transition-none${expanded ? " rotate-180" : ""}`} />
          </button>
        ) : <Link to={destination} onClick={onNavigate} aria-label={`${category.name} ürünlerini gör`} className="rounded-full p-3 text-dark2"><ChevronRight size={18} aria-hidden="true" /></Link>}
      </div>
      {children.length > 0 && (
          <ul id={`mobile-category-${category._id}`} className={`${expanded ? "grid" : "hidden"} grid-cols-2 gap-x-2 pb-3 pl-[68px]`}>
            {children.map((child) => <li key={child._id}>
              <Link to={`/shop?alt=${encodeURIComponent(child._id)}`} onClick={onNavigate} className="flex min-h-11 items-center rounded-lg py-2 text-sm text-dark2 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1">{child.name}</Link>
            </li>)}
          </ul>
      )}
    </div>
  );
}

export default function MobileNavigation({ headerCampaigns = [] }) {
  const { pathname, search } = useLocation();
  const { items } = useCart();
  const { data, loading, error, retry } = useCategoriesCache();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dialogRef = useRef(null);
  const categoriesButtonRef = useRef(null);
  const categories = useMemo(() => Array.isArray(data) ? data : [], [data]);
  const parents = useMemo(() => categories.filter((category) => !category.parent), [categories]);
  const campaigns = useMemo(() => [
    ...headerCampaigns.filter((campaign) => campaign.headerPlacement === "top_panel"),
    ...headerCampaigns.filter((campaign) => campaign.headerPlacement === "sub_panel"),
  ], [headerCampaigns]);
  const cartCount = items.reduce((total, item) => total + Number(item.qty || 0), 0);
  const payment = pathname === "/payment";

  useEffect(() => setCategoriesOpen(false), [pathname, search]);

  useEffect(() => {
    setHidden(false);
    let previousY = window.scrollY;
    let travel = 0;
    const onScroll = () => {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(maxY, Math.max(0, window.scrollY));
      const delta = y - previousY;
      previousY = y;
      if (y < 100) {
        travel = 0;
        setHidden(false);
        return;
      }
      if (Math.sign(delta) !== Math.sign(travel)) travel = 0;
      travel += delta;
      if (Math.abs(travel) > 12) {
        setHidden(travel > 0);
        travel = 0;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, search]);

  useEffect(() => {
    if (!categoriesOpen) return undefined;
    const dialog = dialogRef.current;
    const trigger = categoriesButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setCategoriesOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [categoriesOpen]);

  if (payment) return null;

  const close = () => setCategoriesOpen(false);
  const navClass = ({ isActive }) => `mobile-nav-item${isActive && !categoriesOpen ? " is-active" : ""}`;

  return (
    <>
      <nav className={`mobile-navigation${hidden && !categoriesOpen ? " is-hidden" : ""}`} aria-label="Mobil gezinme" onFocusCapture={() => setHidden(false)}>
        <ul className="mobile-navigation-glass">
          <li><NavLink to="/" end className={navClass}><House aria-hidden="true" /><span>Ana Sayfa</span></NavLink></li>
          <li><button ref={categoriesButtonRef} type="button" onClick={() => setCategoriesOpen(true)} className={`mobile-nav-item${categoriesOpen || pathname === "/shop" ? " is-active" : ""}`} aria-expanded={categoriesOpen} aria-controls="mobile-categories" aria-haspopup="dialog"><LayoutGrid aria-hidden="true" /><span>Kategoriler</span></button></li>
          <li><NavLink to="/cart" id="mobile-cart-icon" className={navClass}><span className="relative"><ShoppingBag aria-hidden="true" />{cartCount > 0 && <span className="mobile-nav-badge" aria-hidden="true">{cartCount > 99 ? "99+" : cartCount}</span>}</span><span>Sepet{cartCount > 0 && <span className="sr-only">, {cartCount} ürün</span>}</span></NavLink></li>
          <li><NavLink to="/favorites" className={navClass}><Heart aria-hidden="true" /><span>Favoriler</span></NavLink></li>
          <li><NavLink to="/profile" className={({ isActive }) => `mobile-nav-item${!categoriesOpen && (isActive || pathname === "/auth") ? " is-active" : ""}`}><UserRound aria-hidden="true" /><span>Hesabım</span></NavLink></li>
        </ul>
      </nav>

      <dialog ref={dialogRef} id="mobile-categories" className="mobile-category-sheet" aria-labelledby="mobile-categories-title" onCancel={close} onClose={close} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }}>
        <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-black/15" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-4">
          <div><p className="text-xs text-dark2">OLDSOCKS</p><h2 id="mobile-categories-title" className="mt-0.5 text-2xl font-semibold text-dark1">Kategoriler</h2></div>
          <button type="button" onClick={close} aria-label="Kategorileri kapat" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-dark1 transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-6">
          <Link to="/shop" onClick={close} className="mb-2 flex min-h-12 items-center justify-between rounded-2xl bg-dark1 px-4 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark1">Tüm ürünleri keşfet<ChevronRight size={18} aria-hidden="true" /></Link>
          <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Fırsatlar">
            <Link to="/shop?indirim=1" onClick={close} className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-white/50 px-4 text-sm font-medium text-dark1 transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1">İndirimdekiler</Link>
            {campaigns.map((campaign) => <Link key={campaign._id} to="/shop" state={{ preset: { title: campaign.name, productIds: campaign.productIds || [] } }} onClick={close} className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-white/50 px-4 text-sm font-medium text-dark1 transition hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1">{campaign.name}</Link>)}
          </div>
          {loading ? <p role="status" className="py-8 text-center text-sm text-dark2">Kategoriler yükleniyor…</p>
            : error ? <div className="py-8 text-center text-sm text-dark2"><p>Kategoriler şu an yüklenemedi.</p><button type="button" onClick={retry} className="mt-3 min-h-11 rounded-full border border-dark1 px-5">Tekrar dene</button></div>
            : !parents.length ? <p className="py-8 text-center text-sm text-dark2">Kategoriler yakında burada.</p>
            : parents.map((category) => <CategoryRow key={category._id} category={category} categories={categories} onNavigate={close} />)}
        </div>
      </dialog>
    </>
  );
}
