/* MX Life offline app shell. Versioned cache for transparent updates. */
"use strict";
const CACHE="mx-life-offline-v3";
const ASSETS=[
  "./",
  "./index.html",
  "./site.webmanifest",
  "./favicon.svg",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE)
    .then(cache=>cache.addAll(ASSETS))
    .then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(
      keys.filter(key=>key.startsWith("mx-life-offline-")&&key!==CACHE)
        .map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith(
      fetch(request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          event.waitUntil(caches.open(CACHE).then(cache=>cache.put("./index.html",copy)));
        }
        return response;
      }).catch(async()=>await caches.match("./index.html")||Response.error())
    );
    return;
  }
  event.respondWith(
    caches.match(request,{ignoreSearch:true}).then(cached=>{
      const network=fetch(request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));
        }
        return response;
      }).catch(()=>cached||Response.error());
      return cached||network;
    })
  );
});
