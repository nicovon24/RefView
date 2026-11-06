import type { LawSourceRef, TopicDepth } from './law-depth-contract';
import type { LawTopic } from './rules-directory-v1';

const source = (esSection: string, enSection: string, esPages: string, enPages: string, esStart: number, enStart: number): LawSourceRef => ({
  section: { es: esSection, en: enSection },
  pages: { es: esPages, en: enPages },
  startPage: { es: esStart, en: enStart },
});

export const foundationOfficialsTopics202627: readonly LawTopic[] = [
  {
    slug: 'field-markings-and-areas', lawsEdition: 'IFAB-2026-27', primaryLaw: 1,
    title: { es: 'Líneas y áreas del campo', en: 'Field markings and areas' },
    scope: { es: 'Ubicá los límites, las medidas y el efecto de una acción sobre una línea.', en: 'Locate boundaries, measurements and the effect of an action on a line.' },
    explanation: { es: 'Las líneas forman parte de las zonas que delimitan. Antes de decidir por una acción cerca del área penal, distinguí la ubicación del contacto de la perspectiva de la cámara.', en: 'Lines belong to the areas they bound. Before deciding an incident near the penalty area, distinguish the location of contact from the camera perspective.' },
    concepts: [
      { es: 'Campo rectangular y rangos de medidas aplicables', en: 'Rectangular field and applicable dimension ranges' },
      { es: 'Áreas de meta y penal con funciones distintas', en: 'Goal and penalty areas serve different purposes' },
      { es: 'La línea del área penal integra el área', en: 'The penalty-area line belongs to the area' },
    ],
    sourceSection: { es: 'Regla 1, apartados 2–7 · Líneas, dimensiones y áreas', en: 'Law 1, sections 2–7 · Markings, dimensions and areas' },
    sourcePages: { es: '49–52', en: '45–48' },
  },
  {
    slug: 'goals-and-field-safety', lawsEdition: 'IFAB-2026-27', primaryLaw: 1,
    title: { es: 'Porterías y seguridad del campo', en: 'Goals and field safety' },
    scope: { es: 'Revisá dimensiones, anclaje y respuesta ante un travesaño dañado.', en: 'Review dimensions, anchoring and the response to a damaged crossbar.' },
    explanation: { es: 'Una portería debe tener las medidas reglamentarias y estar firmemente anclada, incluso si es portátil. Un travesaño roto o desplazado exige detener el juego y resolver si puede repararse.', en: 'A goal must meet the required dimensions and be firmly secured, including when portable. A broken or displaced crossbar requires a stoppage and a decision on whether it can be repaired.' },
    concepts: [
      { es: '7,32 m entre postes y 2,44 m hasta el travesaño', en: '7.32 m between posts and 2.44 m to the crossbar' },
      { es: 'Porterías fijas y portátiles firmemente ancladas', en: 'Fixed and portable goals firmly secured' },
      { es: 'Reparación, balón a tierra o suspensión definitiva', en: 'Repair, dropped ball or abandonment' },
    ],
    sourceSection: { es: 'Regla 1.10 · Porterías', en: 'Law 1.10 · Goals' },
    sourcePages: { es: '54', en: '50' },
  },
  {
    slug: 'ball-specifications-and-checks', lawsEdition: 'IFAB-2026-27', primaryLaw: 2,
    title: { es: 'Características y control del balón', en: 'Ball specifications and checks' },
    scope: { es: 'Separá los requisitos del balón de las marcas exigidas por ciertas competiciones.', en: 'Separate ball requirements from marks required by certain competitions.' },
    explanation: { es: 'La apariencia en una foto no demuestra peso ni presión. El balón utilizado debe cumplir los requisitos de la Regla; en determinadas competiciones se exige además una marca de calidad aprobada.', en: 'Appearance in a photo cannot establish weight or pressure. The match ball must meet the Law’s requirements; certain competitions additionally require an approved quality mark.' },
    concepts: [
      { es: 'Forma, material, circunferencia, peso y presión', en: 'Shape, material, circumference, weight and pressure' },
      { es: 'Marcas de calidad según la competición', en: 'Quality marks depend on the competition' },
      { es: 'Balones de reserva bajo control arbitral', en: 'Spare balls under referee control' },
    ],
    sourceSection: { es: 'Regla 2, apartados 1 y 3 · Características y balones adicionales', en: 'Law 2, sections 1 and 3 · Qualities and additional balls' },
    sourcePages: { es: '59–60', en: '55–56' },
  },
  {
    slug: 'defective-ball-and-replacement', lawsEdition: 'IFAB-2026-27', primaryLaw: 2,
    title: { es: 'Balón defectuoso y reemplazo', en: 'Defective ball and replacement' },
    scope: { es: 'Elegí la reanudación según el momento en que el balón se vuelve defectuoso.', en: 'Choose the restart according to when the ball becomes defective.' },
    explanation: { es: 'El momento de la falla importa: durante el juego, durante una reanudación o mientras avanza un penal. El reemplazo necesita permiso arbitral.', en: 'The timing of a defect matters: during play, at a restart or while a penalty kick moves forward. Replacement requires the referee’s permission.' },
    concepts: [
      { es: 'Falla durante el juego: detener y balón a tierra', en: 'Defect during play: stop and drop the ball' },
      { es: 'Falla al ejecutar una reanudación: repetirla', en: 'Defect while taking a restart: retake it' },
      { es: 'Excepción del penal antes de tocar jugador o marco', en: 'Penalty exception before a player or goal frame is touched' },
    ],
    sourceSection: { es: 'Regla 2.2 · Sustitución de un balón defectuoso', en: 'Law 2.2 · Replacement of a defective ball' },
    sourcePages: { es: '60', en: '56' },
  },
  {
    slug: 'compulsory-and-safe-equipment', lawsEdition: 'IFAB-2026-27', primaryLaw: 4,
    title: { es: 'Equipamiento obligatorio y seguro', en: 'Compulsory and safe equipment' },
    scope: { es: 'Identificá la indumentaria requerida y evaluá objetos peligrosos.', en: 'Identify required kit and assess dangerous items.' },
    explanation: { es: 'La indumentaria básica y la seguridad se revisan por separado. Los accesorios pueden admitirse si no son peligrosos y quedan cubiertos de forma segura; un objeto peligroso debe retirarse.', en: 'Basic kit and safety are separate checks. Accessories may be allowed when they are not dangerous and are safely and securely covered; a dangerous item must be removed.' },
    concepts: [
      { es: 'Camiseta, pantalón, medias, espinilleras y calzado', en: 'Shirt, shorts, socks, shin guards and footwear' },
      { es: 'Accesorios seguros y cubiertos; retirar objetos peligrosos', en: 'Safe covered accessories; remove dangerous items' },
      { es: 'Colores distinguibles y pérdida accidental de equipo', en: 'Distinguishable colours and accidental kit loss' },
    ],
    sourceSection: { es: 'Regla 4, apartados 1–3 · Seguridad, equipamiento y colores', en: 'Law 4, sections 1–3 · Safety, compulsory equipment and colours' },
    sourcePages: { es: '73–75', en: '67–69' },
  },
  {
    slug: 'equipment-offences-and-reentry', lawsEdition: 'IFAB-2026-27', primaryLaw: 4,
    title: { es: 'Infracciones de equipamiento y regreso', en: 'Equipment offences and re-entry' },
    scope: { es: 'Seguí la corrección, la inspección y el permiso para volver.', en: 'Follow correction, inspection and permission to return.' },
    explanation: { es: 'Una infracción de equipamiento no obliga a detener el juego de inmediato. Si el jugador sale para corregirla, un miembro del equipo arbitral debe revisar el equipo antes de que el árbitro autorice su regreso.', en: 'An equipment offence does not require an immediate stoppage. If the player leaves to correct it, a match official checks the equipment before the referee permits re-entry.' },
    concepts: [
      { es: 'Corregir sin detención automática', en: 'Correct without an automatic stoppage' },
      { es: 'Inspección antes del regreso autorizado', en: 'Inspection before authorised return' },
      { es: 'Regreso indebido: amonestación y reinicio según interferencia', en: 'Unauthorised return: caution and restart according to interference' },
    ],
    sourceSection: { es: 'Regla 4.6 · Infracciones y sanciones', en: 'Law 4.6 · Offences and sanctions' },
    sourcePages: { es: '78', en: '71' },
  },
  {
    slug: 'assistant-referee-duties', lawsEdition: 'IFAB-2026-27', primaryLaw: 6,
    title: { es: 'Funciones de los árbitros asistentes', en: 'Assistant referee duties' },
    scope: { es: 'Leé las señales de los asistentes dentro de la autoridad del árbitro.', en: 'Read assistant signals within the referee’s authority.' },
    explanation: { es: 'Los asistentes de campo comunican hechos que están en posición de observar: salida del balón, fuera de juego, sustituciones y determinadas situaciones de penal. El árbitro dirige el partido y conserva la decisión final.', en: 'On-field assistants communicate facts they are positioned to observe: the ball leaving play, offside, substitutions and specified penalty situations. The referee controls the match and retains the final decision.' },
    concepts: [
      { es: 'Señal de apoyo, decisión final del árbitro', en: 'Supporting signal, referee’s final decision' },
      { es: 'Límites, fuera de juego y sustituciones', en: 'Boundaries, offside and substitutions' },
      { es: 'Observaciones específicas durante un penal', en: 'Specific observations at a penalty kick' },
    ],
    sourceSection: { es: 'Regla 6, introducción y apartado 1 · Árbitros asistentes', en: 'Law 6, introduction and section 1 · Assistant referees' },
    sourcePages: { es: '93–94', en: '85–86' },
  },
  {
    slug: 'fourth-official-and-video-officials', lawsEdition: 'IFAB-2026-27', primaryLaw: 6,
    title: { es: 'Cuarto árbitro y oficiales de vídeo', en: 'Fourth official and video officials' },
    scope: { es: 'Distinguí tareas de campo y vídeo sin perder la autoridad final del árbitro.', en: 'Distinguish on-field and video tasks while keeping the referee’s final authority clear.' },
    explanation: { es: 'El cuarto árbitro cumple tareas de campo y administración. Cuando se designan VAR y AVAR, trabajan con imágenes dentro del alcance permitido; la mera controversia no convierte una decisión en revisable.', en: 'The fourth official handles on-field and administrative tasks. When VAR and AVAR are appointed, they work with footage within the permitted scope; a debatable call alone is not automatically reviewable.' },
    concepts: [
      { es: 'Sustituciones, equipamiento y tiempo añadido', en: 'Substitutions, equipment and added time' },
      { es: 'VAR y AVAR solo cuando están designados', en: 'VAR and AVAR only when appointed' },
      { es: 'La decisión final pertenece al árbitro', en: 'The referee makes the final decision' },
    ],
    sourceSection: { es: 'Regla 6, introducción y apartados 2 y 5 · Cuarto árbitro y oficiales de vídeo', en: 'Law 6, introduction and sections 2 and 5 · Fourth and video officials' },
    sourcePages: { es: '93–95', en: '85–87' },
  },
];

export const foundationOfficialsTopicDepths: readonly TopicDepth[] = [
  {
    slug: 'field-markings-and-areas', number: 1, sections: [
      {
        id: 'lines-and-dimensions', title: { es: 'Líneas y dimensiones', en: 'Lines and dimensions' },
        paragraphs: [
          { es: 'El terreno es rectangular: las líneas de banda deben ser más largas que las de meta. La longitud ordinaria de banda es de 90–120 m y la anchura de 45–90 m; para partidos internacionales se aplican intervalos más estrechos de 100–110 m y 64–75 m. La competición fija dimensiones dentro del intervalo correspondiente.', en: 'The field is rectangular: touchlines must be longer than goal lines. Ordinary length is 90–120 m and width 45–90 m; international matches use narrower ranges of 100–110 m and 64–75 m. The competition sets dimensions within the relevant range.' },
          { es: 'Las líneas son continuas, no superan 12 cm de ancho y pertenecen a las áreas que delimitan. La anchura de una línea no es una franja neutral entre dos áreas.', en: 'Lines are continuous, no wider than 12 cm and belong to the areas they bound. A line’s width is not neutral space between two areas.' },
        ],
        source: source('Regla 1, apartados 2–4 · Marcación y dimensiones', 'Law 1, sections 2–4 · Markings and dimensions', '49–51', '45–47', 49, 45),
      },
      {
        id: 'marked-areas', title: { es: 'Áreas marcadas', en: 'Marked areas' },
        paragraphs: [
          { es: 'Desde cada poste se marcan 5,5 m hacia afuera y 5,5 m hacia el campo para formar el área de meta; el área penal emplea 16,5 m en ambas direcciones. El punto penal está a 11 m de la línea de meta, centrado entre los postes, y el arco exterior queda a 9,15 m del punto.', en: 'The goal area uses lines 5.5 m outwards from each post and 5.5 m into the field; the penalty area uses 16.5 m in both directions. The penalty mark is 11 m from the goal line, centred between the posts, and the outer arc lies 9.15 m from that mark.' },
          { es: 'El círculo central también tiene radio de 9,15 m; el arco de esquina tiene radio de 1 m. Las medidas de las áreas se toman desde el borde exterior de sus líneas. Los 11 m del punto penal se miden desde su centro hasta el borde posterior de la línea de meta.', en: 'The centre circle also has a 9.15 m radius; the corner arc has a 1 m radius. Area measurements use the outer edge of their lines. The penalty mark’s 11 m is measured from its centre to the back edge of the goal line.' },
        ],
        source: source('Regla 1, apartados 2 y 5–7 · Áreas y marcas', 'Law 1, sections 2 and 5–7 · Areas and marks', '50–52', '46–48', 50, 46),
      },
      {
        id: 'area-boundary-decision', title: { es: 'Decidir sobre el límite', en: 'Deciding at the boundary' },
        paragraphs: [
          { es: 'La línea del área penal forma parte del área: si se comprueba que una acción ocurrió sobre esa línea, se ubica dentro del área. La perspectiva de una imagen en ángulo no basta para fijar el punto preciso de contacto.', en: 'The penalty-area line belongs to the area: if an action is established to have occurred on that line, its location is inside the area. An angled image alone cannot establish the precise point of contact.' },
          { es: 'El área de meta es una zona marcada distinta, dentro del área penal. Identificá cuál línea y cuál zona estás observando antes de aplicar otra Regla a la jugada.', en: 'The goal area is a separate marked zone within the penalty area. Identify the line and zone you are observing before applying another Law to the incident.' },
        ],
        source: source('Regla 1, apartados 2, 5 y 6 · Pertenencia de las líneas y áreas', 'Law 1, sections 2, 5 and 6 · Lines and areas', '50–52', '46–48', 50, 46),
      },
    ],
  },
  {
    slug: 'goals-and-field-safety', number: 1, sections: [
      {
        id: 'goal-dimensions', title: { es: 'Medidas de la portería', en: 'Goal dimensions' },
        paragraphs: [
          { es: 'La portería va en el centro de cada línea de meta. Hay 7,32 m entre las caras interiores de los postes y 2,44 m desde el suelo hasta la cara inferior del travesaño. Postes y travesaño tienen la misma anchura y profundidad, que no superan 12 cm.', en: 'A goal stands at the centre of each goal line. The inside faces of the posts are 7.32 m apart, and the underside of the crossbar is 2.44 m above the ground. Posts and crossbar have equal width and depth, no more than 12 cm.' },
        ],
        source: source('Regla 1.10 · Porterías y medidas', 'Law 1.10 · Goals and dimensions', '54', '50', 54, 50),
      },
      {
        id: 'anchoring-and-safety', title: { es: 'Construcción y anclaje', en: 'Construction and anchoring' },
        paragraphs: [
          { es: 'Los postes y el travesaño deben ser seguros. Tanto una portería fija como una portátil tienen que quedar firmemente ancladas al suelo; el hecho de que la portátil pueda trasladarse no elimina esa exigencia durante el partido.', en: 'Posts and crossbar must be safe. Fixed and portable goals alike must be firmly secured to the ground; being movable does not remove that requirement during a match.' },
          { es: 'Una foto puede sugerir un problema visible, pero no prueba por sí sola el anclaje. La inspección debe confirmar la condición real antes de jugar.', en: 'A photo may suggest a visible problem but cannot by itself prove the anchoring. An inspection must establish the actual condition before play.' },
        ],
        source: source('Regla 1.10 · Seguridad y fijación', 'Law 1.10 · Safety and securing', '54', '50', 54, 50),
      },
      {
        id: 'crossbar-damage', title: { es: 'Travesaño roto o desplazado', en: 'Broken or displaced crossbar' },
        paragraphs: [
          { es: 'Si el travesaño se rompe o se desplaza, el árbitro detiene el juego hasta repararlo o devolverlo a su posición. Tras la reparación, la reanudación es balón a tierra. Si no puede repararse, el partido se suspende definitivamente.', en: 'If the crossbar breaks or is displaced, the referee stops play until it is repaired or restored to position. After repair, play restarts with a dropped ball. If repair is impossible, the match is abandoned.' },
          { es: 'No se reemplaza el travesaño por una cuerda u otro material flexible. La respuesta depende de una portería segura y conforme, no de mantener el juego a cualquier precio.', en: 'A rope or other flexible material cannot replace the crossbar. The response depends on a safe, compliant goal rather than preserving play at any cost.' },
        ],
        source: source('Regla 1.10 · Travesaño dañado', 'Law 1.10 · Damaged crossbar', '54', '50', 54, 50),
      },
    ],
  },
  {
    slug: 'ball-specifications-and-checks', number: 2, sections: [
      {
        id: 'required-ball-properties', title: { es: 'Propiedades exigidas', en: 'Required properties' },
        paragraphs: [
          { es: 'El balón debe ser esférico, de material adecuado, con circunferencia de 68–70 cm y peso de 410–450 g al inicio del partido. Su presión reglamentaria al nivel del mar es de 0,6–1,1 atmósferas. Estas características se verifican; una imagen no permite confirmar peso o presión.', en: 'The ball must be spherical, made of suitable material, 68–70 cm in circumference and 410–450 g at the start of the match. Required pressure at sea level is 0.6–1.1 atmospheres. These properties need checking; an image cannot establish weight or pressure.' },
        ],
        source: source('Regla 2.1 · Características y medidas', 'Law 2.1 · Qualities and measurements', '59', '55', 59, 55),
      },
      {
        id: 'quality-marks', title: { es: 'Marcas de calidad', en: 'Quality marks' },
        paragraphs: [
          { es: 'En competiciones oficiales de la FIFA o las confederaciones, el balón debe llevar una marca de calidad aprobada que indique que superó controles. Las federaciones nacionales también pueden exigirla en sus competiciones. Esa marca se suma a las propiedades básicas requeridas para todo balón de juego.', en: 'Official FIFA or confederation competitions require the ball to carry an approved quality mark indicating that it passed testing. National associations may also require one in their competitions. The mark is additional to the basic properties required of every match ball.' },
        ],
        source: source('Regla 2.1 · Marcas de calidad', 'Law 2.1 · Quality marks', '59–60', '55–56', 59, 55),
      },
      {
        id: 'referee-and-spares', title: { es: 'Control y balones de reserva', en: 'Control and spare balls' },
        paragraphs: [
          { es: 'No se cambia el balón durante el partido sin permiso del árbitro. Pueden colocarse balones adicionales alrededor del campo para evitar demoras si cumplen los requisitos de la Regla; su uso permanece bajo control arbitral.', en: 'The ball is not changed during the match without the referee’s permission. Additional balls may be placed around the field to reduce delays if they meet the Law’s requirements; their use remains under referee control.' },
          { es: 'Que haya un balón de reserva disponible no autoriza a un equipo a incorporarlo por su cuenta ni prueba que tenga la presión correcta.', en: 'Availability of a spare ball does not authorise a team to introduce it on its own or prove that its pressure is correct.' },
        ],
        source: source('Regla 2, apartados 2–3 · Permiso y balones adicionales', 'Law 2, sections 2–3 · Permission and additional balls', '60', '56', 60, 56),
      },
    ],
  },
  {
    slug: 'defective-ball-and-replacement', number: 2, sections: [
      {
        id: 'defect-during-play', title: { es: 'Falla durante el juego', en: 'Defect during play' },
        paragraphs: [
          { es: 'Si el balón se vuelve defectuoso mientras está en juego, el árbitro detiene el partido y lo reanuda con balón a tierra. Debe distinguirse la falla real de una mera sospecha basada en su apariencia o trayectoria.', en: 'If the ball becomes defective during play, the referee stops the match and restarts with a dropped ball. An actual defect must be distinguished from suspicion based only on appearance or flight.' },
        ],
        source: source('Regla 2.2 · Balón defectuoso durante el juego', 'Law 2.2 · Defective ball during play', '60', '56', 60, 56),
      },
      {
        id: 'defect-at-restart', title: { es: 'Falla en una reanudación', en: 'Defect at a restart' },
        paragraphs: [
          { es: 'Si el balón se vuelve defectuoso durante un saque inicial, de meta, de esquina o de banda, un tiro libre o un penal, esa reanudación se repite. La pregunta es cuándo ocurrió el defecto, porque no se aplica automáticamente el balón a tierra a toda falla observada.', en: 'If the ball becomes defective during a kick-off, goal kick, corner kick, throw-in, free kick or penalty kick, that restart is retaken. The timing of the defect matters; a dropped ball is not the automatic answer to every observed failure.' },
        ],
        source: source('Regla 2.2 · Balón defectuoso durante una reanudación', 'Law 2.2 · Defective ball during a restart', '60', '56', 60, 56),
      },
      {
        id: 'penalty-window-and-permission', title: { es: 'Penal y permiso de reemplazo', en: 'Penalty window and replacement permission' },
        paragraphs: [
          { es: 'En un penal o lanzamiento de tanda, si el balón se estropea mientras se mueve hacia delante antes de tocar a un jugador, un poste o el travesaño, se repite el lanzamiento. Esa ventana específica evita tratar toda falla posterior al remate como el mismo supuesto.', en: 'At a penalty kick or shoot-out kick, if the ball becomes defective while moving forward before it touches a player, goalpost or crossbar, the kick is retaken. This specific window prevents treating every later defect as the same case.' },
          { es: 'La sustitución del balón requiere permiso arbitral, incluso cuando hay balones de reserva listos. La disponibilidad material no reemplaza el control del árbitro.', en: 'Replacing the ball requires the referee’s permission even when spares are ready. Physical availability does not replace referee control.' },
        ],
        source: source('Regla 2.2 · Excepción del penal y permiso', 'Law 2.2 · Penalty exception and permission', '60', '56', 60, 56),
      },
    ],
  },
  {
    slug: 'compulsory-and-safe-equipment', number: 4, sections: [
      {
        id: 'compulsory-kit', title: { es: 'Indumentaria obligatoria', en: 'Compulsory kit' },
        paragraphs: [
          { es: 'La indumentaria básica comprende camiseta con mangas, pantalón corto, medias, espinilleras de protección adecuada cubiertas por las medias y calzado. La revisión de los elementos presentes es distinta de comprobar si cada uno resulta seguro.', en: 'Basic equipment comprises a shirt with sleeves, shorts, socks, shin guards offering suitable protection and covered by the socks, and footwear. Checking that each item is present differs from checking that it is safe.' },
        ],
        source: source('Regla 4.2 · Equipamiento obligatorio', 'Law 4.2 · Compulsory equipment', '73–74', '67–68', 73, 67),
      },
      {
        id: 'dangerous-items-and-accessories', title: { es: 'Objetos peligrosos y accesorios', en: 'Dangerous items and accessories' },
        paragraphs: [
          { es: 'Ningún jugador puede usar equipamiento u objetos peligrosos. Los accesorios, incluso los de joyería, pueden admitirse solo si no son peligrosos y quedan cubiertos de manera segura. Un objeto peligroso debe retirarse; taparlo con cinta u otro material no lo vuelve admisible.', en: 'Players must not use dangerous equipment or items. Accessories, including jewellery, may be allowed only if they are not dangerous and are safely and securely covered. A dangerous item must be removed; tape or another covering does not make it acceptable.' },
          { es: 'Se inspecciona a los titulares antes del inicio y a los suplentes antes de que entren. La fotografía de una prenda no demuestra que el objeto oculto sea seguro.', en: 'Starting players are inspected before kick-off and substitutes before entry. A photo of clothing does not establish that a concealed item is safe.' },
        ],
        source: source('Regla 4.1 · Seguridad y accesorios', 'Law 4.1 · Safety and accessories', '73', '67', 73, 67),
      },
      {
        id: 'colours-and-accidental-loss', title: { es: 'Colores y pérdida accidental', en: 'Colours and accidental loss' },
        paragraphs: [
          { es: 'Los equipos deben distinguirse entre sí y de los árbitros; los guardametas también deben distinguirse de los demás. Si ambos guardametas usan el mismo color y no hay otra camiseta, el árbitro permite que el partido se juegue.', en: 'Teams must be distinguishable from each other and from the officials; goalkeepers must also be distinguishable from the others. If both goalkeepers wear the same colour and no alternative shirt is available, the referee allows the match to be played.' },
          { es: 'Si una bota o espinillera se pierde accidentalmente, se repone cuanto antes y, como máximo, antes de la siguiente interrupción. Si el jugador toca el balón o marca antes, esa acción conserva validez.', en: 'If a boot or shin guard is lost accidentally, it must be replaced as soon as possible and no later than the next stoppage. If the player touches the ball or scores before then, that action remains valid.' },
        ],
        source: source('Regla 4, apartados 2–3 · Pérdida y colores', 'Law 4, sections 2–3 · Loss and colours', '73–75', '67–69', 73, 67),
      },
    ],
  },
  {
    slug: 'equipment-offences-and-reentry', number: 4, sections: [
      {
        id: 'correction-without-stoppage', title: { es: 'Corregir sin detener automáticamente', en: 'Correct without an automatic stoppage' },
        paragraphs: [
          { es: 'Una infracción de equipamiento no obliga a detener el juego. El árbitro indica al jugador que corrija el problema; si no lo hizo antes, deberá salir cuando el juego se detenga. Esta secuencia preserva la continuidad sin admitir equipamiento inseguro.', en: 'An equipment offence does not require play to stop. The referee tells the player to correct it; if it has not been corrected, the player must leave when play stops. This sequence preserves continuity without allowing unsafe equipment.' },
        ],
        source: source('Regla 4.6 · Corrección y salida', 'Law 4.6 · Correction and departure', '78', '71', 78, 71),
      },
      {
        id: 'inspection-and-return', title: { es: 'Inspección y regreso', en: 'Inspection and return' },
        paragraphs: [
          { es: 'Antes del regreso, un miembro del equipo arbitral inspecciona el equipamiento corregido. El jugador solo puede volver con permiso del árbitro; este puede autorizar el ingreso con el balón en juego. La inspección y el permiso son pasos distintos.', en: 'Before return, a match official checks the corrected equipment. The player may re-enter only with the referee’s permission, which may be given while the ball is in play. Inspection and permission are separate steps.' },
        ],
        source: source('Regla 4.6 · Revisión y permiso de ingreso', 'Law 4.6 · Inspection and permission to re-enter', '78', '71', 78, 71),
      },
      {
        id: 'unauthorised-return', title: { es: 'Regreso indebido y reanudación', en: 'Unauthorised return and restart' },
        paragraphs: [
          { es: 'El jugador que vuelve sin permiso recibe una amonestación. Si el árbitro detiene solo para amonestarlo, reanuda con tiro libre indirecto desde donde estaba el balón. Si el jugador interfiere en el juego, corresponde tiro libre directo o penal según el lugar de la interferencia.', en: 'A player returning without permission is cautioned. If the referee stops play solely to caution them, the restart is an indirect free kick from where the ball was. If the player interferes with play, a direct free kick or penalty follows according to the place of interference.' },
        ],
        source: source('Regla 4.6 · Amonestación y reanudación', 'Law 4.6 · Caution and restart', '78', '71', 78, 71),
      },
    ],
  },
  {
    slug: 'assistant-referee-duties', number: 6, sections: [
      {
        id: 'team-authority', title: { es: 'Equipo arbitral y autoridad', en: 'Officials and authority' },
        paragraphs: [
          { es: 'Se pueden designar otros miembros del equipo arbitral según la competición. Los oficiales de campo ayudan al árbitro, informan sobre infracciones que ven mejor y registran hechos del partido; trabajan bajo su dirección y la decisión final corresponde al árbitro.', en: 'Other match officials may be appointed according to the competition. On-field officials assist the referee, report offences they see better and record match events; they work under the referee’s direction and the final decision belongs to the referee.' },
          { es: 'La señal de un asistente aporta observación y recomendación, no una decisión independiente que anule al árbitro.', en: 'An assistant’s signal contributes observation and advice; it is not an independent decision that overrides the referee.' },
        ],
        source: source('Regla 6 · Introducción y autoridad de los oficiales', 'Law 6 · Introduction and officials’ authority', '93–94', '85–86', 93, 85),
      },
      {
        id: 'boundary-offside-substitution', title: { es: 'Límites, fuera de juego y cambios', en: 'Boundaries, offside and substitutions' },
        paragraphs: [
          { es: 'Los asistentes indican cuándo el balón salió completamente y qué equipo debe ejecutar saque de esquina, de meta o de banda. También señalan posibles infracciones de fuera de juego, solicitudes de sustitución y supervisan el procedimiento de cambio.', en: 'Assistants indicate when the whole ball has left the field and which team is entitled to a corner kick, goal kick or throw-in. They also signal possible offside offences and substitution requests and supervise the substitution procedure.' },
          { es: 'Un jugador en posición de fuera de juego no comete por eso solo una infracción; la señal debe referirse a una participación sancionable.', en: 'A player in an offside position has not thereby committed an offence; the signal must concern punishable involvement.' },
        ],
        source: source('Regla 6.1 · Árbitros asistentes', 'Law 6.1 · Assistant referees', '94', '86', 94, 86),
      },
      {
        id: 'penalty-observations-and-signals', title: { es: 'Observación de penales y señales', en: 'Penalty observations and signals' },
        paragraphs: [
          { es: 'En un penal, el asistente observa si el guardameta se adelanta antes del golpeo y si el balón cruza la línea de meta. Comunica lo observado al árbitro con una señal clara, incluida la información de gol cuando corresponda.', en: 'At a penalty kick, the assistant observes whether the goalkeeper moves off the line before the kick and whether the ball crosses the goal line. The assistant communicates the observation clearly to the referee, including goal information when relevant.' },
          { es: 'La posición y la visibilidad del asistente condicionan qué puede aportar; la decisión de sancionar o convalidar sigue siendo del árbitro.', en: 'The assistant’s position and visibility shape what they can contribute; the decision to penalise or allow the outcome remains the referee’s.' },
        ],
        source: source('Regla 6.1 · Observaciones del penal', 'Law 6.1 · Penalty observations', '94', '86', 94, 86),
      },
    ],
  },
  {
    slug: 'fourth-official-and-video-officials', number: 6, sections: [
      {
        id: 'fourth-official-tasks', title: { es: 'Tareas del cuarto árbitro', en: 'Fourth official tasks' },
        paragraphs: [
          { es: 'El cuarto árbitro supervisa sustituciones, comprueba equipamiento de jugadores y suplentes, controla balones de reserva y ayuda con el regreso autorizado de quienes salieron. Al final de cada periodo muestra el mínimo de tiempo añadido decidido por el árbitro.', en: 'The fourth official supervises substitutions, checks players’ and substitutes’ equipment, controls spare balls and assists with authorised re-entry. At the end of each period, they display the minimum added time decided by the referee.' },
          { es: 'Estas tareas de campo y administración no transfieren al cuarto árbitro la decisión final sobre hechos del juego.', en: 'These on-field and administrative tasks do not transfer final decisions on match facts to the fourth official.' },
        ],
        source: source('Regla 6.2 · Cuarto árbitro', 'Law 6.2 · Fourth official', '94', '86', 94, 86),
      },
      {
        id: 'var-and-avar-roles', title: { es: 'Funciones de VAR y AVAR', en: 'VAR and AVAR roles' },
        paragraphs: [
          { es: 'Solo cuando se designan oficiales de vídeo, el VAR examina imágenes dentro de las categorías y el umbral de intervención permitidos. El AVAR asiste durante chequeos y revisiones, registra incidentes y problemas técnicos, ayuda en la comunicación y contabiliza tiempo perdido.', en: 'Only when video officials are appointed does the VAR examine footage within the permitted categories and intervention threshold. The AVAR assists during checks and reviews, records incidents and technical problems, helps communication and tracks time lost.' },
          { es: 'Una jugada discutible no basta para abrir una revisión: primero debe encajar en el alcance autorizado. La imagen disponible tampoco cambia por sí sola los hechos ni sustituye la evaluación del árbitro.', en: 'A debatable incident alone is not enough to start a review: it must first fall within the authorised scope. Available footage does not itself change the facts or replace the referee’s judgement.' },
        ],
        source: source('Regla 6.5 · Oficiales de vídeo', 'Law 6.5 · Video match officials', '95', '87', 95, 87),
      },
      {
        id: 'referee-final-authority', title: { es: 'La decisión final', en: 'The final decision' },
        paragraphs: [
          { es: 'Los asistentes, el cuarto árbitro y, si están designados, VAR y AVAR aportan información por vías diferentes. Todos actúan bajo la dirección del árbitro. Después de recibir esa ayuda, la decisión final sigue siendo suya, dentro de los límites de las Reglas.', en: 'Assistants, the fourth official and, if appointed, VAR and AVAR provide information through different means. All act under the referee’s direction. After receiving that help, the final decision remains with the referee, within the limits of the Laws.' },
        ],
        source: source('Regla 6 · Introducción y apartados 2 y 5', 'Law 6 · Introduction and sections 2 and 5', '93–95', '85–87', 93, 85),
      },
    ],
  },
];
