import type { LawDepth } from './law-depth-contract';

export const lawDepth1to8: readonly LawDepth[] = [
  {
    number: 1,
    sections: [
      {
        id: 'surface-lines-dimensions',
        title: { es: 'Superficie, líneas y dimensiones', en: 'Surface, lines and dimensions' },
        paragraphs: [
          { es: 'El campo es rectangular y puede tener superficie natural, artificial autorizada por la competición o híbrida si su reglamento la admite. Las líneas deben ser continuas, seguras y de hasta 12 cm de ancho; forman parte de las zonas que delimitan. Por eso, una acción sobre la línea del área penal se considera dentro de ella.', en: 'The field is rectangular and may have a natural surface, an artificial surface permitted by competition rules, or a hybrid surface if those rules allow it. Lines must be continuous, safe and no wider than 12 cm; they belong to the areas they bound. An action on the penalty-area line is therefore inside that area.' },
          { es: 'La banda mide de 90 a 120 m y debe ser más larga que la línea de meta, que mide de 45 a 90 m. En partidos internacionales rigen rangos más estrechos: 100–110 m de largo y 64–75 m de ancho. La competición elige medidas dentro del rango aplicable; no puede convertir el campo en un cuadrado.', en: 'A touchline is 90–120 m and must be longer than a goal line, which is 45–90 m. International matches use narrower ranges: 100–110 m long and 64–75 m wide. The competition chooses dimensions within the applicable range; it cannot make the field square.' },
        ],
        source: { section: { es: 'Regla 1, apartados 1–4', en: 'Law 1, sections 1–4' }, pages: { es: '49–51', en: '45–47' }, startPage: { es: 49, en: 45 } },
      },
      {
        id: 'marked-areas',
        title: { es: 'Áreas y distancias de referencia', en: 'Areas and reference distances' },
        paragraphs: [
          { es: 'El área de meta se extiende 5,5 m desde cada poste hacia afuera y 5,5 m dentro del campo; el área penal usa 16,5 m en ambas direcciones. El punto penal está a 11 m de la línea de meta, centrado entre los postes. El arco exterior del área penal y el círculo central tienen 9,15 m de radio; el cuarto de círculo de cada esquina tiene 1 m.', en: 'The goal area extends 5.5 m outward from each post and 5.5 m into the field; the penalty area uses 16.5 m in both directions. The penalty mark is 11 m from the goal line, centred between the posts. The outer penalty arc and centre circle have a 9.15 m radius; each corner quarter-circle has a 1 m radius.' },
          { es: 'Estas marcas cumplen funciones diferentes: el área penal determina, entre otras cosas, cuándo una falta de tiro libre directo del defensor puede dar lugar a penal; el área de meta sirve para ubicar ciertas reanudaciones. Las áreas se miden desde el borde exterior de sus líneas. La distancia del punto penal se toma desde su centro hasta el borde posterior de la línea de meta.', en: 'These markings serve different purposes: the penalty area determines, among other things, when a defender’s direct-free-kick offence may lead to a penalty; the goal area locates certain restarts. Areas are measured from the outer edge of their lines. The penalty mark’s distance runs from its centre to the back edge of the goal line.' },
        ],
        source: { section: { es: 'Regla 1, apartados 2 y 5–7', en: 'Law 1, sections 2 and 5–7' }, pages: { es: '50–52', en: '46–48' }, startPage: { es: 50, en: 46 } },
      },
      {
        id: 'goals-safety',
        title: { es: 'Porterías y seguridad', en: 'Goals and safety' },
        paragraphs: [
          { es: 'Cada portería va centrada en su línea de meta. Entre las caras interiores de los postes hay 7,32 m y desde el suelo hasta la parte inferior del travesaño, 2,44 m. Tanto las porterías fijas como las portátiles deben estar firmemente ancladas; sus postes y travesaño no pueden ser peligrosos.', en: 'Each goal is centred on its goal line. The inside faces of the posts are 7.32 m apart and the lower edge of the crossbar is 2.44 m above the ground. Fixed and portable goals must be firmly secured; their posts and crossbar must not be dangerous.' },
          { es: 'Si se rompe o desplaza un travesaño, el árbitro detiene el juego hasta repararlo y reanuda con balón a tierra. Si no puede repararse, el partido debe suspenderse definitivamente; una cuerda no sustituye al travesaño.', en: 'If a crossbar breaks or moves out of place, the referee stops play until it is repaired and restarts with a dropped ball. If it cannot be repaired, the match must be abandoned; a rope cannot replace the crossbar.' },
        ],
        source: { section: { es: 'Regla 1, apartado 10', en: 'Law 1, section 10' }, pages: { es: '53–54', en: '50' }, startPage: { es: 53, en: 50 } },
      },
    ],
  },
  {
    number: 2,
    sections: [
      {
        id: 'ball-specification',
        title: { es: 'Características y control', en: 'Specification and control' },
        paragraphs: [
          { es: 'El balón debe ser esférico, de material adecuado, con circunferencia de 68–70 cm, peso inicial de 410–450 g y presión de 0,6–1,1 atmósferas al nivel del mar. En determinadas competiciones oficiales se exigen además marcas de calidad aprobadas. El árbitro controla su sustitución y el uso de balones de reserva que cumplan las mismas condiciones.', en: 'The ball must be spherical, made of suitable material, 68–70 cm in circumference, 410–450 g at the start and at 0.6–1.1 atmospheres of pressure at sea level. Certain official competitions also require approved quality marks. The referee controls replacements and the use of spare balls meeting the same conditions.' },
        ],
        source: { section: { es: 'Regla 2, apartados 1 y 3', en: 'Law 2, sections 1 and 3' }, pages: { es: '59–60', en: '55–56' }, startPage: { es: 59, en: 55 } },
      },
      {
        id: 'defective-ball',
        title: { es: 'Qué hacer si se deteriora', en: 'When the ball becomes defective' },
        paragraphs: [
          { es: 'Si el balón deja de ser apto mientras está en juego, el árbitro detiene el partido y reanuda con balón a tierra. Si se deteriora al ejecutar un saque de inicio, banda, meta o esquina, un tiro libre o un penal, se repite esa reanudación.', en: 'If the ball becomes unusable during play, the referee stops the match and restarts with a dropped ball. If it becomes defective at a kick-off, throw-in, goal kick, corner kick, free kick or penalty kick, that restart is retaken.' },
          { es: 'Hay una precisión para el penal y la tanda: si se estropea mientras avanza, antes de tocar a un jugador o la portería, se repite el lanzamiento. El equipo no puede cambiar el balón por su cuenta; hace falta permiso arbitral.', en: 'There is a specific rule for a penalty kick and a shoot-out kick: if the ball becomes defective while moving forward, before touching a player or the goal frame, the kick is retaken. A team cannot change the ball on its own; the referee must permit it.' },
        ],
        source: { section: { es: 'Regla 2, apartado 2', en: 'Law 2, section 2' }, pages: { es: '60', en: '56' }, startPage: { es: 60, en: 56 } },
      },
    ],
  },
  {
    number: 3,
    sections: [
      {
        id: 'team-size',
        title: { es: 'Quiénes pueden jugar', en: 'Who may play' },
        paragraphs: [
          { es: 'Cada equipo tiene como máximo once jugadores, incluido un guardameta. La regla general exige al menos siete por equipo para empezar o reanudar; la versión oficial en línea de IFAB aclara excepciones temporales vinculadas con expulsiones temporales y los protocolos de sustitución o atención fuera del campo. Si uno o más jugadores se van deliberadamente y el número cae por debajo de siete durante una jugada, el árbitro puede dejar seguir y aplicar ventaja, pero no reanudar tras la siguiente interrupción mientras falte el mínimo aplicable.', en: 'Each team has at most eleven players, including a goalkeeper. The general rule requires at least seven per team to start or restart; the official IFAB online Law clarifies temporary exceptions for temporary dismissals and the substitution or off-field treatment protocols. If players deliberately leave and the number falls below seven during play, the referee may allow play to continue and apply advantage, but cannot restart after the next stoppage while the applicable minimum is unmet.' },
        ],
        source: { section: { es: 'Regla 3, apartado 1', en: 'Law 3, section 1' }, pages: { es: '63', en: '59' }, startPage: { es: 63, en: 59 }, onlineUpdate: { label: { es: 'Actualización oficial en línea · puede cambiar de edición', en: 'Official online update · edition may change' }, url: { es: 'https://www.theifab.com/es/laws/latest/the-players/', en: 'https://www.theifab.com/laws/latest/the-players/' } } },
      },
      {
        id: 'substitution-allowance',
        title: { es: 'Cupos y oportunidades de sustitución', en: 'Substitution numbers and opportunities' },
        paragraphs: [
          { es: 'En competiciones oficiales se puede autorizar hasta cinco sustitutos utilizados. Cuando la máxima categoría o una selección absoluta usa ese cupo, cada equipo dispone de tres oportunidades durante el juego y puede sustituir también en el descanso. Varios cambios del mismo equipo durante una interrupción cuentan como una sola oportunidad; la competición debe fijar cuántos suplentes se inscriben, entre tres y quince.', en: 'Official competitions may allow up to five substitutes to be used. Where a top-division or senior international competition uses that limit, each team has three opportunities during play and may also substitute at half-time. Multiple changes by one team during the same stoppage use one opportunity; competition rules must set the number of named substitutes, from three to fifteen.' },
          { es: 'En la prórroga se conservan los cambios y oportunidades no usados. Si el reglamento autoriza un suplente adicional en la prórroga, también se agrega una oportunidad. Las sustituciones entre el final del tiempo reglamentario y la prórroga, o durante el intervalo de la prórroga, no consumen una oportunidad.', en: 'Unused substitutes and opportunities carry into extra time. If competition rules allow an additional substitute there, one further opportunity is added. Substitutions between full-time and extra time, or at the extra-time interval, do not use an opportunity.' },
        ],
        source: { section: { es: 'Regla 3, apartado 2', en: 'Law 3, section 2' }, pages: { es: '63–65', en: '59–61' }, startPage: { es: 63, en: 59 } },
      },
      {
        id: 'substitution-procedure',
        title: { es: 'Salida, entrada y límite de diez segundos', en: 'Exit, entry and ten-second limit' },
        paragraphs: [
          { es: 'Hay que comunicar el cambio al árbitro. El jugador sustituido sale con permiso por el punto más cercano de la línea, salvo indicación distinta por seguridad, lesión u otra razón. Debe estar fuera en diez segundos desde que se muestra el tablero, o desde la señal arbitral si no hay tablero. Si hay varios cambios simultáneos, los diez segundos empiezan al indicarse el último.', en: 'The referee must be told of the change. The departing player leaves with permission at the nearest boundary point unless directed elsewhere for safety, injury or another reason. They must be off within ten seconds of the board being shown, or of the referee’s signal if there is no board. For several changes together, the ten seconds begin when the last is indicated.' },
          { es: 'El suplente entra solamente con el juego detenido, por la línea central, después de que el reemplazado haya salido y con señal arbitral. El cambio se completa cuando entra. Si el sustituido excede los diez segundos sin motivo de seguridad o lesión, sale igualmente y el juego se reanuda sin permitir aún la entrada: el suplente espera hasta la primera interrupción posterior a un minuto de juego reanudado. Una amonestación exige además una demora excesiva de más de diez segundos.', en: 'The substitute enters only while play is stopped, at the halfway line, after the replaced player has left and on the referee’s signal. The change is complete on entry. If the departing player exceeds ten seconds without a safety or injury reason, they still leave and play restarts without the substitute entering yet: entry waits until the first stoppage after one minute of resumed play. A caution also requires excessive delay of more than ten seconds.' },
        ],
        source: { section: { es: 'Regla 3, apartados 3 y 5', en: 'Law 3, sections 3 and 5' }, pages: { es: '65–67', en: '61–63' }, startPage: { es: 65, en: 61 } },
      },
      {
        id: 'extra-persons',
        title: { es: 'Personas adicionales en el campo', en: 'Extra persons on the field' },
        paragraphs: [
          { es: 'Si entra un suplente, un sustituido, un expulsado, un miembro del cuerpo técnico o un agente externo, el árbitro solo interrumpe de inmediato cuando interfiere en el juego. Ordena su salida en la interrupción y aplica las medidas disciplinarias que correspondan. Si detuvo por interferencia de alguien de la lista del equipo, la reanudación es tiro libre directo o penal; si fue un agente externo, balón a tierra.', en: 'If a substitute, substituted or sent-off player, team official or outside agent enters, the referee stops play immediately only when that person interferes. The person is removed at the stoppage and any appropriate disciplinary action follows. If play was stopped for interference by someone on the team list, the restart is a direct free kick or penalty; if by an outside agent, it is a dropped ball.' },
        ],
        source: { section: { es: 'Regla 3, apartado 7', en: 'Law 3, section 7' }, pages: { es: '68–69', en: '64–65' }, startPage: { es: 68, en: 64 } },
      },
    ],
  },
  {
    number: 4,
    sections: [
      {
        id: 'safe-equipment',
        title: { es: 'Seguridad antes que accesorios', en: 'Safety before accessories' },
        paragraphs: [
          { es: 'Ningún jugador puede llevar un objeto o prenda peligrosa. Los accesorios son admisibles únicamente si no representan peligro y quedan cubiertos de forma segura; tapar con cinta un objeto peligroso no lo vuelve aceptable. Se inspecciona a los titulares antes del partido y a los suplentes antes de entrar. Quien no retire el objeto sale en la siguiente interrupción; negarse o volver a colocárselo acarrea amonestación.', en: 'No player may wear dangerous equipment or objects. Accessories are allowed only if they are safe and securely covered; taping over a dangerous object does not make it acceptable. Starters are checked before the match and substitutes before entry. A player who does not remove an item must leave at the next stoppage; refusal or putting it back on brings a caution.' },
        ],
        source: { section: { es: 'Regla 4, apartado 1', en: 'Law 4, section 1' }, pages: { es: '73', en: '67' }, startPage: { es: 73, en: 67 } },
      },
      {
        id: 'required-kit-colours',
        title: { es: 'Indumentaria e identificación', en: 'Required kit and identification' },
        paragraphs: [
          { es: 'La indumentaria básica incluye camiseta con mangas, pantalón corto, medias, espinilleras apropiadas cubiertas por las medias y calzado. Los equipos deben distinguirse entre sí y del equipo arbitral; los guardametas también deben distinguirse de los demás. Si ambos guardametas tienen camisetas iguales y no hay repuesto, el árbitro permite jugar.', en: 'Basic kit comprises a sleeved shirt, shorts, socks, appropriately protective shin guards covered by the socks, and footwear. The teams must be distinguishable from each other and the officials; goalkeepers must also stand out from the others. If both goalkeepers have the same shirt colour and no spare, the referee allows the match to go ahead.' },
          { es: 'Si se pierde accidentalmente una bota o una espinillera, hay que recolocarla cuanto antes, como máximo antes de la siguiente interrupción. Un balón jugado o un gol marcado mientras tanto sigue siendo válido.', en: 'If a boot or shin guard is accidentally lost, it must be replaced as soon as possible, no later than the next stoppage. Playing the ball or scoring meanwhile remains valid.' },
        ],
        source: { section: { es: 'Regla 4, apartados 2–3', en: 'Law 4, sections 2–3' }, pages: { es: '73–75', en: '67–69' }, startPage: { es: 73, en: 67 } },
      },
      {
        id: 'equipment-correction',
        title: { es: 'Corrección y regreso', en: 'Correction and return' },
        paragraphs: [
          { es: 'Una infracción de equipamiento no obliga a parar el juego. El árbitro pide la corrección y, si aún hace falta, el jugador sale cuando se detenga el juego. Un miembro del equipo arbitral comprueba el equipamiento antes del regreso, que requiere permiso del árbitro y puede autorizarse con el balón en juego.', en: 'An equipment breach does not require play to stop. The referee requires correction and, if still necessary, the player leaves when play stops. A match official checks the kit before the return, which needs the referee’s permission and may be allowed while the ball is in play.' },
          { es: 'Volver sin permiso se sanciona con amonestación. Si el árbitro detiene el juego solo para esa amonestación, concede tiro libre indirecto donde estaba el balón; si el jugador interfirió, corresponde tiro libre directo o penal desde el lugar de la interferencia.', en: 'Returning without permission brings a caution. If the referee stops play solely for that caution, the restart is an indirect free kick where the ball was; if the player interfered, a direct free kick or penalty is awarded at the interference point.' },
        ],
        source: { section: { es: 'Regla 4, apartado 6', en: 'Law 4, section 6' }, pages: { es: '78', en: '71' }, startPage: { es: 78, en: 71 } },
      },
    ],
  },
  {
    number: 5,
    sections: [
      {
        id: 'authority-decisions',
        title: { es: 'Autoridad y límite para cambiar decisiones', en: 'Authority and limits on changing decisions' },
        paragraphs: [
          { es: 'El árbitro dirige el partido, aplica las Reglas y decide los hechos del juego con su criterio dentro de ellas. Una vez reanudado el juego, en general ya no puede cambiar una decisión errónea sobre la reanudación. Tampoco puede hacerlo tras señalar el final de un periodo y abandonar el campo o suspender definitivamente el partido; la Regla contempla excepciones concretas para revisiones y disciplina.', en: 'The referee controls the match, applies the Laws and judges facts of play within them. Once play has restarted, an incorrect restart decision generally cannot be changed. The same applies after signalling the end of a period and leaving the field or abandoning the match; the Law sets specific exceptions for reviews and discipline.' },
        ],
        source: { section: { es: 'Regla 5, apartados 1–2', en: 'Law 5, sections 1–2' }, pages: { es: '81–82', en: '73–74' }, startPage: { es: 81, en: 73 } },
      },
      {
        id: 'advantage-discipline',
        title: { es: 'Ventaja y disciplina', en: 'Advantage and discipline' },
        paragraphs: [
          { es: 'Ante una infracción, el árbitro puede permitir que continúe el juego si beneficia al equipo perjudicado. Si la ventaja esperada no aparece inmediatamente o en pocos segundos, vuelve a sancionar la infracción o manda repetir la reanudación incorrecta. Cuando coinciden infracciones, pondera sanción, tipo de reanudación, gravedad física y efecto táctico para castigar la más grave.', en: 'After an offence, the referee may let play continue if the offended team benefits. If that benefit does not appear immediately or within a few seconds, the offence is penalised or the incorrect restart retaken. For simultaneous offences, the referee weighs sanction, restart, physical severity and tactical impact to punish the more serious one.' },
          { es: 'El árbitro registra el tiempo y los incidentes, informa a las autoridades y adopta las sanciones personales que correspondan. Los otros miembros del equipo arbitral pueden aportar hechos que el árbitro no vio, pero no sustituyen su decisión final.', en: 'The referee keeps time and records incidents, reports to the authorities and applies the appropriate personal sanctions. Other match officials may provide facts the referee missed, while the final decision remains the referee’s.' },
        ],
        source: { section: { es: 'Regla 5, apartado 3: facultades, ventaja y disciplina', en: 'Law 5, section 3: powers, advantage and discipline' }, pages: { es: '82–83', en: '74–75' }, startPage: { es: 82, en: 74 } },
      },
      {
        id: 'injuries-interference',
        title: { es: 'Lesiones e interferencia', en: 'Injuries and interference' },
        paragraphs: [
          { es: 'Una lesión leve puede esperar hasta que el balón deje de estar en juego; una grave exige detenerlo. Si una lesión causa interrupción o demora, el jugador tratado normalmente sale y no regresa hasta después de un minuto de juego reanudado. Hay excepciones, entre ellas lesiones del guardameta, colisión de compañeros, lesión grave y lesión causada por una infracción física amonestada o sancionada con expulsión.', en: 'A minor injury may wait until the ball goes out of play; a serious one requires play to stop. If an injury causes a stoppage or delay, the treated player normally leaves and cannot return until after one minute of resumed play. Exceptions include goalkeeper injuries, team-mate collisions, serious injury and injury caused by a physical offence punished with a caution or sending-off.' },
          { es: 'Un jugador que sangra debe salir hasta que cese la hemorragia y no haya sangre en su equipamiento. Ante un objeto, animal o balón extra, el árbitro detiene solo si hay interferencia; un silbato de espectador que interfiere lleva a detener y reanudar con balón a tierra.', en: 'A bleeding player must leave until the bleeding stops and the kit has no blood. For an object, animal or extra ball, the referee stops only if it interferes; an interfering spectator whistle calls for a stoppage and dropped-ball restart.' },
        ],
        source: { section: { es: 'Regla 5, apartado 3: lesiones e interferencia externa', en: 'Law 5, section 3: injuries and outside interference' }, pages: { es: '83–85', en: '75–76' }, startPage: { es: 83, en: 75 } },
      },
      {
        id: 'var-scope',
        title: { es: 'Alcance de la asistencia de vídeo', en: 'Scope of video assistance' },
        paragraphs: [
          { es: 'El VAR solo puede utilizarse si la organización cumple los requisitos y tiene permiso escrito de la FIFA. Su intervención se limita a errores claros u incidentes graves inadvertidos sobre gol, penal, roja —incluida una segunda amarilla claramente incorrecta— o confusión de identidad. La competición puede añadir un córner claramente mal concedido si se corrige de inmediato sin retrasar la reanudación. La decisión final sigue siendo del árbitro.', en: 'VAR may be used only when the organiser meets the requirements and has FIFA’s written permission. Intervention is limited to clear errors or serious missed incidents involving goals, penalties, red cards—including a clearly incorrect second caution—or mistaken identity. A competition may add a clearly incorrect corner if it can be corrected immediately without delaying the restart. The referee still makes the final decision.' },
        ],
        source: { section: { es: 'Regla 5, apartado 4', en: 'Law 5, section 4' }, pages: { es: '85–86', en: '77' }, startPage: { es: 85, en: 77 } },
      },
    ],
  },
  {
    number: 6,
    sections: [
      {
        id: 'officials-team',
        title: { es: 'Un equipo, una decisión final', en: 'One team, one final decision' },
        paragraphs: [
          { es: 'Según la competición pueden designarse asistentes, cuarto árbitro, asistentes adicionales, reserva y oficiales de vídeo. Todos ayudan a dirigir el encuentro bajo la dirección del árbitro, quien conserva la decisión final. Los oficiales de campo informan de faltas que observan mejor y registran tiempo, goles e incidentes; la competición debe prever quién reemplaza a un oficial que no puede continuar.', en: 'Depending on the competition, assistants, a fourth official, additional and reserve assistants, and video officials may be appointed. All help manage the match under the referee, who retains the final decision. On-field officials report offences they see more clearly and help record time, goals and incidents; competition rules must specify replacements for an official who cannot continue.' },
        ],
        source: { section: { es: 'Regla 6, introducción', en: 'Law 6, introduction' }, pages: { es: '93–94', en: '85' }, startPage: { es: 93, en: 85 } },
      },
      {
        id: 'assistants-fourth',
        title: { es: 'Asistentes y cuarto árbitro', en: 'Assistants and fourth official' },
        paragraphs: [
          { es: 'Los asistentes señalan cuándo salió completamente el balón y a quién corresponde el saque, posibles infracciones de fuera de juego, solicitudes de sustitución y determinados hechos de un penal. También supervisan las sustituciones. El cuarto árbitro controla el procedimiento de cambio, equipamiento, balones de reserva y regreso autorizado de jugadores; comunica al final de cada periodo el mínimo de tiempo añadido que prevé el árbitro.', en: 'Assistants signal when the whole ball leaves the field and which team restarts, possible offside offences, substitution requests and specified facts at a penalty kick. They also monitor substitutions. The fourth official supervises changes, equipment, spare balls and authorised re-entry; at the end of each period, they show the referee’s intended minimum added time.' },
        ],
        source: { section: { es: 'Regla 6, apartados 1–2', en: 'Law 6, sections 1–2' }, pages: { es: '94', en: '86' }, startPage: { es: 94, en: 86 } },
      },
      {
        id: 'video-officials',
        title: { es: 'Oficiales de vídeo', en: 'Video match officials' },
        paragraphs: [
          { es: 'Cuando hay VAR, este analiza imágenes solo dentro de las categorías y umbrales permitidos; el AVAR le ayuda mientras chequea o revisa, registra incidentes y problemas técnicos, comunica con el árbitro y contabiliza el tiempo perdido. La disponibilidad de vídeo no convierte cada decisión discutible en una revisión.', en: 'Where VAR is used, the VAR examines footage only within the permitted categories and thresholds; the AVAR assists during checks and reviews, records incidents and technical problems, communicates with the referee and tracks time lost. Video availability does not turn every debatable decision into a review.' },
        ],
        source: { section: { es: 'Regla 6, apartado 5', en: 'Law 6, section 5' }, pages: { es: '95', en: '87' }, startPage: { es: 95, en: 87 } },
      },
    ],
  },
  {
    number: 7,
    sections: [
      {
        id: 'halves-interval',
        title: { es: 'Periodos y descanso', en: 'Halves and interval' },
        paragraphs: [
          { es: 'El partido dura dos periodos iguales de 45 minutos. Solo pueden acortarse si árbitro y equipos lo acuerdan antes de empezar y el reglamento de la competición lo permite. El descanso de medio tiempo no supera 15 minutos y su duración la fija la competición; cambiarla requiere permiso arbitral. En el intervalo de la prórroga se permite una pausa breve para beber de hasta un minuto.', en: 'A match has two equal 45-minute halves. They may be shortened only if the referee and both teams agree before kick-off and competition rules allow it. Half-time is no longer than 15 minutes and its duration is set by competition rules; changing it needs the referee’s permission. A short drinks break of up to one minute is allowed at the extra-time interval.' },
        ],
        source: { section: { es: 'Regla 7, apartados 1–2', en: 'Law 7, sections 1–2' }, pages: { es: '101', en: '93' }, startPage: { es: 101, en: 93 } },
      },
      {
        id: 'added-time',
        title: { es: 'Recuperación del tiempo perdido', en: 'Allowance for lost time' },
        paragraphs: [
          { es: 'El árbitro añade en cada periodo el tiempo perdido por sustituciones, atención de lesiones, demoras, disciplina, pausas médicas autorizadas, chequeos y revisiones VAR, celebraciones de gol y retrasos significativos de una reanudación. El cuarto árbitro muestra el mínimo decidido al final del último minuto; el árbitro puede aumentarlo, pero no reducirlo.', en: 'In each half the referee allows for time lost to substitutions, injury assessment, time-wasting, discipline, authorised medical breaks, VAR checks and reviews, goal celebrations and significant restart delays. The fourth official displays the decided minimum at the end of the final minute; the referee may increase it but cannot reduce it.' },
          { es: 'Un error de cronometraje en el primer periodo no se corrige alterando la duración del segundo. El tiempo añadido responde a pérdidas del periodo correspondiente, no a una cifra fija por sustitución o gol.', en: 'A first-half timekeeping error is not corrected by changing the length of the second half. Added time addresses loss within that period, rather than a fixed amount per substitution or goal.' },
        ],
        source: { section: { es: 'Regla 7, apartado 3', en: 'Law 7, section 3' }, pages: { es: '101–102', en: '93–94' }, startPage: { es: 101, en: 93 } },
      },
      {
        id: 'period-end',
        title: { es: 'Penal pendiente y partido suspendido', en: 'Pending penalty and abandoned match' },
        paragraphs: [
          { es: 'Si al final de un periodo debe ejecutarse o repetirse un penal, ese periodo se prolonga hasta completar el lanzamiento. Un partido suspendido definitivamente se vuelve a jugar, salvo que el reglamento o el organizador de la competición determine otro procedimiento.', en: 'If a penalty kick must be taken or retaken at the end of a half, the half is extended until the kick is completed. An abandoned match is replayed unless competition rules or organisers prescribe another procedure.' },
        ],
        source: { section: { es: 'Regla 7, apartados 4–5', en: 'Law 7, sections 4–5' }, pages: { es: '102', en: '94' }, startPage: { es: 102, en: 94 } },
      },
    ],
  },
  {
    number: 8,
    sections: [
      {
        id: 'kick-off-award',
        title: { es: 'Cuándo corresponde un saque inicial', en: 'When a kick-off is taken' },
        paragraphs: [
          { es: 'El saque inicial abre ambos periodos, ambos periodos de la prórroga y el juego posterior a cada gol. El ganador del sorteo elige campo para el primer tiempo o ejecutar el primer saque; el adversario recibe la otra opción. El equipo que eligió campo inicia el segundo tiempo; tras un gol, saca el equipo que lo recibió.', en: 'Kick-off begins both halves, both halves of extra time and play after every goal. The coin-toss winner chooses which goal to attack in the first half or to take the first kick-off; the opponents receive the other choice. The team that chose its first-half goal kicks off the second half; after a goal, the team that conceded takes the kick-off.' },
        ],
        source: { section: { es: 'Regla 8, apartado 1: procedimiento', en: 'Law 8, section 1: procedure' }, pages: { es: '105', en: '97' }, startPage: { es: 105, en: 97 } },
      },
      {
        id: 'kick-off-execution',
        title: { es: 'Posiciones y consecuencias del saque', en: 'Kick-off positions and outcomes' },
        paragraphs: [
          { es: 'El balón permanece inmóvil en el punto central hasta la señal del árbitro. Salvo el ejecutante, todos deben estar en su propio campo y los rivales a 9,15 m o más. Entra en juego al ser pateado y moverse claramente. Puede marcarse directamente en la meta contraria; si entra directamente en la propia, se concede córner.', en: 'The ball stays still on the centre mark until the referee’s signal. Apart from the kicker, all players must be in their own half and opponents at least 9.15 m away. It is in play when kicked and clearly moves. A direct goal against the opponents counts; if it goes directly into the kicker’s own goal, a corner is awarded.' },
          { es: 'Un segundo toque del ejecutante antes de que otro jugador lo toque concede tiro libre indirecto, o directo si el segundo toque es una infracción por mano. Otras infracciones del procedimiento exigen repetir el saque.', en: 'A second touch by the kicker before another player touches the ball gives an indirect free kick, or a direct free kick for a handball offence. Other procedure breaches require the kick-off to be retaken.' },
        ],
        source: { section: { es: 'Regla 8, apartado 1: procedimiento e infracciones', en: 'Law 8, section 1: procedure and offences' }, pages: { es: '105–106', en: '97–98' }, startPage: { es: 105, en: 97 } },
      },
      {
        id: 'dropped-ball',
        title: { es: 'A quién y dónde se da un balón a tierra', en: 'Dropped-ball recipient and place' },
        paragraphs: [
          { es: 'Si el árbitro detiene sin que corresponda otra reanudación y el balón estaba en el área penal, lo deja caer para el guardameta defensor dentro de esa área. Fuera del área, lo recibe un jugador del equipo que habría conservado o ganado la posesión, incluso desde una reanudación probable, si el árbitro puede determinarlo; en caso contrario, el del último equipo que tocó el balón. Se deja caer donde estaba al detenerse el juego, salvo contacto con un árbitro o agente externo: en ese caso, en el lugar de la interferencia.', en: 'If the referee stops play without another prescribed restart and the ball was in the penalty area, it is dropped for the defending goalkeeper there. Outside the area, one player of the team that would have retained or gained possession receives it, including from a likely restart, if the referee can determine that team; otherwise it goes to the team that last touched it. It is dropped where the ball was when play stopped, except after contact with an official or outside agent, when it is dropped at the interference point.' },
          { es: 'Los demás jugadores se mantienen al menos a 4 m hasta que el balón toca el suelo y entra en juego. Se repite si toca a un jugador antes de caer o sale del campo sin tocar a nadie. Si entra en una meta sin tocar al menos a dos jugadores, no hay gol: saque de meta si es la rival y córner si es la propia.', en: 'All other players stay at least 4 m away until the ball touches the ground and enters play. The drop is repeated if it hits a player before landing or leaves the field without touching anyone. If it enters a goal without touching at least two players, there is no goal: a goal kick follows at the opponents’ goal and a corner at the player’s own goal.' },
        ],
        source: { section: { es: 'Regla 8, apartado 2', en: 'Law 8, section 2' }, pages: { es: '106–107', en: '98' }, startPage: { es: 106, en: 98 } },
      },
    ],
  },
];
