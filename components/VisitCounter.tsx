"use client";

import { useEffect } from "react";

/**
 * Sends one small beacon per page viewed (no cookie). Client navigations are
 * caught from the History API, so the layout doesn't need the URL during
 * rendering (product pages stay fully static).
 */
export function VisitCounter() {
  useEffect(() => {
    let last = "";
    const send = () => {
      const p = window.location.pathname;
      if (p === last) return;
      last = p;
      const body = JSON.stringify({ p });
      if (!navigator.sendBeacon?.("/api/visit", new Blob([body], { type: "text/plain" }))) {
        fetch("/api/visit", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };
    send();
    const push = history.pushState;
    const replace = history.replaceState;
    history.pushState = function (...args) {
      push.apply(this, args);
      setTimeout(send, 0);
    };
    history.replaceState = function (...args) {
      replace.apply(this, args);
      setTimeout(send, 0);
    };
    window.addEventListener("popstate", send);
    return () => {
      history.pushState = push;
      history.replaceState = replace;
      window.removeEventListener("popstate", send);
    };
  }, []);
  return null;
}
