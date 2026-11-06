import type { LawSourceRef, TopicDepth } from './law-depth-contract';
import type { LawTopic } from './rules-directory-v1';

const source = (
  esSection: string, enSection: string, esPages: string, enPages: string,
  esStart: number, enStart: number,
): LawSourceRef => ({
  section: { es: esSection, en: enSection },
  pages: { es: esPages, en: enPages },
  startPage: { es: esStart, en: enStart },
});

const withProtocol = (ref: LawSourceRef, esLabel: string, enLabel: string, page: number): LawSourceRef => ({
  ...ref,
  supplemental: { label: { es: esLabel, en: enLabel }, startPage: { es: page, en: page } },
});

export const playersRefereeTimeTopics202627: readonly LawTopic[] = [
  {
    slug: 'substitution-procedure', lawsEdition: 'IFAB-2026-27', primaryLaw: 3,
    title: { es: 'Procedimiento de sustitución', en: 'Substitution procedure' },
    scope: { es: 'Seguí los cupos, la salida y el ingreso autorizado del suplente.', en: 'Follow allowances, departure and the substitute’s authorised entry.' },
    explanation: { es: 'El reglamento de competición determina los cupos aplicables. En cada cambio, el jugador sale antes de que el suplente ingrese con permiso; la demora en salir puede postergar ese ingreso.', en: 'Competition rules set the applicable allowances. For each change, the player leaves before the substitute enters with permission; a delayed exit can postpone that entry.' },
    concepts: [
      { es: 'Cupos y oportunidades según la competición', en: 'Allowances and opportunities depend on the competition' },
      { es: 'Salida antes del ingreso por la línea central', en: 'Departure before entry at the halfway line' },
      { es: 'Demora: un minuto de juego y primera interrupción', en: 'Delay: one minute of play and the first stoppage' },
    ],
    sourceSection: { es: 'Regla 3.2–3 · Suplentes y procedimiento; protocolo de sustitución', en: 'Law 3.2–3 · Substitutes and procedure; substitution protocol' },
    sourcePages: { es: '63–66; protocolo 22–23', en: '59–62; protocol 22–23' },
  },
  {
    slug: 'players-and-extra-persons', lawsEdition: 'IFAB-2026-27', primaryLaw: 3,
    title: { es: 'Jugadores y personas adicionales', en: 'Players and extra persons' },
    scope: { es: 'Identificá quién entró, si interfirió y qué consecuencia corresponde.', en: 'Identify who entered, whether they interfered and the appropriate consequence.' },
    explanation: { es: 'La presencia de una persona adicional no resuelve por sí sola la reanudación ni la validez de un gol. Importan su relación con el equipo, la interferencia y el momento en que se detecta.', en: 'An extra person’s presence alone does not determine the restart or whether a goal counts. Their team relationship, interference and the moment of discovery matter.' },
    concepts: [
      { es: 'Jugador, suplente, oficial o agente externo', en: 'Player, substitute, official or outside agent' },
      { es: 'Interferencia distinta de mera presencia', en: 'Interference differs from mere presence' },
      { es: 'Gol evaluado según equipo y participación', en: 'Goal assessed by team and involvement' },
    ],
    sourceSection: { es: 'Regla 3.7–9 · Personas adicionales y gol', en: 'Law 3.7–9 · Extra persons and goals' },
    sourcePages: { es: '68–70', en: '63–65' },
  },
  {
    slug: 'referee-authority-and-advantage', lawsEdition: 'IFAB-2026-27', primaryLaw: 5,
    title: { es: 'Autoridad arbitral y ventaja', en: 'Referee authority and advantage' },
    scope: { es: 'Relacioná la decisión, la ventaja y el momento de la sanción disciplinaria.', en: 'Connect the decision, advantage and timing of discipline.' },
    explanation: { es: 'El árbitro decide los hechos del juego y puede dejar seguir una infracción si beneficia al equipo perjudicado. La ventaja, la posibilidad de corregir una decisión y la disciplina tienen límites propios.', en: 'The referee decides facts of play and may let an offence pass if the offended team benefits. Advantage, changing a decision and discipline each have their own limits.' },
    concepts: [
      { es: 'Decisión final dentro de las Reglas', en: 'Final decision within the Laws' },
      { es: 'Beneficio observado inmediatamente o en pocos segundos', en: 'Benefit observed immediately or within a few seconds' },
      { es: 'Disciplina en la siguiente interrupción cuando corresponde', en: 'Discipline at the next stoppage where required' },
    ],
    sourceSection: { es: 'Regla 5.1–3 · Autoridad, decisiones y facultades', en: 'Law 5.1–3 · Authority, decisions and powers' },
    sourcePages: { es: '81–85', en: '73–76' },
  },
  {
    slug: 'injuries-and-return-to-play', lawsEdition: 'IFAB-2026-27', primaryLaw: 5,
    title: { es: 'Lesiones y regreso al juego', en: 'Injuries and return to play' },
    scope: { es: 'Distinguí la atención, la salida obligatoria y el regreso autorizado.', en: 'Distinguish assessment, required departure and authorised return.' },
    explanation: { es: 'La gravedad determina si se detiene el juego. Cuando corresponde evaluar o tratar al jugador, el protocolo de 2026/27 puede exigir una espera fuera del campo; las excepciones y el permiso arbitral importan.', en: 'Severity determines whether play stops. When a player is assessed or treated, the 2026/27 protocol may require a wait off the field; its exceptions and the referee’s permission matter.' },
    concepts: [
      { es: 'Lesión leve y lesión grave requieren respuestas distintas', en: 'Minor and serious injuries call for different responses' },
      { es: 'Minuto de reloj en marcha solo cuando se activa el protocolo', en: 'Running-clock minute only when the protocol applies' },
      { es: 'Permiso y lugar de reingreso según el balón', en: 'Permission and entry point depend on ball state' },
    ],
    sourceSection: { es: 'Regla 5.3 · Lesiones; protocolo de atención fuera del campo', en: 'Law 5.3 · Injuries; off-field treatment protocol' },
    sourcePages: { es: '83–85; protocolo 24–26', en: '75–76; protocol 24–25' },
  },
  {
    slug: 'periods-and-intervals', lawsEdition: 'IFAB-2026-27', primaryLaw: 7,
    title: { es: 'Periodos e intervalos', en: 'Periods and intervals' },
    scope: { es: 'Ubicá las mitades, el descanso y el efecto de una suspensión definitiva.', en: 'Place the halves, half-time and the effect of abandonment.' },
    explanation: { es: 'El partido ordinario se organiza en dos mitades iguales y un descanso regulado. Un partido suspendido definitivamente tiene un tratamiento separado.', en: 'An ordinary match has two equal halves and a regulated interval. An abandoned match is handled separately.' },
    concepts: [
      { es: 'Dos mitades iguales de 45 minutos como regla general', en: 'Two equal 45-minute halves as the general rule' },
      { es: 'Descanso de hasta quince minutos', en: 'Half-time of no more than fifteen minutes' },
      { es: 'Suspensión definitiva sujeta al reglamento u organizador', en: 'Abandonment governed by competition rules or organiser' },
    ],
    sourceSection: { es: 'Regla 7.1–2, 5 · Periodos, descanso y suspensión', en: 'Law 7.1–2, 5 · Periods, interval and abandonment' },
    sourcePages: { es: '101–102', en: '93–94' },
  },
  {
    slug: 'added-time-and-period-end', lawsEdition: 'IFAB-2026-27', primaryLaw: 7,
    title: { es: 'Tiempo añadido y final del periodo', en: 'Added time and period end' },
    scope: { es: 'Calculá pérdidas, leé el mínimo anunciado y reconocé el penal pendiente.', en: 'Account for lost time, read the announced minimum and recognise a pending penalty.' },
    explanation: { es: 'El árbitro compensa pérdidas de cada periodo. El tiempo mostrado es un mínimo que puede aumentar, y un penal pendiente o repetido prolonga el periodo hasta completarse.', en: 'The referee allows for time lost in each period. The displayed time is a minimum that may grow, and a pending or retaken penalty extends the period until completion.' },
    concepts: [
      { es: 'Pérdidas evaluadas en cada periodo', en: 'Lost time assessed within each period' },
      { es: 'Mínimo anunciado: puede subir, no bajar', en: 'Announced minimum: may rise, cannot fall' },
      { es: 'Penal al final: periodo extendido hasta completarlo', en: 'End-of-period penalty: extension until completed' },
    ],
    sourceSection: { es: 'Regla 7.3–4 · Recuperación y penal al final', en: 'Law 7.3–4 · Allowance and end-of-period penalty' },
    sourcePages: { es: '101–102', en: '93–94' },
  },
];

export const playersRefereeTimeTopicDepths: readonly TopicDepth[] = [
  {
    slug: 'substitution-procedure', number: 3, sections: [
      {
        id: 'allowances-and-opportunities', title: { es: 'Cupos y oportunidades', en: 'Allowances and opportunities' },
        paragraphs: [
          { es: 'La cantidad de suplentes inscritos y de cambios utilizables depende de la competición; no se debe trasladar el cupo de una categoría a otra. En competiciones oficiales puede permitirse hasta cinco cambios y, cuando se aplica ese máximo en la máxima categoría o en selecciones absolutas, cada equipo dispone de tres oportunidades durante el juego además del descanso. Varios cambios del mismo equipo en una interrupción consumen una sola oportunidad.', en: 'The number of named substitutes and changes available depends on the competition; an allowance from one category cannot be assumed for another. Official competitions may permit up to five changes and, where that maximum applies at the top level or for senior national teams, each team has three opportunities during play as well as half-time. Several changes by one team at one stoppage use a single opportunity.' },
        ],
        source: source('Regla 3.2 · Número de sustituciones', 'Law 3.2 · Number of substitutions', '63–65', '59–61', 63, 59),
      },
      {
        id: 'exit-before-entry', title: { es: 'Salir antes de ingresar', en: 'Leave before entry' },
        paragraphs: [
          { es: 'Se informa el cambio al árbitro. El jugador que sale recibe permiso y usa el punto más cercano del límite, salvo que el árbitro indique otro recorrido por seguridad, lesión u otra razón. El suplente espera con el juego detenido: ingresa desde la línea central, después de que el jugador haya salido y solo con la señal arbitral. El cambio queda completado al ingresar.', en: 'The referee is informed of the change. The departing player receives permission and uses the nearest boundary point unless the referee directs another route for safety, injury or another reason. The substitute waits for play to be stopped: they enter at the halfway line, after the player has left and only on the referee’s signal. The change is complete on entry.' },
        ],
        source: source('Regla 3.3 · Procedimiento de sustitución', 'Law 3.3 · Substitution procedure', '65–66', '61–62', 65, 61),
      },
      {
        id: 'departure-clock', title: { es: 'Límite de salida y espera', en: 'Departure limit and wait' },
        paragraphs: [
          { es: 'Los diez segundos para salir comienzan cuando aparece el tablero o, sin tablero, cuando el árbitro señala el cambio; para varios cambios de la misma interrupción, cuentan desde la última indicación. El límite no se aplica cuando no es posible salir a tiempo por seguridad o lesión.', en: 'The ten seconds to leave start when the board is shown or, without a board, when the referee signals the change; for several changes at one stoppage, they run from the final indication. The limit does not apply when safety or injury makes timely departure impossible.' },
          { es: 'Si se excede el límite sin esa excepción, el jugador igualmente sale y el partido se reanuda antes de que entre el suplente. El ingreso solo puede autorizarse en la primera interrupción posterior a un minuto completo de reloj en marcha desde la reanudación. La demora de diez segundos por sí misma no produce una amonestación; esta requiere una demora excesiva adicional de la reanudación.', en: 'If the limit is exceeded without that exception, the player still leaves and play restarts before the substitute enters. Entry may be authorised only at the first stoppage after a full running-clock minute from the restart. Missing the ten-second limit alone does not bring a caution; that requires further excessive delay of the restart.' },
        ],
        source: withProtocol(source('Regla 3.3 y protocolo de sustitución con tiempo limitado', 'Law 3.3 and time-limited substitution protocol', '65–66; protocolo 22–23', '61–62; protocol 22–23', 65, 61), 'Protocolo de sustitución', 'Substitution protocol', 22),
      },
    ],
  },
  {
    slug: 'players-and-extra-persons', number: 3, sections: [
      {
        id: 'status-and-presence', title: { es: 'Identidad y mera presencia', en: 'Identity and mere presence' },
        paragraphs: [
          { es: 'Ante alguien adicional en el campo, primero se identifica si es suplente, jugador sustituido o expulsado, miembro del cuerpo técnico o agente externo. El árbitro ordena su salida cuando se detiene el juego, pero la mera presencia no obliga siempre a detener de inmediato: la interferencia es decisiva para esa interrupción.', en: 'When an extra person is on the field, first identify whether they are a substitute, substituted or sent-off player, team official or outside agent. The referee has them removed when play stops, but presence alone does not always require an immediate whistle: interference determines that stoppage.' },
        ],
        source: source('Regla 3.7 · Personas adicionales en el terreno', 'Law 3.7 · Extra persons on the field', '68–69', '63–64', 68, 63),
      },
      {
        id: 'interference-and-restart', title: { es: 'Interferencia y reanudación', en: 'Interference and restart' },
        paragraphs: [
          { es: 'Si el árbitro detiene por interferencia de un suplente, sustituido, expulsado o miembro del cuerpo técnico, el adversario recibe tiro libre directo o penal según el lugar. Si interfiere un agente externo, se reanuda con balón a tierra. La medida disciplinaria contra una persona del equipo se evalúa aparte; no se convierte toda entrada indebida en la misma reanudación.', en: 'If the referee stops for interference by a substitute, substituted or sent-off player or team official, the opponents receive a direct free kick or penalty according to location. Interference by an outside agent leads to a dropped ball. Discipline for a team person is considered separately; every unauthorised entry does not produce the same restart.' },
          { es: 'El regreso de un jugador que estaba fuera y necesitaba permiso es otra situación. Si vuelve sin él, se le amonesta; la interferencia puede cambiar la reanudación de indirecto a directo o penal.', en: 'A player returning from off the field when permission was required presents another situation. They are cautioned for returning without it; interference may change the restart from indirect to direct or a penalty.' },
        ],
        source: source('Regla 3.7–8 · Personas adicionales y regreso', 'Law 3.7–8 · Extra persons and return', '68–69', '63–64', 68, 63),
      },
      {
        id: 'extra-person-at-goal', title: { es: 'Persona adicional cuando entra un gol', en: 'Extra person when a goal is scored' },
        paragraphs: [
          { es: 'Antes de reanudar después de un gol, el árbitro comprueba quién estaba de más y si afectó la jugada. Si pertenece al equipo que marcó y participó o interfirió, no se concede el gol; tampoco si un agente externo interfirió, salvo las condiciones específicas en que el balón igualmente entra y la interferencia no impide a un defensor jugarlo. Si la persona pertenece al equipo que recibió el gol, o al equipo anotador sin interferir, el gol puede concederse.', en: 'Before restarting after a goal, the referee checks who was extra and whether they affected play. If the person belongs to the scoring team and took part or interfered, the goal is disallowed; an interfering outside agent can also prevent the goal, subject to the specific case where the ball still enters and a defender was not prevented from playing it. If the person belongs to the conceding team, or to the scoring team without interference, the goal may stand.' },
          { es: 'Si la presencia se descubre después de la reanudación, el gol ya no se anula por ese motivo. La persona sigue debiendo salir y el árbitro informa el incidente; el momento de detección cambia lo que puede corregirse.', en: 'If the extra person is discovered after the restart, the goal is no longer disallowed for that reason. The person must still leave and the referee reports the incident; discovery time changes what can be corrected.' },
        ],
        source: source('Regla 3.9 · Gol marcado con persona adicional', 'Law 3.9 · Goal scored with an extra person', '69–70', '65', 69, 65),
      },
    ],
  },
  {
    slug: 'referee-authority-and-advantage', number: 5, sections: [
      {
        id: 'authority-and-decision-limit', title: { es: 'Decidir y corregir', en: 'Decide and correct' },
        paragraphs: [
          { es: 'El árbitro dirige el partido, aplica las Reglas y decide sobre los hechos del juego. Puede corregir una decisión si advierte el error o recibe información de otro oficial antes de la reanudación. Una vez reanudado, por regla general no cambia una decisión de reanudación; la Regla prevé excepciones concretas para revisión y disciplina.', en: 'The referee controls the match, applies the Laws and decides facts of play. A decision may be corrected when the referee recognises an error or receives another official’s information before play restarts. After the restart, a restart decision generally cannot be changed; the Law sets specific review and disciplinary exceptions.' },
        ],
        source: source('Regla 5.1–2 · Autoridad y decisiones', 'Law 5.1–2 · Authority and decisions', '81–82', '73–74', 81, 73),
      },
      {
        id: 'assessing-advantage', title: { es: 'Evaluar la ventaja', en: 'Assess advantage' },
        paragraphs: [
          { es: 'Tras una infracción, se puede dejar continuar si el equipo perjudicado obtiene un beneficio real. Si el beneficio esperado no aparece de inmediato o en pocos segundos, se sanciona la infracción original. La Regla no da un cronómetro fijo: la decisión responde a la situación de juego, no al simple hecho de conservar el balón.', en: 'After an offence, play may continue if the offended team gains a real benefit. If the expected benefit does not materialise immediately or within a few seconds, penalise the original offence. The Law sets no fixed stopwatch: the decision follows the playing situation, rather than possession alone.' },
        ],
        source: source('Regla 5.3 · Ventaja', 'Law 5.3 · Advantage', '82–83', '74–75', 82, 74),
      },
      {
        id: 'discipline-after-advantage', title: { es: 'Disciplina después de dejar seguir', en: 'Discipline after allowing play' },
        paragraphs: [
          { es: 'Dejar seguir no elimina automáticamente una sanción personal. Cuando corresponde amonestar o expulsar por la infracción, el árbitro actúa en la siguiente interrupción. Si aplicó ventaja por una infracción que impedía una ocasión manifiesta de gol, el infractor es amonestado, salvo que el equipo perjudicado marque un gol como resultado de esa ventaja; en ese caso no se impone sanción disciplinaria por esa infracción.', en: 'Allowing play does not automatically remove a personal sanction. When the offence calls for a caution or sending-off, the referee acts at the next stoppage. If advantage was applied to an offence that denied an obvious goal-scoring opportunity, the offender is cautioned unless the non-offending team scores as a result of that advantage; in that case there is no disciplinary sanction for that offence.' },
        ],
        source: {
          ...source('Regla 5.3 · Medidas disciplinarias y ventaja; Regla 12.4 · Ventaja', 'Law 5.3 · Disciplinary action and advantage; Law 12.4 · Advantage', '82–84; Regla 12: 129', '74–76; Law 12: 120', 82, 74),
          supplemental: { label: { es: 'Regla 12.4 · Sanción tras ventaja', en: 'Law 12.4 · Discipline after advantage' }, startPage: { es: 129, en: 120 } },
        },
      },
    ],
  },
  {
    slug: 'injuries-and-return-to-play', number: 5, sections: [
      {
        id: 'assessment-and-stoppage', title: { es: 'Evaluar antes de detener', en: 'Assess before stopping' },
        paragraphs: [
          { es: 'Ante una lesión leve, el árbitro puede esperar a que el balón salga del juego; una lesión grave requiere detenerlo. El protocolo de espera fuera del campo se activa cuando se detiene por una lesión sospechada, ingresa personal médico para evaluar o tratar, o el jugador pide atención. No se impone ese minuto por todo contacto o caída sin esas condiciones.', en: 'For a minor injury, the referee may wait until the ball goes out; a serious injury requires a stoppage. The off-field waiting protocol applies when play is stopped for a suspected injury, medical staff enter to assess or treat, or the player requests care. Every contact or fall does not by itself trigger that minute.' },
        ],
        source: withProtocol(source('Regla 5.3 · Lesiones; protocolo de atención y evaluación', 'Law 5.3 · Injuries; treatment and assessment protocol', '83–84; protocolo 24–25', '75–76; protocol 24–25', 83, 75), 'Protocolo de atención', 'Treatment protocol', 24),
      },
      {
        id: 'treatment-and-exceptions', title: { es: 'Salida, atención y excepciones', en: 'Departure, treatment and exceptions' },
        paragraphs: [
          { es: 'El jugador evaluado o atendido en el campo, o cuya lesión causó la interrupción, normalmente sale y permanece fuera durante un minuto de reloj en marcha después de la reanudación. La lesión de un guardameta, el choque entre compañeros, una lesión grave y la lesión por una infracción física sancionada con amonestación o expulsión son ejemplos de excepciones; las condiciones completas están en la Regla y el protocolo.', en: 'A player assessed or treated on the field, or whose injury caused the stoppage, normally leaves and remains off for one running-clock minute after the restart. A goalkeeper injury, collision between team-mates, serious injury and injury caused by a physical offence punished with a caution or sending-off are examples of exceptions; the Law and protocol set their full conditions.' },
          { es: 'Si un jugador sangra, debe salir hasta que cese el sangrado y se quite la sangre de su indumentaria. Esa condición de seguridad se comprueba aparte de cualquier cálculo del minuto.', en: 'A bleeding player must leave until bleeding stops and blood is removed from the kit. That safety condition is checked separately from any minute calculation.' },
        ],
        source: withProtocol(source('Regla 5.3 · Lesiones y excepciones; protocolo', 'Law 5.3 · Injuries and exceptions; protocol', '83–85; protocolo 24–26', '75–76; protocol 24–25', 83, 75), 'Protocolo de atención', 'Treatment protocol', 24),
      },
      {
        id: 'return-with-permission', title: { es: 'Regreso con permiso', en: 'Return with permission' },
        paragraphs: [
          { es: 'Cumplido el plazo aplicable y resuelta la atención, el jugador espera el permiso arbitral; el minuto no produce un regreso automático. Con el balón en juego, reingresa por una línea lateral. Con el balón fuera de juego, puede hacerlo por cualquier línea de demarcación. El árbitro o sus asistentes pueden comprobar primero que se cumplan las condiciones, incluida la ausencia de sangre.', en: 'Once any applicable wait and treatment are complete, the player waits for the referee’s permission; the minute does not produce automatic re-entry. With the ball in play, they enter from a touchline. With the ball out of play, they may enter from any boundary line. The referee or other officials may first check the conditions, including absence of blood.' },
        ],
        source: withProtocol(source('Regla 5.3 · Reingreso; protocolo de atención fuera del campo', 'Law 5.3 · Re-entry; off-field treatment protocol', '84–85; protocolo 25–26', '76; protocol 25', 84, 76), 'Protocolo de atención', 'Treatment protocol', 25),
      },
    ],
  },
  {
    slug: 'periods-and-intervals', number: 7, sections: [
      {
        id: 'equal-halves', title: { es: 'Dos periodos iguales', en: 'Two equal halves' },
        paragraphs: [
          { es: 'La duración ordinaria es de dos periodos iguales de 45 minutos. Puede acordarse otra duración antes de comenzar únicamente con conformidad del árbitro y ambos equipos y cuando el reglamento de competición lo permita. El tiempo añadido se decide dentro de cada periodo; no convierte las mitades reglamentarias en periodos de duración desigual.', en: 'Ordinarily, a match has two equal 45-minute halves. A different duration may be agreed before kick-off only by the referee and both teams and where competition rules permit it. Added time is assessed within each half; it does not make the prescribed halves unequal.' },
        ],
        source: source('Regla 7.1 · Periodos de juego', 'Law 7.1 · Periods of play', '101', '93', 101, 93),
      },
      {
        id: 'half-time-interval', title: { es: 'Descanso y pausa', en: 'Half-time and break' },
        paragraphs: [
          { es: 'Los jugadores tienen derecho a un descanso de medio tiempo de hasta quince minutos; su duración la establece el reglamento de competición y cambiarla exige permiso del árbitro. Si se disputa prórroga, puede haber una breve pausa para beber de hasta un minuto entre sus dos periodos. Esa pausa no reemplaza ni amplía el descanso del partido ordinario.', en: 'Players are entitled to a half-time interval of no more than fifteen minutes; competition rules set its duration and changing it requires the referee’s permission. If extra time is played, a brief drinks break of no more than one minute may occur between its periods. That break does not replace or enlarge ordinary half-time.' },
        ],
        source: source('Regla 7.2 · Intervalo de medio tiempo', 'Law 7.2 · Half-time interval', '101', '93', 101, 93),
      },
      {
        id: 'abandoned-match', title: { es: 'Partido suspendido definitivamente', en: 'Abandoned match' },
        paragraphs: [
          { es: 'Suspender definitivamente un partido es distinto de detenerlo por una lesión, una sustitución o una demora: ya no se completa en ese momento. La Regla dispone volver a jugarlo, salvo que el reglamento o el organizador de la competición determine otro procedimiento.', en: 'Abandoning a match differs from stopping for an injury, substitution or delay: the match is not completed then. The Law provides for replay unless competition rules or organisers specify another procedure.' },
        ],
        source: source('Regla 7.5 · Partido suspendido definitivamente', 'Law 7.5 · Abandoned match', '102', '94', 102, 94),
      },
    ],
  },
  {
    slug: 'added-time-and-period-end', number: 7, sections: [
      {
        id: 'lost-time-causes', title: { es: 'Qué tiempo se recupera', en: 'What lost time is allowed for' },
        paragraphs: [
          { es: 'En cada periodo, el árbitro compensa tiempo perdido por sustituciones, evaluación o atención de lesiones, demoras, sanciones disciplinarias, pausas médicas permitidas, chequeos y revisiones de VAR, festejos de gol y retrasos significativos de una reanudación. La lista identifica causas; no fija automáticamente una cantidad idéntica por cada cambio o gol.', en: 'In each half, the referee allows for time lost to substitutions, injury assessment or treatment, time-wasting, disciplinary action, permitted medical breaks, VAR checks and reviews, goal celebrations and significant restart delays. The list identifies causes; it does not assign the same automatic amount to every change or goal.' },
        ],
        source: source('Regla 7.3 · Recuperación del tiempo perdido', 'Law 7.3 · Allowance for time lost', '101–102', '93–94', 101, 93),
      },
      {
        id: 'minimum-and-correction', title: { es: 'Mínimo anunciado', en: 'Announced minimum' },
        paragraphs: [
          { es: 'El cuarto árbitro muestra al final del último minuto el mínimo que el árbitro decidió añadir. Si se pierde más tiempo, el árbitro puede aumentarlo, pero no reducir el mínimo anunciado. Un error de cronometraje del primer tiempo no se compensa cambiando la duración del segundo: cada periodo conserva su propia cuenta.', en: 'At the end of the final minute, the fourth official displays the minimum the referee has decided to add. Further loss can increase it, but the announced minimum cannot be reduced. A first-half timing error is not compensated by changing the second half’s duration: each half has its own accounting.' },
        ],
        source: source('Regla 7.3 · Tiempo añadido y corrección', 'Law 7.3 · Added time and correction', '102', '94', 102, 94),
      },
      {
        id: 'pending-penalty', title: { es: 'Penal pendiente al final', en: 'Penalty pending at the end' },
        paragraphs: [
          { es: 'Si al terminar un periodo corresponde ejecutar o repetir un penal, ese periodo se prolonga hasta que el lanzamiento quede completado. La extensión sirve para completar ese lanzamiento y no inicia por sí misma otro periodo de juego.', en: 'If a penalty must be taken or retaken as a period ends, that period is extended until the kick is completed. The extension completes that kick and does not itself start another period of play.' },
        ],
        source: source('Regla 7.4 · Penal al final del periodo', 'Law 7.4 · Penalty at the end of a period', '102', '94', 102, 94),
      },
    ],
  },
];
