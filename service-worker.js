const CACHE="gripsholm-v8-days00-10-v76";
const FILES=[
  "./","./index.html","./dia0.html","./dia1.html","./dia2.html","./dia3.html","./dia4.html","./dia5.html","./dia6.html","./dia7.html","./dia8.html","./dia9.html","./dia10.html","./styles.css","./connection-status.js","./app.js","./app-dia1.js","./app-dia2.js","./app-dia5.js","./app-dia6.js","./day0-v7-data.js","./day1-v7-data.js","./day2-v7-data.js","./day3-v7-data.js","./day4-v7-data.js","./day5-v7-data.js","./day6-v7-data.js","./day7-v7-data.js","./day8-v7-data.js","./day9-v7-data.js","./day10-v7-data.js","./manifest.webmanifest","./assets/icons/icon-192.png","./assets/icons/icon-512.png","./assets/icons/icon.svg",
  "./assets/data/nordic-map-data.js","./assets/data/world-map-data.js",
  "./assets/images/saga-transmision-inicial.png",
  "./assets/images/saga-canal-asegurado.png",
  "./assets/images/comunidad-norte-ficcion-original.png",
  "./assets/images/familia-sami-jokkmokk-2025.jpg"
  ,"./assets/images/gamla-stan-map.png"
  ,"./assets/images/karin-testimonio-1520-v1.png"
  ,"./assets/images/gustav-vasa-portrait.jpg"
  ,"./assets/images/vasa-museum-public-domain.jpg"
  ,"./assets/images/abba-1974-top-pop.png"
  ,"./assets/images/kanelbulle-public-domain.jpg"
  ,"./assets/images/engelbrekt-statue-orebro.jpg"
  ,"./assets/images/orebro-castle-cc0.jpg"
  ,"./assets/images/hjalmar-bergman-public-domain.jpg"
  ,"./assets/images/bernadotte-public-domain.jpg"
  ,"./assets/images/alva-nystrom-tiveden-v1.png"
  ,"./assets/images/junker-jagare-stone-public-domain.jpg"
  ,"./assets/images/fagertarn-red-water-lilies-public-domain.jpg"
  ,"./assets/images/trolls-tiveden-recreacion-v1.png"
  ,"./assets/images/baltzar-von-platen-public-domain.jpg"
  ,"./assets/images/geertruyd-van-dijk-gotemburgo-v1.png"
  ,"./assets/images/gustav-ii-adolf-staty-goteborg.jpg"
  ,"./assets/images/goteborg-vapen.svg"
  ,"./assets/images/feskekorka-public-domain.jpg"
  ,"./assets/images/haga-nygata-cc-by-sa.jpg"
  ,"./assets/images/skansen-kronan-public-domain.jpg"
  ,"./assets/images/amsterdam-canals-cc0.jpg"
  ,"./assets/images/goteborg-vallgraven-cc-by-sa.jpg"
  ,"./assets/images/goteborg-botaniska-cc-by.jpg"
  ,"./assets/images/margareta-nilsdotter-reconstruccion-v1.png"
  ,"./assets/images/liv-berg-asunden-ficcion-v1.png"
  ,"./assets/images/maja-lind-store-mosse-ficcion-v1.png"
  ,"./assets/images/elin-ryd-gripsholm-ficcion-v1.png"
  ,"./assets/images/Gustav_Vasa.jpg"
  ,"./assets/images/erik_XIV.jpg"
  ,"./assets/images/John_III_of_Sweden.jpg"
  ,"./assets/images/Danmarks_flag_1219_Lorentzen.jpg"
  ,"./assets/images/Stockholm_Bloodbath.jpg"
  ,"./assets/images/Schantzska_huset_and_Seyfridtzska_huset_buildings,_Stortorget,_Gamla_stan,_Stockholm,_Sweden_julesvernex2.jpg"
  ,"./assets/images/Prästgatan_runsten_närbild.JPG"
  ,"./assets/images/Seglora_kyrka.JPG"
  ,"./assets/images/Wadköping_i_Örebro.jpg"
  ,"./assets/images/Vitsand.jpg"
  ,"./assets/images/Alce.jpg"
  ,"./assets/images/corzo.jpg"
  ,"./assets/images/urogallo.jpeg"
  ,"./assets/images/lince euroasiatico.jpg"
  ,"./assets/images/Lince_ibérico.jpg"
  ,"./assets/images/lucio.jpg"
  ,"./assets/images/perca.jpg"
  ,"./assets/images/salmon de lago.jpg"
  ,"./assets/images/salvelino artico.jpg"
  ,"./assets/images/gotemburgo_1644.jpg"
  ,"./assets/images/faktablad-stenkallerundan-eng.pdf"
  ,"./assets/images/stigmanspasset-2026.jpg"
  ,"./assets/images/stenkallan-tiveden-silverkey.jpg"
  ,"./assets/images/vitsand-playa-2026.jpg"
  ,"./assets/images/Estrid-Erikson.jpg"
  ,"./assets/images/Skottek.jpg"
];
const OFFLINE_MEDIA=[
  "./assets/data/ne_10m_admin_0_countries.geojson","./assets/data/ne_10m_lakes.geojson","./assets/data/ne_110m_admin_0_countries.geojson",
  "./assets/images/chorlito.jpg","./assets/images/Christians_II.,_König_von_Dänemark.jpg","./assets/images/cisne cantor.jpg","./assets/images/colon-vikingos-llegaron-antes.png","./assets/images/El_funeral_de_un_vikingo,_por_Frank_Dicksee_sigloXIX.jpg","./assets/images/El_funeral_de_un_vikingo,_por_Frank_Dicksee.jpg","./assets/images/gallo lira.jpg","./assets/images/Gjermundbu_helmet_-_cropped.jpg","./assets/images/grulla comun.jpg","./assets/images/grulla.jpg","./assets/images/gustav-ii-adolf-public-domain.jpg","./assets/images/gustav-trolle-portrait.png","./assets/images/gustav-vasa-public-domain.jpg","./assets/images/karl-ix-public-domain.jpg","./assets/images/la calle más estrecha de toda la capital sueca.jpg","./assets/images/las tres coronoas.jpg","./assets/images/mapa-vasa-estocolmo-puerto.svg","./assets/images/mapa-vasa-ruta-prevista.svg","./assets/images/sten-kristina-portrait.jpg","./assets/images/Store_Mosse_nationalpark.jpg","./assets/images/turbera.jpg","./assets/images/Veksø-hjelmene_DO-2348_original.jpg","./assets/images/zarapito real.jpg"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...new Set([...FILES,...OFFLINE_MEDIA])])).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok&&new URL(event.request.url).origin===location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
