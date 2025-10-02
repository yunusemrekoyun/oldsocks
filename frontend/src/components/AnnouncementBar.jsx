import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api";

export default function AnnouncementBar() {
  const [data, setData] = useState(null);
  const trackRef = useRef(null);
  const msgRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/announcement-bar");
        setData({
          enabled: !!data?.enabled,
          text: (data?.text || "").trim(),
          bgColor: data?.bgColor || "#000000",
          textColor: data?.textColor || "#ffffff",
        });
      } catch {
        setData({ enabled: false, text: "" });
      }
    })();
  }, []);

  // container ve mesaj genişliklerine göre CSS değişkenlerini ayarla
  useEffect(() => {
    if (!data?.enabled || !data?.text) return;
    const setVars = () => {
      const cw = wrapRef.current?.clientWidth || 0; // container width
      const mw = msgRef.current?.offsetWidth || 0; // message width
      const el = trackRef.current;
      if (!el || !cw || !mw) return;

      el.style.setProperty("--cw", `${cw}px`); // sağdan tam dışarıdan başla
      el.style.setProperty("--mw", `${mw}px`); // sola tam dışarı çık
      // Hız sabit kalsın istersen: süreyi mesafe ile orantıla (opsiyonel)
      const distance = cw + mw; // gidilecek toplam mesafe
      const pxPerSec = 120; // hızı burada ayarlayabilirsin
      const duration = Math.max(4, Math.round(distance / pxPerSec));
      el.style.setProperty("--dur", `${duration}s`);
    };

    setVars();
    // resize’da yeniden ölç
    window.addEventListener("resize", setVars);
    // fontlar/geç yüklenenler için küçük bir tekrar ölçümü
    const t = setTimeout(setVars, 50);
    return () => {
      window.removeEventListener("resize", setVars);
      clearTimeout(t);
    };
  }, [data?.enabled, data?.text]);

  const styles = useMemo(
    () => ({
      backgroundColor: data?.bgColor || "#000000",
      color: data?.textColor || "#ffffff",
    }),
    [data?.bgColor, data?.textColor]
  );

  if (!data?.enabled || !data?.text) return null;

  return (
    <div
      role="region"
      aria-label="Duyuru"
      className="announcement-bar py-2"
      style={styles}
      ref={wrapRef}
    >
      <div className="marquee__track" ref={trackRef}>
        <span className="marquee__msg" ref={msgRef}>
          {data.text}
        </span>
      </div>
    </div>
  );
}
