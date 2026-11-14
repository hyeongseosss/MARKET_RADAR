// 한 번 연 앱은 빨리 열리게: 화면 파일은 저장해 두고, 데이터는 항상 새로 받되 인터넷이 안 되면 마지막 것을 보여 준다
const CACHE = "radar-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const isData = url.pathname.endsWith(".json") && !url.pathname.endsWith("manifest.json");
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  if (isData || isPage) {                         // 데이터·화면: 새로 받고(고친 화면이 바로 보이게), 인터넷이 안 되면 저장본
    const key = url.origin + url.pathname;
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
      return r;
    }).catch(() => caches.match(key)));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => {   // 화면: 저장본 먼저, 뒤에서 새로 받아 둠
    const net = fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
