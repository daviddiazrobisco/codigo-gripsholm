/* Día 03 · migración V7 basada en el guion aprobado V6.
   V4 se conserva como referencia de contenido, mapas y mecánicas. */
window.DAY3_DATA={
  meta:{
    day:"03",store:"codigo-gripsholm-v7-day03",contentVersion:"v7-final-day3",
    place:"ESTOCOLMO → ÖREBRO → TIVEDEN",title:"El puente y el hombre al que llamaron bandido",
    landing:"La Sombra ha sustituido un nombre por una acusación.",openingTime:"Primera apertura recomendada: 20–25 minutos. Puedes continuar durante la parada en Örebro.",
    badge:"Informe Engelbrekt",objective:"RECUPERAR EL INFORME ENGELBREKT",
    objectiveCopy:"Seguiremos el puente, el hierro, las reclamaciones y la caída de un rey para comprobar por qué «bandido» es una etiqueta engañosa.",
    evidenceCopy:"Cada misión recupera una conclusión del Informe Engelbrekt.",
    fine:"Engelbrekt fue una persona histórica. Sus intervenciones son una reconstrucción narrativa basada en fuentes, no citas literales.",
    verifiedTitle:"El Informe Engelbrekt está completo.",verifiedAction:"Abrir el cierre de Saga",
    result:{title:"El puente y el hombre al que llamaron bandido",evidence:"Informe Engelbrekt recuperado",openQuestion:"¿Qué gana La Sombra cuando convierte una protesta contra abusos en la historia de un simple bandido?",next:{href:"dia4.html",label:"Abrir el Día 04"}},
    routeCount:8,previousStore:"codigo-gripsholm-v7-day02",previousDay:"02"
  },
  routePlaces:[
    ["Estocolmo","Salida junto al Mälaren y la costa báltica."],
    ["Mälaren","Gran lago que ayuda a entender las comunicaciones hacia el interior."],
    ["Örebro y Svartån","Cruce de rutas, puente y castillo en un río."],
    ["Hjälmaren","El Svartån desemboca en este lago al este de Örebro."],
    ["Castillo y Storbron","Agua, fortaleza y puente explican el valor estratégico del paso."],
    ["San Nicolás y Stortorget","Engelbrekt y Bernadotte conectan dos crisis separadas por casi cuatro siglos."],
    ["Wadköping","Edificios históricos reunidos desde 1965 y una ciudad nacida antes en la literatura."],
    ["Tiveden","Bosque entre Vänern y Vättern; el siguiente cuaderno espera sin apenas cobertura."]
  ],
  prologue:[
    {k:"SAGA · RUTA ALTERADA",title:"La ruta que La Sombra ha insultado",image:"saga-transmision-inicial.png",alt:"Saga abre la transmisión del Día 03",html:`<p>La ruta que salió de Estocolmo tiene un nombre: <strong>Engelbrekt</strong>. La Sombra no la ha borrado; ha escrito una palabra encima: <strong>BANDIDO</strong>.</p><p>No vamos a convertirlo en un héroe perfecto. Vamos a entender por qué mineros, campesinos, ciudades y parte de la élite sueca se unieron contra el rey de la Unión de Kalmar.</p><p class="lead">Hoy recuperaremos el Informe Engelbrekt: cruce, sistema económico, reclamación, expansión y consecuencia.</p>`,action:"Abrir el Informe Engelbrekt"},
    {k:"ENGELBREKT ENGELBREKTSSON · FIGURA HISTÓRICA",title:"Antes de juzgarme, seguid el hierro",image:"engelbrekt-statue-orebro.jpg",alt:"Estatua posterior de Engelbrekt en Örebro",html:`<p><strong>Reconstrucción narrativa basada en fuentes.</strong></p><p>Un rey que permite que sus funcionarios expriman a su pueblo no puede pedir obediencia como si nada hubiera pasado.</p><p>Mirad quién podía vender el hierro, quién cobraba por el camino y quién decidía si nuestras quejas llegaban al rey.</p><p class="fine">La estatua es una representación posterior: no demuestra el aspecto exacto de Engelbrekt.</p>`,action:"Seguir el hierro"},
    {k:"MAPA REAL DEL DÍA",title:"Un viaje, tres paisajes",routeMap:true,html:`<p>Abre los ocho puntos para situar Estocolmo, el cruce de Örebro y la entrada en Tiveden. El mapa explica; no hay nada que adivinar.</p>`,action:"Guardar la ruta"}
  ],
  missions:[
    {
      title:"Un viaje, tres paisajes",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:3,time:"4–5 min",action:"Leer el mapa",
      sagaOpening:"Hoy cruzamos desde una ciudad marítima a una ciudad de río y terminamos en un bosque entre grandes lagos.",
      opening:"Antes de viajar a 1434, mirad el territorio. El interior no estaba aislado: el agua y los caminos movían personas, noticias y mercancías.",
      goal:"Situar la ruta actual y entender cómo se conectan mar, río, caminos, lagos y bosque.",
      done:"La ruta actual queda entendida antes de abrir la crisis medieval.",
      closing:"Ya sabéis dónde sucede mi historia. Örebro no era una esquina perdida: conectaba agua, caminos y regiones mineras.",
      sagaClosing:"La primera conclusión del informe queda fijada: el interior estaba conectado.",
      questions:[
        {id:"d3v7m1c1",type:"explore",visual:"d3Regional",title:"Estocolmo, Örebro y Tiveden",scene:"Mapa de contexto · no es una pregunta.",prompt:"Abre las cinco señales geográficas.",items:[["Estocolmo","Ciudad de islas, junto al Mälaren y el Báltico."],["Mälaren","Gran lago de las comunicaciones interiores."],["Örebro y Svartån","Cruce de río, puente, caminos y fortaleza."],["Hjälmaren","Lago al este de Örebro conectado por el Svartån."],["Tiveden","Bosque y relieve entre Vänern y Vättern."]],success:"MAPA ACTUAL ABIERTO",explanation:"La carretera moderna atraviesa un territorio que ya estaba conectado por agua y caminos mucho antes del automóvil."},
        {id:"d3v7m1c2",type:"explore",visual:"d3Arrival",title:"La última carretera",scene:"Preparación práctica de V4 conservada como contexto, no como examen.",prompt:"Abre las tres precauciones antes de entrar en Tiveden.",items:[["Compra","Comida y desayuno antes del tramo rural."],["Mochila","Agua, calzado con agarre, impermeable y repelente."],["Sin conexión","Mapa del parque descargado antes de salir."]],success:"LLEGADA PREPARADA",explanation:"La historia puede esperar; el agua, la comida y un mapa sin conexión no."},
        {id:"d3v7m1q1",type:"single",visual:"d3Arrival",title:"La frase que lee bien el viaje",scene:"Ya tienes delante mar, río, lagos, caminos y bosque.",prompt:"¿Qué frase describe mejor la jornada?",options:["Viajamos desde una ciudad marítima a un cruce de río y caminos, y terminamos en un paisaje de bosque y lagos.","Tiveden es una isla situada frente al puerto de Estocolmo.","Antes de las carreteras no existían rutas entre estos lugares."],answer:0,hint:"Mira los lagos y el río: el interior no estaba aislado.",success:"RUTA ACTUAL ENTENDIDA",explanation:"Agua y tierra conectan el interior con ciudades y mercados de maneras distintas."}
      ]
    },
    {
      title:"Cuatro caminos, un puente",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:3,time:"6–8 min",action:"Examinar el cruce",
      sagaOpening:"La siguiente fuente es el propio lugar: nombre, río, puente, caminos y castillo.",
      opening:"El puente de Örebro no es solo una postal. Es el punto donde el río obligaba a parar y donde alguien podía controlar el paso.",
      goal:"Entender por qué el nombre, el río y la fortaleza revelan un cruce estratégico.",
      done:"Puente, agua, defensa y comercio vuelven a formar una sola explicación.",
      closing:"Quien controlaba este cruce podía afectar a la mina, al mercado, a los impuestos y al camino hacia el rey.",
      sagaClosing:"El informe recupera su primera pieza: CRUCE.",
      questions:[
        {id:"d3v7m2c1",type:"match",visual:"d3Name",title:"Öre + bro",scene:"Contexto del nombre: una acumulación de grava hacía más fácil cruzar el Svartån y allí se levantó un puente.",prompt:"Relaciona los dos fragmentos del topónimo.",pairs:[["ör / öre","banco o acumulación de grava"],["bro","puente"]],hint:"Bro sigue significando puente en sueco actual.",success:"NOMBRE RECUPERADO",explanation:"Örebro se relaciona con el puente junto a bancos de grava. Como Ponferrada, el nombre recuerda una solución práctica de paso; las dos ciudades no tuvieron la misma historia."},
        {id:"d3v7m2c2",type:"explore",visual:"d3Crossroads",title:"Un cruce antes de las autopistas",scene:"Mapa histórico explorable · no es una pregunta.",prompt:"Abre las cuatro direcciones del cruce.",items:[["Norte","Bergslagen y Dalarna: hierro, bosques, personas y noticias."],["Este","Mälaren, Estocolmo y el Báltico: mercados y salida marítima."],["Sur","Östergötland y otros centros urbanos."],["Nidaros","Dirección de rutas de larga distancia y peregrinación; no una autopista única."]],success:"CUATRO CAMINOS ABIERTOS",explanation:"El Svartån corre hacia Hjälmaren. Tierra y agua reunían tránsito, comercio, noticias, impuestos y defensa."},
        {id:"d3v7m2q1",type:"single",visual:"d3CastlePhoto",title:"Por qué el castillo está en el agua",scene:"La isla parece pequeña, pero reúne río, puente y caminos.",prompt:"¿Qué explica mejor la posición del castillo de Örebro?",options:["El agua dificultaba el acceso; el puente concentraba el paso y la fortaleza ayudaba a vigilar y defender una ruta comercial.","Se levantó solo como palacio de verano, sin función defensiva ni comercial.","Se construyó para controlar el océano Atlántico."],answer:0,hint:"El agua puede ser obstáculo, transporte y parte de una defensa.",success:"PUENTE, AGUA Y DEFENSA CONECTADOS",explanation:"El castillo actual incorpora reformas posteriores, pero conserva la posición estratégica de la fortificación medieval."}
      ]
    },
    {
      title:"El hierro no vivía solo en la mina",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:3,time:"7–9 min",action:"Abrir la red del Báltico",
      sagaOpening:"Para entender la protesta hay que ampliar el mapa: el hierro salía de Bergslagen y la sal y otros bienes debían entrar.",
      opening:"Cuando la guerra dañó esas rutas, producir hierro no garantizaba poder venderlo ni conseguir lo necesario para vivir.",
      goal:"Comprender la Unión de Kalmar y cómo guerra, comercio e impuestos afectaron de forma concreta a Bergslagen.",
      done:"La frase «el sistema se rompió» queda sustituida por una cadena económica visible.",
      closing:"El descontento no nació de una palabra abstracta. Nació de mercancías que no llegaban, ventas que fallaban e impuestos que seguían cobrándose.",
      sagaClosing:"El informe recupera su segunda pieza: SISTEMA ECONÓMICO.",
      questions:[
        {id:"d3v7m3c1",type:"explore",visual:"d3Kalmar",title:"De Bogislav a Erik",scene:"Mapa político y línea temporal · no es una pregunta.",prompt:"Abre las cinco piezas de la Unión.",items:[["Pomerania","Bogislav nació en una familia ducal de la costa meridional del Báltico."],["Margarita I","Lo adoptó como heredero y pasó a llamarse Erik."],["Kalmar · 1397","Erik fue coronado rey de Dinamarca, Noruega y Suecia."],["Tres reinos","Compartían monarca, no todas sus leyes ni intereses."],["1434","Las tensiones acumuladas se convierten en rebelión en Bergslagen."]],success:"UNIÓN DE KALMAR SITUADA",explanation:"Compartir un rey no eliminaba los conflictos sobre cargos, impuestos y comercio."},
        {id:"d3v7m3c2",type:"match",visual:"d3Holstein",title:"Holstein no está en Suecia",scene:"La disputa al sur de Dinamarca afectó a una región minera cientos de kilómetros al norte.",prompt:"Relaciona cada lugar o red con su papel.",pairs:[["Bergslagen","región minera del centro de Suecia"],["Lübeck y la Hansa","red de ciudades y mercaderes del Báltico"],["Schleswig","territorio entre Dinamarca y Holstein"],["Holstein","espacio germánico al sur de Schleswig"]],hint:"La Hansa era una red comercial, no un país gobernado por una sola persona.",success:"RED COMERCIAL LOCALIZADA",explanation:"La guerra de Erik con Holstein y ciudades hanseáticas dañó la venta de hierro y cobre y la llegada de sal y otros bienes."},
        {id:"d3v7m3q1",type:"single",visual:"d3Trade",title:"La decisión que incendia la protesta",scene:"Las rutas comerciales empeoran mientras la Corona necesita financiar guerra y gobierno.",prompt:"¿Qué decisión aumentaría más el enfado en Bergslagen?",options:["Mantener impuestos altos y a un funcionario acusado de abusos mientras vender y abastecerse resulta más difícil.","Investigar las denuncias y facilitar que el comercio vuelva a funcionar.","Reparar un puente peligroso para favorecer el paso de mercancías."],answer:0,hint:"Busca la combinación de más costes, menos ingresos y falta de escucha.",success:"CRISIS DE BERGSLAGEN ENTENDIDA",explanation:"Guerra, rutas dañadas, impuestos y abusos locales afectaban la vida cotidiana de mineros, campesinos y comerciantes."}
      ]
    },
    {
      title:"La rebelión del hierro",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:3,time:"7–9 min",action:"Abrir la reclamación",
      sagaOpening:"La crisis económica no explica por sí sola una rebelión. Falta saber quién aplicaba las órdenes del rey y qué se pidió antes de levantarse.",
      opening:"Jösse, también llamado Jens, Eriksson era bailío real en Västerås: cobraba impuestos, administraba bienes y hacía cumplir órdenes.",
      goal:"Identificar la reclamación concreta y seguir cómo la protesta se extendió por fortalezas y ciudades.",
      done:"La etiqueta BANDIDO pierde la causa que intentaba ocultar.",
      closing:"No pedimos un tesoro privado. Pedimos que se investigaran abusos y que la guerra y los impuestos no arruinaran a quienes sostenían la región.",
      sagaClosing:"El informe recupera RECLAMACIÓN y EXPANSIÓN.",
      questions:[
        {id:"d3v7m4c1",type:"explore",visual:"d3Trade",title:"Quién era Jösse Eriksson",scene:"Contexto visible · no es una pregunta.",prompt:"Abre las cuatro funciones y límites de un bailío real.",items:[["Administrador local","Representaba a la Corona lejos de la corte."],["Impuestos","Cobraba pagos y gestionaba bienes reales."],["Denuncias","Las fuentes conservan quejas por cargas duras y abusos."],["Límite de la evidencia","Los detalles más espectaculares pueden ser parciales; el rechazo a su gestión sí está documentado."]],success:"CARGO Y DENUNCIAS ABIERTOS",explanation:"La negativa prolongada del rey a apartarlo o investigar contribuyó a encender la rebelión."},
        {id:"d3v7m4q1",type:"single",visual:"d3Decision",title:"Lo que Engelbrekt reclamaba",scene:"Bergslagen eligió a Engelbrekt como portavoz para llevar quejas concretas al rey.",prompt:"¿Qué petición encaja con esas quejas?",options:["Apartar o investigar al bailío acusado de abusos, escuchar las quejas locales y revisar cargas y rutas comerciales.","Reservar todo el hierro para el tesoro privado de Engelbrekt.","Subir los impuestos sin revisar a quien los cobraba."],answer:0,hint:"Busca soluciones a abusos, impuestos y comercio dañado, no un programa político actual.",success:"RECLAMACIÓN RECUPERADA",explanation:"La protesta tuvo causas y peticiones concretas antes de convertirse en rebelión abierta."},
        {id:"d3v7m4c2",type:"explore",visual:"d3RevoltMap",title:"1434 se mueve por Suecia",scene:"Mapa de expansión · no es una pregunta de ordenar.",prompt:"Abre las cinco señales de la expansión.",items:[["Bergslagen y Dalarna","Mineros, campesinos y rutas interiores organizan la protesta."],["Borganäs y Västerås","El conflicto alcanza fortalezas ligadas a la administración real."],["Ciudades y fortalezas","El movimiento obliga a consejos y élites a negociar."],["Örebro","Engelbrekt obtiene el castillo y su distrito de por vida en 1435."],["Arboga · 1435","Es nombrado jefe militar; también participan campesinos, algo muy poco habitual."]],success:"EXPANSIÓN LOCALIZADA",explanation:"La decisión de V4 sobre qué proteger —puente, documentos o apoyo popular— se conserva como idea: las tres prioridades importaban, pero la historia converge en el control de fortalezas, rutas y apoyos."}
      ]
    },
    {
      title:"El viaje que no terminó",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:2,time:"5–7 min",action:"Seguir el último trayecto",
      sagaOpening:"La siguiente fuente separa lugares documentados de huecos que no debemos rellenar.",
      opening:"En 1436, enfermo, salí hacia una reunión política en Estocolmo. Fui atacado cerca de Göksholm y nunca llegué.",
      goal:"Distinguir el asesinato documentado, sus consecuencias y los detalles que no conocemos.",
      done:"La muerte de Engelbrekt ya no funciona como una conspiración inventada.",
      closing:"No llegué a Estocolmo. Mi muerte no convierte en mentira las causas por las que tanta gente se había movilizado.",
      sagaClosing:"El informe conserva los hechos sin escribir una última frase ficticia.",
      questions:[
        {id:"d3v7m5c1",type:"explore",visual:"d3LastJourney",title:"Örebro no era el destino",scene:"Mapa con tramos documentados y ruta exacta parcialmente incierta.",prompt:"Abre las cuatro señales del viaje.",items:[["Örebro","Punto de salida tras retirarse enfermo al castillo."],["Hjälmaren","Red de agua atravesada durante el trayecto."],["Göksholm","Cerca se produjo el ataque; el agresor identificado fue Måns Bengtsson Natt och Dag."],["Estocolmo","Reunión política a la que Engelbrekt no llegó."]],success:"ÚLTIMO TRAYECTO ABIERTO",explanation:"Conocemos al agresor y el lugar aproximado; no cada palabra, parada o detalle del día."},
        {id:"d3v7m5q1",type:"match",visual:"d3FactLegend",title:"Hecho, consecuencia o relleno inventado",scene:"Tres afirmaciones han sido mezcladas para fabricar una escena más cerrada de lo que permiten las fuentes.",prompt:"Devuelve cada tarjeta a su carpeta.",pairs:[["Engelbrekt fue asesinado en 1436 cerca de Göksholm.","HECHO HISTÓRICO"],["Su muerte debilitó el apoyo popular y abrió una lucha por el poder.","CONSECUENCIA HISTÓRICA"],["Sabemos exactamente qué dijo justo antes de morir.","RELLENO INVENTADO"]],hint:"Una historia puede ser emocionante sin rellenar sus huecos.",success:"HISTORIA Y RELLENO SEPARADOS",explanation:"La tradición sobre restos escondidos en el castillo se mantiene como leyenda posterior, no como prueba."}
      ]
    },
    {
      title:"El rey también puede perder",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:2,time:"5–7 min",action:"Seguir la consecuencia",
      sagaOpening:"Después del asesinato, la crisis continuó. La línea temporal ya está ordenada: ahora debemos interpretar su consecuencia.",
      opening:"Mi rebelión no terminó por sí sola la Unión de Kalmar, pero ayudó a quebrar la autoridad de Erik.",
      goal:"Entender cómo Erik perdió apoyos y fue depuesto sin fingir que la Unión terminó en 1436.",
      done:"La consecuencia política queda separada de una victoria simple o inmediata.",
      closing:"Un rey puede perder cuando rutas, impuestos, consejos, ciudades y aliados dejan de sostenerlo.",
      sagaClosing:"El Informe Engelbrekt recupera su quinta pieza: CONSECUENCIA.",
      questions:[
        {id:"d3v7m6c1",type:"explore",visual:"d3Deposition",title:"De rebelión a destitución",scene:"Línea temporal visible · no es una pregunta de ordenar.",prompt:"Abre los seis cambios en orden.",items:[["1434","La rebelión y los consejos limitan la autoridad de Erik."],["1436","Engelbrekt es asesinado; la crisis continúa."],["1436–1439","Erik se instala en Gotland y rechaza condiciones."],["1439","Dinamarca y Suecia lo deponen."],["1441","Noruega aparta definitivamente a Erik."],["1442","Noruega reconoce a Cristóbal de Baviera, aceptado ya en los tres reinos."]],success:"LÍNEA TEMPORAL LEÍDA",explanation:"La Unión continuó con otro monarca: crisis de Erik y final de la Unión no son el mismo acontecimiento."},
        {id:"d3v7m6q1",type:"single",visual:"d3Deposition",title:"La conclusión que cabe en el informe",scene:"La cronología ya está delante; ahora interpreta qué cambió.",prompt:"¿Qué conclusión es más precisa?",options:["La protesta no resolvió todos los problemas, pero contribuyó a que Erik perdiera apoyos y fuera depuesto; la Unión continuó de otra manera.","La Unión de Kalmar terminó exactamente el día en que murió Engelbrekt.","Un rey no puede perder el trono aunque consejos y regiones dejen de obedecerle."],answer:0,hint:"Separa crisis de un rey, continuidad temporal de la Unión y ruptura definitiva posterior.",success:"CONSECUENCIA POLÍTICA ENTENDIDA",explanation:"No ganó una persona para siempre; cambiaron los límites del rey y quién podía exigir ser escuchado."}
      ]
    },
    {
      title:"Örebro mira hacia sí misma",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:3,time:"durante el paseo",action:"Leer la ciudad actual",
      sagaOpening:"Engelbrekt es una parte de Örebro, no toda la ciudad. Volvemos al presente para leer patrimonio, literatura y cocina con honestidad.",
      opening:"Mi estatua no es mi cara exacta. Os enseña cómo generaciones posteriores quisieron recordarme.",
      goal:"Distinguir fortificación transformada, memoria posterior, edificios trasladados y referencias culturales.",
      done:"La ciudad conserva sin fingir que todo permanece en su lugar original.",
      closing:"Una estatua recuerda; no fotografía. Un edificio puede ser auténtico y haber cambiado de lugar.",
      sagaClosing:"Örebro queda abierta como ciudad de muchas épocas, no como decorado congelado.",
      questions:[
        {id:"d3v7m7c1",type:"explore",visual:"d3City",onsite:true,title:"Castillo, plaza e iglesia",scene:"Visita visual · si no estás allí, el mapa y las fotos ofrecen una alternativa.",prompt:"Abre las siete observaciones del paseo.",items:[["Castillo","Torre inicial, fortaleza medieval, palacio renacentista de cuatro torres y residencia administrativa forman capas distintas."],["Storbron","El puente inmediato conserva la lectura del cruce."],["Stortorget","La plaza alargada reúne estatua e iglesia."],["Estatua","La escultura posterior habla de memoria nacional, no del aspecto exacto de Engelbrekt."],["San Nicolás","Conecta el entierro y memoria de Engelbrekt con otro giro político de 1810."],["Stadsparken","El paseo fluvial conduce hacia Wadköping."],["Wadköping","Edificios históricos reunidos desde 1965."]],success:"VISITA VISUAL ABIERTA",explanation:"La posición del castillo conserva la pregunta defensiva original; su fachada y las formas de recuerdo pertenecen también a épocas posteriores."},
        {id:"d3v7m7q1",type:"single",visual:"d3Wadkoping",onsite:true,title:"Una ciudad puede conservar sin fingir",scene:"Las casas parecen formar una calle intacta desde hace siglos.",prompt:"¿Qué frase describe mejor Wadköping?",options:["Es un conjunto inaugurado en 1965 con edificios históricos trasladados desde Örebro y su entorno.","Es una calle vikinga intacta desde el año 900.","Es un decorado sin edificios históricos creado para una película."],answer:0,hint:"Un edificio puede ser auténtico aunque haya viajado.",success:"PATRIMONIO LEÍDO CON HONESTIDAD",explanation:"Wadköping fue antes una ciudad literaria de Hjalmar Bergman y después dio nombre al conjunto urbano actual."},
        {id:"d3v7m7c2",type:"explore",visual:"d3Cajsa",title:"Imagen, cocina y una frase útil",scene:"Tarjetas de ciudad · no son un examen.",prompt:"Abre las tres tarjetas.",items:[["Hjalmar Bergman","Escritor de novelas, teatro y cine; no era Ingmar Bergman."],["Cajsa Warg","Publicó un recetario influyente en 1755; «se toma lo que se tiene» es una atribución popular, no su lema literal."],["Var kan vi parkera?","Significa «¿Dónde podemos aparcar?». Es una tarjeta práctica de sueco actual y no se puntúa la pronunciación."]],success:"TARJETAS DE CIUDAD GUARDADAS",explanation:"La comparación con una figura culinaria actual como Jordi Cruz o MasterChef ayuda a imaginar su influencia, sin igualar medios ni épocas."}
      ]
    },
    {
      title:"Una ciudad, dos giros de poder",speaker:"Engelbrekt",photo:"engelbrekt-statue-orebro.jpg",keys:3,time:"5–7 min",action:"Cerrar el informe",
      sagaOpening:"Örebro aparece de nuevo casi cuatro siglos después. La conexión es la ciudad, no un mismo acontecimiento.",
      opening:"Mi crisis pertenece al siglo XV. La elección de Bernadotte como heredero pertenece a 1810. No mezcléis los siglos para hacer una historia más fácil.",
      goal:"Distinguir las dos crisis políticas y devolver la carretera a Tiveden.",
      done:"El Informe Engelbrekt queda completo y la ruta continúa hacia el bosque.",
      closing:"Gracias por seguir las causas en lugar de aceptar una etiqueta. Conservad el informe, no una leyenda perfecta sobre mí.",
      sagaClosing:"La acusación BANDIDO queda retirada. La evidencia abre la coordenada de Tiveden.",
      questions:[
        {id:"d3v7m8c1",type:"explore",visual:"d3Church",title:"La iglesia y dos fechas",scene:"Contexto visible · el detalle completo de 1809–1819 se reserva para el Día 5.",prompt:"Abre los dos giros políticos.",items:[["1434–1435","La rebelión convierte Örebro y su castillo en una pieza de la crisis del rey Erik."],["1810","Los cuatro estamentos reunidos en Örebro eligen a Jean Baptiste Bernadotte como heredero sueco."]],success:"DOS FECHAS SITUADAS",explanation:"España estaba en guerra contra José Bonaparte; Suecia buscaba heredero en una Europa de alianzas cambiantes. No eran la misma situación."},
        {id:"d3v7m8q1",type:"single",visual:"d3Succession",title:"La tarjeta que une sin confundir",scene:"Misma ciudad no significa mismo siglo.",prompt:"¿Qué frase une las dos fechas con precisión?",options:["Örebro fue importante en una crisis medieval ligada a Engelbrekt y, casi cuatro siglos después, en la elección de Bernadotte; son hechos distintos conectados por la ciudad.","Engelbrekt eligió a Bernadotte como heredero en 1434.","Napoleón construyó el castillo medieval para controlar Bergslagen."],answer:0,hint:"La conexión es espacial y política, no una misma historia.",success:"ÖREBRO COMO NODO POLÍTICO ENTENDIDO",explanation:"El desarrollo completo de la pérdida de Finlandia y Karlsborg llegará en el Día 5, evitando repetirlo aquí."},
        {id:"d3v7m8c2",type:"explore",visual:"d3FinalRoute",title:"La carretera vuelve al bosque",scene:"Mapa real y transición · no es una pregunta.",prompt:"Abre las cuatro piezas del informe antes de entrar en Tiveden.",items:[["PUENTE","Örebro creció en un cruce de agua y caminos."],["HIERRO","Bergslagen dependía de rutas comerciales y abastecimiento."],["CASTILLO","Fortalezas, funcionarios y apoyos sostenían o limitaban al rey."],["BOSQUE","Tiveden guarda el siguiente cuaderno, entre Vänern y Vättern."]],success:"INFORME ENGELBREKT COMPLETO",explanation:"La contraseña geográfica de V4 se conserva como resumen del recorrido y ahora conduce a una evidencia histórica explícita.",finalSignal:true}
      ]
    }
  ],
  ending:[
    {image:"saga-canal-asegurado.png",caption:"Saga · transmisión del Atlas",k:"SAGA · INFORME RECUPERADO",title:"Engelbrekt no era un bandido sin causa",html:`<p>Örebro concentraba rutas, comercio, impuestos y defensa. La guerra dañó el sistema económico de Bergslagen; las denuncias contra un funcionario y la falta de respuesta del rey encendieron una protesta que terminó cuestionando su autoridad.</p><p class="lead">La Sombra ha perdido una etiqueta fácil.</p>`,action:"Devolver la palabra a Engelbrekt"},
    {image:"engelbrekt-statue-orebro.jpg",caption:"Engelbrekt · figura histórica · reconstrucción narrativa",k:"ENGELBREKT · CIERRE DEL INFORME",title:"Conservad las causas, no una leyenda perfecta",html:`<p>No fui un héroe sin límites y no necesito una frase inventada. Basta con no ocultar qué reclamábamos, por qué nos siguieron y qué cambió cuando un rey perdió sus apoyos.</p><p class="lead">Ahora seguid la ruta hacia Tiveden.</p>`,action:"Abrir la siguiente coordenada"},
    {image:"saga-canal-asegurado.png",caption:"Saga · siguiente coordenada",k:"PREGUNTA ABIERTA",title:"¿Qué gana La Sombra al llamar bandido a quien protesta?",html:`<div class="coordinate">INFORME · ENGELBREKT<br>ETIQUETA BANDIDO · RETIRADA<br>SIGUIENTE RUTA · TIVEDEN</div><p>Alguien dejó en el bosque un cuaderno que mezcla roca, agua, fuego y leyenda.</p><p class="lead">Mañana separaremos mito y realidad.</p>`,action:"Cerrar el canal"}
  ]
};
