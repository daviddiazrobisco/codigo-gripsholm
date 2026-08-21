(() => {
  "use strict";

  const DATA = window.DAY1_DATA;
  if(!DATA || !Array.isArray(DATA.missions) || !DATA.missions.length){
    document.body.innerHTML='<main class="screen"><h1>El día no se puede abrir todavía.</h1><p>Faltan las misiones de este archivo. Revisa el contenido del día antes de publicarlo.</p></main>';
    return;
  }
  const invalidMission=DATA.missions.find((m,i)=>!m.title||!m.goal||!m.done||!m.speaker||!m.photo||!Array.isArray(m.questions)||!m.questions.length);
  if(invalidMission){
    document.body.innerHTML=`<main class="screen"><h1>Hay una misión incompleta.</h1><p>La misión ${DATA.missions.indexOf(invalidMission)+1} necesita título, personaje, imagen, objetivo, evidencia y al menos un reto antes de poder publicarse.</p></main>`;
    return;
  }
  const META = DATA.meta || {};
  const DAY = String(META.day || "01").padStart(2,"0");
  const STORE = META.store || "codigo-gripsholm-v7-day01";
  const missions = DATA.missions;
  const missionCount = missions.length;
  const $ = s => document.querySelector(s);
  const screen = $("#screen");
  const actions = $("#actions");
  const topbar = $("#topbar");
  const progressBar = $("#day-progress");
  const progressFill = $("#day-progress-fill");
  const journeyTabs=document.createElement("nav");
  journeyTabs.className="journey-tabs";
  journeyTabs.setAttribute("aria-label","Días del viaje");
  journeyTabs.innerHTML=Array.from({length:11},(_,i)=>{const label=`D${i}`;const href=`dia${i}.html`;return i===Number(META.day||1)?`<a class="active" href="${href}" aria-current="page">${label}</a>`:`<a href="${href}">${label}</a>`}).join("");
  topbar.after(journeyTabs);
  const imgBase = "assets/images/";
  let recorder = null;
  let recordUrl = null;

  const fresh = () => ({
    stage:"landing", intro:0, mission:0, key:0, contextPage:0, storyPage:0, streetKit:0,
    streetKitDone:false, balance:0, bonus:0, completedMissions:[], completedKeys:[],
    failedKeys:[], correctedKeys:[], awarded:{}, progress:{}, choices:{},
    exploredPlaces:[], correctionSkipped:false, spent:0, endingPage:0, finished:false,
    openedAt:null, contentVersion:META.contentVersion || "v7-final-day1"
  });
  let state = load();

  // El mapa ligero sirve para Europa; para la ruta a Cantón se carga la cartografía mundial completa.
  // Al terminar, se redibuja solo el contexto que la necesita.
  if(DAY==="06"&&!window.GRIPSHOLM_WORLD_FULL_COUNTRIES){
    fetch("assets/data/ne_110m_admin_0_countries.geojson").then(r=>r.ok?r.json():null).then(data=>{
      if(!data?.features)return;
      window.GRIPSHOLM_WORLD_FULL_COUNTRIES=data.features;
      if(state.stage==="missionContext"&&state.mission===5&&state.contextPage===0)render();
    }).catch(()=>{});
  }

  function load(){try{const saved=JSON.parse(localStorage.getItem(STORE)||"{}");return saved.contentVersion===(META.contentVersion || "v7-final-day1")?{...fresh(),...saved}:fresh()}catch{return fresh()}}
  function save(){localStorage.setItem(STORE,JSON.stringify(state))}
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function prog(scope){return state.progress[scope]||(state.progress[scope]={})}
  function scopeFor(q,correction=false){return `${correction?"c":"n"}-${q.id}`}
  function shuffleFor(items,scope,key,id=x=>x){
    if(scope.startsWith("c-")) return [...items];
    const p=prog(scope), ids=items.map(id);
    if(!Array.isArray(p[key])||p[key].length!==ids.length||p[key].some(x=>!ids.includes(x))){
      const order=[...ids];
      for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
      if(order.length>1&&order.every((x,i)=>x===ids[i])) order.push(order.shift());
      p[key]=order; save();
    }
    return p[key].map(x=>items.find(y=>id(y)===x));
  }

  function setChrome({show=true,dark=false,correction=false,progress=null}={}){
    topbar.hidden=!show; progressBar.hidden=!show; journeyTabs.hidden=false;
    actions.classList.toggle("darkbar",dark);
    if(show){
      $("#day-label").textContent=`DÍA ${DAY}`;
      $("#mission-label").textContent=correction?`REPASO ${state.correctedKeys.length} DE ${state.failedKeys.length}`:`MISIÓN ${Math.min(state.mission+1,missionCount)} DE ${missionCount}`;
      progressFill.style.width=`${progress??state.completedMissions.length/missionCount*100}%`;
    }
    updateFund();
  }
  function setActions(list,dark=false){
    actions.hidden=!list.length; actions.className=`actions${dark?" darkbar":""}`;
    actions.innerHTML=list.map((a,i)=>`<button type="button" class="${a.kind||"primary"}" data-action="${i}" ${a.disabled?"disabled":""}>${a.label}</button>`).join("");
    actions.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>list[+b.dataset.action].run());
  }
  function updateFund(){
    $("#fund-value").textContent=state.completedMissions.length;
    $("#fund-unit").textContent=`/${missionCount} ${DAY==="10"?"recuerdos":"evidencias"}`;
  }
  function render(){
    window.scrollTo(0,0);
    const views={landing,intro,activation,missionCover,missionContext,key,missionStory,missionEnd,streetKit,optionalQuiz,correctionIntro,correction,verified,fundFinal,ending,result};
    (views[state.stage]||landing)();
  }
  function logo(){return `<div class="code-logo"><p class="kicker">TRANSMISIÓN INTERCEPTADA</p><h1>CÓDIG<span class="logo-o">O<span class="logo-crowns">♛♛♛</span></span><br>GRIPSHOLM</h1><p class="tagline">DIEZ DÍAS · UNA CARTA ALTERADA · UNA HISTORIA QUE PROTEGER</p></div>`}
  function dayResumeStage(){
    if(DATA.streetKit&&state.completedMissions.length>=4&&!state.streetKitDone) return "streetKit";
    if(state.completedMissions.length>=missionCount) return state.failedKeys.length?"correctionIntro":"verified";
    return state.completedMissions.length?"missionCover":"intro";
  }

  function landing(){
    setChrome({show:false,dark:true}); screen.className="screen dark center";
    screen.innerHTML=`${logo()}<div class="signal"><i></i><i></i><i></i><i></i></div><p class="kicker">DÍA ${DAY} · ${META.place||"ESTOCOLMO"}</p><h2>${META.landing||"La plaza ha cerrado sus puertas."}</h2><div class="mission-stats"><div><strong>${missionCount}</strong><small>misiones</small></div><div><strong>${missionCount}</strong><small>retos centrales</small></div><div><strong>◈</strong><small>${META.badge||"cuaderno por proteger"}</small></div></div><p class="muted">${state.completedMissions.length?"Tu progreso sigue guardado en este dispositivo.":META.openingTime||"Primera apertura recomendada: 18–24 minutos. El cierre puede hacerse al final del día."}</p>${META.fine?`<p class="fine">${META.fine}</p>`:""}`;
    setActions([{label:state.completedMissions.length?"Retomar la transmisión":"Abrir la transmisión",run:()=>{if(!state.openedAt)state.openedAt=new Date().toISOString();state.stage=dayResumeStage();save();render()}}],true);
  }

  function intro(){
    const x=DATA.prologue[state.intro]; setChrome({show:false,dark:true}); screen.className="screen dark";
    const image=x.characterImage||(/MARGARETA/.test(x.k||"")?"margareta-nilsdotter-reconstruccion-v1.png":x.image);
    const introHtml=(x.html||"").replace(/Saga añade:\s*/gi,"");
    screen.innerHTML=`${image?`<figure class="hero-photo ${x.portraitFocus?"portrait-focus":""}"><img src="${imgBase+image}" alt="${esc(x.alt||"")}"></figure>`:""}<p class="kicker">${x.k}</p><h2>${x.title}</h2>${x.routeMap?routeMapMarkup():""}${introHtml}`;
    if(x.routeMap) bindRouteMap();
    setActions([{label:x.action||"Continuar",run:()=>{if(state.intro<DATA.prologue.length-1)state.intro++;else state.stage="activation";save();render()}}],true);
  }

  function routeMapMarkup(){
    const points=[[51,42],[62,31],[69,23],[39,54],[52,72],[22,46],[20,88],[10,70]];
    return `<section class="route-explorer"><div class="stockholm-route route-map" role="img" aria-label="Mapa orientativo de Gamla Stan y el paseo">${points.map((p,i)=>`<button type="button" class="route-pin ${state.exploredPlaces.includes(i)?"seen":""}" style="--x:${p[0]}%;--y:${p[1]}%" data-place="${i}" aria-label="Abrir ${esc(DATA.routePlaces[i][0])}">${state.exploredPlaces.includes(i)?"✓":i+1}</button>`).join("")}</div><p class="map-credit">Mapa orientativo · © OpenStreetMap contributors · CC BY-SA</p><p class="placement-progress">Lugares abiertos: <strong>${state.exploredPlaces.length} de 8</strong></p><div id="place-detail"></div></section>`;
  }
  function bindRouteMap(){
    screen.querySelectorAll("[data-place]").forEach(b=>b.onclick=()=>{
      const i=+b.dataset.place;
      if(!state.exploredPlaces.includes(i)){
        state.exploredPlaces.push(i);
        if(state.exploredPlaces.length===8&&!state.awarded.route){state.balance+=5;state.bonus+=5;state.awarded.route=5}
        save();
      }
      const [name,copy]=DATA.routePlaces[i];
      $("#place-detail").innerHTML=`<article class="route-detail"><span class="route-number">${i+1}</span><div><strong>${esc(name)}</strong><p>${copy}</p>${state.exploredPlaces.length===8?`<p class="reward">ORIENTACIÓN COMPLETADA</p>`:""}</div></article>`;
      b.classList.add("seen"); b.textContent="✓";
      screen.querySelector(".placement-progress").innerHTML=`Lugares abiertos: <strong>${state.exploredPlaces.length} de 8</strong>`;
      updateFund();
    });
  }

  function activation(){
    setChrome({show:false,dark:true}); screen.className="screen dark center";
    screen.innerHTML=`${logo()}<p class="kicker">DÍA ${DAY} ACTIVADO</p><h2>${META.title||"La plaza cerrada"}</h2><div class="coordinate">MISIONES · 0/${missions.length}<br>EVIDENCIAS · 0/${missions.length}<br>OBJETIVO · ${META.objective||"ENTENDER QUÉ OCURRIÓ EN STORTORGET"}</div><p>${META.objectiveCopy||"Las primeras misiones devuelven el contexto. Después entrarás con Karin en el Estocolmo de 1520."}</p>`;
    setActions([{label:"Comenzar la misión 1",run:()=>{state.stage="missionCover";save();render()}}],true);
  }

  function fundMessage(){
    return `${state.completedMissions.length} de ${missions.length} evidencias recuperadas. ${META.evidenceCopy||"Cada misión devuelve una parte del contexto de la historia."}`;
  }
  function riskMarkup(){ return ""; }
  function characterStrip(m){
    if(!m.photo)return `<div class="speaker-chip">${m.speaker||"Saga"} transmite</div>`;
    return `<figure class="character-strip"><img src="${imgBase+m.photo}" alt="Karin durante la reconstrucción de 1520"><figcaption><strong>${m.speaker}</strong><span>Reconstrucción narrativa</span></figcaption></figure>`;
  }
  function progressBlock(value,total,label){
    const safe=Math.max(0,Math.min(total,value)),percent=total?Math.round(safe/total*100):0;
    return `<section class="progress-block"><div><span>${label}</span><strong>${safe} de ${total}</strong></div><i><b style="width:${percent}%"></b></i></section>`;
  }
  function missionHero(m,alt){
    const isSaga=(m.speaker||"Saga")==="Saga";
    const person=isSaga?"Saga":(m.speaker||"Karin");
    const image=isSaga?"saga-transmision-inicial.png":(person==="Margareta"?"margareta-nilsdotter-reconstruccion-v1.png":m.photo||"karin-testimonio-1520-v1.png");
    const caption=m.characterCaption || (isSaga?"transmisión de la Carta":"reconstrucción narrativa");
    return `<figure class="hero-photo character-hero"><img src="${imgBase+image}" alt="${alt||person}"><figcaption>${person} · ${caption}</figcaption></figure>`;
  }
  function reactionFor(q,m){
    if(q.reaction)return q.reaction;
    if(m.reaction)return m.reaction;
    const id=q.id||"";
    if(/m1$/.test(id))return "Ya sabemos desde qué Suecia empieza esta historia: nombres antiguos, comunidades y un reino que tardó siglos en formarse.";
    if(/m2$/.test(id))return "Hemos quitado el disfraz. Ahora el mapa muestra personas reales, no un vikingo de cartel.";
    if(/m3$/.test(id))return "Las rutas vuelven a conectar agua, comercio y viajes; no pasaportes modernos.";
    if(/m4$/.test(id))return "Ahora conocemos el conflicto antes de la puerta: una corona compartida no borraba intereses ni lealtades.";
    if(/m5$/.test(id))return "La promesa y sus pruebas ya no dependen de que alguien las recuerde de memoria.";
    if(/m6$/.test(id))return "Ya sabemos cómo una celebración se convirtió en una trampa. Esta evidencia será importante para Karin.";
    if(/m7$/.test(id))return "La ciudad no ha olvidado del todo: cada lugar conserva una pista, pero hay que leerla con cuidado.";
    return "La búsqueda queda abierta y la ciudad puede recordarse sin inventar un final para Karin.";
  }
  function missionCloseCopy(m){
    if(m.closing)return m.closing;
    const copy={
      "Antes de llamarnos suecos":"No confundís un nombre con una historia sencilla. Empiezo a creer que puedo confiar en vosotras.",
      "Quiénes eran los vikingos":"Ya sabéis que no todos los suecos eran vikingos y que los vikingos no llevaban cuernos. Eso sí: ¿a quién se le ocurrió que los cuernos eran una buena idea para un casco?",
      "Los mares y sus rutas":"Éramos buenos en muchas aguas: para pescar, comerciar, viajar y guerrear. Ahora volvemos a mi tiempo. No sé dónde está mi padre y la ciudad está a punto de cambiar.",
      "Una corona, tres reinos":"La unión llevaba más de un siglo crujiendo y ahora ese desacuerdo ha entrado por las puertas de Estocolmo. Antes de buscar a mi padre, necesito guardar algo que no puedan cambiar después.",
      "Tres pruebas, una copia":"Mi padre estaba en la lista. Si la amnistía es verdad, quizá vuelva pronto. Pero hay demasiados soldados daneses en las calles.",
      "Las puertas se cierran":"Mi padre fue invitado, pero una lista no me dice si salió de la reunión. No voy a inventar un final que todavía no conozco.",
      "El Baño de Sangre de Estocolmo":"Cristián II y Gustav Trolle nos engañaron con la amnistía. Mi padre estaba en la lista, pero algunos lograron escapar. Ojalá él sea uno de ellos.",
      "La ciudad recuerda, pero no se congela":"No sé si mi padre está vivo. Pero sé que algunos escaparon y ahora sé qué pruebas puedo conservar. Gracias por no convertir nuestra historia en una leyenda cómoda."
    };
    return copy[m.title]||m.done;
  }
  function missionCover(){
    const m=missions[state.mission]; setChrome({progress:state.completedMissions.length/missions.length*100}); screen.className="screen dark mission-scene-screen";
    screen.innerHTML=`${missionHero(m,`${m.speaker||"Saga"} abre la misión ${state.mission+1}: ${m.title}`)}<p class="kicker">${m.speaker||"SAGA"} · NUEVO BLOQUE DEL DÍA</p><h2>${m.title}</h2><p class="scene-dialogue">${m.obstacle}</p><section class="mission-brief"><p class="kicker">LO QUE NECESITAMOS ENTENDER</p><p>${m.goal}</p><p><strong>Al terminar:</strong> ${m.done}</p></section>${progressBlock(state.completedMissions.length,missions.length,`Evidencias del Día ${DAY}`)}`;
    setActions([{label:m.action,run:()=>{state.key=0;state.contextPage=0;state.stage=m.contexts?.length?"missionContext":"key";save();render()}}],true);
  }

  function missionContext(){
    const m=missions[state.mission],c=m.contexts?.[state.contextPage];
    if(!c){state.stage="key";save();return render()}
    if(c.optionalQuiz){state.optionalFromContext=true;state.stage="optionalQuiz";save();return optionalQuiz()}
    setChrome({progress:(state.mission+(state.contextPage/(m.contexts.length+1)))/missions.length*100});
    screen.className=`screen${c.dark?" dark":""}`;
    const speaker=c.speaker||m.speaker||"Saga";
    const image=c.image||(speaker==="Saga"?"saga-transmision-inicial.png":m.photo||"karin-testimonio-1520-v1.png");
    const visualBlock=c.routeMap?routeMapMarkup():c.visual?visual(c.visual,c,`context-${state.mission}-${state.contextPage}`,true):"";
    const mapImage=c.mapImage?`<figure class="context-map"><img src="${imgBase+c.mapImage}" alt="${c.mapAlt||c.title}"><figcaption>${c.mapCaption||"Imagen de orientación"}</figcaption></figure>`:"";
    const mediaGalleryBlock=c.mediaGallery?mediaGallery(c.mediaGallery):"";
    const speechCard=c.speech?`<div class="speech-card"><button class="flashcard" id="flip-card" type="button" aria-label="Girar la tarjeta para ver la traducción"><span class="flash-front-speech"><small>TOCA PARA GIRAR</small><strong>${c.speech.word}</strong></span><span class="flash-back-speech"><small>EN ESPAÑOL</small><strong>${c.speech.meaning}</strong><em>${c.speech.tip}</em></span></button><div class="speech-controls"><button id="listen-model" type="button">▶ Escuchar modelo</button><button id="record-voice" type="button">● Grabar mi voz</button><button id="play-record" type="button" ${recordUrl?"":"disabled"}>▶ Mi grabación</button></div><p class="fine">La app no pone nota. Escucha, repite o continúa sin micrófono.</p></div>`:"";
    screen.innerHTML=`${c.character?`<figure class="hero-photo character-hero"><img src="${imgBase+image}" alt="${speaker} presenta ${c.title}"><figcaption>${speaker} · ${c.characterCaption||m.characterCaption||(speaker==="Saga"?"transmisión de la Carta":"reconstrucción narrativa")}</figcaption></figure>`:""}<p class="key-count">MISIÓN ${state.mission+1} DE ${missions.length} · CONTEXTO ${state.contextPage+1} DE ${m.contexts.length}</p>${progressBlock(state.contextPage,m.contexts.length,"Contextos leídos")}<p class="kicker">${c.k||"MIRAR Y ENTENDER"}</p><h2>${c.title}</h2>${mapImage}${visualBlock}${mediaGalleryBlock}<div class="context-copy">${c.html||""}</div>${speechCard}`;
    if(c.routeMap)bindRouteMap();
    if(c.speech)bindSpeech(c.speech);
    const last=state.contextPage===m.contexts.length-1;
    setActions([{label:c.action||(last?"Ir al reto":"Continuar"),run:()=>{if(last){state.key=0;state.stage="key"}else state.contextPage++;save();render()}}],!!c.dark);
  }

  function narrative(q){
    let branch="";
    if(q.branchChoice&&state.choices[q.branchChoice]!=null){
      const i=state.choices[q.branchChoice];
      const variants=["Karin aprieta contra el pecho la copia de la amnistía.","Karin sigue con la mirada el pliego de acusación de Trolle.","Karin ha memorizado los primeros nombres de la lista de invitados."];
      branch=`<p class="branch-note">${variants[i]}</p>`;
    }
    return `${q.scene?`<div class="narrative-scene"><span class="scene-signal">SEÑAL ABIERTA</span><p>${q.scene}</p>${branch}</div>`:""}`;
  }
  function key(){
    const m=missions[state.mission],q=m.questions[state.key],scope=scopeFor(q); setChrome({progress:(state.mission+state.key/m.keys)/missions.length*100}); screen.className="screen";
    screen.innerHTML=`<p class="key-count">MISIÓN ${state.mission+1} DE ${missions.length} · RETO ${state.key+1} DE ${m.keys}</p>${progressBlock(state.key,m.keys,"Retos completados")}${m.contexts?.length?"":narrative(q)}<h2>${q.title}</h2><p>${q.prompt}</p>${onsiteMarkup(q,scope)}${q.contextVisual?visual(q.contextVisual,q,scope):""}${m.contexts?.length?"":visual(q.visual,q,scope)}${q.media?mediaCard(q.media):""}${questionMarkup(q,scope)}<div id="feedback"></div>`;
    bindOnsite(q,scope); bindQuestion(q,scope,false);
  }

  function onsiteMarkup(q,scope){
    if(!q.onsite)return ""; const p=prog(scope);
    return `<div class="onsite-choice"><button type="button" class="secondary" data-onsite="found">Lo he encontrado</button><button type="button" class="secondary" data-onsite="visual">No estoy allí · ver la prueba visual</button>${p.onsite?`<p class="onsite-status">✓ ${p.onsite==="found"?"Hallazgo confirmado":"Prueba visual abierta"}</p>`:""}</div>`;
  }
  function mediaCard(media){return `<figure class="context-map"><img src="${imgBase+media.file}" alt="${media.alt||"Imagen de apoyo"}"><figcaption>${media.caption||"Imagen de apoyo"}</figcaption></figure>`}
  function mediaGallery(items){return `<div class="visual-evidence bird-gallery">${items.map(item=>`<figure><img src="${imgBase+item.file}" alt="${item.alt||item.name||"Imagen de apoyo"}"><figcaption><strong>${item.name||"OBSERVACIÓN"}</strong>${item.caption?`<span>${item.caption}</span>`:""}</figcaption></figure>`).join("")}</div>`}
  function bindOnsite(q,scope){
    if(!q.onsite)return; const p=prog(scope);
    screen.querySelectorAll("[data-onsite]").forEach(b=>b.onclick=()=>{p.onsite=b.dataset.onsite;if(p.onsite==="visual")p.evidenceOpen=true;save();key()});
  }

  function questionMarkup(q,scope){
    if(q.type==="single"||q.type==="multi")return optionMarkup(q,scope);
    if(q.type==="trueFalse")return trueFalseMarkup(q,scope);
    if(q.type==="match")return matchMarkup(q,scope);
    if(q.type==="lakePlacement")return lakePlacementMarkup(q,scope);
    if(q.type==="order")return orderMarkup(q,scope);
    if(q.type==="explore")return exploreMarkup(q,scope);
    if(q.type==="speech")return speechQuestionMarkup(q,scope);
    return "";
  }
  function trueFalseMarkup(q,scope){
    const p=prog(scope), index=p.index||0, item=q.items[index];
    if(!item)return `<section class="puzzle-card"><p class="kicker">RETO COMPLETADO</p><p>${q.explanation||"Has comprobado las cinco afirmaciones."}</p></section>`;
    const answered=typeof p.answer==="boolean";
    return `<section class="puzzle-card true-false-card"><p class="kicker">AFIRMACIÓN ${index+1} DE ${q.items.length}</p><h3>${esc(item.label)}</h3>${answered?`<div class="feedback ${p.answer===item.answer?"":"bad"}"><strong>${p.answer===item.answer?"CORRECTO":"NO EXACTAMENTE"}</strong><p>${item.explanation}</p></div>`:`<div class="options"><button type="button" class="option" data-true-false="true">Verdadero</button><button type="button" class="option" data-true-false="false">Falso</button></div>`}</section>`;
  }
  function speechQuestionMarkup(q,scope){
    const p=prog(scope);
    if(!p.useConfirmed){
      const choices=shuffleFor(q.options.map((label,index)=>({label,index})),scope,"speechOptions",x=>x.index);
      return `<div class="scene-card"><p class="kicker">ELIGE LA FRASE</p><p>${q.scene||""}</p><div class="options">${choices.map(x=>`<button type="button" class="option ${p.selected===x.index?"selected":""}" data-speech-option="${x.index}">${esc(x.label)}</button>`).join("")}</div></div>`;
    }
    return `<div class="speech-card"><button class="flashcard" id="flip-card" type="button" aria-label="Girar la tarjeta para ver la traducción"><span class="flash-front-speech"><small>TOCA PARA GIRAR</small><strong>${esc(q.word)}</strong></span><span class="flash-back-speech"><small>EN ESPAÑOL</small><strong>${esc(q.meaning)}</strong><em>${esc(q.tip)}</em></span></button><div class="speech-controls"><button id="listen-model" type="button">▶ Escuchar modelo</button><button id="record-voice" type="button">● Grabar mi voz</button><button id="play-record" type="button" ${recordUrl?"":"disabled"}>▶ Mi grabación</button></div><p class="fine">La app no pone nota. Escucha ambas versiones y compáralas tú. Si no hay micrófono, puedes continuar.</p></div>`;
  }
  function optionalQuiz(){
    const q=DATA.optionalTrueFalse;if(!q){state.stage="landing";save();return render()}
    const p=prog("optional-truefalse"),i=p.index||0,item=q.items[i];
    setChrome({progress:Math.min(100,(state.completedMissions.length/missionCount)*100)});screen.className="screen";
    if(!item){const rs=p.results||[],ok=rs.filter(x=>x.answer===x.solution).length;const fromContext=state.optionalFromContext;screen.innerHTML=`<p class="key-count">RETO OPCIONAL COMPLETADO</p><h2>${q.title}</h2><div class="feedback"><strong>${ok} aciertos · ${rs.length-ok} errores</strong><p>${q.explanation}</p></div><section class="puzzle-card"><p class="kicker">RESUMEN DE RESPUESTAS</p>${rs.map(x=>`<p><strong>Pregunta:</strong> ${esc(x.question)}<br><strong>Tu respuesta:</strong> ${x.answer?"Verdadero":"Falso"}<br><strong>Solución:</strong> ${x.solution?"Verdadero":"Falso"} · ${x.answer===x.solution?"acierto":"error"}</p>`).join("")}</section>`;return setActions([{label:"Volver a empezar",kind:"secondary",run:()=>{delete state.progress["optional-truefalse"];save();render()}},{label:fromContext?"Continuar con la misión":"Volver al menú",run:()=>{if(fromContext){delete state.optionalFromContext;state.key=0;state.stage="key"}else state.stage="landing";save();render()}}])}
    const answered=p.answer!=null;
    screen.innerHTML=`<p class="key-count">RETO OPCIONAL · SEÑAL ${i+1} DE ${q.items.length}</p><h2>${q.title}</h2><p>${q.prompt}</p><section class="puzzle-card"><p class="kicker">GOTEMBURGO SALIÓ AL MUNDO</p><h3>${item.label}</h3>${!answered?`<div class="options"><button type="button" class="option" data-optional-bool="true">Verdadero</button><button type="button" class="option" data-optional-bool="false">Falso</button></div>`:`<div class="feedback ${p.answer===item.answer?"":"bad"}"><strong>${p.answer===item.answer?"LO HAS SITUADO":"ESTA SEÑAL SE HABÍA MEZCLADO"}</strong><p>${item.explanation}</p></div>`}</section>`;
    if(!answered){screen.querySelectorAll("[data-optional-bool]").forEach(b=>b.onclick=()=>{p.answer=b.dataset.optionalBool==="true";save();render()});setActions([{label:"Saltar la prueba",kind:"secondary",run:()=>{if(state.optionalFromContext){delete state.optionalFromContext;state.key=0;state.stage="key"}else state.stage="landing";save();render()}},{label:"Elige verdadero o falso",disabled:true,run:()=>{}}]);}
    else setActions([{label:i===q.items.length-1?"Ver el resumen":"Siguiente señal",run:()=>{p.results||=[];p.results.push({question:item.label,answer:p.answer,solution:item.answer});p.index=i+1;delete p.answer;save();render()}},{label:"Volver al menú",kind:"secondary",run:()=>{state.stage="landing";save();render()}}]);
  }
  function optionMarkup(q,scope){
    const p=prog(scope), fixed=p.fixed||[], selected=p.selected||[];
    const choices=shuffleFor(q.options.map((label,index)=>({label,index})),scope,"optionOrder",x=>x.index);
    return `<div class="options">${choices.map(x=>`<button type="button" class="option ${fixed.includes(x.index)?"locked":selected.includes(x.index)?"selected":""}" data-option="${x.index}" ${fixed.includes(x.index)?"disabled":""}>${esc(x.label)}${fixed.includes(x.index)?" · ✓":""}</button>`).join("")}</div>${q.dossier?`<details class="dossier"><summary>ABRIR EL EXPEDIENTE</summary><p>${q.dossier}</p></details>`:""}`;
  }
  function matchMarkup(q,scope,solution=false){
    const p=prog(scope);p.fixed||={};p.pending||={};
    const left=solution?q.pairs:shuffleFor(q.pairs,scope,"matchLeft",x=>x[0]);
    const right=solution?q.pairs:shuffleFor(q.pairs,scope,"matchRight",x=>x[1]);
    const used=[...Object.values(p.fixed),...Object.values(p.pending)];
    return `<div class="match-columns"><div>${left.filter(x=>solution||!used.includes(x[0])).map(x=>`<button class="option ${p.source===x[0]?"selected":""}" data-source="${esc(x[0])}" ${solution?"disabled":""}>${esc(x[0])}</button>`).join("")}</div><div>${right.map(x=>`<button class="option ${solution||p.fixed[x[1]]?"locked":p.pending[x[1]]?"selected":""}" data-target="${esc(x[1])}" ${solution||p.fixed[x[1]]?"disabled":""}>${esc(x[1])}${solution||p.fixed[x[1]]?" · ✓":""}</button>`).join("")}</div></div>${solution?"":`<p class="placement-progress">Relaciones fijadas: ${Object.keys(p.fixed).length} de ${q.pairs.length}</p>${q.dossier?`<details class="dossier"><summary>ABRIR EL EXPEDIENTE</summary><p>${q.dossier}</p></details>`:""}`}`;
  }
  function lakePlacementMarkup(q,scope){
    const p=prog(scope);p.fixed||={};p.pending||={};
    const used=[...Object.values(p.fixed),...Object.values(p.pending)];
    const b=[12.2,19,57.85,60.05],m=baseMap(b,"Mapa de Vänern, Vättern, Mälaren y Hjälmaren"),selected=p.selectedLabel;
    let s=m.svg;
    q.items.forEach((item,i)=>{
      const [id,label,,lon,lat,dx,dy]=item,point=project(lon,lat,b,m.W,m.H),x=point[0]+dx,y=point[1]+dy,fixed=p.fixed[id],pending=p.pending[id];
      if(dx||dy)s+=`<line class="lake-placement-line" x1="${point[0]}" y1="${point[1]}" x2="${x}" y2="${y}"/>`;
      s+=`<g class="lake-placement-pin ${fixed?"fixed":pending?"pending":""}" data-lake-target="${id}" role="button" tabindex="0" aria-label="Posición ${i+1}"><circle cx="${x}" cy="${y}" r="12"/><text x="${x}" y="${y+4}" text-anchor="middle">${fixed?"✓":i+1}</text>${fixed?`<text class="lake-placement-name" x="${x+(dx<0?-8:8)}" y="${y-16}" text-anchor="${dx<0?"end":"start"}">${esc(fixed)}</text>`:""}</g>`;
    });
    const notes=q.items.filter(x=>p.fixed[x[0]]).map(x=>`<div><b>✓ ${esc(x[1])}</b><span>${esc(x[2])}</span></div>`).join("");
    return `<section class="lake-placement"><div class="geo-map lake-placement-map">${s}</svg></div><p class="placement-progress">Has situado <strong>${Object.keys(p.fixed).length} de ${q.items.length}</strong> lagos.</p><div class="label-bank lake-label-bank">${q.items.filter(x=>!used.includes(x[1])).map(x=>`<button type="button" class="map-label-chip ${selected===x[1]?"selected":""}" data-lake-label="${esc(x[1])}">${esc(x[1])}</button>`).join("")}</div><p class="map-caption">Elige un lago y toca el punto que corresponde a su forma real en el mapa.</p>${notes?`<div class="lake-fixed-notes">${notes}</div>`:""}</section>`;
  }
  function orderMarkup(q,scope,solution=false){
    const p=prog(scope); if(!p.order)p.order=shuffleFor(q.items,scope,"order",x=>x[0]).map(x=>x[0]);
    const order=solution?q.answer:p.order;
    return `<div class="order-list">${order.map((id,i)=>{const item=q.items.find(x=>x[0]===id);return `<div class="order-item"><span>${i+1}</span><strong>${esc(item[1])}</strong>${solution?"":`<div><button data-move="${i},-1" aria-label="Subir">↑</button><button data-move="${i},1" aria-label="Bajar">↓</button></div>`}</div>`}).join("")}</div>${q.dossier?`<details class="dossier"><summary>ABRIR EL EXPEDIENTE</summary><p>${q.dossier}</p></details>`:""}`;
  }
  function exploreMarkup(q,scope){
    const p=prog(scope);p.opened||=[];
    if(q.visual==="d5GotaExplore")return d5GotaExploreMap(q,scope);
    return `<div class="explore-grid">${q.items.map((item,i)=>{const opened=p.opened.includes(i);return `<button type="button" class="explore-item ${opened?"opened":""}" data-explore="${i}"><span>${opened?"✓":i+1}</span><strong>${esc(item[0])}</strong><small>${opened?esc(item[1]):"Toca para abrir"}</small></button>`}).join("")}</div><p class="placement-progress">Pistas abiertas: ${p.opened.length} de ${q.items.length}</p>`;
  }

  function bindQuestion(q,scope,correction){
    if(prog(scope).complete){success(q,scope,correction);return}
    if(q.type==="single")return bindSingle(q,scope,correction);
    if(q.type==="multi")return bindMulti(q,scope,correction);
    if(q.type==="trueFalse")return bindTrueFalse(q,scope,correction);
    if(q.type==="match")return bindMatch(q,scope,correction);
    if(q.type==="lakePlacement")return bindLakePlacement(q,scope,correction);
    if(q.type==="order")return bindOrder(q,scope,correction);
    if(q.type==="explore")return bindExplore(q,scope,correction);
    if(q.type==="speech")return bindSpeechQuestion(q,scope,correction);
  }
  function bindTrueFalse(q,scope,correction){
    const p=prog(scope),index=p.index||0,item=q.items[index];
    if(!item)return complete(q,scope,correction);
    if(typeof p.answer!=="boolean"){
      screen.querySelectorAll("[data-true-false]").forEach(b=>b.onclick=()=>{p.answer=b.dataset.trueFalse==="true";markAttempt(q,scope,p.answer===item.answer,correction);save();renderCurrent(q,correction)});
      return setActions([{label:"Elige verdadero o falso",disabled:true,run:()=>{}}]);
    }
    setActions([{label:index===q.items.length-1?"Cerrar el reto":"Siguiente afirmación",run:()=>{p.index=index+1;delete p.answer;save();if(p.index>=q.items.length)complete(q,scope,correction);else renderCurrent(q,correction)}}]);
  }
  function bindSpeechQuestion(q,scope,correction){
    const p=prog(scope);
    if(!p.useConfirmed){
      screen.querySelectorAll("[data-speech-option]").forEach(b=>b.onclick=()=>{p.selected=+b.dataset.speechOption;save();renderCurrent(q,correction)});
      return setActions([{label:"Comprobar la frase",disabled:p.selected==null,run:()=>{const ok=p.selected===q.answer;markAttempt(q,scope,ok,correction);if(ok){p.useConfirmed=true;save();renderCurrent(q,correction)}else{p.selected=null;save();renderCurrent(q,correction,q.hint)}}}]);
    }
    bindSpeech(q);
    setActions([{label:"Guardar y continuar",run:()=>complete(q,scope,correction)}]);
  }
  function markAttempt(q,scope,correct,correction){
    const p=prog(scope);p.attempts=(p.attempts||0)+1;
    if(!correct&&!correction&&!state.failedKeys.includes(q.id))state.failedKeys.push(q.id);
    save();
  }
  function complete(q,scope,correction){
    const p=prog(scope); if(p.complete)return; p.complete=true;
    if(correction){if(!state.correctedKeys.includes(q.id))state.correctedKeys.push(q.id)}
    else if(!state.completedKeys.includes(q.id))state.completedKeys.push(q.id);
    save(); renderCurrent(q,correction);
  }
  function bindSingle(q,scope,correction){
    const p=prog(scope); screen.querySelectorAll("[data-option]").forEach(b=>b.onclick=()=>{p.selected=[+b.dataset.option];save();renderCurrent(q,correction)});
    setActions([{label:q.anyAnswer?(q.anyAnswerLabel||"Confiar la prueba a Karin"):"Comprobar la clave",disabled:!p.selected?.length,run:()=>{
      const chosen=p.selected[0],ok=q.anyAnswer||chosen===q.answer;markAttempt(q,scope,ok,correction);
      if(ok){if(q.anyAnswer)state.choices[q.id]=chosen;complete(q,scope,correction)}else{p.selected=[];save();renderCurrent(q,correction,q.hint)}
    }}]);
  }
  function bindMulti(q,scope,correction){
    const p=prog(scope);p.fixed||=[];p.selected||=[];
    screen.querySelectorAll("[data-option]").forEach(b=>b.onclick=()=>{const i=+b.dataset.option;p.selected=p.selected.includes(i)?p.selected.filter(x=>x!==i):[...p.selected,i];save();renderCurrent(q,correction)});
    setActions([{label:"Comprobar la selección",disabled:!p.selected.length,run:()=>{
      const good=p.selected.filter(i=>q.answer.includes(i)),bad=p.selected.filter(i=>!q.answer.includes(i));p.fixed=[...new Set([...p.fixed,...good])];p.selected=[];
      const ok=p.fixed.length===q.answer.length&&!bad.length;markAttempt(q,scope,ok,correction);
      if(ok)complete(q,scope,correction);else{save();renderCurrent(q,correction,`${good.length?`Has fijado ${p.fixed.length} de ${q.answer.length}. `:""}${q.hint}`)}
    }}]);
  }
  function bindMatch(q,scope,correction){
    const p=prog(scope);p.fixed||={};p.pending||={};
    screen.querySelectorAll("[data-source]").forEach(b=>b.onclick=()=>{p.source=b.dataset.source;save();renderCurrent(q,correction)});
    screen.querySelectorAll("[data-target]").forEach(b=>b.onclick=()=>{const t=b.dataset.target;if(!p.source||p.fixed[t])return;Object.keys(p.pending).forEach(k=>{if(p.pending[k]===p.source)delete p.pending[k]});p.pending[t]=p.source;p.source=null;save();renderCurrent(q,correction)});
    const ready=Object.keys(p.fixed).length+Object.keys(p.pending).length===q.pairs.length;
    setActions([{label:"Comprobar relaciones",disabled:!ready,run:()=>{
      q.pairs.forEach(x=>{if(p.pending[x[1]]===x[0]){p.fixed[x[1]]=x[0];delete p.pending[x[1]]}else delete p.pending[x[1]]});
      const ok=Object.keys(p.fixed).length===q.pairs.length;markAttempt(q,scope,ok,correction);
      if(ok)complete(q,scope,correction);else{save();renderCurrent(q,correction,`Has fijado ${Object.keys(p.fixed).length} de ${q.pairs.length}. ${q.hint}`)}
    }}]);
  }
  function bindLakePlacement(q,scope,correction){
    const p=prog(scope);p.fixed||={};p.pending||={};
    screen.querySelectorAll("[data-lake-label]").forEach(b=>b.onclick=()=>{p.selectedLabel=b.dataset.lakeLabel;save();renderCurrent(q,correction)});
    screen.querySelectorAll("[data-lake-target]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.lakeTarget;if(!p.selectedLabel||p.fixed[id])return;
      Object.keys(p.pending).forEach(k=>{if(p.pending[k]===p.selectedLabel)delete p.pending[k]});
      p.pending[id]=p.selectedLabel;p.selectedLabel=null;save();renderCurrent(q,correction);
    });
    const ready=Object.keys(p.fixed).length+Object.keys(p.pending).length===q.items.length;
    setActions([{label:"Comprobar el mapa",disabled:!ready,run:()=>{
      let wrong=0;q.items.forEach(([id,label])=>{if(p.pending[id]===label){p.fixed[id]=label;delete p.pending[id]}else if(p.pending[id]){delete p.pending[id];wrong++}});
      const ok=Object.keys(p.fixed).length===q.items.length;markAttempt(q,scope,ok,correction);
      if(ok)complete(q,scope,correction);else{save();renderCurrent(q,correction,`Has situado ${Object.keys(p.fixed).length} de ${q.items.length} lagos. ${wrong?"Revisa las posiciones que han vuelto a quedar libres. ":""}${q.hint}`)}
    }}]);
  }
  function bindOrder(q,scope,correction){
    const p=prog(scope);screen.querySelectorAll("[data-move]").forEach(b=>b.onclick=()=>{const [i,d]=b.dataset.move.split(",").map(Number),j=i+d;if(j<0||j>=p.order.length)return;[p.order[i],p.order[j]]=[p.order[j],p.order[i]];save();renderCurrent(q,correction)});
    setActions([{label:"Comprobar la secuencia",run:()=>{const ok=p.order.every((x,i)=>x===q.answer[i]);markAttempt(q,scope,ok,correction);if(ok)complete(q,scope,correction);else{save();renderCurrent(q,correction,q.hint)}}}]);
  }
  function bindExplore(q,scope,correction){
    const p=prog(scope);p.opened||=[];
    screen.querySelectorAll("[data-explore]").forEach(b=>b.onclick=()=>{const i=+b.dataset.explore;if(!p.opened.includes(i))p.opened.push(i);save();renderCurrent(q,correction)});
    setActions([{label:"Continuar",disabled:p.opened.length!==q.items.length,run:()=>{complete(q,scope,correction)}}]);
  }
  function renderCurrent(q,correction,failure){correction?correctionQuestion(q):key();if(failure){const f=$("#feedback");f.innerHTML=`<div class="feedback bad"><strong>La clave sigue dañada</strong><p>${failure}</p></div>`}}
  function success(q,scope,correction){
    const choice=q.anyAnswer?`<p class="branch-note">${q.choiceResults?.[state.choices[q.id]]||""}</p>`:"";
    const m=missions[state.mission],speaker=(m.speaker||"Saga")==="Saga"?"Saga":m.speaker||"Karin",image=speaker==="Saga"?"saga-transmision-inicial.png":(speaker==="Margareta"?"margareta-nilsdotter-reconstruccion-v1.png":m.photo||"karin-testimonio-1520-v1.png");
    $("#feedback").innerHTML=`<div class="feedback"><strong>${q.success||"EVIDENCIA RECUPERADA"}</strong>${choice}<p>${q.explanation}</p></div>${solutionExtra(q,scope)}<section class="character-response"><img src="${imgBase+image}" alt="${speaker} confirma el resultado"><div><p class="kicker">${speaker.toUpperCase()} CONFIRMA</p><p>${reactionFor(q,m)}</p></div></section>`;
    setActions([{label:correction?(state.correctedKeys.length===state.failedKeys.length?"Sellar el testimonio":"Volver a la corrección"):nextLabel(),run:()=>advance(correction)}]);
  }
  function nextLabel(){const m=missions[state.mission];return state.key===m.keys-1?(m.epilogue?(m.epilogue[0]?.action||"Escuchar a Karin"):"Completar la misión"):"Ir a la siguiente clave"}
  function solutionExtra(q,scope){
    let h="";
    if(q.type==="match")h+=`<div class="puzzle-card"><p class="kicker">REGISTRO COMPLETO</p>${q.pairs.map(x=>`<p><strong>${esc(x[0])}</strong><br>${esc(x[1])}</p>`).join("")}</div>`;
    if(q.solutionNote)h+=`<div class="puzzle-card"><p class="kicker">LEER LA PRUEBA</p>${q.solutionNote}</div>`;
    if(q.type==="order")h+=`<div class="puzzle-card"><p class="kicker">SECUENCIA RECUPERADA</p>${orderMarkup(q,scope,true)}</div>`;
    if(q.solutionVisual)h+=`<div class="puzzle-card solution-visual"><p class="kicker">PISTAS VISUALES</p>${visual(q.solutionVisual,q,scope,true)}</div>`;
    if(q.visual&&!missions[state.mission].contexts?.length)h+=`<div class="puzzle-card solution-visual"><p class="kicker">PRUEBA COMPLETA</p>${visual(q.visual,q,scope,true)}</div>`;
    if(q.finalSignal)h+=`<div class="coordinate">GUSTAV ERIKSSON · 1520<br>DINASTÍA VASA · DESDE 1523<br>BUQUE VASA · 1628<br>TIEMPO A FLOTE · UNOS 20 MIN</div>`;
    return h;
  }
  function advance(correction){
    if(correction){state.stage=state.correctedKeys.length===state.failedKeys.length?"verified":"correction"}
    else{const m=missions[state.mission];if(state.key<m.keys-1)state.key++;else if(m.epilogue){state.storyPage=0;state.stage="missionStory"}else state.stage="missionEnd"}
    save();render();
  }

  function missionStory(){
    const m=missions[state.mission],p=m.epilogue[state.storyPage];setChrome({progress:(state.mission+1)/missionCount*100});screen.className="screen dark";
    screen.innerHTML=`<p class="kicker">${p.k}</p>${riskMarkup()}<h2>${p.title}</h2>${p.html}${p.options?`<div class="options story-options">${p.options.map((x,i)=>`<button class="option ${state.choices[p.choiceId]===i?"selected":""}" data-story-choice="${i}">${esc(x)}</button>`).join("")}</div>`:""}`;
    if(p.options)screen.querySelectorAll("[data-story-choice]").forEach(b=>b.onclick=()=>{state.choices[p.choiceId]=+b.dataset.storyChoice;save();missionStory()});
    setActions([{label:state.storyPage===m.epilogue.length-1?(p.endAction||(p.options?"Conservar la decisión":"Completar la misión")):"Continuar",disabled:!!p.options&&state.choices[p.choiceId]==null,run:()=>{if(state.storyPage<m.epilogue.length-1)state.storyPage++;else state.stage="missionEnd";save();render()}}],true);
  }
  function missionEnd(){
    const m=missions[state.mission];if(!state.completedMissions.includes(state.mission)){state.completedMissions.push(state.mission);save()}
    const next=state.mission+1;setChrome({progress:next/missions.length*100});screen.className="screen dark mission-scene-screen";
    screen.innerHTML=`${missionHero(m,`${m.speaker||"Saga"} cierra la misión ${next}: ${m.title}`)}<p class="kicker">${m.speaker||"SAGA"} · EVIDENCIA RECUPERADA</p><h2>${m.title}</h2><p class="scene-dialogue">${missionCloseCopy(m)}</p><section class="mission-brief"><p class="kicker">LO QUE HEMOS CONSEGUIDO</p><p>${m.done}</p><p><strong>La siguiente misión parte de esta evidencia.</strong></p></section>${progressBlock(next,missions.length,`Evidencias del Día ${DAY}`)}`;
    if(next===missionCount)setActions([{label:"Salir por ahora",kind:"secondary",run:()=>{state.stage="landing";save();render()}},{label:"Revisar la ruta completa",run:finishMissions}]);
    else if(next===(DATA.streetKitAfterMission??4)&&DATA.streetKit)setActions([{label:"Salir por ahora",kind:"secondary",run:()=>{state.mission=next;state.stage="landing";save();render()}},{label:"Preparar el kit de calle",run:()=>{state.mission=next;state.streetKit=0;state.stage="streetKit";save();render()}}]);
    else setActions([{label:"Salir por ahora",kind:"secondary",run:()=>{state.mission=next;state.stage="landing";save();render()}},{label:`Ir a la misión ${next+1}`,run:()=>{state.mission=next;state.stage="missionCover";save();render()}}]);
  }
  function finishMissions(){state.stage=state.failedKeys.length?"correctionIntro":"verified";save();render()}

  function streetKit(){
    const q=DATA.streetKit[state.streetKit],scope=`street-${state.streetKit}`,p=prog(scope);setChrome({progress:50});screen.className="screen";
    const kitCount=DATA.streetKit.length;
    screen.innerHTML=`${state.streetKit===0?`<figure class="hero-photo character-hero"><img src="${imgBase}saga-transmision-inicial.png" alt="Saga presenta una frase de sueco actual"><figcaption>Saga · sueco actual</figcaption></figure><p class="kicker">SAGA · PAUSA DE IDIOMA</p><p class="scene-dialogue">Es sueco actual para usar hoy. No se puntúa la pronunciación.</p>`:""}<p class="key-count">SUECO ACTUAL · EXPRESIÓN ${state.streetKit+1} DE ${kitCount}</p>${progressBlock(state.streetKit,kitCount,"Expresiones aprendidas")}<h2>${q.prompt}</h2>${streetOptions(q,scope)}${p.correct?`<div class="speech-card"><button class="flashcard" id="flip-card" type="button" aria-label="Girar la tarjeta para ver la traducción"><span class="flash-front-speech"><small>TOCA PARA GIRAR</small><strong>${q.word}</strong></span><span class="flash-back-speech"><small>EN ESPAÑOL</small><strong>${q.meaning}</strong><em>${q.tip}</em></span></button><div class="speech-controls"><button id="listen-model" type="button">▶ Escuchar modelo</button><button id="record-voice" type="button">● Grabar mi voz</button><button id="play-record" type="button" ${recordUrl?"":"disabled"}>▶ Mi grabación</button></div><p class="fine">La app no pone nota. Escucha ambas versiones y compáralas tú. Si no hay micrófono, puedes continuar.</p></div>`:""}<div id="feedback"></div>`;
    screen.querySelectorAll("[data-street-option]").forEach(b=>b.onclick=()=>{p.selected=+b.dataset.streetOption;save();streetKit()});
    if(!p.correct)setActions([{label:"Comprobar cuándo se usa",disabled:p.selected==null,run:()=>{if(p.selected===q.answer){p.correct=true;save();streetKit()}else{$("#feedback").innerHTML=`<div class="feedback bad"><strong>Revisa la situación</strong><p>${q.tip}</p></div>`}}}]);
    else{bindSpeech(q);setActions([{label:state.streetKit===kitCount-1?"Volver a la misión":"Guardar y continuar",run:()=>{if(state.streetKit<kitCount-1){state.streetKit++;recordUrl=null}else{state.streetKitDone=true;state.stage="missionCover"}save();render()}}])}
  }
  function streetOptions(q,scope){const p=prog(scope),items=shuffleFor(q.options.map((label,index)=>({label,index})),scope,"options",x=>x.index);return `<div class="options">${items.map(x=>`<button class="option ${p.selected===x.index?"selected":""}" data-street-option="${x.index}">${esc(x.label)}</button>`).join("")}</div>`}
  function bindSpeech(q){
    const flip=$("#flip-card");if(flip)flip.onclick=()=>flip.classList.toggle("flipped");
    const listen=$("#listen-model");if(listen)listen.onclick=()=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.speech);u.lang="sv-SE";u.rate=.82;speechSynthesis.speak(u)};
    const rec=$("#record-voice");if(rec)rec.onclick=async()=>{
      if(recorder?.state==="recording"){recorder.stop();rec.textContent="● Grabar mi voz";return}
      try{const stream=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{if(recordUrl)URL.revokeObjectURL(recordUrl);recordUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));stream.getTracks().forEach(t=>t.stop());const p=$("#play-record");if(p)p.disabled=false};recorder.start();rec.textContent="■ Detener grabación"}catch{rec.disabled=true;rec.textContent="Micrófono no disponible"}
    };
    const play=$("#play-record");if(play)play.onclick=()=>{if(recordUrl)new Audio(recordUrl).play()};
  }

  function correctionIntro(){
    const count=state.failedKeys.length;setChrome({correction:true,progress:100});screen.className="screen dark";
    screen.innerHTML=`<p class="kicker">DÍA ${DAY} · REPASO 0 DE ${count}</p><h1>La ruta conserva preguntas abiertas.</h1><p>${count===1?"Solo reaparecerá el reto en el que necesitaste más de un intento.":`Solo reaparecerán los ${count} retos en los que necesitaste más de un intento.`} Las demás evidencias siguen guardadas.</p><div class="correction-list">${state.failedKeys.map((id,i)=>{const q=findQuestion(id).q;return `<div class="correction-item"><strong>${i+1}</strong><span>${q.title}</span></div>`}).join("")}</div><p>Repasar no es una penalización: sirve para que la historia quede completa antes de cerrar el día.</p>`;
    setActions([{label:"Continuar sin repasar",kind:"secondary",run:()=>{state.correctionSkipped=true;state.stage="verified";save();render()}},{label:"Repasar los retos",run:()=>{state.stage="correction";save();render()}}],true);
  }
  function correction(){const pending=state.failedKeys.filter(x=>!state.correctedKeys.includes(x));if(!pending.length){state.stage="verified";save();return render()}correctionQuestion(findQuestion(pending[0]).q)}
  function correctionQuestion(q){
    const scope=scopeFor(q,true);setChrome({correction:true,progress:100});screen.className="screen";
    screen.innerHTML=`<p class="key-count">CORRECCIÓN ${state.correctedKeys.length} DE ${state.failedKeys.length}</p><h2>${q.title}</h2><p>${q.prompt}</p>${visual(q.visual,q,scope)}${questionMarkup(q,scope)}<div id="feedback"></div>`;bindQuestion(q,scope,true);
  }
  function findQuestion(id){for(let mi=0;mi<missions.length;mi++){const qi=missions[mi].questions.findIndex(q=>q.id===id);if(qi>=0)return{q:missions[mi].questions[qi],mi,qi}}}
  function verified(){
    setChrome({progress:100});screen.className="screen dark center";
    const status=state.correctionSkipped?`${state.failedKeys.length} retos quedan disponibles para otro momento.`:state.failedKeys.length?`Repaso ${state.correctedKeys.length} de ${state.failedKeys.length}. La ruta vuelve a estar completa.`:"Todas las evidencias se recuperaron al primer intento.";
    screen.innerHTML=`<p class="kicker">${missions.length.toString().toUpperCase()} MISIONES COMPLETADAS</p><h1>${META.verifiedTitle||"Testimonio protegido."}</h1><div class="three-crowns">♛ ♛ ♛</div><p>${status}</p>${progressBlock(missions.length,missions.length,`Evidencias del Día ${DAY}`)}`;
    setActions([{label:META.verifiedAction||"Abrir el cierre",run:()=>{state.endingPage=0;state.stage="ending";save();render()}}],true);
  }
  function fundFinal(){ state.endingPage=0;state.stage="ending";save();render(); }
  function ending(){
    if(DATA.ending){
      setChrome({dark:true,progress:100});screen.className="screen dark";
      const p=DATA.ending[state.endingPage],image=/Margareta/.test(p.caption||"")?"margareta-nilsdotter-reconstruccion-v1.png":p.image;
      screen.innerHTML=`${image?`<figure class="hero-photo character-hero"><img src="${imgBase+image}" alt="${p.alt||p.k}"><figcaption>${p.caption||"Saga · transmisión de la Carta"}</figcaption></figure>`:""}<p class="kicker">${p.k}</p><h2>${p.title}</h2>${p.html}${progressBlock(missions.length,missions.length,`Evidencias del Día ${DAY}`)}`;
      setActions([{label:p.action||"Continuar",run:()=>{if(state.endingPage<DATA.ending.length-1)state.endingPage++;else{state.stage="result";state.finished=true}save();render()}}],true);
      return;
    }
    setChrome({dark:true,progress:100});screen.className="screen dark";
    const pages=[
      `<figure class="hero-photo"><img src="${imgBase}saga-canal-asegurado.png" alt="Saga cierra el Día 01 junto al agua"></figure><p class="kicker">SAGA · CUADERNO PROTEGIDO</p><h2>El testimonio de Karin está a salvo.</h2><p>Mis padres construyeron una testigo ficticia para proteger nombres y hechos reales sin inventar la voz de una víctima concreta.</p><p>La Sombra intentó borrar justo la conexión entre Cristián, la plaza y Gustav Eriksson. No fue un accidente.</p><p class="lead">Karin mantiene una búsqueda abierta; el nombre Vasa abre la siguiente puerta.</p>`,
      `<figure class="hero-photo"><img src="${imgBase}karin-testimonio-1520-v1.png" alt="Karin al cerrar la reconstrucción narrativa"></figure><p class="kicker">KARIN · CIERRE DE LA RECONSTRUCCIÓN</p><h2>Ya tienes el nombre.</h2><p>Yo conservaré los demás.</p><p>Cuando mi señal desaparezca, no digas que me encontraste en una lista. Di la verdad: alguien como yo pudo estar aquí y no dejarla.</p><p class="lead">Ahora sal. Están cerrando la plaza.</p>`,
      `<p class="kicker">PRIMERA CONSECUENCIA</p><h1>Un nombre. 108 años. Dos coordenadas.</h1>${timelineSignal()}<p>Un hombre sobrevivió a la crisis. Una dinastía tomó su nombre. Un barco intentó mostrar hasta dónde había llegado su poder.</p><div class="vasa-brief"><img src="${imgBase}gustav-vasa-portrait.jpg" alt="Retrato histórico de Gustav Vasa"><div><strong>La pista del Día 02</strong><p>En 1625, el rey Gustav II Adolf encargó el <em>Vasa</em> como gran buque de guerra. Se construyó para combatir y exhibir poder, pero quedó demasiado alto y estrecho para su peso. El 10 de agosto de 1628 una ráfaga lo inclinó; entró agua por las portas de los cañones y se hundió tras navegar unos veinte minutos.</p><p>Fue localizado por Anders Franzén en 1956 y volvió a la superficie el 24 de abril de 1961, después de 333 años bajo el agua.</p></div></div><p class="lead">Mañana veremos el barco real y averiguaremos qué revela sobre aquella dinastía.</p>${progressBlock(missions.length,missions.length,"Evidencias del Día 1")}`
    ];
    screen.innerHTML=pages[state.endingPage];setActions([{label:state.endingPage===0?"Cerrar el testimonio de Karin":state.endingPage===1?"Revelar la coordenada del Vasa":"Cerrar el canal",run:()=>{if(state.endingPage<2)state.endingPage++;else{state.stage="result";state.finished=true}save();render()}}],true);
  }
  function result(){
    if(META.result){
      setChrome({progress:100});screen.className="screen result";
      screen.innerHTML=`<div class="mission-complete"><div class="seal">♛♛♛</div><p class="kicker">DÍA ${DAY} COMPLETADO</p><h1>${META.result.title}</h1><p>${missions.length} de ${missions.length} misiones · <strong>${META.result.evidence}</strong></p>${progressBlock(missions.length,missions.length,`Evidencias del Día ${DAY}`)}<p><strong>Pregunta abierta:</strong> ${META.result.openQuestion}</p>${META.result.next?`<a class="next-day-link" href="${META.result.next.href}">${META.result.next.label}</a>`:""}</div>`;
      setActions([{label:"Ver las misiones",kind:"secondary",run:openMenu},{label:"Releer el cierre",run:()=>{state.endingPage=0;state.stage="ending";save();render()}}]);
      return;
    }
    setChrome({progress:100});screen.className="screen result";screen.innerHTML=`<div class="mission-complete"><div class="seal">♛♛♛</div><p class="kicker">DÍA 01 COMPLETADO</p><h1>La plaza cerrada</h1><p>${missions.length} de ${missions.length} misiones · <strong>Cuaderno de Karin protegido</strong></p>${progressBlock(missions.length,missions.length,"Evidencias del Día 1")}<p><strong>Pregunta abierta:</strong> ¿El padre de Karin está entre quienes escaparon y por qué La Sombra necesita borrar el nombre Vasa?</p><a class="next-day-link" href="dia2.html">Abrir el Día 02</a></div>`;setActions([{label:"Ver las misiones",kind:"secondary",run:openMenu},{label:"Releer el cierre",run:()=>{state.endingPage=0;state.stage="ending";save();render()}}]);
  }

  function visual(kind,q,scope,solution=false){
    if(!kind)return ""; if(q?.onsite&&!prog(scope).evidenceOpen&&!solution)return "";
    const cards={
      names:`<div class="evidence-grid two"><div><b>SVEA RIKE</b><span>reino de los Svear</span></div><div><b>SVETHIUDH</b><span>pueblo de los Svear</span></div></div>`,
      helmets:`<section class="helmet-gallery" aria-label="Tres cascos de tres épocas"><figure><img src="${imgBase}Gjermundbu_helmet_-_cropped.jpg" alt="Casco de Gjermundbu, de época vikinga y sin cuernos"><figcaption><strong>GJERMUNDBU</strong><span>Época vikinga · sin cuernos</span></figcaption></figure><figure><img src="${imgBase}Veksø-hjelmene_DO-2348_original.jpg" alt="Cascos de Veksø, de la Edad del Bronce y con cuernos"><figcaption><strong>VEKSØ</strong><span>Edad del Bronce · con cuernos</span></figcaption></figure><figure><img src="${imgBase}El_funeral_de_un_vikingo,_por_Frank_Dicksee_sigloXIX.jpg" alt="Pintura romántica del siglo XIX que representa un funeral vikingo"><figcaption><strong>SIGLO XIX</strong><span>Arte romántico · imagen popular</span></figcaption></figure></section>`,
      stones:`<div class="evidence-photo stones-evidence"><span class="building"></span><b>Schantzska huset · nº 20</b><p>Las piedras claras rodean las ventanas. Cuéntalas por hileras: la solución rotulada muestra 94.</p></div>`,
      choir:`<div class="evidence-photo choir-evidence"><span></span><b>Contorno del antiguo coro</b><p>La línea de piedra aparece junto a Storkyrkan, a pocos pasos del antiguo Tre Kronor.</p></div>`,
      runeAlley:`<div class="evidence-grid two"><div class="rune-card"><b>PIEDRA U 53</b><span>«Torsten y Frögunn… la piedra en memoria de…, su hijo»</span><em>Texto incompleto: faltan fragmentos.</em></div><div><b>90 CM</b><span>Mårten Trotzigs gränd</span></div></div>`,
      crowns:`<div class="evidence-photo crowns-evidence"><span>♛ ♛ ♛</span><b>Torre del Ayuntamiento</b><p>Se reconoce desde el agua y desde varios miradores de Södermalm.</p></div>`,
      gustav:`<div class="gustav-evidence"><img src="${imgBase}gustav-vasa-portrait.jpg" alt="Retrato histórico de Gustav Vasa"><div class="evidence-grid two"><div><b>GUSTAV ERIKSSON</b><span>hijo de Erik · joven noble en 1520</span></div><div><b>VASA</b><span>nombre posterior del linaje y de la dinastía</span></div></div><small>Retrato pintado años después: sirve para identificar al personaje, no para mostrar exactamente su aspecto en 1520.</small></div>`,
      d2Port:`<figure class="vasa-photo"><img src="${imgBase}vasa-museum-public-domain.jpg" alt="Vasa conservado en el Museo Vasa"><figcaption>Museo Vasa · el barco se conserva hoy junto a Djurgården</figcaption></figure><div class="evidence-grid two"><div><b>TRE KRONOR</b><span>salida desde el puerto histórico</span></div><div><b>BECKHOLMEN</b><span>naufragio tras unos 1.300 metros</span></div><div><b>VAXHOLM</b><span>primera escala prevista</span></div><div><b>ÁLVSNABBEN</b><span>reunión prevista con la flota</span></div></div>`,
      d2War:`<div class="history-timeline"><div><strong>SUECIA</strong><span>guerra contra la Mancomunidad Polaco-Lituana</span></div><div><strong>GDAŃSK</strong><span>bloqueo posible en el Báltico</span></div><div><strong>STRALSUND</strong><span>apoyo naval posible</span></div><div><strong>VASA</strong><span>dos cubiertas de artillería · 64 cañones a bordo</span></div></div>`,
      d2Shipyard:`<div class="evidence-grid three"><div><b>MADERA</b><span>casco, mástiles y tallas</span></div><div><b>HIERRO</b><span>herrajes, anclas y armas</span></div><div><b>CUERDAS Y VELAS</b><span>aparejo y navegación</span></div><div><b>CUENTAS</b><span>compras, salarios y contratos</span></div><div><b>OFICIOS</b><span>más de 400 personas en meses de actividad</span></div><div><b>RUTAS</b><span>materiales y trabajadores de varias zonas</span></div></div>`,
      d2Stability:`<div class="evidence-grid two"><div><b>ARRIBA</b><span>dos cubiertas de cañones y estructura pesada</span></div><div><b>ABAJO</b><span>lastre limitado en un casco relativamente estrecho</span></div><div><b>PRUEBA</b><span>30 hombres corren de una banda a otra</span></div><div><b>SEÑAL</b><span>se detiene tras tres pasadas por temor a que vuelque</span></div></div>`,
      d2Sinking:`<div class="history-timeline"><div><strong>INESTABILIDAD</strong><span>vulnerabilidad conocida</span></div><div><strong>RÁFAGA</strong><span>el barco escora</span></div><div><strong>PORTAS ABIERTAS</strong><span>el agua entra</span></div><div><strong>NAUFRAGIO</strong><span>no logra recuperarse</span></div></div>`,
      d2Recovery:`<div class="history-timeline"><div><strong>1956</strong><span>Anders Franzén localiza el pecio</span></div><div><strong>SEIS TÚNELES</strong><span>cables de acero pasan bajo el casco</span></div><div><strong>PONTONES</strong><span>elevaciones lentas por etapas</span></div><div><strong>24 ABR 1961</strong><span>el Vasa vuelve a la superficie</span></div></div>`,
      d2Brackish:`<div class="evidence-grid two"><div><b>MAR OCEÁNICO</b><span>más sal · el gusano de barco puede prosperar</span></div><div><b>BÁLTICO SALOBRE</b><span>menos sal · el organismo no prospera igual</span></div><div><b>FONDO FRÍO Y POBRE EN OXÍGENO</b><span>ayudó a conservar la madera</span></div><div><b>PEG Y MUSEO</b><span>la conservación continuó tras salir del agua</span></div></div>`,
      d2Fika:`<figure class="vasa-photo food-photo"><img src="${imgBase}kanelbulle-public-domain.jpg" alt="Bollos de canela suecos"><figcaption>Fika actual · pausa social, bebida y algo de comer</figcaption></figure>`,
      d2Djurgarden:`<div class="evidence-grid two"><div><b>CAZA REAL</b><span>un uso histórico de la isla</span></div><div><b>MUSEO VASA</b><span>un barco y su conservación</span></div><div><b>SKANSEN</b><span>edificios y formas de vida de distintas regiones</span></div><div><b>ROSENDAL</b><span>jardín, cultivo y pausa</span></div></div><figure class="vasa-photo"><img src="${imgBase}abba-1974-top-pop.png" alt="ABBA en 1974"><figcaption>ABBA · cultura contemporánea de Djurgården</figcaption></figure>`,
      djurgarden:`<div class="history-timeline"><div><strong>1452</strong><span>propiedad real</span></div><div><strong>1579</strong><span>recinto de animales</span></div><div><strong>1680s</strong><span>parque de caza</span></div><div><strong>1733</strong><span>32 locales con licencia</span></div></div>`,
      skansen:`<div class="evidence-grid three"><div><b>GRANJA</b><span>región y época</span></div><div><b>TALLER</b><span>oficio y herramienta</span></div><div><b>FAUNA</b><span>animales nórdicos</span></div></div>`,
      rosendal:`<div class="garden-diagram"><span>INVERNADERO</span><span>HUERTO</span><span>PANADERÍA</span><span>CAFÉ</span></div>`,
      abba:`<figure class="vasa-photo"><img src="${imgBase}abba-1974-top-pop.png" alt="ABBA en 1974"><figcaption>ABBA en 1974 · Agnetha, Björn, Benny y Anni-Frid</figcaption></figure><div class="evidence-grid two"><div><b>A · AGNETHA</b><span>Fältskog</span></div><div><b>B · BJÖRN</b><span>Ulvaeus</span></div><div><b>B · BENNY</b><span>Andersson</span></div><div><b>A · ANNI-FRID</b><span>Lyngstad</span></div></div><p class="fine">Las iniciales de sus cuatro nombres formaron ABBA.</p>`,
      d2Aland:`<div class="evidence-grid two"><div><b>ARCHIPIÉLAGO</b><span>islas y aguas entre ellas</span></div><div><b>ÅLAND</b><span>entre Suecia y Finlandia</span></div><div><b>IDIOMA</b><span>mayoritariamente sueco</span></div><div><b>SOBERANÍA</b><span>autonomía de Finlandia · desmilitarizada</span></div></div>`
    };
    if(kind==="sveargotar")return mapSvearGotar(solution);
    if(kind==="vikingRoutes")return mapVikings(solution);
    if(kind==="aland")return mapAland(solution);
    if(kind==="kalmar")return mapKalmar(solution);
    if(kind==="asunden")return mapAsunden();
    if(kind==="raceMaps")return raceMaps();
    if(kind==="ships")return shipGallery();
    if(kind==="finalSignal")return timelineSignal();
    if(kind==="d2Port")return /ruta que el Vasa/i.test(q?.title||"")?d2RouteMap():d2StockholmMap();
    if(kind==="d2StockholmMap")return d2StockholmMap();
    if(kind==="d2RouteMap")return d2RouteMap();
    if(kind==="d2WarMap")return d2WarMap();
    if(kind==="d2War")return d2WarMap();
    if(kind==="d2Shipyard")return `<div class="visual-evidence">${cards.d2Shipyard}</div>`;
    if(kind==="d2Stability")return `<div class="visual-evidence"><div class="stability-demo"><div class="mini-ship"><i></i><b>VASA</b></div><div class="crew-dots">${Array.from({length:30},()=>"<span></span>").join("")}</div><strong>30 HOMBRES · PRUEBA INTERRUMPIDA</strong></div></div>`;
    if(kind==="d2Sinking")return `<div class="visual-evidence">${cards.d2Sinking}</div>`;
    if(kind==="d2Recovery")return `<div class="visual-evidence">${cards.d2Recovery}</div>`;
    if(kind==="d2Brackish")return `<div class="visual-evidence">${cards.d2Brackish}</div>`;
    if(kind==="d2Fika")return `<div class="visual-evidence">${cards.d2Fika}</div>`;
    if(kind==="d2Djurgarden")return `<div class="visual-evidence">${cards.d2Djurgarden}</div>`;
    if(["djurgarden","skansen","rosendal","abba"].includes(kind))return `<div class="visual-evidence">${cards[kind]}</div>`;
    if(kind==="d2Aland")return `<div class="visual-evidence">${cards.d2Aland}</div>`;
    if(kind==="d3Route")return d3RouteMap();
    if(kind==="d3Crossroads")return d3CrossroadsMap();
    if(kind==="d3Baltic")return d3BalticMap();
    if(kind==="d3Jens")return d3JensMap();
    if(kind==="d3Revolt")return d3RevoltMap();
    if(kind==="d3LastJourney")return d3LastJourneyMap();
    if(kind==="d3Erik")return d3ErikTimeline();
    if(kind==="d3Visit")return d3VisitCard();
    if(kind==="d3Culture")return d3CultureCard();
    if(kind==="d3Bernadotte")return d3BernadotteCard();
    if(kind==="d4TivedenMap")return d4TivedenMap();
    if(kind==="d4TrailPlanner")return d4TrailPlanner();
    if(kind==="d4Geology")return d4GeologyCard();
    if(kind==="d4Junker")return d4JunkerCard();
    if(kind==="d4Vitsand")return d4VitsandCard();
    if(kind==="d4Storsjon")return d4StorsjonMap();
    if(kind==="d4Forest")return d4ForestCard();
    if(kind==="d4Fire")return d4FireCard();
    if(kind==="d4Trolls")return d4TrollCard();
    if(kind==="d4Swedish")return d4SwedishCard();
    if(kind==="d4Animals")return d4AnimalsCard();
    if(kind==="d4Lynx")return d4LynxCard();
    if(kind==="d4Fagertarn")return d4FagertarnCard();
    if(kind==="d5Route")return d5RouteMap();
    if(kind==="d5Lakes")return d5LakesCard();
    if(kind==="d5Finland")return d5FinlandMap();
    if(kind==="d5FinlandComic")return d5FinlandComic();
    if(kind==="d5Bernadotte")return d5BernadotteCard();
    if(kind==="d5Gota")return d5GotaMap();
    if(kind==="d5GotaExplore")return d5GotaExploreMap(c,scope);
    if(kind==="d5Lock")return d5LockCard();
    if(kind==="d5Workers")return d5WorkersCard();
    if(kind==="d5Karlsborg")return d5KarlsborgCard();
    if(kind==="d5Timeline")return d5TimelineCard();
    if(kind==="d5Water")return d5WaterCard();
    if(kind==="d5LakeLife")return d5LakeLifeCard();
    if(kind==="d5Hjo")return d5HjoMap();
    if(kind==="d5Culture")return d5CultureCard();
    if(kind==="d5Trafik")return d5TrafikCard();
    if(kind==="d5Swedish")return d5SwedishCard();
    if(kind==="d6West")return d6WestMap();
    if(kind==="d6Coast")return d6CoastMap();
    if(kind==="d6Founding")return d6FoundingCard();
    if(kind==="d6Vasa")return d6VasaCard();
    if(kind==="d6Drain")return d6DrainCard();
    if(kind==="d6Amsterdam")return d6AmsterdamCard();
    if(kind==="d6Shield")return d6ShieldCard();
    if(kind==="d6War")return d6WarMap();
    if(kind==="d6Nordlingen")return d6NordlingenMap();
    if(kind==="d6Solutions")return d6SolutionsCard();
    if(kind==="d6Fesk")return d6FeskCard();
    if(kind==="d6TeaWorld")return d6TeaWorldMap();
    if(kind==="d6TeaEurope")return d6TeaEuropeMap();
    if(kind==="d6Legacy")return d6LegacyCard();
    if(kind==="d6Ports")return d6PortsCard();
    if(kind==="d6Swedish")return d6SwedishCard();
    if(kind==="d7Route")return d7RouteMap();
    if(kind==="d7Lake")return d7LakeCard();
    if(kind==="d7Winter")return d7WinterCard();
    if(kind==="d7Battle")return d7BattleMap();
    if(kind==="d7Chain")return d7ChainCard();
    if(kind==="d7Skottek")return d7SkottekCard();
    if(kind==="d7Ancient")return d7AncientCard();
    if(kind==="d7Gotar")return d7GotarMap();
    if(kind==="d7Ulrika")return d7UlrikaCard();
    if(kind==="d7Torpa")return d7TorpaCard();
    if(kind==="d7Family")return d7FamilyCard();
    if(kind==="d7SkottekPhoto")return d7SkottekPhoto();
    if(kind==="d7Peat")return d7PeatCard();
    if(kind==="d7PeatTypes")return d7PeatTypesCard();
    if(kind==="d7PeatScale")return d7PeatScaleCard();
    if(kind==="d7Boardwalk")return d7BoardwalkCard();
    if(kind==="d7Swedish")return d7SwedishCard();
    if(kind==="d7Birds")return d7BirdsCard();
    if(kind==="d8Route")return d8RouteMap();
    if(kind==="d8Peat")return d8PeatCard();
    if(kind==="d8Core")return d8CoreCard();
    if(kind==="d8Drosera")return d8DroseraCard();
    if(kind==="d8Rocknar")return d8RocknarCard();
    if(kind==="d8Dunes")return d8DunesCard();
    if(kind==="d8Birds")return d8BirdsCard();
    if(kind==="d8Restore")return d8RestoreCard();
    if(kind==="d8Gnosjo")return d8GnosjoCard();
    if(kind==="d8Mariefred")return d8MariefredMap();
    if(kind==="d8Pax")return d8PaxCard();
    if(kind==="d8Inn")return d8InnCard();
    if(kind==="d8Madrid")return d8MadridCard();
    if(kind==="d8Swedish")return d8SwedishCard();
    if(kind==="d9Bo")return d9BoMap();
    if(kind==="d9Name")return d9NameCard();
    if(kind==="d9Pax")return d9PaxCard();
    if(kind==="d9Mariefred")return d9MariefredCard();
    if(kind==="d9Water")return d9WaterMap();
    if(kind==="d9Castles")return d9CastlesCard();
    if(kind==="d9Segovia")return d9SegoviaCard();
    if(kind==="d9Family")return d9FamilyCard();
    if(kind==="d9Felipe")return d9FelipeCard();
    if(kind==="d9Portraits")return d9PortraitsCard();
    if(kind==="d9Theatre")return d9TheatreCard();
    if(kind==="d9Lion")return d9LionCard();
    if(kind==="d9Swedish")return d9SwedishCard();
    if(kind==="d9Strangnas")return d9StrangnasMap();
    if(kind==="d9Sigtuna")return d9SigtunaMap();
    if(kind==="d9View")return d9ViewMap();
    if(kind==="d9Five")return d9FiveCard();
    if(kind==="d9Thanks")return d9ThanksCard();
    if(kind==="d10Karin")return d10PhotoCard("KARIN · STORTORGET · 1520","karin-testimonio-1520-v1.png","Una plaza puede ser bonita y guardar una pregunta que nadie debería olvidar.");
    if(kind==="d10Vasa")return d10PhotoCard("MARGARETA · VASA · 1628","vasa-museum-public-domain.jpg","Diseño, estabilidad y evidencia: la historia real ya es extraordinaria.");
    if(kind==="d10Engelbrekt")return d10PhotoCard("ENGELBREKT · BERGSLAGEN · 1434","engelbrekt-statue-orebro.jpg","Hierro, rutas y abusos: la protesta tenía causas concretas.");
    if(kind==="d10Tiveden")return d10PhotoCard("ALVA · TIVEDEN","junker-jagare-stone-public-domain.jpg","La roca conserva una leyenda y una historia de hielo; no hay que confundirlas.");
    if(kind==="d10Karlsborg")return d10KarlsborgCard();
    if(kind==="d10Goteborg")return d10PhotoCard("GEERTRUYD · GOTEMBURGO","goteborg-vallgraven-cc-by-sa.jpg","Canales, barro, puerto y defensas formaban un mismo problema.");
    if(kind==="d10Komosse")return d10PhotoCard("LIV · KOMOSSE","liv-berg-asunden-ficcion-v1.png","Las pasarelas permiten observar un terreno frágil sin pisarlo.");
    if(kind==="d10Maja")return d10PhotoCard("MAJA · STORE MOSSE","maja-lind-store-mosse-ficcion-v1.png","Las capas visibles se convierten en cronología con muestras y análisis.");
    if(kind==="d10Elin")return d10PhotoCard("ELIN · GRIPSHOLM","elin-ryd-gripsholm-ficcion-v1.png","Fortaleza, monasterio, castillo, prisión, teatro y memoria: las capas pueden convivir.");
    return cards[kind]?`<div class="visual-evidence">${cards[kind]}</div>`:"";
  }

  function d2StockholmMap(){
    return `<div class="puzzle-card map-card"><p class="kicker">ESTOCOLMO · PUERTO Y SALIDA</p><svg class="schematic-map regional" viewBox="0 0 420 300" role="img" aria-label="Mapa de Estocolmo con Gamla Stan, Djurgården, Beckholmen, Vaxholm y el Báltico"><rect width="420" height="300" class="schem-water"/><path class="schem-land" d="M0 0H240L258 37 242 77 269 111 231 147 182 140 142 169 73 153 0 180Z"/><path class="schem-land" d="M0 220 74 181 149 190 207 229 194 300H0Z"/><path class="schem-land" d="M258 126Q343 89 420 135V224Q349 239 281 204Q246 181 258 126Z"/><path class="schem-island" d="M210 134q25-17 35 12t-19 46q-26-7-16-58Z"/><path class="schem-island" d="M287 109q19-10 33 9t-10 28q-27 6-23-37Z"/><path class="schem-route planned" d="M174 142Q228 124 292 128Q341 120 384 55"/><circle class="schem-point" cx="174" cy="142" r="6"/><text class="schem-label" x="112" y="129">Gamla Stan · Tre Kronor</text><circle class="schem-point danger" cx="210" cy="157" r="7"/><text class="schem-label" x="180" y="190">Beckholmen</text><circle class="schem-point" cx="292" cy="128" r="6"/><text class="schem-label" x="275" y="104">Djurgården</text><circle class="schem-point" cx="384" cy="55" r="6"/><text class="schem-label" x="330" y="37">Vaxholm</text><text class="schem-water-label" x="268" y="268">HACIA EL BÁLTICO</text><path class="north-arrow" d="M390 270V240m0 0-7 12m7-12 7 12"/><text class="schem-label" x="384" y="285">N</text></svg><p class="map-caption">Orientación: ciudad, islas, puerto y salida oriental. Confirma siempre los recorridos con un mapa actual y la señalización.</p></div>`;
  }
  function d2RouteMap(){
    return `<div class="puzzle-card map-card"><p class="kicker">VASA · RUTA REAL Y RUTA PREVISTA</p><svg class="schematic-map regional" viewBox="0 0 420 300" role="img" aria-label="Ruta del Vasa desde Tre Kronor hasta el naufragio y ruta prevista hacia Vaxholm y Älvsnabben"><rect width="420" height="300" class="schem-water"/><path class="schem-land" d="M0 0H134L120 60 141 112 111 170 90 230 102 300H0Z"/><g class="schem-islands"><ellipse cx="144" cy="134" rx="8" ry="13"/><ellipse cx="162" cy="109" rx="11" ry="6"/><ellipse cx="185" cy="91" rx="7" ry="12"/><ellipse cx="204" cy="120" rx="12" ry="7"/><ellipse cx="229" cy="145" rx="7" ry="11"/><ellipse cx="248" cy="174" rx="13" ry="7"/><ellipse cx="270" cy="204" rx="7" ry="12"/><ellipse cx="295" cy="230" rx="11" ry="6"/><ellipse cx="321" cy="248" rx="8" ry="13"/></g><path class="schem-route planned" d="M92 150Q151 107 191 82Q245 130 304 255"/><path class="schem-route sunk-route" d="M92 150L113 160"/><circle class="schem-point" cx="92" cy="150" r="6"/><text class="schem-label" x="23" y="136">Tre Kronor · salida</text><circle class="schem-point danger" cx="113" cy="160" r="7"/><text class="schem-label" x="32" y="184">Beckholmen · 1.300 m</text><circle class="schem-point" cx="191" cy="82" r="6"/><text class="schem-label" x="165" y="60">Vaxholm · escala prevista</text><circle class="schem-point" cx="304" cy="255" r="6"/><text class="schem-label" x="265" y="282">Älvsnabben · flota</text><text class="schem-country" x="19" y="43">ESTOCOLMO</text><text class="schem-water-label" x="262" y="126">ARCHIPIÉLAGO</text></svg><p class="map-caption">Línea corta: lo que ocurrió. Línea larga: el plan que quedó interrumpido antes de Vaxholm.</p></div>`;
  }
  function d2WarMap(){
    return `<div class="puzzle-card map-card"><p class="kicker">BÁLTICO · HACIA 1628</p>${annotatedMap([5,32,50,67],[["Suecia",17,61],["Estocolmo",18.07,59.33],["Polonia-Lituania",23,54],["Gdańsk",18.65,54.35],["Stralsund",13.09,54.31],["Sacro Imperio",12,51]],[],"Europa septentrional hacia 1628")}<p class="map-caption">Mapa histórico orientativo: Suecia incluía Finlandia; Polonia-Lituania era una mancomunidad. Gdańsk y Stralsund aparecen como posibles horizontes militares del Vasa, no como su recorrido real.</p></div>`;
  }
  function d3MapCard(kicker,body,caption="Mapa de orientación · los recorridos actuales se confirman siempre con un mapa y señalización actualizados."){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}<p class="map-caption">${caption}</p></div>`}
  function d3RouteMap(){return d3MapCard("ESTOCOLMO → ÖREBRO → TIVEDEN",annotatedMap([12.5,19,58.45,60.05],[["Estocolmo",18.07,59.33,10,-12],["Mälaren",17.18,59.48,-54,-25],["Örebro",15.21,59.27,10,-14],["Hjälmaren",15.9,59.25,10,20],["Tiveden",14.65,58.75,-48,18],["Vänern",13.2,58.9,-38,-10],["Vättern",14.5,58.87,10,24]],[[18.07,59.33,15.21,59.27,"",""],[15.21,59.27,14.65,58.75,"","danger"]],"Ruta de Estocolmo a Örebro y Tiveden"),"Una misma orientación abre y cierra el día: ciudad marítima, cruce interior y bosque entre lagos.")}
  function d3CrossroadsMap(){return d3MapCard("ÖREBRO · RÍO, PUENTE Y CUATRO DIRECCIONES",annotatedMap([13.9,18.4,58.65,60.7],[["Bergslagen",15.3,60.1,-42,-12],["Mälaren / Estocolmo",17.18,59.48,10,-13],["Östergötland",15.8,58.82,10,18],["hacia Nidaros",14.2,60.45,-8,-12],["Örebro · Svartån",15.21,59.27,10,-12],["puente y castillo",15.25,59.3,10,20]],[[15.21,59.27,15.3,60.1,"",""],[15.21,59.27,17.18,59.48,"",""],[15.21,59.27,15.8,58.82,"","danger"],[15.21,59.27,14.2,60.45,"","danger"]],"Mapa de Örebro como cruce de rutas"),"No son carreteras modernas: las flechas muestran direcciones de relación. El río, el puente y el castillo concentraban paso, defensa y comercio.")}
  function d3BalticMap(){const trade=state.mission===2&&state.contextPage>0;const marks=[["Dinamarca",10.2,56,10,-10],["Kalmar",16.36,56.66,10,14],["Suecia",17,60.8,10,-10],["Bergslagen",15.3,60.05,-62,-10],["Pomerania",15.5,54.2,10,16]];if(trade)marks.push(["Lübeck · Hansa",10.7,53.9,-30,18],["Schleswig",9.5,54.8,-35,-12],["Holstein",9.8,54.15,-28,18]);return d3MapCard(trade?"BÁLTICO · COMERCIO Y CONFLICTO":"BÁLTICO · PODERES Y CONEXIONES",annotatedMap([7.8,21,53,62.4],marks,trade?[[15.3,60.05,10.7,53.9,"hierro y cobre",""],[10.7,53.9,15.3,60.05,"sal y otros bienes","danger"]]:[],"Mapa del Báltico, la Unión de Kalmar y las rutas comerciales"),trade?"La misma base añade lo que se dañó: salidas de hierro y cobre; entrada de sal y otros bienes. La Hansa era una red comercial, no un país único.":"Primera capa: una corona compartida no borraba leyes, élites ni necesidades propias de cada reino.")}
  function d3JensMap(){return d3MapCard("BERGSLAGEN → VÄSTERÅS · LAS QUEJAS",annotatedMap([14.3,18.2,58.95,60.7],[["Bergslagen",15.3,60.1,-50,-12],["Västerås",16.55,59.61,10,-12],["Örebro",15.21,59.27,-46,18],["Estocolmo",18.07,59.33,-55,-12]],[[15.3,60.1,16.55,59.61,"quejas y administración","danger"]],"Mapa de Bergslagen, Västerås y Örebro"),"Jens Eriksson era el bailío real en Västerås: allí convergían impuestos, administración y las reclamaciones de Bergslagen.")}
  function d3RevoltMap(){return d3MapCard("1434–1435 · LA PROTESTA SE EXTIENDE",annotatedMap([14.3,17.4,59.0,60.7],[["Bergslagen",15.3,60.1,-46,-12],["Borganäs",15.3,60.3,10,-12],["Västerås",16.55,59.61,10,-12],["Örebro",15.21,59.27,-44,18],["Arboga",15.84,59.39,10,20]],[[15.3,60.1,16.55,59.61,"","danger"],[16.55,59.61,15.21,59.27,"",""],[15.21,59.27,15.84,59.39,"1435","danger"]],"Expansión de la rebelión de Engelbrekt"),"La misma región de la pantalla anterior cambia de lectura: de una queja contra un funcionario a una crisis que alcanza fortalezas, ciudades y negociación.")}
  function d3LastJourneyMap(){return d3MapCard("ÖREBRO → HJÄLMAREN → ENGELBREKTSHOLMEN",annotatedMap([14.8,16.35,59.05,59.5],[["Örebro",15.21,59.27,-42,-14],["Hjälmaren",15.72,59.29,10,-12],["Engelbrektsholmen",15.87,59.2,-110,24],["Göksholm",15.88,59.19,12,20]],[[15.21,59.27,15.87,59.2,"trayecto documentado",""]],"Último viaje documentado de Engelbrekt"),"La reunión política prevista era en Estocolmo, pero la fuente no permite dibujar cada tramo posterior. El mapa muestra solo los lugares documentados.")}
  function d3ErikTimeline(){return d3MapCard("ERIK DE POMERANIA · 1434–1442",`<div class="history-timeline"><div><strong>1434</strong><span>rebelión y consejos limitan su autoridad</span></div><div><strong>1436</strong><span>muere Engelbrekt; la crisis continúa</span></div><div><strong>1436–1439</strong><span>Erik se instala en Gotland</span></div><div><strong>1439</strong><span>Dinamarca y Suecia lo deponen</span></div><div><strong>1441–1442</strong><span>Noruega lo aparta y acepta a Cristóbal</span></div></div>`,"La autoridad de Erik se fue quedando sin apoyos; la Unión de Kalmar continuó de otra forma.")}
  function d3VisitCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}orebro-castle-cc0.jpg" alt="Castillo de Örebro rodeado por el Svartån"><figcaption>Castillo de Örebro · agua, paso y defensa</figcaption></figure><figure class="vasa-photo"><img src="${imgBase}engelbrekt-statue-orebro.jpg" alt="Estatua posterior de Engelbrekt en Örebro"><figcaption>Estatua posterior · memoria de Engelbrekt, no retrato exacto</figcaption></figure></div>`}
  function d3CultureCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}hjalmar-bergman-public-domain.jpg" alt="Retrato histórico de Hjalmar Bergman"><figcaption>Hjalmar Bergman · no era familia de Ingmar Bergman</figcaption></figure><div class="evidence-grid"><div><b>1755 · CAJSA WARG</b><span>recetario influyente, no una cita literal de «se toma lo que se tiene»</span></div></div></div>`}
  function d3BernadotteCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}bernadotte-public-domain.jpg" alt="Retrato de Jean Baptiste Bernadotte"><figcaption>Jean Baptiste Bernadotte · elegido heredero en Örebro en 1810</figcaption></figure><div class="history-timeline"><div><strong>1434–1435</strong><span>Örebro en la crisis de Engelbrekt</span></div><div><strong>1810</strong><span>elección de Bernadotte como heredero</span></div></div></div>`}
  function d4Card(kicker,body,caption){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}${caption?`<p class="map-caption">${caption}</p>`:""}</div>`}
  function d4TivedenMap(){return d4Card("ÖREBRO → TIVEDEN · ENTRE DOS GRANDES LAGOS",annotatedMap([12.6,16.5,58.3,59.65],[["Örebro",15.21,59.27,10,-12],["Tiveden",14.65,58.75,10,20],["Vänern",13.2,58.9,-39,-10],["Vättern",14.5,58.68,10,22]],[[15.21,59.27,14.65,58.75,"","danger"]],"Mapa de orientación de Tiveden entre Vänern y Vättern"),"Primero situamos el paisaje. Los detalles de senderos, Stenkälla y seguridad están en la ficha oficial de la ruta.")}
  function d4TrailPlanner(){return d4Card("TIVEDEN · ELIGE TU DÍA",'<section class="tiveden-trails"><div class="geo-map"><svg viewBox="0 0 420 285" role="img" aria-label="Mapa orientativo del Parque Nacional de Tiveden con rutas oficiales, Vitsand y Junker Jägares sten"><rect width="420" height="285" class="map-water"/><path class="schem-land" d="M20 20H398V265H20Z"/><path d="M105 43Q180 18 280 62Q335 110 347 188Q298 245 183 237Q80 205 70 112Z" fill="#b9dce7" stroke="#58717b" stroke-width="3"/><path d="M105 45Q58 93 88 151Q113 184 73 228" fill="none" stroke="#b52b45" stroke-width="6" stroke-dasharray="10 7"/><path d="M145 42Q194 82 229 55Q272 35 321 76" fill="none" stroke="#f0bd19" stroke-width="6"/><path d="M75 226Q112 197 154 214Q202 245 265 233Q320 218 347 188" fill="none" stroke="#7d4fa0" stroke-width="7"/><path d="M72 226Q111 207 151 223Q126 251 88 243Z" fill="none" stroke="#fff" stroke-width="6"/><path d="M88 235Q146 182 202 203" fill="none" stroke="#e98a1c" stroke-width="6"/><path d="M117 208Q155 178 205 201" fill="none" stroke="#111" stroke-width="5"/><circle cx="85" cy="236" r="8" fill="#ffcf00" stroke="#092333" stroke-width="4"/><text class="schem-label" x="98" y="242">Vitsand · playa</text><circle cx="123" cy="207" r="8" fill="#ffcf00" stroke="#092333" stroke-width="4"/><text class="schem-label" x="132" y="202">Junker Jägares sten</text><circle cx="109" cy="45" r="7" class="schem-point"/><text class="schem-label" x="28" y="37">Entrada principal</text><circle cx="343" cy="189" r="7" class="schem-point"/><text class="schem-label" x="296" y="211">Stenkällan</text></svg></div><div class="route-legend"><span><i style="background:#fff;border:2px solid #092333"></i>Junker jägarerundan · 2,8 km · 1 h 30</span><span><i style="background:#7d4fa0"></i>Trehörningsrundan · 9,5 km · 4–5 h</span><span><i style="background:#e98a1c"></i>Tärnkullerundan · 1,3 km · 1 h</span><span><i style="background:#f0bd19"></i>Stenkällerundan · 2,2 km · 1 h 30</span></div><p class="map-caption">Mapa de orientación: las líneas sitúan los recorridos oficiales principales. Consulta la ficha y la señalización del parque antes de salir.</p></section>',"Vitsand y Junker Jägares sten están cerca, pero no todo el mundo tiene que recorrerlos a pie: el mapa permite decidir entre combinarlos en ruta o moverse entre entradas.")}
  function d4GeologyCard(){return d4Card("TIVEDEN · ROCA ANTIGUA, PAISAJE GLACIAR",`<section class="tiveden-geology" aria-label="Tres diagramas que explican cómo el hielo modeló el paisaje de Tiveden"><div class="geo-timeline"><span><b>≈1.800 millones de años</b>se forma la roca</span><i>→</i><span><b>hace ≈115.000 años</b>comienza la última glaciación</span><i>→</i><span><b>hace ≈20.000 años</b>máximo del hielo</span><i>→</i><span><b>hace ≈10.000 años</b>el hielo ya se ha retirado de Suecia</span></div><article class="geo-panel rock"><header><b>1</b><div><strong>La roca ya tenía grietas</strong><span>La base del parque es muchísimo más antigua que el hielo.</span></div></header><div class="geo-scene" aria-hidden="true"><i class="bedrock"></i><i class="crack one"></i><i class="crack two"></i><em>ROCA ANTIGUA<br>CON FRACTURAS</em></div><p>Las fracturas son zonas débiles de una roca formada hace muchísimo tiempo. Algunas existían antes de la última Edad de Hielo.</p></article><article class="geo-panel ice"><header><b>2</b><div><strong>El hielo usa esas zonas débiles</strong><span>Una enorme capa de hielo se mueve lentamente por encima.</span></div></header><div class="geo-scene" aria-hidden="true"><i class="bedrock"></i><i class="ice-sheet">HIELO EN MOVIMIENTO →</i><i class="ice-stone a"></i><i class="ice-stone b"></i><i class="force-arrow">PESO + ROZAMIENTO</i></div><p>El hielo llevaba piedras en su base: al avanzar, desgastaba la superficie y podía arrancar o desplazar bloques donde la roca estaba fracturada.</p></article><article class="geo-panel melt"><header><b>3</b><div><strong>Al retirarse, deja el relieve visible</strong><span>El hielo no desaparece de un día para otro.</span></div></header><div class="geo-scene" aria-hidden="true"><i class="bedrock"></i><i class="retreat-ice">HIELO EN RETIRADA</i><i class="left-block"></i><i class="right-block"></i><i class="meltwater">AGUA DE DESHIELO ↘</i></div><p>Al quedar el terreno al descubierto, permanecen bloques, cavidades y materiales depositados. Después, agua, heladas y vegetación siguen cambiando el paisaje.</p></article><aside class="geo-key"><b>IDEA CLAVE</b><span>Tiveden no fue creado por el hielo: el hielo modeló una roca muy antigua y dejó visibles muchas de sus formas.</span></aside></section>`,"Es una historia de dos escalas: roca muy antigua y un paisaje intensamente modelado durante la última glaciación.")}
  function d4JunkerCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}junker-jagare-stone-public-domain.jpg" alt="Junker Jägares sten en Tiveden"><figcaption>Junker Jägares sten · foto de Zeth Johansson · dominio público</figcaption></figure><div class="evidence-grid two"><div><b>HECHO GEOLÓGICO</b><span>bloque errático transportado por el hielo</span></div><div><b>RELATO LOCAL</b><span>leyenda vinculada al joven cazador</span></div></div></div>`}
  function d4VitsandCard(){return d4Card("VITSAND · HIELO + AGUA DE FUSIÓN",`<div class="history-timeline"><div><strong>HIELO</strong><span>mueve y deja materiales</span></div><div><strong>AGUA DE FUSIÓN</strong><span>transporta y ordena granos</span></div><div><strong>VITSAND</strong><span>arena clara junto al lago forestal</span></div></div><div class="evidence-grid two"><div><b>AGUA OSCURA</b><span>sustancias húmicas del suelo y la vegetación</span></div><div><b>ARENA CLARA</b><span>sedimentos seleccionados por el agua</span></div></div>`,"Nunca se deduce si un lago es seguro solo por su color.")}
  function d4StorsjonMap(){return d4Card("SUECIA · DOS LAGOS, DOS HISTORIAS",annotatedMap([10,23,57,64],[["Tiveden / Stora Trehörningen",14.6,58.8],["Storsjön · Jämtland",14.65,63.18],["Östersund",14.64,63.18],["Vättern",14.5,58.8]],[],"Mapa de Stora Trehörningen y Storsjön"),"Storsjöodjuret pertenece a los relatos de Storsjön, junto a Östersund; no es una especie confirmada ni el monstruo de Vitsand.")}
  function d4ForestCard(){return d4Card("UN ÁRBOL PUEDE GUARDAR UN INCENDIO",`<div class="fire-ring-diagram"><div class="tree-rings" aria-hidden="true"><i></i><span>anillos posteriores</span><b>cicatriz de fuego</b></div><div class="fire-ring-copy"><div><strong>ANTES</strong><span>El pino crece y deja un anillo por año.</span></div><div><strong>FUEGO</strong><span>El calor daña una parte del tronco: queda una cicatriz.</span></div><div><strong>DESPUÉS</strong><span>Si sobrevive, nuevos anillos cubren y fechan la herida.</span></div><div><strong>SUELO</strong><span>El carbón conservado completa la lectura.</span></div></div></div>`,"En Tiveden se han registrado al menos 86 incendios entre 1371 y 1853. Anillos, cicatrices y carbón permiten reconstruir esa historia.")}
  function d4FireCard(){return d4Card("MADERA → CARBÓN VEGETAL → HIERRO",`<div class="history-timeline"><div><strong>madera y carbonera</strong><span>calor con poco oxígeno</span></div><div><strong>carbón vegetal</strong><span>combustible concentrado</span></div><div><strong>metalurgia</strong><span>una conexión con el hierro de Bergslagen</span></div></div>`,"En el parque se han identificado más de doscientos restos de carboneras.")}
  function d4TrollCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}trolls-tiveden-recreacion-v1.png" alt="Ilustración contemporánea de un relato de trolls en un bosque"><figcaption>Ilustración contemporánea de una leyenda · no es una prueba histórica</figcaption></figure><div class="evidence-grid two"><div><b>STIGMANSPASSET</b><span>garganta natural y relato de salteadores</span></div><div><b>TROLLKYRKA</b><span>dos cumbres visibles desde Vättern</span></div></div></div>`}
  function d4SwedishCard(){return d4Card("SUECO PRÁCTICO",`<div class="evidence-grid two"><div><b>skog</b><span>bosque</span></div><div><b>sjö</b><span>lago</span></div><div><b>troll</b><span>troll</span></div><div><b>berättelse</b><span>relato / historia contada</span></div></div>`,"Una tarjeta para reconocer palabras, no una prueba de pronunciación.")}
  function d4AnimalsCard(){const animals=[['Alce.jpg','ALCE','huella grande de pezuña hendida'],['corzo.jpg','CORZO','huella de pezuña hendida más pequeña'],['urogallo.jpeg','UROGALLO','ave ligada a bosques; una pluma no basta para identificarla'],['lince euroasiatico.jpg','LINCE EUROASIÁTICO','vive en Suecia, pero es muy esquivo']];return d4Card("GUÍA DE PISTAS · NO PROMESA DE AVISTAMIENTO",`<div class="animal-cards">${animals.map(x=>`<figure><div><b>${x[1]}</b><span>${x[2]}</span></div><img src="${imgBase+x[0]}" alt="${x[1]}"></figure>`).join("")}</div>`,"Observar es dejar distancia: no se sale del sendero ni se sigue a un animal.")}
  function d4LynxCard(){const lynx=[['lince euroasiatico.jpg','LINCE EUROASIÁTICO','especie presente en Suecia y gran parte de Eurasia'],['Lince_ibérico.jpg','LINCE IBÉRICO','especie distinta, propia de la península ibérica']];return d4Card("DOS LINCES · DOS ESPECIES",`<div class="animal-cards lynx-cards">${lynx.map(x=>`<figure><div><b>${x[1]}</b><span>${x[2]}</span></div><img src="${imgBase+x[0]}" alt="${x[1]}"></figure>`).join("")}</div>`,"Un nombre parecido no significa mismo mapa, hábitat o situación de conservación.")}
  function d4FagertarnCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}fagertarn-red-water-lilies-public-domain.jpg" alt="Nenúfares rojos y blancos de Fagertärn"><figcaption>Fagertärn · nenúfares rojos y blancos · Erik Åman · dominio público</figcaption></figure><div class="evidence-grid two"><div><b>VARIACIÓN NATURAL</b><span>color rojo por una variación genética</span></div><div><b>FUERA DEL PARQUE</b><span>Fagertärn es una señal natural de la región</span></div></div></div>`}
  function d5Card(kicker,body,caption){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}${caption?`<p class="map-caption">${caption}</p>`:""}</div>`}
  function d5RouteMap(){return d5Card("TIVEDEN → KARLSBORG → HJO → HÖKERUM",annotatedMap([12.5,16,57.45,59.5],[["Vänern",13.2,58.92,-34,-10],["Vättern",14.53,58.73,12,-8],["Tiveden",14.65,58.75,10,20],["Karlsborg",14.52,58.54,12,-12],["Hjo",14.29,58.30,-26,20],["Hökerum",13.28,57.88,-30,17]],[[14.65,58.75,14.52,58.54,"",""],[14.52,58.54,14.29,58.30,"","danger"],[14.29,58.30,13.28,57.88,"",""]],"Mapa de orientación de la jornada desde Tiveden a Hökerum"),"Una idea por mapa: Tiveden queda entre los dos lagos; Karlsborg y Hjo se encuentran junto a Vättern; Hökerum abre la pista hacia el interior.")}
  function d5LakesCard(){return d5Card("SITÚA LOS LAGOS Y LAS CIUDADES",annotatedMap([12.2,19,57.85,60.05],[["Vänern",13.2,58.9,-35,-8],["Vättern",14.5,58.4,10,17],["Hjälmaren",15.9,59.25,10,-9],["Mälaren",17.3,59.35,10,18],["Tiveden",14.65,58.75,10,-10],["Örebro",15.21,59.27,-26,-15],["Estocolmo",18.07,59.33,-53,-12]],[],"Mapa de los cuatro lagos y lugares de referencia"),"Toca una etiqueta y su explicación quedará fijada al acertar.")}
  function d5FinlandMap(){return d5Card("1809 · UNA FRONTERA QUE CAMBIA",annotatedMap([12,34,54,71],[["Suecia antes de 1809",17.3,62],["Finlandia · entonces parte del reino",25.5,64],["Åland",19.9,60.2],["Rusia",32,62]],[[32,62,25.5,64,"invasión rusa · 1808","danger"]],"Mapa orientativo de Suecia, Finlandia, Åland y Rusia en torno a 1809"),"Tras el tratado de Fredrikshamn, Finlandia y Åland pasaron al Imperio ruso. No se muestran fronteras actuales como si existieran entonces.")}
  function d5FinlandComic(){
    const panels=[
      ["comic-finlandia-01-tilsit.jpg","1807: Napoleón y Alejandro I pactan en Tilsit."],
      ["comic-finlandia-02-mensaje.jpg","Alejandro I exige a Gustavo IV Adolfo que corte el comercio con Gran Bretaña."],
      ["comic-finlandia-03-finlandia-sueca.jpg","En 1808 Finlandia formaba parte del reino de Suecia."],
      ["comic-finlandia-04-invasion.jpg","Febrero de 1808: Rusia invade Finlandia."],
      ["comic-finlandia-05-sveaborg.jpg","La falta de refuerzos y suministros da ventaja a Rusia."],
      ["comic-finlandia-06-tratado.jpg","1809: el tratado cambia el mapa de Finlandia y Åland."]
    ];
    return d5Card("CÓMIC · LA GUERRA DE FINLANDIA",`<div class="d5-comic" role="group" aria-label="Cómic de seis viñetas sobre la Guerra de Finlandia">${panels.map(([file,alt],i)=>`<figure><img src="${imgBase}${file}" alt="${esc(alt)}" ${i>0?"loading=\"lazy\"":""}><figcaption>VIÑETA ${i+1} DE 6</figcaption></figure>`).join("")}</div>`,"Los bocadillos son una reconstrucción didáctica: resumen decisiones y hechos reales, no citas literales.");
  }
  function d5BernadotteCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}bernadotte-public-domain.jpg" alt="Retrato de Jean Baptiste Bernadotte"><figcaption>Jean Baptiste Bernadotte · retrato histórico · heredero en 1810</figcaption></figure>${d5Card("EUROPA NAPOLEÓNICA · DOS EXTREMOS",annotatedMap([-10,32,36,66],[['España · 1808',-3.7,40.4],['Finlandia · 1808',25.5,64],['Suecia · 1810',17.5,59.3],['Noruega · 1814',10.5,61],['Francia',2.3,46.5],['Rusia',31,59]],[],'Mapa orientativo de España, Francia, Suecia, Noruega, Finlandia y Rusia'),"La misma Europa napoleónica produjo respuestas distintas.")}<div class="history-timeline"><div><strong>1807</strong><span>Tilsit · alianza Francia–Rusia</span></div><div><strong>1809</strong><span>Finlandia se pierde y Gustavo IV Adolfo es depuesto</span></div><div><strong>1810</strong><span>Örebro elige a Bernadotte como heredero</span></div><div><strong>1812</strong><span>Suecia se acerca a Rusia contra Napoleón</span></div><div><strong>1819</strong><span>comienza Karlsborg</span></div></div></div>`}
  function d5GotaMap(){return d5Card("SISTEMA GÖTA · DE COSTA A COSTA",`${annotatedMap([10.5,19,57.4,59.35],[["Gotemburgo",11.97,57.71,-33,-10],["Trollhättan",12.29,58.28,10,-11],["Vänern",13.2,58.92,-30,-11],["Sjötorp",13.98,58.84,10,17],["Vättern",14.7,58.52,10,17],["Motala",15.04,58.54,10,-10],["Roxen",15.6,58.48,10,18],["Söderköping",16.32,58.48,-38,-11],["Mem",16.4,58.48,9,18],["Báltico",18.2,58.48,10,-10]],[[11.97,57.71,12.29,58.28,"Göta älv + esclusas",""],[12.29,58.28,13.2,58.92,"","danger"],[13.98,58.84,14.7,58.52,"canal + Vättern",""],[14.7,58.52,16.4,58.48,"canal + lagos + ríos",""],[16.4,58.48,18.2,58.48,"salida al mar",""]],"Mapa costa a costa del sistema Göta")}<div class="gota-key"><span><b>OESTE</b> Gotemburgo · Göta älv · Vänern.</span><span><b>ESTE</b> Göta Canal · Vättern · Mem · Báltico.</span></div>`,"La ruta combina río, lagos, canal y esclusas; no es una única zanja excavada de punta a punta.")}
  function d5GotaExploreMap(q,scope){
    const opened=prog(scope).opened||[],b=[10.4,18.2,57.25,59.35],m=baseMap(b,"Mapa interactivo del sistema Göta, desde Gotemburgo hasta Mem y el Báltico");let s=m.svg;
    const stops=[["1","Gotemburgo",11.97,57.71,-31,18],["2","Göta älv · Trollhättan",12.29,58.28,-38,-12],["3","Vänern · Sjötorp",13.6,58.88,-34,-14],["4","Vättern · Motala",14.9,58.54,10,18],["5","Canal · Roxen",15.9,58.48,10,-13],["6","Mem · Báltico",16.42,58.48,12,20]];
    const route=stops.map(x=>[x[2],x[3]]);for(let i=0;i<route.length-1;i++){const a=project(...route[i],b,m.W,m.H),z=project(...route[i+1],b,m.W,m.H);s+=`<path class="route-line ${opened.includes(i)&&opened.includes(i+1)?"opened-route":""}" d="M${a[0]},${a[1]} Q${(a[0]+z[0])/2},${(a[1]+z[1])/2-13} ${z[0]},${z[1]}"/>`}
    stops.forEach((x,i)=>{const p=project(x[2],x[3],b,m.W,m.H),active=opened.includes(i);s+=`<g class="map-explore-pin ${active?"opened":""}" data-explore="${i}" role="button" tabindex="0" aria-label="Abrir etapa ${x[0]}: ${x[1]}"><circle cx="${p[0]}" cy="${p[1]}" r="12"/><text x="${p[0]}" y="${p[1]+5}" text-anchor="middle">${x[0]}</text><text class="map-label" x="${p[0]+x[4]}" y="${p[1]+x[5]}">${x[1]}</text></g>`});
    const active=opened.length?opened[opened.length-1]:null,detail=active==null?`<p class="map-explore-detail"><strong>Toca cualquier número.</strong> Cada uno abre una explicación; aquí no hay que adivinar nada.</p>`:`<p class="map-explore-detail"><strong>${active+1}. ${esc(q.items[active][0])}.</strong> ${esc(q.items[active][1])}</p>`;
    return d5Card("SISTEMA GÖTA · SEIS ETAPAS DE COSTA A COSTA",`<div class="geo-map interactive-geo-map">${s}</svg></div><p class="map-caption">Toca un número para abrir el comentario de esa etapa. El punto se ilumina al leerlo.</p>${detail}<p class="placement-progress">Etapas leídas: ${opened.length} de ${q.items.length}</p>`)
  }
  function d5LockCard(){return d5Card("CÓMO UNA ESCLUSA SUBE UN BARCO",`<figure class="lock-sequence" role="img" aria-label="Tres pasos de una esclusa: el barco entra desde el agua baja, se cierran las compuertas y se llena la cámara, y cuando el agua queda al nivel alto se abre la compuerta de salida"><svg class="lock-sequence-svg" viewBox="0 0 420 285"><defs><marker id="lock-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z"/></marker></defs><g class="lock-step" transform="translate(8 0)"><text x="61" y="18">1 · ENTRAR</text><rect x="0" y="28" width="122" height="182" rx="12"/><path class="lock-wall" d="M8 72V190H114V72"/><path class="lock-water low" d="M8 151H114V190H8Z"/><path class="lock-water high" d="M82 92H114V151H82Z"/><path class="lock-gate closed" d="M35 104V190"/><path class="lock-gate closed" d="M82 104V190"/><path class="lock-boat" d="M42 146h34l-6 12H49Z"/><path class="lock-mast" d="M59 126v20"/><text class="lock-small" x="11" y="139">nivel bajo</text><text class="lock-small" x="86" y="81">alto</text><text class="lock-note" x="61" y="229">El barco entra.</text><text class="lock-note" x="61" y="245">Se cierran las dos puertas.</text></g><path class="lock-next" d="M137 116h19" marker-end="url(#lock-arrow)"/><g class="lock-step" transform="translate(150 0)"><text x="61" y="18">2 · NIVELAR</text><rect x="0" y="28" width="122" height="182" rx="12"/><path class="lock-wall" d="M8 72V190H114V72"/><path class="lock-water low" d="M8 151H35V190H8Z"/><path class="lock-water high" d="M82 92H114V190H82Z"/><path class="lock-water rising" d="M35 112H82V190H35Z"/><path class="lock-gate closed" d="M35 104V190"/><path class="lock-gate closed" d="M82 104V190"/><path class="lock-boat raised" d="M42 107h34l-6 12H49Z"/><path class="lock-mast raised" d="M59 87v20"/><path class="lock-rise-arrow" d="M59 145V120" marker-end="url(#lock-arrow)"/><text class="lock-small" x="10" y="139">bajo</text><text class="lock-small" x="86" y="81">alto</text><text class="lock-note" x="61" y="229">Con las puertas cerradas,</text><text class="lock-note" x="61" y="245">entra agua y el barco sube.</text></g><path class="lock-next" d="M279 116h19" marker-end="url(#lock-arrow)"/><g class="lock-step" transform="translate(292 0)"><text x="61" y="18">3 · SALIR</text><rect x="0" y="28" width="122" height="182" rx="12"/><path class="lock-wall" d="M8 72V190H114V72"/><path class="lock-water high" d="M8 92H114V190H8Z"/><path class="lock-gate closed" d="M35 104V190"/><path class="lock-gate open" d="M82 106l16 18"/><path class="lock-boat raised" d="M82 107h34l-6 12H89Z"/><path class="lock-mast raised" d="M99 87v20"/><text class="lock-small" x="11" y="81">nivel alto</text><text class="lock-note" x="61" y="229">El nivel ya es igual.</text><text class="lock-note" x="61" y="245">Se abre la puerta alta.</text></g><text class="lock-bottom" x="210" y="275" text-anchor="middle">La cámara cambia de nivel; el barco no tiene que subir una pendiente.</text></svg></figure>`,"Una esclusa aísla una cámara entre dos niveles. Al llenar o vaciar esa cámara con las compuertas cerradas, el barco sube o baja hasta igualarse con el siguiente tramo.")}
  function d5WorkersCard(){return d5Card("UNA OBRA DE MILES DE MANOS",`<div class="evidence-grid three"><div><b>58.000 SOLDADOS</b><span>asignados por 16 regimientos según el canal</span></div><div><b>OFICIOS</b><span>técnicos, canteros, carpinteros, herreros y transportistas</span></div><div><b>MEMORIA</b><span>una gran obra nunca surge sola</span></div></div>`,"Karlsborg y el Göta Canal no son el mismo caso histórico, pero ambos obligan a mirar las personas tras el plano.")}
  function d5KarlsborgCard(){return d5Card("KARLSBORG · CAPITAL DE RESERVA",`<div class="history-timeline"><div><strong>SLUTVÄRNET · 678 m</strong><span>barrera defensiva, no una residencia pequeña</span></div><div><strong>IGLESIA DE GUARNICIÓN</strong><span>prevista para acoger al Riksdag</span></div><div><strong>ESTADO</strong><span>documentos, reservas, defensas y abastecimiento</span></div></div>`,"El plan no consistía en trasladar a toda la población, sino en conservar funciones esenciales en una crisis.")}
  function d5TimelineCard(){return d5Card("KARLSBORG · 90 AÑOS",`<div class="history-timeline"><div><strong>1819</strong><span>comienza la obra</span></div><div><strong>durante décadas</strong><span>cambian artillería, transportes y comunicaciones</span></div><div><strong>1909</strong><span>finaliza, con la estrategia ya transformada</span></div></div><div class="evidence-grid two"><div><b>EL ESCORIAL</b><span>1563–1584 · gran obra en 21 años</span></div><div><b>SAGRADA FAMILIA</b><span>comenzó en 1882 y continúa</span></div></div>`,"Una obra cambia de sentido mientras la construyen generaciones distintas.")}
  function d5WaterCard(){return d5Card("DOS LAGOS · DOS COLORES",`<div class="evidence-grid two"><div><b>TIVEDEN</b><span>agua forestal color té por sustancias húmicas</span></div><div><b>VÄTTERN</b><span>gran lago abierto, profundo y en general más claro</span></div><div><b>128 m</b><span>profundidad máxima aproximada de Vättern</span></div><div><b>~40 m</b><span>profundidad media aproximada</span></div></div>`,"El color del agua no basta para llamarla «limpia» o «sucia».")}
  function d5LakeLifeCard(){const fish=[['lucio.jpg','LUCIO','cazador de orillas y vegetación'],['perca.jpg','PERCA','zonas litorales y aguas intermedias'],['salmon de lago.jpg','SALMÓN DE LAGO','agua abierta'],['salvelino artico.jpg','SALVELINO ÁRTICO','agua profunda, fría y bien oxigenada']];return d5Card("UN LAGO TIENE «PISOS»",`<div class="fish-cards">${fish.map(x=>`<figure><div><b>${x[1]}</b><span>${x[2]}</span></div><img src="${imgBase+x[0]}" alt="${x[1]}"></figure>`).join("")}</div>`,"Cada ficha conserva junta la idea y la imagen. Observar no exige buscar ni molestar animales.")}
  function d5HjoMap(){return d5Card("HJO · UNA ORILLA CON CINCO FUNCIONES",`<div class="hjo-map" role="img" aria-label="Esquema de Hjo con el lago Vättern, puerto, río Hjoån, plaza y parque"><div class="hjo-land"><b>PLAZA</b><b>HJOÅN</b><b>STADSPARKEN</b><b>PUERTO</b></div><div class="hjo-water"><strong>VÄTTERN</strong><span>lago, llegada y horizonte</span></div></div><div class="hjo-key"><span><b>PUERTO</b> llegadas y mercancías</span><span><b>HJOÅN</b> agua que atraviesa la ciudad</span><span><b>PLAZA</b> encuentro y comercio</span><span><b>STADSPARKEN</b> paseo y etapa balnearia</span></div>`,"Esquema de orientación, no plano a escala: separa las funciones para que se puedan leer sin etiquetas amontonadas.")}
  function d5TrafikCard(){return d5Card("S/S TRAFIK · VÄTTERN",`<div class="history-timeline"><div><strong>1892</strong><span>el vapor entra en servicio</span></div><div><strong>VÄTTERN</strong><span>puertos, personas y mercancías conectadas por el lago</span></div><div><strong>HJO</strong><span>una ciudad cuya orilla también fue llegada y salida</span></div></div>`,"El barco abre la pantalla de Hjo; la siguiente pertenece por completo a Estrid Ericson.")}
  function d5CultureCard(){return d5Card("ESTRID ERICSON · DE HJO AL DISEÑO SUECO",`<figure class="estrid-photo"><img src="${imgBase}Estrid-Erikson.jpg" alt="Retrato de Estrid Ericson"><figcaption>Estrid Ericson · imagen incorporada al cuaderno de la ruta</figcaption></figure><div class="estrid-timeline"><div><strong>1894 · ÖREGRUND</strong><span>Nace en Öregrund y crece en Hjo, junto a Vättern y el hotel de su familia.</span></div><div><strong>1915–1918 · ESTOCOLMO</strong><span>Se forma como profesora de dibujo en Tekniska skolan, hoy Konstfack.</span></div><div><strong>1924 · SVENSKT TENN</strong><span>Funda en Estocolmo la firma con el artesano del peltre Nils Fougstedt.</span></div><div><strong>1934 · JOSEF FRANK</strong><span>Su colaboración une empresa, muebles, textiles y una forma más cálida de entender el hogar.</span></div></div>`,"Hjo no es una anécdota: su infancia, el hotel familiar y la ciudad junto a Vättern forman parte del comienzo de su historia.")}
  function d5SwedishCard(){return d5Card("SUECO ÚTIL",`<div class="quote-card"><strong>Jag skulle vilja ha en glass, tack.</strong><span>Me gustaría un helado, por favor.</span></div>`,"Una frase para usar, no para aprobar un examen de pronunciación.")}
  function d6Card(kicker,body,caption){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}${caption?`<p class="map-caption">${caption}</p>`:""}</div>`}
  function d6WestMap(){return d6Card("VÄNERN → GÖTA ÄLV → KATTEGAT",annotatedMap([10.3,14.5,57.35,59.45],[["Vänern",13.2,58.9,10,-10],["Trollhättan",12.29,58.28,10,-12],["Göta älv",12.1,57.95,10,16],["Gotemburgo",11.97,57.71,10,-10],["Kattegat",10.85,57.55,-26,17]],[[13.2,58.9,12.29,58.28,"",""],[12.29,58.28,11.97,57.71,"","danger"],[11.97,57.71,10.85,57.55,"",""]],"Mapa del río Göta älv desde Vänern hasta el Kattegat"),"El primer mapa solo explica la ruta del agua: interior → río → Gotemburgo → Kattegat.")}
  function d6CoastMap(){return d6Card("COSTA OCCIDENTAL · HACIA 1621",annotatedMap([8.5,15,56.2,59.8],[["Bohuslän · Noruega bajo el rey danés",11.2,58.7,-66,-10],["Halland · Dinamarca",12.4,56.85,10,17],["franja sueca",12.05,57.75,10,-10],["Gotemburgo",11.97,57.71,10,18],["Kattegat",10.25,57.35,-18,14],["Skagerrak",9.55,58.65,10,-10],["hacia mar del Norte",8.9,58.2,10,18]],[],"Mapa histórico de la costa occidental sueca hacia 1621"),"Segundo mapa: muestra por qué la salida sueca era estrecha. Kattegat conecta al norte con Skagerrak y después con el mar del Norte y el Atlántico.")}
  function d6FoundingCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}gustav-ii-adolf-staty-goteborg.jpg" alt="Estatua de Gustavo II Adolfo en Gotemburgo"><figcaption>Estatua posterior de Gustavo II Adolfo · el gesto es tradición local; la fundación de 1621 está documentada</figcaption></figure><div class="evidence-grid two"><div><b>1621</b><span>privilegios urbanos otorgados por la Corona</span></div><div><b>NYA LÖDÖSE</b><span>antecedentes, población y actividades previas</span></div><div><b>AGUA</b><span>canales, drenaje y fortificaciones</span></div><div><b>OFICIOS</b><span>población local y especialistas de otras redes</span></div></div></div>`}
  function d6VasaCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}gustav-ii-adolf-public-domain.jpg" alt="Retrato de Gustavo II Adolfo"><figcaption>Gustavo II Adolfo · nieto de Gustav Vasa · retrato histórico</figcaption></figure><div class="history-timeline"><div><strong>1523</strong><span>Gustav Vasa es elegido rey</span></div><div><strong>1621</strong><span>su nieto funda Gotemburgo</span></div></div></div>`}
  function d6DrainCard(){return d6Card("CUANDO LLUEVE · SALIDA Y PROTECCIÓN",`<figure class="drain-system" role="img" aria-label="Esquema del drenaje de Gotemburgo. La lluvia cae sobre casas y calles, baja a una zanja y a un canal, y sale al río. Una compuerta se abre hacia fuera cuando el nivel exterior es bajo y se cierra cuando sube para impedir el retorno del agua a la ciudad."><svg viewBox="0 0 440 330" class="drain-system-svg" aria-hidden="true"><defs><marker id="drainArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#08749a"/></marker><marker id="drainRedArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#b8424f"/></marker></defs><rect x="1" y="1" width="438" height="328" rx="22" fill="#dff1f5" stroke="#9bcdda" stroke-width="2"/><text x="22" y="29" class="drain-svg-title">1 · LA LLUVIA ENCUENTRA UN CAMINO</text><g class="drain-rain"><path d="M50 44v24M75 44v24M100 44v24M125 44v24M150 44v24"/></g><path d="M26 109H217L236 127H284V109H414V181H26Z" class="drain-ground"/><path d="M46 109V82l30-22 30 22v27M124 109V72l27-20 29 20v37" class="drain-house"/><path d="M55 109H101M132 109H171" class="drain-roof"/><path d="M37 123H214" class="drain-street"/><path d="M96 125v37h93" class="drain-pipe"/><path d="M190 162c33 0 31 38 63 38h104" class="drain-canal"/><path d="M102 118v34" class="drain-flow-arrow" marker-end="url(#drainArrow)"/><path d="M202 162h35" class="drain-flow-arrow" marker-end="url(#drainArrow)"/><path d="M264 200h71" class="drain-flow-arrow" marker-end="url(#drainArrow)"/><text x="43" y="147" class="drain-svg-label">calle</text><text x="110" y="158" class="drain-svg-label">zanja / conducto</text><text x="242" y="191" class="drain-svg-label">canal</text><text x="352" y="192" class="drain-svg-label">río</text><path d="M360 164v63" class="drain-gate"/><path d="M367 174l23 16" class="drain-gate-open"/><text x="321" y="245" class="drain-svg-small">compuerta hacia fuera</text><rect x="18" y="260" width="194" height="53" rx="12" class="drain-panel-good"/><text x="31" y="281" class="drain-svg-panel-title">2 · NIVEL EXTERIOR BAJO</text><path d="M39 298h94" class="drain-flow-arrow" marker-end="url(#drainArrow)"/><path d="M143 286v22" class="drain-gate-mini"/><path d="M149 289l12 9" class="drain-gate-open"/><text x="166" y="302" class="drain-svg-small">sale por gravedad</text><rect x="228" y="260" width="194" height="53" rx="12" class="drain-panel-stop"/><text x="241" y="281" class="drain-svg-panel-title">3 · RÍO O MAR ALTO</text><path d="M396 298h-91" class="drain-red-arrow" marker-end="url(#drainRedArrow)"/><path d="M294 286v22" class="drain-gate-mini"/><path d="M288 287l13 20" class="drain-gate-closed"/><text x="316" y="302" class="drain-svg-small">se cierra: no vuelve</text></svg><figcaption><strong>La salida no está siempre abierta:</strong> cuando el río o el mar están altos, la compuerta bloquea el retorno. El agua queda momentáneamente en la zanja o el canal y sale cuando el nivel exterior baja.</figcaption></figure><div class="drain-steps"><div><b>01</b><span>Tejados y calles recogen la lluvia.</span></div><div><b>02</b><span>Zanjas y canales la llevan hacia el río.</span></div><div><b>03</b><span>La compuerta deja salir, pero no entrar.</span></div></div><p class="drain-history"><strong>En la Gotemburgo de 1621:</strong> pendiente, zanjas, canales, compuertas y limpieza eran la defensa principal. Las grandes redes cerradas y las bombas son posteriores.</p>`,"Sigue las flechas: primero se protege la ciudad; cuando el nivel exterior lo permite, el agua continúa su camino al río y al mar.")}
  function d6AmsterdamCard(){return `<div class="visual-evidence"><div class="evidence-grid two"><figure class="vasa-photo"><img src="${imgBase}amsterdam-canals-cc0.jpg" alt="Canal de Ámsterdam"><figcaption>Ámsterdam · primera mención: 1275</figcaption></figure><figure class="vasa-photo"><img src="${imgBase}goteborg-vallgraven-cc-by-sa.jpg" alt="Canal Vallgraven de Gotemburgo"><figcaption>Gotemburgo · privilegios urbanos: 1621 · foto CC BY-SA</figcaption></figure></div><p class="map-caption">Problema parecido, ciudades distintas: agua, drenaje y mantenimiento no convierten una ciudad en copia de otra.</p></div>`}
  function d6ShieldCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}goteborg-vapen.svg" alt="Escudo de Gotemburgo"><figcaption>Escudo de Gotemburgo · el león mira hacia la derecha de quien observa por una ambigüedad histórica de orientación</figcaption></figure></div>`}
  function d6WarMap(){return d6Card("EUROPA · 1618–1648",annotatedMap([-11,35,43,64],[["Bohemia",14.5,50.1],["Sacro Imperio",10.5,50],["España",-3.5,40],["Francia",2.3,46.5],["Dinamarca",10,56],["Suecia",17.5,61],["Báltico",19,56]],[[17.5,61,14.5,50.1,"Suecia entra · 1630","danger"],[2.3,46.5,10.5,50,"Francia limita a los Habsburgo",""]],"Mapa de contexto de la Guerra de los Treinta Años"),"No fue una sola guerra simple de católicos contra protestantes: religión, autonomías, dinastías, rutas y poder se mezclaron.")}
  function d6NordlingenMap(){return d6WarMap()}
  function d6SolutionsCard(){return `<div class="visual-evidence"><div class="evidence-grid three"><div><b>LANDSHÖVDINGEHUS</b><span>piedra o ladrillo abajo; madera en dos pisos superiores</span></div><div><b>SKANSEN KRONAN</b><span>fortaleza de colina; 23 cañones que nunca dispararon en combate</span></div><div><b>FESKEKÖRKA</b><span>lonja de pescado · 1874</span></div></div><figure class="vasa-photo"><img src="${imgBase}skansen-kronan-public-domain.jpg" alt="Skansen Kronan en Gotemburgo"><figcaption>Skansen Kronan · defensa que también podía disuadir sin disparar</figcaption></figure></div>`}
  function d6FeskCard(){return `<div class="visual-evidence"><figure class="vasa-photo"><img src="${imgBase}feskekorka-public-domain.jpg" alt="Feskekörka de Gotemburgo"><figcaption>Feskekörka · lonja de pescado inaugurada en 1874</figcaption></figure><div class="evidence-grid two"><div><b>FESK</b><span>pescado · habla local</span></div><div><b>KÖRKA</b><span>iglesia · habla local</span></div><div><b>FISK</b><span>pescado · sueco estándar</span></div><div><b>KYRKA</b><span>iglesia · sueco estándar</span></div></div></div>`}
  function d6TeaWorldMap(){const bounds=[-180,180,-60,85],W=420,H=260,countries=window.GRIPSHOLM_WORLD_FULL_COUNTRIES||window.GRIPSHOLM_WORLD_COUNTRIES||window.GRIPSHOLM_MAP_DATA?.countries||[],pt=(lon,lat)=>project(lon,lat,bounds,W,H),p=(lon,lat)=>pt(lon,lat).map(n=>n.toFixed(1)).join(","),stops=[["1",11.97,57.71,"Gotemburgo",8,-9],["2",18.48,-34.36,"Cabo de Buena Esperanza",8,17],["3",105.85,-5.95,"estrecho de Sonda",8,17],["4",113.26,23.13,"Cantón",-7,-9]],route=[[11.97,57.71],[1,54],[-12,42],[-15,12],[1,-12],[18.48,-34.36],[48,-25],[76,-13],[105.85,-5.95],[113.26,23.13]].map((x,i)=>`${i?"L":"M"}${p(x[0],x[1])}`).join(" "),land=countries.map(f=>`<path class="country" d="${geomPath(f.geometry,bounds,W,H)}"/>`).join(""),labels=[["AMÉRICA DEL NORTE",-104,45],["AMÉRICA DEL SUR",-61,-20],["EUROPA",18,65],["ÁFRICA",21,5],["ASIA",82,42],["OCEANÍA",137,-28]].map(x=>{const q=pt(x[1],x[2]);return `<text class="world-continent" x="${q[0]}" y="${q[1]}">${x[0]}</text>`}).join("");return d6Card("MAPA MUNDIAL · GOTEMBURGO → CANTÓN",`<div class="world-route-geo"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa mundial con países y continentes reconocibles. La ruta marítima va de Gotemburgo por el Atlántico, el cabo de Buena Esperanza, el océano Índico y el estrecho de Sonda hasta Cantón."><rect width="${W}" height="${H}" class="map-water"/>${land}${labels}<path class="world-route-segment" d="${route}"/>${stops.map(x=>{const q=pt(x[1],x[2]);return `<circle class="world-route-stop" cx="${q[0]}" cy="${q[1]}" r="10"/><text class="world-route-number" x="${q[0]}" y="${q[1]+3.5}" text-anchor="middle">${x[0]}</text><text class="world-route-label" x="${q[0]+x[4]}" y="${q[1]+x[5]}" text-anchor="${x[4]<0?"end":"start"}">${x[3]}</text>`}).join("")}</svg></div><div class="route-legend"><span><b>1</b> Gotemburgo · salida al Atlántico</span><span><b>2</b> Cabo de Buena Esperanza · giro al Índico</span><span><b>3</b> Estrecho de Sonda · paso al mar de Java</span><span><b>4</b> Cantón · llegada a China</span></div>`,"El mapa usa países y costas reales para que se entienda la escala. La línea sigue los pasos principales, pero un viaje real dependía de vientos, escalas y navegación.")}
  function d6TeaEuropeMap(){return d6Card("TÉ LEGAL Y TÉ CLANDESTINO",annotatedMap([-10,16,49,61],[["Gotemburgo",11.97,57.71],["Países Bajos",4.5,52.2],["Londres",-0.13,51.51],["Escocia",-4.2,56.5]],[[11.97,57.71,4.5,52.2,"venta legal",""],[4.5,52.2,-0.13,51.51,"contrabando","danger"]],"Red europea del té sueco"),"Los impuestos pueden alterar rutas, precios y el interés por introducir una mercancía ilegalmente.")}
  function d6LegacyCard(){return `<div class="visual-evidence"><div class="evidence-grid two"><figure class="vasa-photo"><img src="${imgBase}goteborg-botaniska-cc-by.jpg" alt="Jardín Botánico de Gotemburgo"><figcaption>Jardín Botánico · investigación, conservación, educación y paseo</figcaption></figure><div class="evidence-grid"><div><b>1923</b><span>tercer centenario de Gotemburgo</span></div><div><b>LISEBERG</b><span>ocio y encuentro; sus conejos verdes son ficción del parque</span></div><div><b>JARDÍN BOTÁNICO</b><span>ciencia y conservación, no solo decoración</span></div></div></div></div>`}
  function d6PortsCard(){const a=[['Róterdam',435.8],['Amberes-Brujas',277.7],['Valencia',80.7],['Gotemburgo',21.8]];return d6Card("PUERTOS · MILLONES DE TONELADAS · 2024",`<div class="port-bars">${a.map(x=>`<div><strong>${x[0]}</strong><i><b style="width:${x[1]/4.358}%"></b></i><span>${String(x[1]).replace('.',',')} millones t</span></div>`).join('')}</div>`,"Las barras usan la misma escala y hacen visible la diferencia de volumen. No miden belleza, turismo ni importancia histórica.")}
  function d6SwedishCard(){return d6Card("SUECO ÚTIL",`<div class="quote-card"><strong>Var ligger hamnen?</strong><span>¿Dónde está el puerto?</span></div><div class="evidence-grid three"><div><b>Var</b><span>dónde</span></div><div><b>ligger</b><span>está situado</span></div><div><b>hamnen</b><span>el puerto</span></div></div>`,"Hamnen ligger vid älven och havet. · El puerto está junto al río y el mar.")}
  function d7Card(kicker,body,caption){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}${caption?`<p class="map-caption">${caption}</p>`:""}</div>`}
  function d7RouteMap(){return d7Card("MAPA DE LA JORNADA · ULRICEHAMN → KOMOSSE",annotatedMap([12.85,14.45,57.15,58.25],[["Ulricehamn · Åsunden · Skottek",13.41,57.79,-8,-28],["Torpa Stenhus",13.25,57.64,-58,17],["Komosse",13.52,57.57,11,19],["Store Mosse",13.93,57.25,10,-9]],[[13.41,57.79,13.25,57.64,"",""],[13.25,57.64,13.52,57.57,"","danger"],[13.52,57.57,13.93,57.25,"siguiente día",""]],"Mapa geográfico simplificado de la jornada desde Ulricehamn a Komosse"),`<div class="route-map-key"><span><b>1 · Ulricehamn</b> Åsunden y Skottek están juntos junto al lago.</span><span><b>2 · Torpa</b> alternativa histórica.</span><span><b>3 · Komosse</b> turbera: se visita por accesos y pasarelas.</span></div>`,"El mapa sitúa los lugares. La línea no indica un atajo ni una ruta a pie: cada tramo exige una regla distinta.")}
  function d7LakeCard(){return d7Card("ÅR DET BLÅSIGT?",`<div class="evidence-grid three"><div><b>VIENTO</b><span>condiciones y consejo del proveedor</span></div><div><b>CHALECO</b><span>equipo e instrucciones</span></div><div><b>ALTERNATIVA</b><span>paseo, bici u otra actividad si no acompaña</span></div></div>`,"«¿Hace viento?» es una pregunta práctica antes de remar.")}
  function d7WinterCard(){return d7Card("INVIERNO · CONDICIONES VERIFICADAS",`<div class="evidence-grid two"><div><b>PATINAJE Y PESCA EN HIELO</b><span>solo con zonas, condiciones y personas responsables</span></div><div><b>1520</b><span>evidencia de un invierno excepcional, no un permiso actual</span></div></div>`,"Nunca se prueba el hielo porque «suele helarse» o por una foto histórica.")}
  function d7BattleMap(){return d7Card("19 DE ENERO DE 1520 · QUÉ EXPLICA EL MAPA",`<div class="battle-route"><div><b>DINAMARCA</b><span>fuerzas de Cristián II</span></div><i>→</i><div><b>ÅSUNDEN</b><span>batalla sobre el hielo</span></div><i>→</i><div><b>ESTOCOLMO</b><span>traslado de Sten Sture</span></div></div><p class="map-caption">No es un mapa de todos los movimientos de tropas. Sitúa el hecho decisivo y el traslado posterior que conecta Åsunden con la historia de Estocolmo.</p>`,"El hielo explica cómo pudo librarse aquella batalla en 1520; no describe las condiciones de un invierno actual.")}
  function d7ChainCard(){return d7Card("UNA CADENA ENTRE DOS DÍAS",`<div class="history-timeline"><div><strong>Åsunden · enero de 1520</strong><span>Sten Sture es herido</span></div><div><strong>semanas después</strong><span>muere durante el traslado hacia Estocolmo</span></div><div><strong>Estocolmo</strong><span>Kristina dirige la resistencia</span></div><div><strong>noviembre de 1520</strong><span>coronación y Baño de Sangre</span></div></div>`,"La historia de Karin del Día 1 comienza antes de Stortorget.")}
  function d7SkottekCard(){return d7Card("SKOTTEK · ORILLA Y MEMORIA",`<div class="evidence-grid two"><div><b>ÅSUNDEN</b><span>el lago donde se libró la batalla sobre hielo</span></div><div><b>SKOTTEK</b><span>orilla arbolada con monumento de memoria</span></div><div><b>LO QUE SABEMOS</b><span>Sten Sture fue herido durante la batalla</span></div><div><b>LO QUE NO SABEMOS</b><span>su posición exacta en el instante del impacto</span></div></div>`,"La memoria puede ser rigurosa sin inventar una escena completa.")}
  function d7AncientCard(){return d7Card("MARBÄCK · HACIA 7700 A. C.",`<div class="evidence-grid two"><div><b>BREDGÅRDSMANNEN</b><span>evidencia muy antigua de presencia humana local</span></div><div><b>RESTOS ÓSEOS</b><span>permiten estimar algunos datos y realizar una reconstrucción científica parcial</span></div></div>`,"Una reconstrucción no es fotografía ni nos permite inventar un nombre, carácter o biografía.")}
  function d7GotarMap(){
    const b=[9.5,24.8,54.4,69.8],m=baseMap(b,"Mapa geográfico de Suecia con Norrland, Svealand y Götaland; Västergötland señalado dentro de Götaland");
    const countries=window.GRIPSHOLM_WORLD_COUNTRIES||window.GRIPSHOLM_MAP_DATA?.countries||[];
    const sweden=countries.find(f=>/^(Sweden|Sverige)$/i.test(f.properties?.ADMIN||f.properties?.NAME||""));
    const swedenPath=sweden?geomPath(sweden.geometry,b,m.W,m.H):"";
    const y=lat=>project(0,lat,b,m.W,m.H)[1];
    let s=m.svg;
    if(swedenPath){
      s+=`<defs><clipPath id="d7-sweden-regions"><path d="${swedenPath}"/></clipPath></defs><g clip-path="url(#d7-sweden-regions)"><rect class="sweden-region norrland" x="0" y="0" width="420" height="${y(61.35)}"/><rect class="sweden-region svealand" x="0" y="${y(61.35)}" width="420" height="${y(58.75)-y(61.35)}"/><rect class="sweden-region gotaland" x="0" y="${y(58.75)}" width="420" height="${300-y(58.75)}"/></g><path class="sweden-outline" d="${swedenPath}"/>`;
    }
    [["NORRLAND",18.1,65.7,"region-label"],["SVEALAND",16.7,60.1,"region-label"],["GÖTALAND",14.8,56.9,"region-label"],["MAR BÁLTICO",22.5,60.5,"water-region-label"]].forEach(x=>{const p=project(x[1],x[2],b,m.W,m.H);s+=`<text class="${x[3]}" x="${p[0]}" y="${p[1]}">${x[0]}</text>`});
    const vg=project(13.45,58.18,b,m.W,m.H);s+=`<circle class="region-place" cx="${vg[0]}" cy="${vg[1]}" r="6"/><path class="region-leader" d="M${vg[0]+5},${vg[1]-4} L${vg[0]+57},${vg[1]-24}"/><text class="region-place-label" x="${vg[0]+61}" y="${vg[1]-27}">Västergötland</text><text class="region-place-sub" x="${vg[0]+61}" y="${vg[1]-14}">Ulricehamn · Torpa</text>`;
    return d7Card("SUECIA · TRES GRANDES REGIONES",`<div class="geo-map sweden-regions-geo">${s}</svg></div><div class="sweden-region-key"><span><i class="norrland"></i>Norrland</span><span><i class="svealand"></i>Svealand</span><span><i class="gotaland"></i>Götaland</span></div>`,"Mapa geográfico de orientación: las tres regiones históricas se muestran por zonas amplias, no como fronteras administrativas. Västergötland queda dentro de Götaland.")
  }
  function d7UlrikaCard(){return d7Card("BOGESUND → ULRICEHAMN · 1741",`<div class="history-timeline"><div><strong>1307</strong><span>Bogesund aparece mencionada por escrito</span></div><div><strong>1718–1720</strong><span>Ulrika Eleonora reina por derecho propio</span></div><div><strong>1741</strong><span>la ciudad recibe el nombre Ulricehamn</span></div></div>`,"Ulrika Eleonora aceptó una nueva forma de gobierno que dio mayor peso al Riksdag y después cedió la Corona a Federico I.")}
  function d7TorpaCard(){return d7Card("TORPA STENHUS · CASA, COMERCIO Y DEFENSA",`<div class="evidence-grid three"><div><b>CASA</b><span>vida de una familia señorial</span></div><div><b>COMERCIO</b><span>ganado y alimentos por valles cercanos</span></div><div><b>DEFENSA</b><span>edificio preparado para una época insegura</span></div></div>`,"Una alternativa histórica si las condiciones no acompañan en el lago.")}
  function d7FamilyCard(){return d7Card("GUSTAV VASA · FAMILIA Y SUCESIÓN",`<div class="vasa-tree"><div class="vasa-root"><b>GUSTAV VASA</b><span>rey desde 1523</span></div><div class="vasa-branches"><div><strong>1ª esposa</strong><b>Katarina de Sajonia-Lauenburgo</b><span>madre de Erik XIV</span></div><div><strong>2ª esposa</strong><b>Margareta Leijonhufvud</b><span>madre de Johan III y Karl IX</span></div><div><strong>3ª esposa</strong><b>Katarina Stenbock</b><span>reina 1552–1560 · sin hijos con Gustav</span></div></div><div class="vasa-successors"><span>ERIK XIV</span><span>JOHAN III</span><span>KARL IX → GUSTAVO II ADOLFO</span></div></div><div class="fact-note"><b>HECHOS COMPROBADOS</b><span>Katarina Stenbock, hija de los señores de Torpa, se casó con Gustav Vasa en 1552. Era sobrina de Margareta Leijonhufvud, la esposa anterior del rey; hubo oposición eclesiástica por ese parentesco. Quedó viuda en 1560 y murió en 1621, a los 86 años.</span></div><div class="legend-note"><b>LO QUE TORPA CUENTA COMO LEYENDA</b><span>La tradición local dice que la joven Katarina intentó esconderse en el jardín antes del matrimonio. Es una historia conservada por Torpa, no un hecho que podamos reconstruir con detalle.</span></div>`,"El árbol explica la sucesión: Karl IX fue padre de Gustavo II Adolfo, quien fundó Gotemburgo en 1621.")}
  function d7SkottekPhoto(){return `<figure class="visual-evidence skottek-photo"><img src="${imgBase}Skottek.jpg" alt="Orilla de Skottek junto al lago Åsunden"><figcaption><strong>SKOTTEK</strong><span>Orilla de memoria junto a Åsunden: el monumento recuerda a Sten Sture sin fingir conocer su posición exacta durante la batalla.</span></figcaption></figure>`}
  function d7PeatCard(){return d7Card("CÓMO CRECE UNA TURBERA",`<div class="history-timeline"><div><strong>PLANTAS + AGUA</strong><span>terreno muy húmedo</span></div><div><strong>POCO OXÍGENO</strong><span>descomposición incompleta</span></div><div><strong>TURBA</strong><span>restos vegetales acumulados</span></div><div><strong>TIEMPO</strong><span>la superficie puede crecer hacia arriba</span></div></div>`,"Komosse combina turberas, bosque húmedo, lagunas, arroyos e islas de suelo mineral.")}
  function d7PeatTypesCard(){return d7Card("TRES TIPOS DE TURBERA",`<div class="evidence-grid three"><div><b>BAJA</b><span>agua de terreno, arroyos o nivel freático</span></div><div><b>ELEVADA</b><span>centro alimentado sobre todo por lluvia; más ácido y pobre</span></div><div><b>DE COBERTURA</b><span>como una manta sobre lomas húmedas</span></div></div>`,"Elevada no quiere decir montaña. Komosse es un mosaico: una turbera elevada no es toda la respuesta.")}
  function d7PeatScaleCard(){return d7Card("OCHO METROS · MEDIO MILÍMETRO",`<div class="evidence-grid two"><div><b>3–4 m</b><span>profundidad habitual de turba en Komosse</span></div><div><b>hasta 8 m</b><span>en algunos puntos</span></div><div><b>~0,5 mm/año</b><span>media de crecimiento indicada por la reserva</span></div><div><b>MILES DE AÑOS</b><span>tiempo necesario para muchos metros</span></div></div>`,"Una capa reciente puede verse diferente, pero fecharla con precisión exige estudiar perfiles y métodos científicos, no mirarla por encima.")}
  function d7BoardwalkCard(){return d7Card("BJÖRNÖLEDEN · PASARELA",`<div class="evidence-grid three"><div><b>PERSONAS</b><span>evita zonas húmedas o inestables</span></div><div><b>VEGETACIÓN</b><span>reduce el pisoteo repetido</span></div><div><b>TURBA</b><span>protege un archivo de miles de años</span></div></div>`,"La ronda tiene algo más de 4 km y discurre en gran parte por pasarelas: confirmar estado y duración antes de salir.")}
  function d7SwedishCard(){return d7Card("SUECO ÚTIL",`<div class="quote-card"><strong>Håll dig på spången</strong><span>Quédate en la pasarela.</span></div><div class="evidence-grid two"><div><b>mosse</b><span>turbera / pantano de turba</span></div><div><b>sjö</b><span>lago</span></div></div>`,"Una frase de ayuda para el sendero, no una prueba de pronunciación.")}
  function d7BirdsCard(){return `<div class="visual-evidence bird-gallery"><figure><img src="${imgBase}grulla.jpg" alt="Grulla en un humedal"><figcaption><strong>GRULLA</strong><span>Ave de patas largas ligada a humedales.</span></figcaption></figure><figure><img src="${imgBase}chorlito.jpg" alt="Chorlito dorado europeo en una turbera"><figcaption><strong>CHORLITO DORADO EUROPEO</strong><span>Ave de espacios abiertos de turbera.</span></figcaption></figure><p class="map-caption">Son pistas para observar con distancia; no garantizan un avistamiento.</p></div>`}
  function d8Card(kicker,body,caption){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}${caption?`<p class="map-caption">${caption}</p>`:""}</div>`}
  function d8RouteMap(){return d8Card("HÖKERUM → STORE MOSSE → MARIEFRED",annotatedMap([12.5,19.3,56.5,59.5],[["Hökerum",13.28,57.84],["Store Mosse",13.93,57.24],["carretera 151",13.85,57.25],["Naturum",13.93,57.24],["Kävsjön",13.95,57.23],["Mariefred",17.22,59.26],["Mälaren",17.0,59.3]],[[13.28,57.84,13.93,57.24,"mañana de visita",""],[13.93,57.24,17.22,59.26,"E4 hacia Mariefred","danger"]],"Mapa de la ruta hacia Store Mosse y Mariefred"),"Store Mosse no es una mancha vacía ni una parada que haya que recorrer entera en un día largo.")}
  function d8PeatCard(){return d8Card("STORE MOSSE · ESCALA Y VARIEDAD",`<div class="evidence-grid three"><div><b>≥ 8.000 AÑOS</b><span>de formación de turba</span></div><div><b>ESFAGNOS</b><span>restos vegetales principales</span></div><div><b>MOSAICO</b><span>turbera elevada, lagos, pinos, bosque húmedo y carrizal</span></div></div>`,"Komosse explicó el mecanismo; Store Mosse añade escala y distintos hábitats.")}
  function d8CoreCard(){return d8Card("TESTIGO DE TURBA · MUESTRA CIENTÍFICA",`<div class="history-timeline"><div><strong>SUPERFICIE</strong><span>capas más recientes y musgos vivos</span></div><div><strong>PROFUNDIDAD</strong><span>capas normalmente más antiguas</span></div><div><strong>LABORATORIO</strong><span>carbono 14, polen, semillas y otras señales</span></div></div>`,"Una imagen de turba no puede fecharse sola. No se excava ni se recogen muestras en el parque.")}
  function d8DroseraCard(){return d8Card("DROSERA · MIRAR, NO TOCAR",`<div class="evidence-grid two"><div><b>SUELO POBRE</b><span>pocos nutrientes en una turbera elevada</span></div><div><b>GOTAS PEGAJOSAS</b><span>atrapan insectos para obtener parte de lo que escasea</span></div></div>`,"Una adaptación natural interesante no es una invitación a tocar la planta.")}
  function d8RocknarCard(){return d8Card("ROCKNAR · ARENA, PINOS Y TURBA",`<div class="history-timeline"><div><strong>hace ~15.000 años</strong><span>el hielo se retira y queda el lago de deshielo Fornbolmen</span></div><div><strong>hace ~12.000 años</strong><span>el lago se vacía y deja arena</span></div><div><strong>miles de años</strong><span>el viento forma dunas; pinos las estabilizan</span></div><div><strong>hoy</strong><span>turba baja y dunas boscosas altas</span></div></div>`,"Los rocknar son dunas de arena cubiertas de bosque, no rocas ni torres.")}
  function d8DunesCard(){return d8Card("UN PARALELISMO, NO UNA COPIA",`<div class="evidence-grid two"><div><b>STORE MOSSE</b><span>arena de un lago glaciar + pinos + enorme turbera</span></div><div><b>OTRAS DUNAS INTERIORES</b><span>comparten viento y arena, no necesariamente la misma historia</span></div></div>`,"Los paralelismos ayudan a reconocer una idea sin borrar lo particular de cada paisaje.")}
  function d8BirdsCard(){return `<div class="visual-evidence bird-gallery"><figure><img src="${imgBase}grulla comun.jpg" alt="Grulla común"><figcaption><strong>GRULLA · trana</strong><span>Patas largas y llamada como trompeta.</span></figcaption></figure><figure><img src="${imgBase}cisne cantor.jpg" alt="Cisne cantor"><figcaption><strong>CISNE CANTOR · sångsvan</strong><span>Pico amarillo y negro.</span></figcaption></figure><figure><img src="${imgBase}gallo lira.jpg" alt="Gallo lira"><figcaption><strong>GALLO LIRA · orre</strong><span>Macho oscuro, ceja roja y detalles blancos.</span></figcaption></figure><figure><img src="${imgBase}zarapito real.jpg" alt="Zarapito real"><figcaption><strong>ZARAPITO REAL · storspov</strong><span>Pico largo curvado hacia abajo.</span></figcaption></figure><p class="map-caption">Guía de observación: las especies pueden aparecer, pero no están garantizadas hoy.</p></div>`}
  function d8RestoreCard(){return d8Card("TURBERA · USO Y RESTAURACIÓN",`<div class="history-timeline"><div><strong>miles de años</strong><span>se acumula turba</span></div><div><strong>primera mitad del siglo XX</strong><span>extracción de turba en partes del paisaje</span></div><div><strong>1982</strong><span>se crea el Parque Nacional de Store Mosse</span></div><div><strong>hoy</strong><span>algunas zonas se restauran para recuperar funciones de turbera elevada</span></div></div>`,"Proteger no borra las cicatrices: decide qué condiciones se intenta reparar.")}
  function d8GnosjoCard(){return d8Card("GNOSJÖANDAN Y EL VALLE DEL JUGUETE",`<div class="evidence-grid two"><div><b>GNOSJÖANDAN</b><span>iniciativa, pequeñas empresas y redes de apoyo práctico</span></div><div><b>ONIL · 1957</b><span>25 fabricantes de muñecas crean FAMOSA para afrontar cambios e inversiones</span></div></div>`,"Dos historias distintas que comparten una idea: competir no impide colaborar ante un cambio grande.")}
  function d8MariefredMap(){return d8Card("MARIEFRED · MÄLAREN · GRIPSHOLM",annotatedMap([15.8,18.2,58.6,60.1],[["Mariefred",17.22,59.26],["Gripsholm",17.22,59.26],["Mälaren",17.0,59.3],["Estocolmo",18.07,59.33],["Västerås",16.55,59.61]],[],"Mapa de Mariefred, Gripsholm y Mälaren"),"Pax Mariæ, Mariefred y Gripsholm son capas de una misma orilla.")}
  function d8PaxCard(){return d8Card("PAX MARIÆ → MARIEFRED",`<div class="history-timeline"><div><strong>1493</strong><span>se funda el monasterio cartujo Pax Mariæ</span></div><div><strong>1523–1527</strong><span>Gustav Vasa llega al poder y la Corona controla bienes de la Iglesia</span></div><div><strong>1537</strong><span>se demuele el monasterio en relación con el castillo Vasa</span></div><div><strong>1605</strong><span>la ciudad toma el nombre Mariefred</span></div></div>`,"En 1520 Suecia seguía siendo católica. Durante el siglo XVI se fue transformando en reino luterano.")}
  function d8InnCard(){return d8Card("MARIEFRED · 1609",`<div class="history-timeline"><div><strong>Gripsholm recibe a la corte</strong><span>viajeros y comitivas necesitan cama y comida</span></div><div><strong>vecinos protestan</strong><span>la carga sin pago se vuelve demasiado costosa</span></div><div><strong>13 de febrero de 1609</strong><span>privilegio para Jocim Smock, primer posadero</span></div></div>`,"Una necesidad cotidiana creó un servicio organizado; no fue una posada «mágicamente antigua».")}
  function d8MadridCard(){return d8Card("MADRID Y MARIEFRED · ALOJAR A LA CORTE",`<div class="evidence-grid two"><div><b>MADRID · 1561</b><span>Regalía de aposento y casas a la malicia ante una corte estable</span></div><div><b>MARIEFRED · 1609</b><span>protesta por visitas de la corte a Gripsholm y posada organizada</span></div></div>`,"Problemas parecidos no son historias idénticas. La Posada del Peine se fundó en 1610 y hoy conserva su nombre como hotel.")}
  function d8SwedishCard(){return d8Card("SUECO ÚTIL",`<div class="quote-card"><strong>Ett bord för tre, tack.</strong><span>Una mesa para tres, por favor.</span></div><div class="evidence-grid two"><div><b>bord</b><span>mesa</span></div><div><b>tack</b><span>gracias / por favor</span></div></div>`,"Tarjeta para usar durante la cena, no un examen de pronunciación.")}

  function d9Card(kicker,body,caption){return `<div class="puzzle-card map-card"><p class="kicker">${kicker}</p>${body}${caption?`<p class="map-caption">${caption}</p>`:""}</div>`}
  function d9BoMap(){return d9Card("BO JONSSON GRIP · HACIA 1386",annotatedMap([9,25,54,66],[["Gripsholm",17.22,59.26],["Estocolmo",18.07,59.33],["Mälaren",16.9,59.35],["Kalmar",16.36,56.66],["Örebro",15.21,59.27]],[],"Mapa de orientación de las tierras y rutas relacionadas con Bo Jonsson Grip"),"Orientación moderna de una red medieval de tierras, castillos y derechos: no representa un país con fronteras actuales.")}
  function d9NameCard(){return d9Card("GRIP + HOLM",`<div class="evidence-grid three"><div><b>GRIP</b><span>apellido de Bo Jonsson Grip y emblema de grifo</span></div><div><b>HOLM</b><span>islote o pequeña isla</span></div><div><b>GRIPSHOLM</b><span>«el islote de Grip»</span></div></div>`,"El nombre conserva a una persona, un símbolo y un lugar junto al Mälaren.")}
  function d9PaxCard(){return d9Card("1404 → 1537 · CAMBIOS DE LLAVES",`<div class="history-timeline"><div><strong>1404</strong><span>la reina Margarita incorpora Gripsholm a la Corona</span></div><div><strong>1472</strong><span>Sten Sture el Viejo lo obtiene mediante intercambio</span></div><div><strong>1493–1498</strong><span>Pax Mariæ se funda y recibe la finca</span></div><div><strong>1526–1537</strong><span>Reforma y comienzo del castillo Vasa</span></div></div>`,"Corona, intercambio, fundación religiosa y Reforma: cuatro cambios distintos.")}
  function d9MariefredCard(){return d9Card("PAX MARIÆ → MARIEFRED",`<div class="evidence-grid three"><div><b>PAX MARIÆ</b><span>latín: Paz de María</span></div><div><b>MARIAS FRED</b><span>sueco: Paz de María</span></div><div><b>MARIEFRED</b><span>la ciudad conserva esa idea</span></div></div>`,"Marie es María; fred significa paz. El nombre del lugar es una pista histórica.")}
  function d9WaterMap(){return d9Card("GRIPSHOLM · MÄLAREN · ESTOCOLMO · BÁLTICO",annotatedMap([14.5,20,58.3,60.4],[["Gripsholm",17.22,59.26],["Mälaren",16.8,59.35],["Estocolmo",18.07,59.33],["Báltico",19.4,59.2]],[[17.22,59.26,18.07,59.33,"ruta de agua",""]],"Mapa de Gripsholm entre el lago Mälaren, Estocolmo y el Báltico"),"El agua era conexión, vigilancia y defensa; no una barrera perfecta.")}
  function d9CastlesCard(){return d9Card("SEIS LUGARES PARA LEER EL VIAJE",`<div class="evidence-grid two"><div><b>KALMAR</b><span>Unión de tres reinos y Báltico</span></div><div><b>ESTOCOLMO</b><span>centro de la monarquía</span></div><div><b>ÖREBRO</b><span>cruce, comercio y rebelión</span></div><div><b>KARLSBORG</b><span>capital de reserva</span></div><div><b>SKANSEN KRONAN</b><span>defensa de Gotemburgo</span></div><div><b>GRIPSHOLM</b><span>residencia, prisión y memoria</span></div></div>`,"No son «castillos iguales»: cada lugar responde a una ruta y una pregunta de poder distinta.")}
  function d9SegoviaCard(){return d9Card("PARALELISMO · ALCÁZAR DE SEGOVIA",`<div class="evidence-grid two"><div><b>ALCÁZAR</b><span>fortaleza, residencia, prisión de Estado y colegio de artillería</span></div><div><b>GRIPSHOLM</b><span>fortaleza, monasterio, castillo Vasa, prisión, teatro y museo</span></div></div>`,"Comparación de funciones, no de historias idénticas.")}
  function d9FamilyCard(){return d9Card("FAMILIA VASA · QUIÉN TENÍA LAS LLAVES",`<div class="history-timeline"><div><strong>1563–1567</strong><span>Erik XIV encierra a Johan y a Katarina Jagellonica</span></div><div><strong>1568</strong><span>Johan y sus partidarios cambian el poder</span></div><div><strong>1571</strong><span>Erik XIV, Karin Månsdotter y sus hijos quedan presos</span></div></div>`,"No basta un parentesco: hay que seguir quién controla el reino y, con él, las llaves.")}
  function d9FelipeCard(){return d9Card("SUECIA Y ESPAÑA · 1568",`<div class="evidence-grid two"><div><b>ERIK XIV Y JOHAN</b><span>sucesión y lucha por el poder en Suecia</span></div><div><b>FELIPE II Y CARLOS</b><span>otro conflicto sucesorio y de Estado en España</span></div></div>`,"Un paralelo abre una pregunta común; no vuelve idénticas las causas ni los desenlaces.")}
  function d9PortraitsCard(){return d9Card("TRES RETRATOS, TRES PISTAS",`<div class="character-gallery"><figure class="history-person"><img src="${imgBase}Gustav_Vasa.jpg" alt="Retrato de Gustav Vasa"><strong>Gustav Vasa</strong><span>Rey en 1523</span><small>Impulsó el castillo y la Reforma.</small></figure><figure class="history-person"><img src="${imgBase}erik_XIV.jpg" alt="Retrato de Erik XIV"><strong>Erik XIV</strong><span>Rey y prisionero</span><small>Encerró a Johan y después fue preso.</small></figure><figure class="history-person"><img src="${imgBase}John_III_of_Sweden.jpg" alt="Retrato de Johan III"><strong>Johan III</strong><span>Prisionero y rey</span><small>Estuvo preso y después llegó al trono.</small></figure></div>`,"Un retrato puede mostrar representación y memoria elegida; no cuenta una vida entera.")}
  function d9TheatreCard(){return d9Card("GUSTAVO III · UNA TORRE TEATRAL",`<div class="evidence-grid three"><div><b>ESCENARIO</b><span>lugar pensado para representar</span></div><div><b>PÚBLICO</b><span>espacios para mirar y escuchar</span></div><div><b>TORRE</b><span>una función distinta de la militar</span></div></div>`,"El teatro muestra que los edificios cambian de uso sin borrar por completo sus capas anteriores.")}
  function d9LionCard(){return d9Card("EL LEÓN Y EL CASCO VIKINGO",`<div class="quote-card"><strong>Una imagen llamativa puede estar equivocada.</strong><span>La pregunta útil es qué sabía quien la hizo y con qué referencias trabajó.</span></div>`,"El objeto sigue siendo una fuente: enseña también los límites del conocimiento de su época.")}
  function d9SwedishCard(){return d9Card("SUECO ÚTIL · MUSEO",`<div class="quote-card"><strong>Vad berättar bilden?</strong><span>¿Qué cuenta la imagen?</span></div><div class="evidence-grid two"><div><b>bild</b><span>imagen</span></div><div><b>berättar</b><span>cuenta / relata</span></div></div>`,"Tarjeta para usar al mirar una pieza, no un examen de pronunciación.")}
  function d9StrangnasMap(){return d9Card("OPCIÓN A · STRÄNGNÄS",annotatedMap([15.2,18.4,58.6,60.1],[["Mariefred",17.22,59.26],["Strängnäs",17.03,59.38],["catedral",17.03,59.38]],[[17.22,59.26,17.03,59.38,"por el Mälaren",""]],"Mapa de Mariefred y Strängnäs"),"6 de junio de 1523: Gustav Eriksson fue elegido rey. Una elección decisiva, no un Estado terminado de golpe.")}
  function d9SigtunaMap(){return d9Card("OPCIÓN B · SIGTUNA",annotatedMap([16.5,19.4,58.8,60.2],[["Mariefred",17.22,59.26],["Sigtuna",17.72,59.62],["Mälaren",17.1,59.32]],[[17.22,59.26,17.72,59.62,"ruta alternativa",""]],"Mapa de Mariefred y Sigtuna"),"Las piedras rúnicas no eran claves secretas: podían funcionar como memoria pública junto a un camino.")}
  function d9ViewMap(){return d9Card("ORILLA DE GRIPSHOLM",annotatedMap([16.8,17.6,59.0,59.6],[["Gripsholm",17.22,59.26],["Mariefred",17.22,59.26],["Hjorthagen",17.25,59.28],["Mälaren",17.0,59.3]],[],"Mapa de orientación de la orilla y el entorno de Gripsholm"),"La vista conecta agua, praderas, arbolado y torres sin inventar una ruta histórica que no está demostrada.")}
  function d9FiveCard(){return d9Card("LAS CINCO PUERTAS",`<div class="history-timeline"><div><strong>1 · PODER</strong><span>Bo Jonsson Grip y una red medieval</span></div><div><strong>2 · CORONA</strong><span>intercambio y cambios de manos</span></div><div><strong>3 · MONASTERIO</strong><span>Pax Mariæ</span></div><div><strong>4 · VASA</strong><span>castillo, reforma y sucesión</span></div><div><strong>5 · MEMORIA</strong><span>prisión, teatro y retratos</span></div></div>`,"Las capas no se excluyen: juntas forman una historia más completa.")}
  function d9ThanksCard(){return d9Card("SUECO PARA DESPEDIRSE",`<div class="quote-card"><strong>Tack för resan.</strong><span>Gracias por el viaje.</span></div><div class="evidence-grid two"><div><b>tack</b><span>gracias</span></div><div><b>resa</b><span>viaje</span></div></div>`,"Una frase práctica para el final del viaje.")}
  function d10PhotoCard(kicker,file,caption){return `<figure class="puzzle-card map-card"><p class="kicker">${kicker}</p><img src="${imgBase+file}" alt="${kicker}" style="width:100%;max-height:260px;object-fit:cover;border-radius:16px"><figcaption class="map-caption">${caption}</figcaption></figure>`}
  function d10KarlsborgCard(){return d9Card("KARLSBORG · REFUGIO INTERIOR",`<div class="history-timeline"><div><strong>1809</strong><span>Suecia pierde su parte oriental de Finlandia y busca proteger el gobierno en el interior.</span></div><div><strong>PROYECTO</strong><span>El rey, Gobierno, Riksdag, reservas y documentos debían poder trasladarse allí.</span></div><div><strong>MÁS DE 90 AÑOS</strong><span>La construcción se alargó y el uso previsto quedó obsoleto.</span></div></div>`,"Una fortaleza puede contar un plan que nunca llegó a ponerse en práctica.")}

  function baseMap(bounds,aria="Mapa geográfico"){
    const W=420,H=300,world=(window.GRIPSHOLM_WORLD_COUNTRIES||[]).map(f=>({name:f.properties?.ADMIN||f.properties?.NAME,geometry:f.geometry})),features=world.length?world:(window.GRIPSHOLM_MAP_DATA?.countries||[]),lakes=window.GRIPSHOLM_MAP_DATA?.lakes||[];
    let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}"><rect width="420" height="300" class="map-water"/>`;
    features.forEach(f=>{if(visible(f.geometry,bounds))s+=`<path class="country" d="${geomPath(f.geometry,bounds,W,H)}"/>`});
    lakes.forEach(f=>{if(visible(f.geometry,bounds))s+=`<path class="lake" d="${geomPath(f.geometry,bounds,W,H)}"/>`});
    return {svg:s,bounds,W,H};
  }
  function annotatedMap(bounds,marks=[],lines=[],aria){
    const m=baseMap(bounds,aria);let s=m.svg;
    lines.forEach(l=>{const a=project(l[0],l[1],bounds,m.W,m.H),b=project(l[2],l[3],bounds,m.W,m.H);s+=`<path class="route-line ${l[5]||""}" d="M${a[0]},${a[1]} Q${(a[0]+b[0])/2},${Math.min(a[1],b[1])-18} ${b[0]},${b[1]}"/><text class="route-distance" x="${(a[0]+b[0])/2+(l[6]||0)}" y="${(a[1]+b[1])/2-10+(l[7]||0)}">${l[4]||""}</text>`});
    marks.forEach(x=>{const p=project(x[1],x[2],bounds,m.W,m.H),dx=x[3]??7,dy=x[4]??-7;s+=`<circle class="map-marker" cx="${p[0]}" cy="${p[1]}" r="5"/><line class="map-label-line" x1="${p[0]}" y1="${p[1]}" x2="${p[0]+dx*.72}" y2="${p[1]+dy*.72}"/><text class="map-label" x="${p[0]+dx}" y="${p[1]+dy}">${esc(x[0])}</text>`});
    return `<div class="geo-map">${s}</svg></div>`;
  }
  function mapAland(solution){return `<div class="puzzle-card map-card"><p class="kicker">BÁLTICO · ARCHIPIÉLAGO INTERCEPTADO</p>${annotatedMap([15,30,58,61],[['Estocolmo',18.07,59.33],['Turku',22.27,60.45],['ÅLAND',19.91,60.18]],[],"Mapa de Åland entre Suecia y Finlandia")}<div class="aland-flag"><span>${flagSvg("ax")}</span><b>Åland</b><small>${solution?"Finlandia · autonomía · idioma oficial sueco":"¿Suecia, Finlandia o Estado independiente?"}</small></div></div>`}
  function mapKalmar(){return `<div class="puzzle-card map-card"><p class="kicker">UNIÓN DE KALMAR · 1397</p>${annotatedMap([4,32,54,71],[['DINAMARCA',10.1,56.2],['NORUEGA',8.5,63.5],['SUECIA',16,62.5]],[],"Mapa de los tres reinos de la Unión de Kalmar")}<p class="map-caption">Una corona compartida; tres reinos con instituciones propias.</p></div>`}
  function mapSvearGotar(solution=false){
    const b=[9,23,54.5,64],m=baseMap(b,"Mapa de las zonas aproximadas de Svear y Götar");let s=m.svg;
    const zone=(coords,cls,label)=>{const pts=coords.map(p=>project(p[0],p[1],b,m.W,m.H).join(",")).join(" ");const c=project(coords.reduce((n,p)=>n+p[0],0)/coords.length,coords.reduce((n,p)=>n+p[1],0)/coords.length,b,m.W,m.H);return `<polygon class="historic-zone ${cls}" points="${pts}"/><text class="historic-zone-label" x="${c[0]}" y="${c[1]}">${solution?label:cls==="svear"?"A":"B"}</text>`};
    s+=zone([[15.2,58.7],[19.6,58.6],[19.4,61.1],[16.2,61.5],[14.6,60.1]],"svear","SVEAR");
    s+=zone([[11.5,55.6],[17.1,55.5],[16.7,58.8],[13.5,59.1],[11.1,57.8]],"gotar","GÖTAR");
    [['Mälaren',17.35,59.35,8,-8],['Uppland',17.7,60.05,8,-8],['Västergötland',13.1,57.7,-58,12],['Östergötland',15.8,58.25,8,14]].forEach(x=>{const p=project(x[1],x[2],b,m.W,m.H);s+=`<circle class="map-marker small" cx="${p[0]}" cy="${p[1]}" r="3"/><text class="map-label" x="${p[0]+x[3]}" y="${p[1]+x[4]}">${x[0]}</text>`});
    s+=`</svg>`;
    return `<div class="puzzle-card map-card"><p class="kicker">ZONAS APROXIMADAS · FRONTERAS ACTUALES COMO REFERENCIA</p><div class="geo-map historic-map">${s}</div><div class="map-legend"><span><i class="svear"></i>${solution?"Svear":"Zona A"}</span><span><i class="gotar"></i>${solution?"Götar":"Zona B"}</span></div><p class="map-caption">Las manchas no representan fronteras medievales exactas. Las líneas finas son las fronteras actuales.</p></div>`
  }
  function routeMapPanel(bounds,routes,marks,title,aria){
    const m=baseMap(bounds,aria);let s=m.svg;
    routes.forEach(r=>{for(let i=0;i<r.points.length-1;i++){const a=project(...r.points[i],bounds,m.W,m.H),z=project(...r.points[i+1],bounds,m.W,m.H);s+=`<path class="route-line ${r.cls}" d="M${a[0]},${a[1]} Q${(a[0]+z[0])/2},${(a[1]+z[1])/2-10} ${z[0]},${z[1]}"/>`}});
    marks.forEach(x=>{const p=project(x[1],x[2],bounds,m.W,m.H);s+=`<circle class="map-marker" cx="${p[0]}" cy="${p[1]}" r="4"/><text class="map-label" x="${p[0]+(x[3]||7)}" y="${p[1]+(x[4]||-7)}">${x[0]}</text>`});
    return `<article class="viking-route-panel"><strong>${title}</strong><div class="geo-map">${s}</svg></div></article>`;
  }
  function mapVikings(){
    const europe=routeMapPanel([-12,62,34,72],[
      {cls:"east",points:[[17.7,59.4],[24,58],[30.5,50.4],[30.5,46],[29,41],[28.97,41.01]]},
      {cls:"east",points:[[17.7,59.4],[30,55],[40,48],[51,43],[50.3,40.4]]},
      {cls:"west",points:[[10,60],[-3,55],[-1,48.8],[-8.5,43.3],[-6,37.4]]}
    ],[['Birka',17.55,59.33,7,-8],['Gotland',18.4,57.5,7,12],['Constantinopla',28.97,41.01,-58,14],['mar Caspio',50.3,40.4,-45,-9],['Islas Británicas',-3,55,7,-8],['Francia',-1,48.8,7,-8],['Galicia',-8.5,43.3,7,-8],['Sevilla',-6,37.4,7,13]],"EUROPA · ESTE Y OESTE","Redes vikingas orientales y occidentales");
    const atlantic=routeMapPanel([-78,22,43,74],[{cls:"atlantic",points:[[7,61],[-19,65],[-42,64],[-56,51]]}],[['Noruega',7,61,7,-8],['Islandia',-19,65,7,-8],['Groenlandia',-42,64,7,-8],['L’Anse aux Meadows',-55.6,51.6,7,13]],"ATLÁNTICO NORTE","Redes vikingas atlánticas");
    return `<div class="puzzle-card map-card"><p class="kicker">REDES, NO PASAPORTES</p><div class="viking-route-maps">${europe}${atlantic}</div><div class="route-legend"><span class="east">Este</span><span class="west">Oeste e Iberia</span><span class="atlantic">Atlántico</span></div><p class="map-caption">Las líneas representan redes y tendencias generales; no rutas únicas recorridas por todas las expediciones.</p></div>`;
  }
  function shipGallery(){
    const ship=(kind,title,copy,path,mast)=>`<article class="ship-type"><svg viewBox="0 0 180 105" role="img" aria-label="Esquema de ${title}"><path class="ship-water" d="M8 91h164"/><path class="ship-hull ${kind}" d="${path}"/>${mast?`<path class="ship-mast" d="M91 18v61M91 21L${kind==="knarr"?"145 65":"145 56"}H91Z"/>`:""}${kind==="long"?`<g class="ship-oars">${[38,55,72,108,125,142].map(x=>`<path d="M${x} 75l${x<90?-13:13} 23"/>`).join("")}</g>`:""}</svg><strong>${title}</strong><span>${copy}</span></article>`;
    return `<div class="ship-gallery">${ship("long","BARCO LARGO","estrecho, poco calado y muchos remeros","M17 67Q90 98 164 65L151 86H31Z",true)}${ship("knarr","KNARR","casco ancho, profundo y con alta capacidad de carga","M24 61Q89 101 158 61L143 91H38Z",true)}${ship("coast","COSTERO / FLUVIAL","menor, maniobrable y más fácil de arrastrar entre ríos","M28 69Q90 94 151 69L139 87H42Z",false)}</div>`;
  }
  function mapAsunden(){return `<div class="puzzle-card map-card"><p class="kicker">ENERO–FEBRERO DE 1520</p>${annotatedMap([12,20,56,60.5],[['Lago Åsunden',13.42,57.79],['Estocolmo',18.07,59.33]],[ [13.42,57.79,18.07,59.33,'traslado hacia Estocolmo','danger'] ],"Ruta desde Åsunden hasta Estocolmo")}</div>`}
  function raceMaps(){return `<section class="race-compare"><article><p class="kicker">SUECIA · DALARNA</p>${annotatedMap([4,27,54,70],[['Sälen',13.27,61.16,-35,-10],['Mora',14.54,61.0,10,14],['Estocolmo',18.07,59.33,9,-9]],[[13.27,61.16,14.54,61.0,'90 km','ski',0,-8]],"Vasaloppet dentro de Suecia")}<strong>Vasaloppet · 90 km</strong><small>Sälen → Mora · cerca de la frontera noruega</small></article><article><p class="kicker">GRECIA · ÁTICA</p>${annotatedMap([18,29,34,42.5],[['Maratón',23.97,38.15,18,-18],['Atenas',23.73,37.98,14,18],['Esparta',22.43,37.07,-40,2]],[[23.97,38.15,23.73,37.98,'42,195 km','run',-38,-14]],"Maratón dentro de Grecia")}<strong>Maratón moderno · 42,195 km</strong><small>Maratón → Atenas · Esparta como referencia geográfica</small></article><div class="distance-compare"><span style="--w:100%">Vasaloppet · 90 km</span><span style="--w:46.9%">Maratón · 42,195 km</span></div></section>`}
  function timelineSignal(){return `<div class="history-timeline"><div><strong>1520</strong><span>Stortorget</span></div><i>108 años</i><div><strong>1628</strong><span>Djurgården · Vasa</span></div></div>`}
  function project(lon,lat,b,W,H){return[(lon-b[0])/(b[1]-b[0])*W,(b[3]-lat)/(b[3]-b[2])*H]}
  function visible(g,b){const c=g.type==="Polygon"?g.coordinates.flat(1):g.coordinates.flat(2);return c.some(p=>p[0]>=b[0]-5&&p[0]<=b[1]+5&&p[1]>=b[2]-5&&p[1]<=b[3]+5)}
  function geomPath(g,b,W,H){const ps=g.type==="Polygon"?[g.coordinates]:g.coordinates;return ps.map(poly=>poly.map(ring=>ring.map((p,i)=>{const q=project(p[0],p[1],b,W,H);return`${i?"L":"M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`}).join("")+"Z").join(" ")).join(" ")}
  const flagSvg=code=>code==="ax"?`<svg viewBox="0 0 80 50" aria-label="Bandera de Åland"><rect width="80" height="50" fill="#0053a5"/><path d="M25 0v50M0 25h80" stroke="#ffce00" stroke-width="10"/><path d="M25 0v50M0 25h80" stroke="#d21034" stroke-width="5"/></svg>`:"";

  function updateFundDialog(){
    const total=missions.length,complete=state.completedMissions.length;
    $("#fund-dialog-title").textContent=DAY==="10"?`${complete} de ${total} recuerdos guardados`:`${complete} de ${total} evidencias recuperadas`;
    $("#fund-meter").style.width=`${Math.round(complete/total*100)}%`;
    $("#fund-ledger").innerHTML=missions.map((m,i)=>`<div><dt>${state.completedMissions.includes(i)?"✓":"○"} ${m.title}</dt><dd>${state.completedMissions.includes(i)?"recuperada":"pendiente"}</dd></div>`).join("");
  }
  function openMenu(){
    const list=$("#mission-menu");list.innerHTML=missions.map((m,i)=>`<button type="button" data-jump="${i}"><span class="${state.completedMissions.includes(i)?"done":""}">${state.completedMissions.includes(i)?"✓":String(i+1).padStart(2,"0")}</span><strong>${m.title}</strong><small>${state.completedMissions.includes(i)?"completada":i===state.mission?"actual":"pendiente · disponible"}</small></button>`).join("")+(DATA.optionalTrueFalse?`<button type="button" data-optional-quiz><span>◈</span><strong>${DATA.optionalTrueFalse.title}</strong><small>opcional · siempre disponible</small></button>`:"");
    list.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{$("#menu-dialog").close();state.mission=+b.dataset.jump;state.key=0;state.stage="missionCover";save();render()});$("#menu-dialog").showModal();
    list.querySelector("[data-optional-quiz]")?.addEventListener("click",()=>{$("#menu-dialog").close();state.stage="optionalQuiz";save();render()});
  }
  $("#fund-btn").onclick=()=>{updateFundDialog();$("#fund-dialog").showModal()};$("#menu-btn").onclick=openMenu;
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
  document.querySelectorAll("dialog").forEach(d=>d.onclick=e=>{if(e.target===d)d.close()});
  $("#restart-btn").onclick=()=>{if(confirm(`¿Borrar todo el progreso del Día ${DAY}?`)){localStorage.removeItem(STORE);state=fresh();$("#menu-dialog").close();render()}};
  if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("service-worker.js?v=8-10").catch(()=>{});
  render();
})();
