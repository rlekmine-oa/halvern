(function () {
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function css(nom) { return getComputedStyle(document.documentElement).getPropertyValue(nom).trim(); }
  function fr(x, d) { return x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−"); }
  function euros(x, signe) { var t = Math.abs(Math.round(x)).toLocaleString("fr-FR") + " €"; return signe ? (x > 0 ? "+" : x < 0 ? "−" : "") + t : t; }
  function aleatoire(g) { return function () { g = (g * 16807) % 2147483647; return g / 2147483647; }; }
  // Visibilité calculée au défilement : dans le cadre isolé de la page publiée, IntersectionObserver
  // signale les éléments comme hors de l'écran et figeait les animations.
  function dansEcran(el, part) {
    var r = el.getBoundingClientRect(), h = window.innerHeight || document.documentElement.clientHeight, marge = Math.min(r.height, h) * (part || 0);
    return r.bottom > marge && r.top < h - marge && document.visibilityState !== "hidden";
  }
  function suivreVisibilite(el, rappel, part) {
    var avant = null;
    function maj() { var v = dansEcran(el, part); if (v !== avant) { avant = v; rappel(v); } }
    addEventListener("scroll", maj, { passive: true }); addEventListener("resize", maj);
    document.addEventListener("visibilitychange", maj);
    maj();
  }
  function enVue(el, fn, seuil) {
    if (calme) { fn(); return; }
    var fait = false;
    suivreVisibilite(el, function (v) { if (v && !fait) { fait = true; fn(); } }, seuil || 0.3);
  }
  function compter(el, fin, rendu, duree) {
    var t0 = null, d = calme ? 0 : (duree || 1400);
    (function pas(t) { if (t0 === null) t0 = t; var p = d ? Math.min(1, (t - t0) / d) : 1; el.textContent = rendu(fin * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(pas); })(performance.now());
  }

  /* En-tête */
  var entete = document.getElementById("entete"), ouverture = document.querySelector(".ouverture, .page-tete");
  function majEntete() { var passe = ouverture.getBoundingClientRect().bottom < 70; entete.classList.toggle("solide", passe); entete.classList.toggle("sur-nuit", !passe && scrollY > 8); }
  addEventListener("scroll", majEntete, { passive: true }); majEntete();

  /* Ouverture : panneau de suivi du portefeuille d'exemple */
  (function () {
    if (!document.getElementById("ph-svg")) return;
    var svg = document.getElementById("ph-svg"), zoneG = document.getElementById("ph-graphe"), W = 640, H = 280, g = 8, d = 70, h = 12, b = 26, N = 150;
    var hs = aleatoire(7), commun = [0], propre = [0];
    for (var i = 1; i < N; i++) { commun.push(commun[i - 1] + (hs() - 0.5) * 170); propre.push(propre[i - 1] + (hs() - 0.5) * 70); }
    var port = [], temoin = [];
    for (var j = 0; j < N; j++) { var t = j / (N - 1), c = commun[j] - commun[N - 1] * t, pr = propre[j] - propre[N - 1] * t; temoin.push(Math.round(1680 * t + c)); port.push(Math.round(2100 * t + c * 1.08 + pr)); }
    port[0] = 0; temoin[0] = 0;
    var debut = Date.UTC(2024, 0, 8), fin = Date.UTC(2026, 9, 30), jour = 864e5;
    var mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    function dateDe(k) { return new Date(debut + (fin - debut) * k / (N - 1)); }
    function dateLongue(dt) { return dt.getUTCDate() + " " + mois[dt.getUTCMonth()] + " " + dt.getUTCFullYear(); }
    var periode = "max", etat = null, balayage = null;
    var T2 = "var(--nuit-texte-2)", TX = "var(--nuit-texte)", FL = "var(--nuit-filet)", BL = "var(--nuit-accent)", OR = "var(--nuit-temoin)";
    function dessiner(anime) {
      var etroit = zoneG.clientWidth < 520; W = etroit ? 400 : 640; H = etroit ? 250 : 280; d = etroit ? 62 : 70;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var k0 = periode === "1a" ? Math.round((N - 1) * (1 - 365 * jour / (fin - debut))) : 0;
      var P = port.slice(k0).map(function (v) { return v - port[k0]; }), Q = temoin.slice(k0).map(function (v) { return v - temoin[k0]; }), n = P.length;
      var mn = Math.min.apply(null, [0].concat(P, Q)), mx = Math.max.apply(null, P.concat(Q));
      var pas = mx - mn > 1600 ? 500 : 250, bas = Math.floor(mn / pas) * pas, haut = Math.ceil(mx / pas) * pas;
      function X(k) { return g + (W - g - d) * k / (n - 1); }
      function Y(v) { return h + (H - h - b) * (haut - v) / (haut - bas); }
      var o = [];
      for (var v = bas; v <= haut; v += pas) {
        o.push(ligne(g, Y(v), W - d, Y(v), FL, 1, v === 0 ? "3 3" : ""));
        if (Math.abs(Y(v) - Y(P[n - 1])) > 13 && Math.abs(Y(v) - Y(Q[n - 1])) > 13) o.push(txt(W - d + 10, Y(v) + 4, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toLocaleString("fr-FR"), { m: 1, t: 11, c: T2 }));
      }
      var ecartMois = periode === "1a" ? 3 : (etroit ? 12 : 6);
      for (var a = 2024; a <= 2026; a++) for (var m = 0; m < 12; m += ecartMois) {
        var dm = Date.UTC(a, m, 1), kk = (dm - debut) / (fin - debut) * (N - 1) - k0;
        if (kk < 2 || kk > n - 3) continue;
        o.push(ligne(X(kk), H - b, X(kk), H - b + 4, FL), txt(X(kk), H - 8, mois[m] + " " + String(a).slice(2), { t: 11, a: "middle", c: T2 }));
      }
      o.push(ligne(g, H - b, W - d, H - b, "var(--nuit-texte-2)", 1));
      var zone = P.map(function (v, k) { return X(k).toFixed(1) + "," + Y(v).toFixed(1); }).concat(Q.slice().reverse().map(function (v, k) { return X(n - 1 - k).toFixed(1) + "," + Y(v).toFixed(1); })).join(" ");
      o.push('<polygon points="' + zone + '" fill="rgba(143,182,236,0.10)"/>');
      function chemin(s) { return s.map(function (v, k) { return (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1); }).join(" "); }
      o.push('<path class="trait-h" d="' + chemin(Q) + '" fill="none" stroke="' + OR + '" stroke-width="1.6"/>');
      o.push('<path class="trait-h" d="' + chemin(P) + '" fill="none" stroke="' + BL + '" stroke-width="2.2"/>');
      var yP = Y(P[n - 1]), yQ = Y(Q[n - 1]);
      if (Math.abs(yP - yQ) < 20) { var milieu = (yP + yQ) / 2; yP = milieu - 10; yQ = milieu + 10; }
      [[yP, BL, P[n - 1]], [yQ, OR, Q[n - 1]]].forEach(function (e) {
        o.push('<g class="etiquette-fin" opacity="0"><rect x="' + (W - d + 4) + '" y="' + (e[0] - 9) + '" width="' + (d - 6) + '" height="18" fill="' + e[1] + '"/>' + txt(W - d + 10, e[0] + 4, (e[2] >= 0 ? "+" : "−") + Math.abs(e[2]).toLocaleString("fr-FR"), { m: 1, t: 11, c: "#06080b" }) + '</g>');
      });
      o.push('<g id="ph-reticule" visibility="hidden"><line id="ph-rv" y1="' + h + '" y2="' + (H - b) + '" stroke="var(--nuit-texte-2)" stroke-dasharray="2 3"/><circle id="ph-cp" r="3.5" fill="' + BL + '"/><circle id="ph-ct" r="3" fill="' + OR + '"/>' +
        '<rect id="ph-boite" y="' + (h + 2) + '" width="196" height="54" fill="var(--nuit)" stroke="var(--nuit-filet)"/><text id="ph-t1" font-size="11" fill="' + T2 + '" font-family="IBM Plex Sans, sans-serif"></text><text id="ph-t2" font-size="12" fill="' + TX + '" font-family="IBM Plex Sans, sans-serif"></text><text id="ph-t3" font-size="12" fill="' + TX + '" font-family="IBM Plex Sans, sans-serif"></text></g>');
      svg.innerHTML = o.join("");
      etat = { P: P, Q: Q, n: n, X: X, Y: Y, k0: k0 };
      var traits = svg.querySelectorAll(".trait-h");
      traits.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = anime && !calme ? L : 0; });
      if (anime && !calme) requestAnimationFrame(function () { requestAnimationFrame(function () { traits.forEach(function (p) { p.style.strokeDashoffset = 0; }); }); });
      setTimeout(function () { svg.querySelectorAll(".etiquette-fin").forEach(function (e) { e.setAttribute("opacity", 1); }); }, anime && !calme ? 1700 : 0);
      document.getElementById("ph-libelle").textContent = "Gain cumulé hors versements, " + (periode === "1a" ? "sur un an" : "depuis janvier 2024");
      document.getElementById("ph-gain").textContent = euros(P[n - 1], true);
      document.getElementById("ph-ecart").textContent = euros(P[n - 1] - Q[n - 1], true) + " face au témoin";
    }
    function reticule(k) {
      if (!etat) return;
      var e = etat, r = svg.querySelector("#ph-reticule");
      if (k === null) { r.setAttribute("visibility", "hidden"); return; }
      k = Math.max(0, Math.min(e.n - 1, Math.round(k)));
      var x = e.X(k), dt = dateDe(k + e.k0), boiteX = x > (W - d) / 2 ? x - 206 : x + 10;
      r.setAttribute("visibility", "visible");
      svg.querySelector("#ph-rv").setAttribute("x1", x); svg.querySelector("#ph-rv").setAttribute("x2", x);
      svg.querySelector("#ph-cp").setAttribute("cx", x); svg.querySelector("#ph-cp").setAttribute("cy", e.Y(e.P[k]));
      svg.querySelector("#ph-ct").setAttribute("cx", x); svg.querySelector("#ph-ct").setAttribute("cy", e.Y(e.Q[k]));
      svg.querySelector("#ph-boite").setAttribute("x", boiteX);
      [["#ph-t1", dateLongue(dt), 18], ["#ph-t2", "Portefeuille  " + euros(e.P[k], true), 34], ["#ph-t3", "ETF monde     " + euros(e.Q[k], true), 50]].forEach(function (l) {
        var el = svg.querySelector(l[0]); el.setAttribute("x", boiteX + 10); el.setAttribute("y", h + 2 + l[2]); el.textContent = l[1]; el.setAttribute("xml:space", "preserve");
      });
    }
    function arreterBalayage() { if (balayage) { cancelAnimationFrame(balayage); balayage = null; } }
    function balayer() {
      if (calme) return;
      var t0 = null;
      (function pas(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 2600), e = 0.5 - Math.cos(p * Math.PI) / 2; reticule((0.2 + 0.8 * e) * (etat.n - 1)); if (p < 1) balayage = requestAnimationFrame(pas); else { balayage = null; setTimeout(function () { if (!balayage) reticule(null); }, 900); } })(performance.now());
    }
    zoneG.addEventListener("pointermove", function (ev) { arreterBalayage(); var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width; reticule((x - g) / (W - g - d) * (etat.n - 1)); });
    zoneG.addEventListener("pointerleave", function () { reticule(null); });
    document.querySelectorAll(".ph-periodes button").forEach(function (bt) {
      bt.addEventListener("click", function () { periode = bt.dataset.p; document.querySelectorAll(".ph-periodes button").forEach(function (x) { x.classList.toggle("choisi", x === bt); }); arreterBalayage(); reticule(null); dessiner(true); });
    });
    dessiner(true);
    setTimeout(balayer, 2000);
    var largeur = zoneG.clientWidth, attente;
    addEventListener("resize", function () { clearTimeout(attente); attente = setTimeout(function () { if (Math.abs(zoneG.clientWidth - largeur) > 40) { largeur = zoneG.clientWidth; arreterBalayage(); dessiner(false); } }, 150); });
  })();

  /* Ouverture : Terre rendue par la carte graphique (jour, nuit, nuages, reflets), chaînes d'impact, places boursières */
  (function () {
    var zone = document.getElementById("globe-site"), toile = document.getElementById("globe-toile");
    if (!zone || !toile || typeof window.Globe !== "function") return;
    var rad = Math.PI / 180;
    // Images en données (geo/textures.js) : le cadre isolé de la page publiée bloque les fichiers image chargés
    // comme textures. Jeu de base en 4096 px ; le jeu en 8192 px (geo/textures-hd.js) arrive ensuite sur ordinateur.
    var IMAGES = window.TEXTURES_TERRE;
    if (!IMAGES) return;
    // Aperçu à une autre heure, pour les essais en local : ?heure=2026-06-21T10:00Z
    var heureForcee = null;
    try { var h0 = new URLSearchParams(location.search).get("heure"); if (h0 && !isNaN(Date.parse(h0))) heureForcee = new Date(h0); } catch (e) {}
    function maintenant() { return heureForcee || new Date(); }
    function soleil(date) {
      var jour = (date - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5;
      var h = date.getUTCHours() + date.getUTCMinutes() / 60;
      return { lat: -23.44 * Math.cos(2 * Math.PI / 365 * (jour + 10)), lon: ((12 - h) * 15 + 540) % 360 - 180 };
    }
    function image(url) { return new Promise(function (ok, ko) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = ko; i.src = url; }); }
    var PLACES = [
      { nom: "New York", lat: 40.71, lon: -74.01, fuseau: "America/New_York", debut: 570, fin: 960 },
      { nom: "São Paulo", lat: -23.55, lon: -46.63, fuseau: "America/Sao_Paulo", debut: 600, fin: 1020 },
      { nom: "Londres", lat: 51.51, lon: -0.13, fuseau: "Europe/London", debut: 480, fin: 990 },
      { nom: "Paris", lat: 48.86, lon: 2.35, fuseau: "Europe/Paris", debut: 540, fin: 1050 },
      { nom: "Bombay", lat: 19.08, lon: 72.88, fuseau: "Asia/Kolkata", debut: 555, fin: 930 },
      { nom: "Hong Kong", lat: 22.28, lon: 114.16, fuseau: "Asia/Hong_Kong", debut: 570, fin: 960 },
      { nom: "Tokyo", lat: 35.68, lon: 139.77, fuseau: "Asia/Tokyo", debut: 540, fin: 930 },
      { nom: "Sydney", lat: -33.87, lon: 151.21, fuseau: "Australia/Sydney", debut: 600, fin: 960 }
    ];
    function etatPlaces(date) {
      return PLACES.map(function (p) {
        var m = {};
        new Intl.DateTimeFormat("en-GB", { timeZone: p.fuseau, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
          .formatToParts(date).forEach(function (x) { m[x.type] = x.value; });
        var minutes = Number(m.hour) * 60 + Number(m.minute), semaine = m.weekday !== "Sat" && m.weekday !== "Sun";
        return Object.assign({}, p, { heure: m.hour + ":" + m.minute, ouverte: semaine && minutes >= p.debut && minutes < p.fin });
      });
    }
    // Exemples fictifs de chaînes d'impact, dans l'esprit de l'espace Géopolitique du poste de travail.
    // Deux teintes seulement : la cause en laiton, la transmission en bleu pâle.
    var CAUSE = "#e3c083", SUITE = "#bcd3f2";
    var CHAINES = [
      { fait: "L'OPEP+ réduit sa production", chemin: "Pétrole → Inflation → Fed", vue: { lat: 24, lng: -14 },
        lieux: [[24.71, 46.68], [38.9, -77.04]], arcs: [[24.71, 46.68, 38.9, -77.04, CAUSE], [38.9, -77.04, 40.71, -74.01, SUITE]],
        lignes: [["Brent", "+4,2 %", "pos", "+2,8 σ", true], ["Taux US 10 ans", "+11 pb", "pos", "+2,1 σ", true], ["Air France-KLM", "−3,1 %", "neg", "−1,7 σ", false]] },
      { fait: "Nouveaux droits de douane entre la Chine et les États-Unis", chemin: "Commerce et sanctions → Croissance", vue: { lat: 26, lng: 160 },
        lieux: [[39.9, 116.4], [38.9, -77.04], [50.11, 8.68]], arcs: [[39.9, 116.4, 38.9, -77.04, CAUSE], [39.9, 116.4, 50.11, 8.68, SUITE]],
        lignes: [["Cuivre", "−2,6 %", "neg", "−2,4 σ", true], ["LVMH", "−3,4 %", "neg", "−2,1 σ", true], ["Dollar / yuan", "+0,6 %", "pos", "+1,8 σ", false]] },
      { fait: "Attaques sur le trafic maritime en mer Rouge", chemin: "Conflits → Pétrole → Inflation", vue: { lat: 22, lng: 26 },
        lieux: [[15.35, 44.2], [51.92, 4.48]], arcs: [[15.35, 44.2, 51.92, 4.48, CAUSE], [15.35, 44.2, 50.11, 8.68, SUITE]],
        lignes: [["Brent", "+3,8 %", "pos", "+2,6 σ", true], ["Or", "+1,2 %", "pos", "+1,4 σ", false], ["Euro Stoxx 50", "−1,5 %", "neg", "−1,9 σ", false]] }
    ];
    var g = new window.Globe(toile, { animateIn: false, rendererConfig: { antialias: true, alpha: true } })
      .backgroundColor("rgba(0,0,0,0)")
      .globeImageUrl(IMAGES.jour)
      .showAtmosphere(true).atmosphereColor("#6ea8ff").atmosphereAltitude(0.13)
      .labelLat("lat").labelLng("lon").labelText("nom").labelSize(0.82).labelDotRadius(0.34).labelResolution(2).labelAltitude(0.012)
      .labelColor(function (l) { return l.ouverte ? "#62cf94" : "rgba(232,238,245,.9)"; }).labelIncludeDot(true)
      .arcStartLat(function (a) { return a[0]; }).arcStartLng(function (a) { return a[1]; }).arcEndLat(function (a) { return a[2]; }).arcEndLng(function (a) { return a[3]; }).arcColor(function (a) { return [a[4], a[4]]; })
      .arcStroke(0.5).arcDashLength(0.45).arcDashGap(0.15).arcDashAnimateTime(calme ? 0 : 2200).arcAltitudeAutoScale(0.3)
      .ringLat(function (r) { return r[0]; }).ringLng(function (r) { return r[1]; }).ringColor(function () { return function (t) { return "rgba(238,242,246," + (1 - t) + ")"; }; })
      .ringMaxRadius(3).ringPropagationSpeed(1.6).ringRepeatPeriod(1400)
      .pointOfView({ lat: 24, lng: -14, altitude: 1.7 });
    var ctrl = g.controls();
    ctrl.enableZoom = false; ctrl.enablePan = false; ctrl.enableDamping = true; ctrl.rotateSpeed = 0.5;
    ctrl.autoRotate = !calme; ctrl.autoRotateSpeed = 0.28;

    // --- Rendu de la Terre ---
    // Le matériau du globe garde sa texture de jour ; son programme est complété pour calculer, à chaque pixel et
    // à pleine résolution : l'éclairement selon la position réelle du soleil, les lumières des villes côté nuit,
    // les nuages et leur ombre, le reflet du soleil sur l'eau, la teinte du crépuscule et le voile de l'atmosphère.
    var mat = g.globeMaterial(), rendu = g.renderer(), Vecteur = g.camera().position.constructor;
    var U = { uSoleil: { value: new Vecteur(1, 0, 0) }, tLumieres: { value: null }, tNuages: { value: null }, tEau: { value: null } };
    function majSoleil() { var s = soleil(maintenant()), p = g.getCoords(s.lat, s.lon, 0); U.uSoleil.value.set(p.x, p.y, p.z).normalize(); }
    var DECLARATIONS = ["uniform vec3 uSoleil;", "uniform sampler2D tLumieres;", "uniform sampler2D tNuages;", "uniform sampler2D tEau;"].join("\n");
    var TERRE = [
      "{",
      "  vec3 nrm = normalize(normal);",
      "  vec3 sol = normalize((viewMatrix * vec4(uSoleil, 0.0)).xyz);",
      "  vec3 vue = normalize(vViewPosition);",
      "  float c = dot(nrm, sol);",                                  // cosinus de la hauteur du soleil
      "  float jour = smoothstep(-0.10, 0.14, c);",
      "  vec2 uv = vMapUv;",
      "  vec3 surface = diffuseColor.rgb;",
      "  float eau = texture2D(tEau, uv).r;",
      "  float nuage = texture2D(tNuages, uv).r;",
      // Ombre des nuages : la couche est relue un peu plus loin en direction du soleil
      "  float ombre = 0.0;",
      "  vec2 gx = dFdx(uv), gy = dFdy(uv);",
      "  if (max(abs(gx.x), abs(gy.x)) < 0.05) {",
      "    vec2 d = gx * dFdx(c) + gy * dFdy(c);",
      "    float l = length(d);",
      "    if (l > 1e-8) ombre = texture2D(tNuages, uv + d / l * 0.0016).r;",
      "  }",
      "  float lumiere = pow(max(c, 0.0), 0.6);",
      "  vec3 clair = surface * (0.035 + 1.18 * lumiere) * (1.0 - 0.42 * ombre * (1.0 - nuage));",
      // Reflet du soleil sur l'eau : un point vif et une traîne plus large
      "  float nh = max(dot(nrm, normalize(sol + vue)), 0.0);",
      "  clair += vec3(1.0, 0.92, 0.78) * (pow(nh, 110.0) * 0.60 + pow(nh, 16.0) * 0.06) * eau * (1.0 - nuage) * step(0.0, c);",
      "  clair = mix(clair, vec3(0.06 + 0.98 * lumiere), nuage * 0.94);",
      // Crépuscule : la lumière rasante rougit près du terminateur
      "  float crepuscule = smoothstep(0.30, 0.02, c) * smoothstep(-0.12, 0.04, c);",
      "  clair *= mix(vec3(1.0), vec3(1.0, 0.62, 0.38), crepuscule * 0.8);",
      // Nuit : continents à peine visibles, lumières des villes voilées par les nuages
      "  float ville = texture2D(tLumieres, uv).r;",
      "  vec3 sombre = surface * vec3(0.010, 0.018, 0.042) + vec3(0.006, 0.009, 0.020) * nuage;",
      "  sombre += vec3(1.0, 0.76, 0.46) * pow(ville, 1.25) * 2.1 * (1.0 - 0.78 * nuage);",
      "  vec3 terre = mix(sombre, clair, jour);",
      // Voile bleu de l'atmosphère, plus épais vers le bord du disque et côté jour
      "  float rasant = pow(1.0 - max(dot(nrm, vue), 0.0), 3.0);",
      "  terre += vec3(0.20, 0.44, 1.0) * rasant * (0.05 + 0.95 * smoothstep(-0.25, 0.55, c)) * 0.9;",
      "  outgoingLight = terre;",
      "}"
    ].join("\n");
    function texture(Classe, img, gris, aniso) {
      var t = new Classe(img);
      if (gris) t.format = 1028; else t.colorSpace = "srgb";        // une seule composante (RedFormat) ; ou sRGB
      t.wrapS = 1000; t.anisotropy = aniso; t.needsUpdate = true;     // RepeatWrapping en longitude
      return t;
    }
    function montrerToile() { toile.classList.add("pret"); }
    function installerTerre() {
      if (!mat.map || !mat.map.image) { setTimeout(installerTerre, 60); return; }
      var Classe = mat.map.constructor, aniso = rendu.capabilities.getMaxAnisotropy();
      Promise.all([image(IMAGES.lumieres), image(IMAGES.nuages), image(IMAGES.eau)]).then(function (im) {
        mat.map.anisotropy = aniso; mat.map.wrapS = 1000; mat.map.needsUpdate = true;
        U.tLumieres.value = texture(Classe, im[0], true, aniso);
        U.tNuages.value = texture(Classe, im[1], true, aniso);
        U.tEau.value = texture(Classe, im[2], true, aniso);
        majSoleil(); setInterval(majSoleil, 60e3);
        mat.onBeforeCompile = function (programme) {
          Object.keys(U).forEach(function (k) { programme.uniforms[k] = U[k]; });
          programme.fragmentShader = programme.fragmentShader
            .replace("void main() {", DECLARATIONS + "\nvoid main() {")
            .replace("#include <opaque_fragment>", TERRE + "\n#include <opaque_fragment>");
        };
        mat.customProgramCacheKey = function () { return "halvern-terre"; };
        mat.needsUpdate = true;
        // Si la carte graphique refuse le programme, on revient au matériau d'origine (image de jour simple).
        rendu.debug.onShaderError = function () { mat.onBeforeCompile = function () {}; mat.customProgramCacheKey = function () { return "halvern-repli"; }; mat.needsUpdate = true; rendu.debug.onShaderError = null; };
        // Halo extérieur : seulement du côté éclairé
        g.scene().traverse(function (o) {
          var m = o.material;
          if (!m || !m.uniforms || !m.uniforms.coefficient || !m.fragmentShader || m.fragmentShader.indexOf("uSoleil") >= 0) return;
          m.uniforms.uSoleil = U.uSoleil;
          m.fragmentShader = m.fragmentShader.replace("void main() {", "uniform vec3 uSoleil;\nvoid main() {")
            .replace(/gl_FragColor\s*=\s*vec4\(\s*color\s*,\s*intensity\s*\)\s*;/, "float cote = dot(normalize(vVertexNormal), normalize((viewMatrix * vec4(uSoleil, 0.0)).xyz));\n  gl_FragColor = vec4(color, intensity * (0.08 + 0.92 * smoothstep(-0.35, 0.30, cote)));");
          m.needsUpdate = true;
        });
        requestAnimationFrame(function () { requestAnimationFrame(montrerToile); });
        setTimeout(function () { chargerHD(Classe, aniso); }, 1200);
      }).catch(montrerToile);
    }
    // Jeu en 8192 px : seulement sur un ordinateur qui peut le porter.
    function chargerHD(Classe, aniso) {
      var memoire = navigator.deviceMemory, lien = navigator.connection;
      if (rendu.capabilities.maxTextureSize < 8192 || innerWidth < 900 || /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) || (memoire && memoire < 8) || (lien && lien.saveData)) return;
      var s = document.createElement("script"); s.src = "geo/textures-hd.js";
      s.onload = function () {
        var HD = window.TEXTURES_TERRE_HD; if (!HD) return;
        Promise.all([image(HD.jour), image(HD.lumieres)]).then(function (im) {
          var ancienJour = mat.map, anciennesLumieres = U.tLumieres.value;
          mat.map = texture(Classe, im[0], false, aniso); U.tLumieres.value = texture(Classe, im[1], true, aniso);
          ancienJour.dispose(); anciennesLumieres.dispose();
          window.TEXTURES_TERRE_HD = null; zone.dataset.definition = "8192";
        }).catch(function () {});
      };
      document.head.appendChild(s);
    }
    installerTerre();
    setTimeout(montrerToile, 6000);   // la Terre s'affiche quoi qu'il arrive

    // Cadrage : la toile est plus haute que la zone visible et décalée vers le bas, si bien que la Terre, plus
    // grande que le cadre, est coupée sous l'équateur. Le recul de la caméra donne à la sphère le diamètre voulu.
    var DEMI_ANGLE = Math.tan(25 * rad), cadre = null;
    function cadrer() {
      var r = zone.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      var haut = Math.round(r.height * 1.5), diametre = Math.min(r.width * 0.92, r.height * 1.36);
      toile.style.height = haut + "px";
      toile.style.top = Math.round(r.height * 0.76 - haut / 2) + "px";
      return { l: Math.round(r.width), h: haut, alt: 1 / Math.sin(Math.atan(diametre / haut * DEMI_ANGLE)) - 1 };
    }
    function recul() { return cadre ? cadre.alt : 1.7; }
    function taille() {
      var c = cadrer(); if (!c) return;
      cadre = c; g.width(c.l).height(c.h);
      var v = g.pointOfView(); g.pointOfView({ lat: v.lat, lng: v.lng, altitude: c.alt });
    }
    if ("ResizeObserver" in window) new ResizeObserver(taille).observe(zone);
    addEventListener("resize", taille);
    taille();

    var liste = document.getElementById("cm-liste"), heure = document.getElementById("cm-heure");
    function majPlaces() {
      var date = new Date(), etats = etatPlaces(date);
      g.labelsData(etats);
      heure.textContent = "Paris " + new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(date);
      liste.innerHTML = etats.map(function (p) {
        return '<li class="' + (p.ouverte ? "ouverte" : "") + '"><i></i><span>' + p.nom + '</span><span class="h">' + p.heure + '</span><span class="sr">' + (p.ouverte ? "ouverte" : "fermée") + "</span></li>";
      }).join("");
    }
    majPlaces(); setInterval(majPlaces, 60e3);

    var fondus = [document.getElementById("ci-corps"), document.getElementById("globe-fait")];
    var points = document.querySelectorAll("#ci-points i"), courant = 0, minuteur = null, visible = true;
    function montrer(n, transition) {
      var c = CHAINES[n];
      var appliquer = function () {
        document.getElementById("ci-fait").textContent = c.fait;
        document.getElementById("ci-chemin").textContent = c.chemin;
        document.getElementById("ci-lignes").innerHTML = c.lignes.map(function (l) {
          return "<tr><td>" + l[0] + '</td><td class="' + l[2] + '">' + l[1] + '</td><td class="' + (l[4] ? "fort" : "") + '">' + l[3] + "</td></tr>";
        }).join("");
        points.forEach(function (p, i) { p.classList.toggle("actif", i === n); });
        fondus.forEach(function (f) { f.classList.remove("change"); });
      };
      g.arcsData(c.arcs).ringsData(calme ? [] : c.lieux);
      g.pointOfView({ lat: c.vue.lat, lng: c.vue.lng, altitude: recul() }, transition ? 1800 : 0);
      if (transition) { fondus.forEach(function (f) { f.classList.add("change"); }); setTimeout(appliquer, 450); } else appliquer();
    }
    function planifier() { clearTimeout(minuteur); if (calme || !visible) return; minuteur = setTimeout(function () { courant = (courant + 1) % CHAINES.length; montrer(courant, true); planifier(); }, 8000); }
    montrer(0, false); planifier();
    suivreVisibilite(zone, function (v) {
      visible = v;
      if (v) { g.resumeAnimation(); planifier(); } else { g.pauseAnimation(); clearTimeout(minuteur); }
    }, 0);

    // Portefeuille d'exemple : gain cumulé (même série fictive que la page Méthode).
    var hs = aleatoire(7), N = 150, commun = [0], propre = [0];
    for (var i = 1; i < N; i++) { commun.push(commun[i - 1] + (hs() - 0.5) * 170); propre.push(propre[i - 1] + (hs() - 0.5) * 70); }
    var port = [], tem = [];
    for (var j2 = 0; j2 < N; j2++) { var tt = j2 / (N - 1), cc = commun[j2] - commun[N - 1] * tt, pp = propre[j2] - propre[N - 1] * tt; tem.push(1680 * tt + cc); port.push(2100 * tt + cc * 1.08 + pp); }
    port[0] = 0; tem[0] = 0;
    var mn = Math.min.apply(null, port.concat(tem)), mx = Math.max.apply(null, port.concat(tem));
    var Yc = function (v) { return 64 - (v - mn) / (mx - mn) * 58; };
    var pts = function (s) { return s.map(function (v, k) { return (k / (N - 1) * 294).toFixed(1) + "," + Yc(v).toFixed(1); }).join(" "); };
    document.getElementById("cp-trace").innerHTML = '<line x1="0" y1="' + Yc(0).toFixed(1) + '" x2="294" y2="' + Yc(0).toFixed(1) + '" stroke="#21354b" stroke-width="1"/>'
      + '<polyline points="' + pts(tem) + '" fill="none" stroke="#d0ad74" stroke-width="1.3"/><polyline points="' + pts(port) + '" fill="none" stroke="#8fb6ec" stroke-width="1.7"/>'
      + '<circle cx="294" cy="' + Yc(port[N - 1]).toFixed(1) + '" r="2.6" fill="#8fb6ec"/><circle cx="294" cy="' + Yc(tem[N - 1]).toFixed(1) + '" r="2.2" fill="#d0ad74"/>';
  })();

  /* Simulateur de frais */
  (function () {
    if (!document.getElementById("k-capital")) return;
    var champs = { capital: "k-capital", duree: "k-duree", rend: "k-rend", frais: "k-frais", direct: "k-direct" }, el = {};
    Object.keys(champs).forEach(function (k) { el[k] = document.getElementById(champs[k]); });
    var svg = document.getElementById("courbe-frais"), boutons = document.querySelectorAll(".prereglages button[data-f]"), anime = null, affiche = 0;
    var formulesSim = document.querySelectorAll("#formules-sim button"), abo = 89, nomAbo = "Investisseur";
    formulesSim.forEach(function (b) { b.addEventListener("click", function () { abo = +b.dataset.p; nomAbo = b.dataset.n; formulesSim.forEach(function (x) { x.classList.toggle("choisi", x === b); }); maj(); }); });
    function calculer() {
      var C = +el.capital.value, n = +el.duree.value, r = +el.rend.value / 100, f = +el.frais.value / 100, d = +el.direct.value / 100;
      var a = [C], b = [C];
      for (var i = 1; i <= n; i++) { a.push(Math.max(0, a[i - 1] * (1 + r) * (1 - d) - abo)); b.push(b[i - 1] * (1 + r) * (1 - f)); }
      return { a: a, b: b, n: n, C: C, r: r, f: f, d: d };
    }
    function dessiner(s) {
      var W = 560, H = 220, g = 58, dr = 10, h = 12, bas = 28, mx = Math.max.apply(null, s.a.concat(s.b)), o = [];
      var pas = Math.pow(10, Math.floor(Math.log10(mx))) / 2; while (mx / pas > 5) pas *= 2;
      var X = function (i) { return g + (W - g - dr) * i / s.n; }, Y = function (v) { return h + (H - h - bas) * (1 - v / (Math.ceil(mx / pas) * pas)); };
      for (var v = 0; v <= Math.ceil(mx / pas) * pas + 1; v += pas) o.push(ligne(g, Y(v), W - dr, Y(v), "var(--filet)"), txt(g - 8, Y(v) + 4, v >= 1e6 ? fr(v / 1e6, 1) + " M€" : Math.round(v / 1000) + " k€", { m: 1, t: 11, a: "end", c: "var(--discret)" }));
      [0, Math.round(s.n / 2), s.n].forEach(function (i) { o.push(txt(X(i), H - 8, i ? "+" + i + " ans" : "aujourd'hui", { t: 11, a: i === 0 ? "start" : i === s.n ? "end" : "middle", c: "var(--discret)" })); });
      var zone = s.a.map(function (v, i) { return X(i) + "," + Y(v); }).concat(s.b.slice().reverse().map(function (v, i) { return X(s.n - i) + "," + Y(v); })).join(" ");
      o.push('<polygon points="' + zone + '" fill="var(--voile)"/>');
      o.push('<polyline points="' + s.b.map(function (v, i) { return X(i) + "," + Y(v); }).join(" ") + '" fill="none" stroke="var(--temoin)" stroke-width="2"/>');
      o.push('<polyline points="' + s.a.map(function (v, i) { return X(i) + "," + Y(v); }).join(" ") + '" fill="none" stroke="var(--accent)" stroke-width="2.6"/>');
      svg.innerHTML = o.join("");
    }
    function maj() {
      var s = calculer(), ecart = s.a[s.n] - s.b[s.n];
      document.getElementById("o-capital").textContent = euros(s.C);
      document.getElementById("o-duree").textContent = s.n + " ans";
      document.getElementById("o-rend").textContent = fr(s.r * 100, 1) + " % par an";
      document.getElementById("o-frais").textContent = fr(s.f * 100, 2) + " % par an";
      document.getElementById("o-direct").textContent = fr(s.d * 100, 2) + " % par an";
      document.getElementById("o-formule").textContent = nomAbo + " · " + abo + " €/an";
      document.getElementById("o-titre-ecart").textContent = (ecart >= 0 ? "Gardé en plus" : "Perdu") + " au bout de " + s.n + " ans";
      document.getElementById("o-direct-v").textContent = euros(s.a[s.n]);
      document.getElementById("o-delegue-v").textContent = euros(s.b[s.n]);
      boutons.forEach(function (b) { b.classList.toggle("choisi", Math.abs(+b.dataset.f - s.f * 100) < 0.001); });
      dessiner(s);
      var cible = document.getElementById("o-ecart"), depart = affiche, t0 = null, dur = calme ? 0 : 500;
      if (anime) cancelAnimationFrame(anime);
      (function pas(t) { if (t0 === null) t0 = t; var p = dur ? Math.min(1, (t - t0) / dur) : 1; affiche = depart + (ecart - depart) * (1 - Math.pow(1 - p, 3)); cible.textContent = euros(affiche, true); if (p < 1) anime = requestAnimationFrame(pas); })(performance.now());
    }
    Object.keys(el).forEach(function (k) { el[k].addEventListener("input", maj); });
    boutons.forEach(function (b) { b.addEventListener("click", function () { el.frais.value = b.dataset.f; maj(); }); });
    enVue(document.getElementById("frais"), maj, 0.25);
    maj();
  })();

  /* Visite du poste de travail */
  function serie(n, graine, vol, derive, debut) { var h = aleatoire(graine), s = [debut || 0]; for (var i = 1; i < n; i++) s.push(s[i - 1] + derive + (h() - 0.5) * vol); return s; }
  function trace(s, x0, x1, y0, y1, mn, mx) { return s.map(function (v, k) { return (k ? "L" : "M") + (x0 + (x1 - x0) * k / (s.length - 1)).toFixed(1) + " " + (y1 - (v - mn) / (mx - mn) * (y1 - y0)).toFixed(1); }).join(" "); }
  function bornes(listes) { var t = [].concat.apply([], listes); return [Math.min.apply(null, t), Math.max.apply(null, t)]; }
  var T = "var(--nuit-texte)", T2 = "var(--nuit-texte-2)", F = "var(--nuit-filet)", B = "var(--nuit-accent)", O = "var(--nuit-temoin)", V = "#62cf94", R = "#ff8f86";
  function txt(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.t || 12) + '" fill="' + (o.c || T2) + '" font-family="' + "IBM Plex Sans, sans-serif" + '"' + (o.a ? ' text-anchor="' + o.a + '"' : "") + (o.cl ? ' class="' + o.cl + '"' : "") + '>' + s + '</text>'; }
  function ligne(x1, y1, x2, y2, c, w, dash) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="' + (w || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + '/>'; }
  var ESPACES = [
    { code: "DESK", titre: "Moniteur", texte: "Vos lignes, leurs cours pendant la séance, le gain du jour et le fil d'actualités de vos sociétés.", points: ["Cours en continu", "Gain du jour par ligne", "Actualités filtrées sur vos titres"], dessin: function () {
      var l = [["Société A", "412,60", "+1,2 %", 1], ["Société B", "58,34", "−0,8 %", 0], ["Société C", "187,05", "+2,4 %", 1], ["ETF monde", "531,20", "+0,3 %", 1], ["Société D", "23,91", "−1,6 %", 0], ["Société E", "96,48", "+0,1 %", 1]], o = [];
      o.push(txt(16, 28, "Titre", { t: 12 }), txt(330, 28, "Cours", { t: 12, a: "end" }), txt(430, 28, "Jour", { t: 12, a: "end" }), txt(620, 28, "Gain du jour", { t: 12, a: "end" }), ligne(16, 40, 624, 40, F));
      l.forEach(function (r, i) { var y = 72 + i * 40; o.push(txt(16, y, r[0], { c: T, t: 14 }), txt(330, y, r[1], { m: 1, c: T, t: 14, a: "end", cl: "px px" + i }), txt(430, y, r[2], { m: 1, c: r[3] ? V : R, t: 13, a: "end" }), txt(620, y, (r[3] ? "+" : "−") + (40 + i * 17) + " €", { m: 1, c: r[3] ? V : R, t: 13, a: "end" }), ligne(16, y + 16, 624, y + 16, F)); });
      return o.join("");
    }, vivant: function (svg) { var cells = svg.querySelectorAll(".px"); if (!cells.length) return; var c = cells[Math.floor(Math.random() * cells.length)], v = parseFloat(c.textContent.replace(/\s/g, "").replace(",", ".")), d = (Math.random() - 0.48) * v * 0.002; c.textContent = fr(v + d, 2); c.classList.remove("flash-h", "flash-b"); void c.getBBox(); c.classList.add(d >= 0 ? "flash-h" : "flash-b"); } },
    { code: "PERF", titre: "Performance", texte: "Vos achats et ventes rejoués dans un ETF actions monde, aux mêmes dates et pour les mêmes montants.", points: ["Valeur ajoutée par ligne", "Alpha, bêta et statistique t", "Sharpe glissant sur 12 mois"], dessin: function () {
      var a = serie(120, 4, 26, 1.6), b = serie(120, 4, 24, 1.25), m = bornes([a, b]);
      return ligne(40, 280, 624, 280, F) + '<path d="' + trace(b, 40, 624, 30, 280, m[0], m[1]) + '" fill="none" stroke="' + O + '" stroke-width="2"/><path d="' + trace(a, 40, 624, 30, 280, m[0], m[1]) + '" fill="none" stroke="' + B + '" stroke-width="2.4"/>' + txt(40, 22, "Gain cumulé, portefeuille et témoin", { t: 12 }) + txt(624, 22, "alpha +1,4 %/an · t = 0,8", { m: 1, t: 12, a: "end", c: T });
    } },
    { code: "RISK", titre: "Risque", texte: "Volatilité, pire baisse, bêta, perte probable sur un mois, et des milliers de trajectoires simulées pour voir l'éventail des possibles.", points: ["Simulations de Monte-Carlo", "Perte maximale historique", "Couverture face à une baisse du marché"], dessin: function () {
      var o = [], n = 60, med = [], p10 = [], p90 = [], p25 = [], p75 = [];
      for (var k = 0; k < n; k++) { var t = k / (n - 1); med.push(100 + 42 * t); var s = 70 * Math.sqrt(t); p90.push(100 + 42 * t + s); p10.push(100 + 42 * t - s * 0.8); p75.push(100 + 42 * t + s * 0.45); p25.push(100 + 42 * t - s * 0.38); }
      function bandeau(hautS, basS, c) { var x = function (k) { return 40 + 584 * k / (n - 1); }, y = function (v) { return 290 - (v - 40) / 180 * 260; }; return '<polygon points="' + hautS.map(function (v, k) { return x(k) + "," + y(v); }).concat(basS.slice().reverse().map(function (v, k) { return x(n - 1 - k) + "," + y(v); })).join(" ") + '" fill="' + c + '"/>'; }
      o.push(bandeau(p90, p10, "rgba(143,182,236,0.16)"), bandeau(p75, p25, "rgba(143,182,236,0.30)"));
      var y = function (v) { return 290 - (v - 40) / 180 * 260; };
      o.push('<polyline points="' + med.map(function (v, k) { return (40 + 584 * k / (n - 1)) + "," + y(v); }).join(" ") + '" fill="none" stroke="' + B + '" stroke-width="2"/>');
      o.push(txt(40, 22, "Valeur simulée sur 5 ans, base 100", { t: 12 }), txt(624, 22, "pire baisse −18,5 % · bêta 0,92", { m: 1, t: 12, a: "end", c: T }));
      return o.join("");
    } },
    { code: "PAIR", court: "Paires", titre: "Paires et corrélations", texte: "N'importe quel actif face à n'importe quel autre : corrélation glissante, écart normalisé, test de cointégration, résultats publiés.", points: ["Corrélation sur fenêtre glissante", "Écart normalisé et ses bandes", "Test de cointégration d'Engle-Granger"], dessin: function () {
      var h = aleatoire(21), z = [0]; for (var k = 1; k < 140; k++) z.push(z[k - 1] * 0.93 + (h() - 0.5) * 0.9);
      var a = serie(140, 31, 3, 0.25, 50), b = a.map(function (v, k) { return v * 0.9 + z[k] * 2.2 + 4; }), m = bornes([a, b]), o = [];
      o.push('<path d="' + trace(a, 40, 624, 30, 170, m[0], m[1]) + '" fill="none" stroke="' + B + '" stroke-width="2"/><path d="' + trace(b, 40, 624, 30, 170, m[0], m[1]) + '" fill="none" stroke="' + O + '" stroke-width="2"/>');
      var yz = function (v) { return 245 - v * 22; };
      o.push(ligne(40, yz(2), 624, yz(2), F, 1, "4 3"), ligne(40, yz(-2), 624, yz(-2), F, 1, "4 3"), ligne(40, yz(0), 624, yz(0), F));
      o.push('<polyline points="' + z.map(function (v, k) { return (40 + 584 * k / 139) + "," + yz(v * 1.6); }).join(" ") + '" fill="none" stroke="' + T + '" stroke-width="1.5"/>');
      o.push(txt(40, 22, "Deux actifs et l'écart normalisé de leur rapport", { t: 12 }), txt(624, 22, "corrélation 0,81 · ADF −3,9", { m: 1, t: 12, a: "end", c: T }), txt(620, yz(2) - 4, "+2σ", { m: 1, t: 11, a: "end" }), txt(620, yz(-2) + 14, "−2σ", { m: 1, t: 11, a: "end" }));
      return o.join("");
    } },
    { code: "EXPO", court: "Exposition", titre: "Exposition réelle", texte: "Où est vraiment votre argent : pays, secteurs, devises, ETF compris grâce à leurs principales lignes.", points: ["Transparence des ETF", "Concentration par titre et secteur", "Part en devises étrangères"], dessin: function () {
      var o = [], blocs = [["Zones", [["Europe", 46, B], ["États-Unis", 38, O], ["Asie", 11, "#8aa0b8"], ["Autres", 5, F]]], ["Secteurs", [["Technologie", 31, B], ["Consommation", 22, O], ["Finance", 18, "#8aa0b8"], ["Industrie", 16, "#5d7590"], ["Autres", 13, F]]], ["Devises", [["Euro", 54, B], ["Dollar", 39, O], ["Autres", 7, F]]]];
      blocs.forEach(function (bl, i) { var y = 46 + i * 92, x = 40; o.push(txt(40, y - 10, bl[0], { t: 12 })); bl[1].forEach(function (s) { var w = 584 * s[1] / 100; o.push('<rect x="' + x + '" y="' + y + '" width="' + (w - 2) + '" height="22" fill="' + s[2] + '"/>', txt(x, y + 42, s[0] + " " + s[1] + " %", { t: 11, c: T })); x += w; }); });
      return o.join("");
    } },
    { code: "SCRN", titre: "Screener", texte: "Environ un millier de titres du S&P 500 et des grands indices européens, notés par secteur sur des critères que vous pondérez.", points: ["Critères de valeur, qualité, momentum", "Classement au sein de chaque secteur", "Ajout direct à votre liste de suivi"], dessin: function () {
      var l = [["Société F", "Industrie", 92], ["Société G", "Santé", 88], ["Société H", "Logiciels", 85], ["Société I", "Énergie", 81], ["Société J", "Banques", 77], ["Société K", "Luxe", 74]], o = [];
      o.push(txt(16, 28, "Titre", { t: 12 }), txt(220, 28, "Secteur", { t: 12 }), txt(400, 28, "Note (percentile)", { t: 12 }), ligne(16, 40, 624, 40, F));
      l.forEach(function (r, i) { var y = 70 + i * 40; o.push(txt(16, y, r[0], { c: T, t: 14 }), txt(220, y, r[1], { t: 13 }), '<rect x="400" y="' + (y - 11) + '" width="180" height="10" fill="' + F + '"/><rect x="400" y="' + (y - 11) + '" width="' + (180 * r[2] / 100) + '" height="10" fill="' + B + '"/>', txt(624, y, String(r[2]), { m: 1, c: T, t: 13, a: "end" }), ligne(16, y + 16, 624, y + 16, F)); });
      return o.join("");
    } },
    { code: "VAL", titre: "Valorisation", texte: "Flux de trésorerie actualisés et multiples sectoriels, avec vos propres hypothèses de croissance, de marge et de coût du capital.", points: ["DCF avec hypothèses réglables", "Multiples sectoriels par région", "Sensibilité au coût du capital"], dessin: function () {
      var o = [], lignes = [["DCF (vos hypothèses)", 120, 168, 146], ["Multiple EV/EBITDA", 132, 176, 158], ["Multiple cours / bénéfice", 110, 150, 131], ["Fourchette combinée", 124, 164, 145]];
      var x = function (v) { return 220 + (v - 90) / 110 * 400; };
      [100, 125, 150, 175, 200].forEach(function (v) { o.push(ligne(x(v), 40, x(v), 270, F), txt(x(v), 290, String(v), { m: 1, t: 11, a: "middle" })); });
      lignes.forEach(function (l, i) { var y = 70 + i * 54; o.push(txt(16, y + 5, l[0], { c: T, t: 13 }), '<rect x="' + x(l[1]) + '" y="' + (y - 9) + '" width="' + (x(l[2]) - x(l[1])) + '" height="18" fill="' + (i === 3 ? "rgba(143,182,236,0.45)" : "rgba(160,174,190,0.35)") + '"/>', ligne(x(l[3]), y - 13, x(l[3]), y + 13, i === 3 ? B : T, 2.5)); });
      o.push(ligne(x(152), 34, x(152), 270, O, 1.5, "5 4"), txt(x(152), 28, "cours 152", { m: 1, t: 11, a: "middle", c: O }));
      return o.join("");
    } },
    { code: "ALRT", titre: "Alertes", texte: "Des seuils sur les cours, les variations et l'écart entre deux actifs, surveillés pendant la séance.", points: ["Seuil de cours ou de variation", "Écart normalisé d'une paire", "Historique des déclenchements"], dessin: function () {
      var l = [["09:14", "Société A", "a franchi 410,00", 1], ["10:02", "Paire C / D", "écart normalisé au-delà de +2", 2], ["11:47", "Société B", "variation du jour −3 %", 0], ["14:31", "ETF monde", "nouveau plus haut sur un an", 1], ["15:58", "Société E", "volume trois fois la moyenne", 2]], o = [];
      l.forEach(function (r, i) { var y = 44 + i * 54; o.push('<rect x="16" y="' + (y - 22) + '" width="4" height="36" fill="' + [R, V, O][r[3]] + '"/>', txt(34, y, r[0], { m: 1, t: 12 }), txt(100, y, r[1], { c: T, t: 14 }), txt(100, y + 18, r[2], { t: 12 }), ligne(16, y + 28, 624, y + 28, F)); });
      return o.join("");
    } },
    { code: "AGND", titre: "Agenda", texte: "Les publications de résultats, les dividendes et les grands rendez-vous macroéconomiques qui touchent vos lignes.", points: ["Résultats de vos sociétés", "Détachements de dividendes", "Banques centrales et statistiques"], dessin: function () {
      var j = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."], ev = [[0, "Résultats", "Société A", B], [1, "Dividende", "Société E", V], [2, "BCE", "Décision de taux", O], [2, "Résultats", "Société C", B], [3, "Emploi US", "Statistique", O], [4, "Résultats", "Société B", B]], o = [], n = [0, 0, 0, 0, 0];
      j.forEach(function (d, i) { var x = 16 + i * 122; o.push(txt(x, 28, d + " " + (17 + i), { m: 1, t: 12, c: T }), ligne(x, 38, x + 112, 38, F)); });
      ev.forEach(function (e) { var x = 16 + e[0] * 122, y = 56 + n[e[0]]++ * 76; o.push('<rect x="' + x + '" y="' + y + '" width="112" height="64" fill="' + "var(--nuit-2)" + '" stroke="' + F + '"/><rect x="' + x + '" y="' + y + '" width="112" height="3" fill="' + e[3] + '"/>', txt(x + 10, y + 26, e[1], { c: T, t: 13 }), txt(x + 10, y + 46, e[2], { t: 11 })); });
      return o.join("");
    } },
    { code: "MACRO", court: "Macro", titre: "Macro et marchés", texte: "Courbes de taux, changes, volatilité implicite et carte des événements géopolitiques, pour situer vos lignes dans leur environnement.", points: ["Courbes de taux zone euro et États-Unis", "Changes et différentiels de taux", "Globe des événements"], dessin: function () {
      var mats = [0.25, 1, 2, 5, 10, 20, 30], eu = [2.0, 2.05, 2.15, 2.45, 2.9, 3.25, 3.3], us = [4.1, 3.9, 3.75, 3.85, 4.2, 4.6, 4.65], o = [];
      var x = function (m) { return 60 + Math.log(m / 0.25) / Math.log(120) * 560; }, y = function (v) { return 270 - (v - 1.5) / 3.5 * 230; };
      [2, 3, 4, 5].forEach(function (v) { o.push(ligne(60, y(v), 620, y(v), F), txt(52, y(v) + 4, v + " %", { m: 1, t: 11, a: "end" })); });
      mats.forEach(function (m) { o.push(txt(x(m), 292, (m < 1 ? "3 m" : m + " a"), { m: 1, t: 11, a: "middle" })); });
      o.push('<polyline points="' + mats.map(function (m, i) { return x(m) + "," + y(eu[i]); }).join(" ") + '" fill="none" stroke="' + B + '" stroke-width="2.2"/>', '<polyline points="' + mats.map(function (m, i) { return x(m) + "," + y(us[i]); }).join(" ") + '" fill="none" stroke="' + O + '" stroke-width="2.2"/>');
      o.push(txt(60, 22, "Courbes de taux souverains", { t: 12 }), txt(620, 22, "zone euro · États-Unis", { m: 1, t: 12, a: "end", c: T }));
      return o.join("");
    } },
    { code: "THES", court: "Journal", titre: "Journal des thèses", texte: "Pourquoi vous avez acheté, ce qui vous ferait revendre, et le bilan de chaque thèse une fois le résultat connu.", points: ["Une thèse par ligne, datée", "Conditions de sortie écrites à l'avance", "Bilan des thèses clôturées"], dessin: function () {
      var c = [["Société A", "Ouverte · 14 mois", "Croissance des marges en Asie ; je sors si la marge opérationnelle passe sous 25 %.", B], ["Société C", "Ouverte · 6 mois", "Gain de parts de marché du logiciel ; je réévalue après deux trimestres de recul.", B], ["Société D", "Clôturée · −12 %", "Redressement attendu non venu ; condition de sortie atteinte, thèse invalidée.", R]], o = [];
      c.forEach(function (t, i) { var y = 16 + i * 98; o.push('<rect x="16" y="' + y + '" width="608" height="86" fill="var(--nuit-2)" stroke="' + F + '"/>', txt(32, y + 28, t[0], { c: T, t: 14 }), txt(608, y + 28, t[1], { m: 1, t: 11, a: "end", c: t[3] }), txt(32, y + 56, t[2], { t: 12 })); });
      return o.join("");
    } }
  ];
  if (document.getElementById("onglets")) (function () {
  var onglets = document.getElementById("onglets"), ecranTexte = document.getElementById("ecran-texte"), ecranSvg = document.getElementById("ecran-svg"), poste = document.getElementById("poste-travail");
  var courant = 0, minuteur = null, duree = 5200, vivant = null, enPause = false, visible = false;
  ESPACES.forEach(function (e, i) {
    var b = document.createElement("button"); b.className = "onglet"; b.type = "button"; b.setAttribute("role", "tab"); b.id = "onglet-" + e.code; b.textContent = e.court || e.titre;
    var p = document.createElement("span"); p.className = "progression"; b.appendChild(p);
    b.addEventListener("click", function () { montrerEspace(i, true); });
    onglets.appendChild(b);
  });
  poste.style.setProperty("--duree", (duree / 1000) + "s");
  function montrerEspace(i, manuel) {
    courant = i; var e = ESPACES[i];
    onglets.querySelectorAll(".onglet").forEach(function (b, k) { b.classList.toggle("actif", k === i); b.setAttribute("aria-selected", k === i ? "true" : "false"); var p = b.querySelector(".progression"); p.style.animation = "none"; void p.offsetWidth; p.style.animation = ""; });
    ecranTexte.innerHTML = '<h3>' + e.titre + '</h3><p>' + e.texte + '</p><ul>' + e.points.map(function (p) { return "<li>" + p + "</li>"; }).join("") + '</ul>';
    ecranTexte.classList.remove("changer"); ecranSvg.classList.remove("changer"); void ecranTexte.offsetWidth; ecranTexte.classList.add("changer"); ecranSvg.classList.add("changer");
    ecranSvg.innerHTML = e.dessin();
    clearInterval(vivant); if (e.vivant && !calme) vivant = setInterval(function () { e.vivant(ecranSvg); }, 420);
    var actif = onglets.children[i]; if (manuel && actif.scrollIntoView) onglets.scrollTo({ left: actif.offsetLeft - 40, behavior: calme ? "auto" : "smooth" });
    planifier();
  }
  function planifier() { clearTimeout(minuteur); if (calme || enPause || !visible) return; minuteur = setTimeout(function () { montrerEspace((courant + 1) % ESPACES.length); }, duree); }
  poste.addEventListener("pointerenter", function () { enPause = true; poste.classList.add("pause"); clearTimeout(minuteur); });
  poste.addEventListener("pointerleave", function () { enPause = false; poste.classList.remove("pause"); montrerEspace(courant); });
  suivreVisibilite(poste, function (v) { visible = v; if (v) montrerEspace(courant); else clearTimeout(minuteur); }, 0.35);
  montrerEspace(0);
  })();


  /* Récits épinglés : étape active selon le défilement */
  function recit(nom, montrer) {
    var pas = document.querySelectorAll('[data-recit="' + nom + '"] .pas'), etat = -1;
    function maj() {
      var milieu = innerHeight * 0.55, actif = 0;
      pas.forEach(function (p, i) { if (p.getBoundingClientRect().top < milieu) actif = i; });
      pas.forEach(function (p, i) { p.classList.toggle("actif", i === actif); });
      if (actif !== etat) { etat = actif; montrer(actif); }
    }
    addEventListener("scroll", maj, { passive: true }); addEventListener("resize", maj); maj();
  }
  function dessinerTrait(p, visible) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = visible ? 0 : L; }

  /* Récit 1 : corrélations */
  (function () {
    if (!document.getElementById("scene-correl")) return;
    var svg = document.getElementById("scene-correl"), W = 640, H = 340, o = [];
    var noms = ["Luxe", "Banques", "Industrie", "Logiciels", "Semi-cond.", "Énergie", "Or", "Oblig."];
    var M = [[1, .82, .76, .41, .38, .35, .05, -.12], [.82, 1, .79, .36, .33, .44, .02, -.18], [.76, .79, 1, .45, .42, .51, .08, -.10], [.41, .36, .45, 1, .86, .22, .04, -.06], [.38, .33, .42, .86, 1, .25, .07, -.04], [.35, .44, .51, .22, .25, 1, .21, -.15], [.05, .02, .08, .04, .07, .21, 1, .28], [-.12, -.18, -.10, -.06, -.04, -.15, .28, 1]];
    var cote = 30, x0 = 130, y0 = 34;
    function couleur(v) { return v >= 0 ? "rgba(26,75,143," + (0.08 + v * 0.82).toFixed(2) + ")" : "rgba(150,115,59," + (0.1 + -v * 1.6).toFixed(2) + ")"; }
    o.push('<g class="calque" id="c-matrice">');
    noms.forEach(function (n, i) { o.push(txt(x0 - 8, y0 + i * cote + 19, n, { t: 11, a: "end", c: "var(--encre-2)" }), '<text x="' + (x0 + i * cote + 15) + '" y="' + (y0 - 8) + '" font-size="10" fill="var(--discret)" font-family="IBM Plex Sans, sans-serif" text-anchor="start" transform="rotate(-40 ' + (x0 + i * cote + 15) + ' ' + (y0 - 8) + ')">' + n + '</text>'); });
    M.forEach(function (r, i) { r.forEach(function (v, j) { o.push('<rect class="cellule" data-d="' + (i + j) + '" x="' + (x0 + j * cote) + '" y="' + (y0 + i * cote) + '" width="' + (cote - 2) + '" height="' + (cote - 2) + '" fill="' + couleur(v) + '" opacity="0"/>'); if (i !== j) o.push('<text class="cellule" data-d="' + (i + j) + '" x="' + (x0 + j * cote + 14) + '" y="' + (y0 + i * cote + 18) + '" font-size="9" text-anchor="middle" fill="' + (Math.abs(v) > 0.55 ? "#ffffff" : "var(--encre-2)") + '" font-family="IBM Plex Sans, sans-serif" opacity="0">' + fr(v, 1) + '</text>'); }); });
    o.push('<rect x="' + (x0 - 2) + '" y="' + (y0 - 2) + '" width="' + (3 * cote + 2) + '" height="' + (3 * cote + 2) + '" fill="none" stroke="var(--encre)" stroke-width="1.5" class="cellule" data-d="14" opacity="0"/>');
    o.push(txt(x0 + 8 * cote + 24, y0 + 24, "Un seul pari", { t: 13, c: "var(--encre)" }), txt(x0 + 8 * cote + 24, y0 + 42, "Luxe, banques et industrie :", { t: 11, c: "var(--encre-2)" }), txt(x0 + 8 * cote + 24, y0 + 58, "corrélation moyenne 0,79", { t: 11, c: "var(--encre-2)", m: 1 }));
    o.push(txt(x0 + 8 * cote + 24, y0 + 186, "Ce qui diversifie", { t: 13, c: "var(--temoin)" }), txt(x0 + 8 * cote + 24, y0 + 204, "Or et obligations d'État :", { t: 11, c: "var(--encre-2)" }), txt(x0 + 8 * cote + 24, y0 + 220, "corrélation proche de 0", { t: 11, c: "var(--encre-2)", m: 1 }));
    o.push('</g>');
    var N = 150, h = aleatoire(17), rc = [];
    for (var k = 0; k < N; k++) { var t = k / (N - 1), base = t < 0.55 ? 0.76 - t * 0.12 : 0.69 - (t - 0.55) * 1.25; rc.push(Math.max(-0.1, Math.min(0.95, base + (h() - 0.5) * 0.07))); }
    var gx = function (k) { return 60 + 560 * k / (N - 1); }, gy = function (v) { return 290 - (v + 0.2) / 1.2 * 250; };
    o.push('<g class="calque" id="c-glissante" opacity="0">');
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { o.push(ligne(60, gy(v), 620, gy(v), "var(--filet)"), txt(52, gy(v) + 4, fr(v, 2), { m: 1, t: 11, a: "end", c: "var(--discret)" })); });
    var debutD = rc.findIndex(function (v, k) { return k > 60 && v < 0.3; });
    o.push('<rect x="' + gx(debutD) + '" y="' + gy(1) + '" width="' + (620 - gx(debutD)) + '" height="' + (gy(-0.2) - gy(1)) + '" fill="var(--voile-orange)"/>');
    o.push(ligne(60, gy(0.3), 620, gy(0.3), "var(--temoin)", 1, "5 4"), txt(616, gy(0.3) - 6, "seuil 0,3", { m: 1, t: 11, a: "end", c: "var(--temoin)" }));
    o.push('<path class="trait" id="c-trait-glissante" d="' + rc.map(function (v, k) { return (k ? "L" : "M") + gx(k).toFixed(1) + " " + gy(v).toFixed(1); }).join(" ") + '" stroke="var(--accent)" stroke-width="2.4"/>');
    o.push(txt(612, gy(1) + 16, "décorrélation repérée", { t: 12, c: "var(--temoin)", a: "end" }), txt(60, 320, "Corrélation sur 6 mois glissants · Société A et Société D", { t: 11, c: "var(--discret)" }));
    o.push('</g>');
    var hz = aleatoire(29), z = [0]; for (var q = 1; q < N; q++) z.push(z[q - 1] * 0.94 + (hz() - 0.5) * 0.85);
    var zm = Math.max.apply(null, z.map(Math.abs)), zs = z.map(function (v) { return v / zm * 2.6; });
    var zy = function (v) { return 170 - v * 48; };
    o.push('<g class="calque" id="c-ecart" opacity="0">');
    o.push('<rect x="60" y="' + zy(2) + '" width="560" height="' + (zy(-2) - zy(2)) + '" fill="var(--voile)"/>');
    [-2, -1, 0, 1, 2].forEach(function (v) { o.push(ligne(60, zy(v), 620, zy(v), v === 0 ? "var(--filet-fort)" : "var(--filet)", 1, Math.abs(v) === 2 ? "5 4" : ""), txt(52, zy(v) + 4, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "σ", { m: 1, t: 11, a: "end", c: "var(--discret)" })); });
    o.push('<path class="trait" id="c-trait-ecart" d="' + zs.map(function (v, k) { return (k ? "L" : "M") + gx(k).toFixed(1) + " " + zy(v).toFixed(1); }).join(" ") + '" stroke="var(--encre)" stroke-width="1.8"/>');
    zs.forEach(function (v, k) { if (Math.abs(v) > 2) o.push('<circle cx="' + gx(k) + '" cy="' + zy(v) + '" r="3" fill="var(--temoin)"/>'); });
    o.push(txt(60, 320, "Écart normalisé du rapport des cours · zone bleue : ±2 écarts-types", { t: 11, c: "var(--discret)" }));
    o.push('<g id="c-carte" opacity="0" class="calque"><rect x="376" y="26" width="244" height="74" fill="var(--surface)" stroke="var(--encre)"/>' + txt(390, 48, "Test d'Engle-Granger, 5 ans", { t: 11, c: "var(--encre-2)" }) + txt(390, 72, "ADF −3,9 · seuil −3,34", { t: 15, c: "var(--encre)", m: 1 }) + txt(390, 90, "relation stable sur la période", { t: 11, c: "var(--hausse)" }) + '</g>');
    o.push('</g>');
    svg.innerHTML = o.join("");
    var cellules = svg.querySelectorAll(".cellule"), calques = { m: svg.querySelector("#c-matrice"), g: svg.querySelector("#c-glissante"), e: svg.querySelector("#c-ecart"), c: svg.querySelector("#c-carte") };
    var tg = svg.querySelector("#c-trait-glissante"), te = svg.querySelector("#c-trait-ecart");
    dessinerTrait(tg, false); dessinerTrait(te, false);
    var titre = document.getElementById("c-titre"), vA = document.getElementById("c-actuelle"), vZ = document.getElementById("c-z"), vC = document.getElementById("c-coint");
    recit("correl", function (n) {
      calques.m.setAttribute("opacity", n === 0 ? 1 : 0);
      calques.g.setAttribute("opacity", n === 1 ? 1 : 0);
      calques.e.setAttribute("opacity", n >= 2 ? 1 : 0);
      calques.c.setAttribute("opacity", n >= 3 ? 1 : 0);
      if (n === 0) cellules.forEach(function (c) { c.style.transitionDelay = (calme ? 0 : c.getAttribute("data-d") * 0.04) + "s"; c.setAttribute("opacity", 1); });
      dessinerTrait(tg, n === 1); dessinerTrait(te, n >= 2);
      titre.textContent = ["Corrélation des rendements quotidiens, sur un an", "Corrélation glissante entre deux lignes", "Écart normalisé entre deux actifs", "Écart normalisé et test de cointégration"][n];
      vA.textContent = n >= 1 ? fr(rc[N - 1], 2) : "0,79"; vA.style.color = n >= 1 ? "var(--temoin)" : "";
      vZ.textContent = n >= 2 ? (zs[N - 1] >= 0 ? "+" : "−") + fr(Math.abs(zs[N - 1]), 1) + "σ" : "—";
      vC.textContent = n >= 3 ? "stable" : "—"; vC.style.color = n >= 3 ? "var(--hausse)" : "";
    });
  })();

  /* Récit 2 : performance */
  (function () {
    if (!document.getElementById("scene-perf")) return;
    var svg = document.getElementById("scene-perf"), W = 640, H = 330, g = 52, d = 14, h = 16, b = 34, N = 150;
    var hs = aleatoire(7), commun = [0], propre = [0];
    for (var i = 1; i < N; i++) { commun.push(commun[i - 1] + (hs() - 0.5) * 170); propre.push(propre[i - 1] + (hs() - 0.5) * 70); }
    var port = [], temoin = [];
    for (var j = 0; j < N; j++) { var t = j / (N - 1), c = commun[j] - commun[N - 1] * t, pr = propre[j] - propre[N - 1] * t; temoin.push(Math.round(1680 * t + c)); port.push(Math.round(2100 * t + c * 1.08 + pr)); }
    port[0] = 0; temoin[0] = 0;
    var ordres = [[0, 3000], [20, 4000], [52, 2500], [88, 1500]], debutDate = Date.UTC(2024, 0, 8), finDate = Date.UTC(2026, 9, 30);
    var mn = Math.min.apply(null, port.concat(temoin)), mx = Math.max.apply(null, port.concat(temoin)), pasY = 500, basY = Math.floor(mn / pasY) * pasY, hautY = Math.ceil(mx / pasY) * pasY;
    function X(k) { return g + (W - g - d) * k / (N - 1); }
    function Y(v) { return h + (H - h - b) * (hautY - v) / (hautY - basY); }
    function chemin(s) { return s.map(function (v, k) { return (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1); }).join(" "); }
    var mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], o = [];
    for (var v = basY; v <= hautY; v += pasY) { o.push(ligne(g, Y(v), W - d, Y(v), "var(--filet)", 1, v === 0 ? "4 3" : ""), txt(g - 8, Y(v) + 4, v.toLocaleString("fr-FR"), { m: 1, t: 11, a: "end", c: "var(--discret)" })); }
    [0, 6, 12, 18, 24, 30].forEach(function (m) { var dm = Date.UTC(2024, m, 1), k = (dm - debutDate) / (finDate - debutDate) * (N - 1); if (k < 0 || k > N - 1) return; o.push(txt(X(k), H - 10, mois[new Date(dm).getUTCMonth()] + " " + new Date(dm).getUTCFullYear(), { t: 11, a: "middle", c: "var(--discret)" })); });
    var zone = port.map(function (v, k) { return X(k).toFixed(1) + "," + Y(v).toFixed(1); }).concat(temoin.slice().reverse().map(function (v, k) { return X(N - 1 - k).toFixed(1) + "," + Y(v).toFixed(1); })).join(" ");
    o.push('<polygon class="calque" id="p-zone" points="' + zone + '" fill="var(--voile)" opacity="0"/>');
    ordres.forEach(function (or) { var x = X(or[0]); o.push('<g class="ordre">' + ligne(x, H - b, x, H - b - 26, "var(--encre)", 1.5) + '<circle cx="' + x + '" cy="' + (H - b - 26) + '" r="3" fill="var(--encre)"/>' + txt(x + 6, H - b - 30, "+" + or[1].toLocaleString("fr-FR") + " €", { m: 1, t: 11, c: "var(--encre)" }) + '</g>'); });
    o.push('<path class="trait" id="p-temoin" d="' + chemin(temoin) + '" stroke="var(--temoin)" stroke-width="2"/>', '<path class="trait" id="p-port" d="' + chemin(port) + '" stroke="var(--accent)" stroke-width="2.6"/>');
    svg.innerHTML = o.join("");
    var tT = svg.querySelector("#p-temoin"), tP = svg.querySelector("#p-port"), zoneEl = svg.querySelector("#p-zone");
    dessinerTrait(tT, false); dessinerTrait(tP, false);
    var vT = document.getElementById("p-temoin"), vE = document.getElementById("p-ecart");
    recit("perf", function (n) {
      dessinerTrait(tT, n >= 1); dessinerTrait(tP, n >= 2); zoneEl.setAttribute("opacity", n >= 3 ? 1 : 0);
      vT.textContent = n >= 1 ? "+1 680 €" : "—";
      if (n >= 3) { vE.style.color = "var(--hausse)"; compter(vE, 420, function (x) { return euros(x, true); }, 1200); } else { vE.style.color = ""; vE.textContent = "—"; }
    });
  })();

  /* Risque : éventail de simulations et mesures */
  (function () {
    if (!document.getElementById("eventail")) return;
    var svg = document.getElementById("eventail"), n = 61, o = [], h = aleatoire(41);
    var x = function (k) { return 52 + 574 * k / (n - 1); }, y = function (v) { return 250 - (v - 60) / 140 * 230; };
    [60, 100, 140, 180].forEach(function (v) { o.push(ligne(52, y(v), 626, y(v), "var(--filet)"), txt(44, y(v) + 4, v + " k€", { m: 1, t: 11, a: "end", c: "var(--discret)" })); });
    [0, 1, 2, 3, 4, 5].forEach(function (a) { o.push(txt(x(a * 12), 272, a ? "+" + a + " an" + (a > 1 ? "s" : "") : "aujourd'hui", { t: 11, a: "middle", c: "var(--discret)" })); });
    for (var s = 0; s < 26; s++) { var v = 100, pts = []; for (var k = 0; k < n; k++) { if (k) v *= 1 + 0.006 + (h() - 0.5) * 0.085; pts.push(x(k).toFixed(1) + "," + y(Math.max(60, Math.min(200, v))).toFixed(1)); } o.push('<polyline class="traj" points="' + pts.join(" ") + '" fill="none" stroke="var(--filet-fort)" stroke-width="0.8" opacity="0"/>'); }
    function q(t, z) { return 100 * Math.exp(0.065 * t * 5 + z * 0.15 * Math.sqrt(t * 5)); }
    function bande(z1, z2, c) { var a = [], b = []; for (var k = 0; k < n; k++) { var t = k / (n - 1); a.push(x(k) + "," + y(Math.min(200, q(t, z1)))); b.unshift(x(k) + "," + y(Math.max(60, q(t, z2)))); } return '<polygon class="bande-ev" points="' + a.concat(b).join(" ") + '" fill="' + c + '" opacity="0"/>'; }
    o.push(bande(1.28, -1.28, "var(--voile)"), bande(0.67, -0.67, "var(--voile)"));
    var med = []; for (var k2 = 0; k2 < n; k2++) med.push((k2 ? "L" : "M") + x(k2).toFixed(1) + " " + y(q(k2 / (n - 1), 0)).toFixed(1));
    o.push('<path id="ev-med" d="' + med.join(" ") + '" fill="none" stroke="var(--accent)" stroke-width="2.4" style="transition:stroke-dashoffset 1.8s var(--ease)"/>');
    o.push(txt(626, y(q(1, 0)) - 8, "médiane " + Math.round(q(1, 0)) + " k€", { m: 1, t: 11, a: "end", c: "var(--accent)" }), txt(626, y(Math.min(200, q(1, 1.28))) + 14, "8 trajectoires sur 10", { t: 11, a: "end", c: "var(--encre-2)" }));
    svg.innerHTML = o.join("");
    var medEl = svg.querySelector("#ev-med"), L = medEl.getTotalLength(); medEl.style.strokeDasharray = L; medEl.style.strokeDashoffset = L;
    svg.querySelectorAll(".traj, .bande-ev").forEach(function (e) { e.style.transition = "opacity 1s var(--ease)"; });
    enVue(svg, function () {
      svg.querySelectorAll(".traj").forEach(function (e, i) { e.style.transitionDelay = (calme ? 0 : i * 0.03) + "s"; e.setAttribute("opacity", 0.7); });
      svg.querySelectorAll(".bande-ev").forEach(function (e) { e.style.transitionDelay = calme ? "0s" : ".6s"; e.setAttribute("opacity", 1); });
      medEl.style.strokeDashoffset = 0;
    }, 0.35);
    var mesures = document.getElementById("mesures");
    enVue(mesures, function () {
      mesures.querySelectorAll(".v").forEach(function (el) {
        var c = parseFloat(el.dataset.cible), f = el.dataset.format;
        compter(el, c, function (x) { return f === "dec2" ? fr(x, 2) : fr(x, 1) + " %"; }, 1500);
      });
    }, 0.4);
  })();

  /* Index des modules */
  if (document.getElementById("index-modules")) (function () {
  var index = document.getElementById("index-modules");
  [["Suivi", "Moniteur", "Vos lignes et leurs cours pendant la séance, gain du jour, actualités de vos sociétés."],
   ["Suivi", "Performance face au marché", "Ordres rejoués dans un ETF monde, valeur ajoutée par ligne, alpha et sa statistique t, Sharpe glissant."],
   ["Suivi", "Alertes", "Seuils de cours, de variation et d'écart entre deux actifs, surveillés pendant la séance."],
   ["Suivi", "Agenda", "Résultats, dividendes et rendez-vous macroéconomiques qui touchent vos lignes."],
   ["Suivi", "Journal des thèses", "Raisons d'achat, conditions de sortie écrites à l'avance, bilan des thèses clôturées."],
   ["Analyse", "Corrélations et décorrélation", "Matrice de vos lignes, corrélations glissantes, repérage des actifs qui cessent d'évoluer ensemble."],
   ["Analyse", "Paires", "N'importe quel actif face à n'importe quel autre : écart normalisé, cointégration, résultats publiés."],
   ["Analyse", "Screener", "Environ mille titres américains et européens, notés par secteur sur vos critères pondérés."],
   ["Analyse", "Valorisation", "DCF et multiples sectoriels avec vos hypothèses, sensibilité au coût du capital."],
   ["Analyse", "Cours et résultats", "Le cours d'un titre face à ses bénéfices publiés, trimestre après trimestre."],
   ["Risque", "Risque", "Volatilité, pire baisse, bêta, perte mensuelle probable, simulations de Monte-Carlo, couverture."],
   ["Risque", "Exposition réelle", "Pays, secteurs et devises de votre argent, ETF compris grâce à leurs principales lignes."],
   ["Marchés", "Macro et marchés", "Courbes de taux, changes, volatilité implicite, carte des événements géopolitiques."]
  ].forEach(function (m) { var d = document.createElement("div"); d.className = "ligne-index"; d.innerHTML = '<span class="code">' + m[0] + '</span><h3>' + m[1] + '</h3><p>' + m[2] + '</p>'; index.appendChild(d); });

  })();

  /* Tarif : période de facturation et choix d'une formule */
  if (document.getElementById("p-annuel")) (function () {
  var bAnnuel = document.getElementById("p-annuel"), bMensuel = document.getElementById("p-mensuel");
  function periode(annuelle) {
    bAnnuel.classList.toggle("choisi", annuelle); bMensuel.classList.toggle("choisi", !annuelle);
    bAnnuel.setAttribute("aria-pressed", annuelle); bMensuel.setAttribute("aria-pressed", !annuelle);
    document.querySelectorAll(".formules .montant[data-annuel]").forEach(function (m) { m.querySelector(".m").textContent = annuelle ? m.dataset.annuel : m.dataset.mensuel; m.querySelector(".u").textContent = annuelle ? "par an" : "par mois"; });
    document.querySelectorAll(".formules .detail-prix[data-annuel]").forEach(function (p) { p.innerHTML = annuelle ? p.dataset.annuel : p.dataset.mensuel; });
  }
  bAnnuel.addEventListener("click", function () { periode(true); }); bMensuel.addEventListener("click", function () { periode(false); });
  document.querySelectorAll(".formule-carte .choisir").forEach(function (a) { a.addEventListener("click", function () { try { sessionStorage.setItem("halvern-formule", a.dataset.formule); } catch (e) {} }); });

  })();

  /* Inscription : envoi au service de formulaires si la page en déclare un (data-action, site publié), sinon aperçu */
  if (document.getElementById("formulaire")) (function () {
  var memo = null; try { memo = sessionStorage.getItem("halvern-formule"); } catch (e) {}
  if (memo && document.getElementById("f-" + memo)) document.getElementById("f-" + memo).checked = true;
  var form = document.getElementById("formulaire"), champEmail = document.getElementById("email"), retour = document.getElementById("retour");
  var nomsFormules = { decouverte: "Découverte", investisseur: "Investisseur", patrimoine: "Patrimoine" };
  champEmail.addEventListener("input", function () { retour.textContent = ""; retour.classList.remove("erreur"); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(champEmail.value.trim())) { retour.textContent = "Saisissez une adresse email valide, par exemple prenom@exemple.fr."; retour.classList.add("erreur"); champEmail.focus(); return; }
    var choisie = document.querySelector('input[name="formule"]:checked');
    retour.classList.remove("erreur");
    var adresse = form.getAttribute("data-action"), bouton = form.querySelector("button");
    if (adresse) {
      bouton.disabled = true; retour.textContent = "Envoi…";
      fetch(adresse, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () {
          form.reset(); retour.textContent = "C'est noté : vous serez prévenu à l'ouverture, avec le prix fondateur de la formule " + nomsFormules[choisie ? choisie.value : "investisseur"] + ".";
        })
        .catch(function () { retour.textContent = "L'envoi n'a pas abouti. Réessayez dans un instant."; retour.classList.add("erreur"); })
        .then(function () { bouton.disabled = false; });
      return;
    }
    retour.textContent = "Aperçu : formule " + nomsFormules[choisie ? choisie.value : "investisseur"] + " notée. Les inscriptions ouvriront dès que le formulaire sera relié au service d'envoi ; rien n'a été enregistré.";
  });
  })();

  /* Menu sur téléphone */
  var boutonMenu = document.getElementById("bouton-menu"), menu = document.getElementById("menu-mobile");
  if (boutonMenu && menu) boutonMenu.addEventListener("click", function () {
    var ouvert = menu.hidden; menu.hidden = !ouvert; boutonMenu.setAttribute("aria-expanded", ouvert ? "true" : "false");
    boutonMenu.textContent = ouvert ? "Fermer" : "Menu"; entete.classList.toggle("menu-ouvert", ouvert);
  });
})();
