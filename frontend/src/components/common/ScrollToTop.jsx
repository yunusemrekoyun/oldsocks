import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef(null);

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    // Filter/sort replacements keep their position; following a link starts at the top.
    if (pathChanged || navigationType !== "REPLACE") {
      // An animated reset can be interrupted when the next page changes document height.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, key, navigationType]);

  return null;
}
