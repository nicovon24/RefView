import type { LawSourceRef, TopicDepth } from './law-depth-contract';
import { restartTopicDepths } from './restart-topic-content-v1';
import { outcomeFreeKickTopicDepths } from './outcome-free-kick-topic-content-v1';
import { playersRefereeTimeTopicDepths } from './players-referee-time-topic-content-v1';
import { foundationOfficialsTopicDepths } from './foundation-officials-topic-content-v1';

const source = (
  esSection: string,
  enSection: string,
  esPages: string,
  enPages: string,
  esStart: number,
  enStart: number,
): LawSourceRef => ({
  section: { es: esSection, en: enSection },
  pages: { es: esPages, en: enPages },
  startPage: { es: esStart, en: enStart },
});

const topicDepths: readonly TopicDepth[] = [
  {
    slug: 'challenge', number: 12, sections: [
      {
        id: 'identify-the-offence',
        title: { es: 'Primero: ¿hubo falta?', en: 'First: was there a foul?' },
        paragraphs: [
          { es: 'Una disputa fuerte no es automáticamente una falta. Observá quién juega el balón, la trayectoria, el punto de contacto y el efecto sobre el adversario. Dar una patada, zancadillear, empujar, cargar o entrar contra un rival puede ser infracción si la acción es imprudente, temeraria o usa fuerza excesiva.', en: 'A strong challenge is not automatically a foul. Observe who plays the ball, the path, point of contact and effect on the opponent. Kicking, tripping, pushing, charging or challenging an opponent can be an offence when careless, reckless or using excessive force.' },
          { es: 'Si la falta implica contacto físico con un adversario, la respuesta técnica es tiro libre directo. Si la comete un defensor dentro de su propia área penal con el balón en juego, se concede penal. La línea del área forma parte de ella.', en: 'A foul involving physical contact with an opponent is punished with a direct free kick. If a defender commits it in their own penalty area while the ball is in play, award a penalty kick. The penalty-area line belongs to that area.' },
        ],
        source: source('Regla 12.1 · Tiro libre directo', 'Law 12.1 · Direct free kick', '123–124', '115–116', 123, 115),
      },
      {
        id: 'grade-the-force',
        title: { es: 'Después: calificá la intensidad', en: 'Then: assess the force' },
        paragraphs: [
          { es: 'Imprudente significa falta de atención o consideración al disputar: hay falta, sin sanción disciplinaria obligatoria. Temeraria significa ignorar el riesgo o las consecuencias para el rival: además del tiro libre, corresponde amonestación. Con fuerza excesiva significa superar la fuerza necesaria y poner en peligro la integridad del adversario: corresponde expulsión.', en: 'Careless means a lack of attention or consideration in the challenge: it is a foul without mandatory disciplinary sanction. Reckless means disregarding the danger or consequences for the opponent: the free kick is accompanied by a caution. Excessive force means exceeding necessary force and endangering an opponent’s safety: the player is sent off.' },
        ],
        facts: [
          { label: { es: 'Imprudente', en: 'Careless' }, value: { es: 'Falta, sin tarjeta exigida por esa intensidad.', en: 'Foul, with no card required for that level of force.' } },
          { label: { es: 'Temeraria', en: 'Reckless' }, value: { es: 'Falta y tarjeta amarilla.', en: 'Foul and yellow card.' } },
          { label: { es: 'Fuerza excesiva', en: 'Excessive force' }, value: { es: 'Falta y tarjeta roja.', en: 'Foul and red card.' } },
        ],
        source: source('Regla 12.1 · Imprudente, temeraria, fuerza excesiva', 'Law 12.1 · Careless, reckless, excessive force', '123–124', '115–116', 123, 115),
      },
      {
        id: 'serious-foul-play',
        title: { es: 'Entrada que pone en peligro', en: 'Challenge that endangers safety' },
        paragraphs: [
          { es: 'Una entrada o disputa por el balón que pone en peligro la integridad de un adversario o emplea fuerza excesiva constituye juego brusco grave. Una entrada con una o ambas piernas y fuerza excesiva puede serlo desde delante, de lado o desde atrás. El hecho de tocar el balón no borra el riesgo creado por la acción.', en: 'A tackle or challenge for the ball that endangers an opponent’s safety or uses excessive force is serious foul play. A lunge with one or both legs and excessive force may come from the front, side or behind. Touching the ball does not erase the danger created by the challenge.' },
        ],
        source: source('Regla 12.4 · Juego brusco grave', 'Law 12.4 · Serious foul play', '133–134', '124–125', 133, 124),
      },
    ],
  },
  {
    slug: 'handball', number: 12, sections: [
      {
        id: 'boundary-and-deliberate-contact',
        title: { es: 'Qué parte del brazo y qué movimiento', en: 'Which part of the arm and what movement' },
        paragraphs: [
          { es: 'El límite entre hombro y brazo se ubica en la parte inferior de la axila. No todo contacto del balón con mano o brazo es infracción. Primero considerá si el jugador mueve deliberadamente la mano o el brazo hacia el balón; importa la acción, no solo el resultado.', en: 'The boundary between shoulder and arm is the bottom of the armpit. Not every ball-to-hand or arm contact is an offence. First consider whether the player deliberately moves the hand or arm towards the ball; the action matters, not merely the result.' },
        ],
        source: source('Regla 12.1 · Mano', 'Law 12.1 · Handball', '124–125', '116–117', 124, 116),
      },
      {
        id: 'unnatural-bigger-body',
        title: { es: 'Brazo y movimiento corporal', en: 'Arm and body movement' },
        paragraphs: [
          { es: 'También hay infracción cuando la posición de la mano o el brazo agranda el cuerpo de manera no justificable por el movimiento de esa acción concreta. Evaluá la postura al saltar, caer, girar o disputar: un brazo separado no se juzga aislado de la situación, pero asumir una posición antinatural implica asumir el riesgo de que el balón lo toque.', en: 'It is also an offence when the hand or arm makes the body unnaturally bigger, meaning its position is not justified by the body movement for that specific action. Assess posture while jumping, falling, turning or challenging: an extended arm is not judged without context, but an unnatural position carries the risk of ball contact.' },
        ],
        caution: { es: 'Un rebote o una distancia corta no eximen por sí solos una posición antinatural; tampoco convierten automáticamente un contacto en infracción.', en: 'A rebound or short distance does not by itself excuse an unnatural position, nor does it automatically make contact an offence.' },
        source: source('Regla 12.1 · Mano y ampliación del cuerpo', 'Law 12.1 · Handball and making the body bigger', '124–125', '116–117', 124, 116),
      },
      {
        id: 'scorer-and-restart',
        title: { es: 'Gol, reanudación y tarjeta', en: 'Goal, restart and card' },
        paragraphs: [
          { es: 'Si un jugador marca directamente con mano o brazo, incluso de forma accidental, el gol no vale. Tampoco vale si marca inmediatamente después de que el balón le haya tocado su propia mano o brazo. El contacto accidental de otro compañero durante la construcción del ataque no anula por sí solo un gol posterior.', en: 'A goal scored directly with hand or arm does not count, even if the contact was accidental. Nor does a goal scored immediately after the ball touched the scorer’s own hand or arm. Accidental contact by another team-mate during the build-up does not, by itself, cancel a later goal.' },
          { es: 'La infracción de mano se reanuda normalmente con tiro libre directo o penal según el lugar. La tarjeta requiere otro motivo, como cortar un ataque prometedor o evitar una ocasión manifiesta de gol; una mano sancionable no implica automáticamente amonestación.', en: 'A handball offence normally restarts with a direct free kick or penalty according to location. A card needs another basis, such as stopping a promising attack or denying an obvious goal-scoring opportunity; punishable handball does not automatically mean a caution.' },
        ],
        source: source('Regla 12.1 y 12.4 · Mano; medidas disciplinarias', 'Law 12.1 and 12.4 · Handball; disciplinary action', '124–125, 129–133', '116–117, 120–124', 124, 116),
      },
    ],
  },
  {
    slug: 'indirect-free-kick', number: 12, sections: [
      {
        id: 'non-contact-offences',
        title: { es: 'Conductas sin contacto sancionadas', en: 'Punishable non-contact actions' },
        paragraphs: [
          { es: 'Jugar de manera peligrosa supone intentar jugar el balón con riesgo de lesión, incluso propia, y hacer que un adversario cercano desista por temor. Obstaculizar el avance de un rival sin contacto también puede dar libre indirecto cuando el balón no está a distancia de juego. Si la acción se convierte en una falta de contacto, corresponde valorar el libre directo.', en: 'Playing in a dangerous manner means trying to play the ball with a risk of injury, including to oneself, and causing a nearby opponent to refrain for fear of injury. Impeding an opponent without contact can also bring an indirect free kick when the ball is not within playing distance. If the action becomes a contact foul, assess a direct free kick instead.' },
        ],
        source: source('Regla 12.2 · Tiro libre indirecto; juego peligroso; obstaculizar', 'Law 12.2 · Indirect free kick; dangerous play; impeding', '126–127', '118–119', 126, 118),
      },
      {
        id: 'goalkeeper-handling',
        title: { es: 'Restricciones del guardameta', en: 'Goalkeeper handling restrictions' },
        paragraphs: [
          { es: 'Dentro de su área, el guardameta no puede volver a tocar con la mano o el brazo un balón que ya soltó antes de que lo toque otro jugador. Tampoco puede tomar con las manos un pase deliberado con el pie de un compañero ni un saque de banda lanzado directamente por un compañero, salvo que haya golpeado claramente el balón con el pie, o intentado hacerlo, para ponerlo en juego. Fuera de esa excepción, esas infracciones se sancionan con libre indirecto.', en: 'Inside their penalty area, a goalkeeper may not handle the ball again after releasing it before another player touches it. They also may not handle a deliberate kick from a team-mate or a throw-in received directly from a team-mate, unless they clearly kicked or attempted to kick the ball to release it into play. Outside that exception, these offences bring an indirect free kick.' },
          { es: 'Usar un truco deliberado para eludir la restricción del pase al guardameta también es infracción, aunque el guardameta termine tocando o no el balón con las manos. La sanción disciplinaria corresponde a quien inicia el truco.', en: 'A deliberate trick to circumvent the restriction on passes to the goalkeeper is also an offence whether or not the goalkeeper eventually handles the ball. The disciplinary sanction applies to the player who initiates the trick.' },
        ],
        source: source('Regla 12.2 · Infracciones del guardameta', 'Law 12.2 · Goalkeeper offences', '126–128', '118–119', 126, 118),
      },
      {
        id: 'eight-seconds-distinction',
        title: { es: 'Ocho segundos: reanudación distinta', en: 'Eight seconds: a different restart' },
        paragraphs: [
          { es: 'Si el guardameta controla el balón con manos o brazos durante más de ocho segundos en su área, se concede saque de esquina al rival, no libre indirecto. El árbitro indica visualmente los últimos cinco segundos. Sujetar, botar o lanzar el balón al aire manteniendo el control cuenta dentro de ese tiempo.', en: 'If the goalkeeper controls the ball with hands or arms for more than eight seconds in their penalty area, the opponents receive a corner kick, not an indirect free kick. The referee visibly signals the final five seconds. Holding, bouncing or throwing the ball into the air while retaining control counts towards that time.' },
          { es: 'En un libre indirecto, el árbitro mantiene el brazo levantado hasta que otro jugador toque el balón o se detenga la jugada. Un tiro directo a la meta rival sin ese segundo toque no puede ser gol: se concede saque de meta.', en: 'For an indirect free kick the referee keeps an arm raised until another player touches the ball or play stops. A kick directly into the opponents’ goal without that second touch cannot score: award a goal kick.' },
        ],
        source: source('Reglas 12.2 y 13.1 · Ocho segundos; tiro libre indirecto', 'Laws 12.2 and 13.1 · Eight seconds; indirect free kick', '126–128, 141', '118–119, 131', 126, 118),
      },
    ],
  },
  {
    slug: 'disciplinary-sanctions', number: 12, sections: [
      {
        id: 'restart-versus-discipline',
        title: { es: 'Dos decisiones para una misma jugada', en: 'Two decisions for one incident' },
        paragraphs: [
          { es: 'El reinicio responde a la infracción y su lugar; la sanción personal responde a la conducta y al contexto. Una entrada imprudente puede dar libre directo sin tarjeta, una temeraria exige amarilla y una con fuerza excesiva exige roja. También puede haber tarjeta por conducta incorrecta aunque el juego ya estuviera detenido; la reanudación original no cambia por un hecho posterior.', en: 'The restart follows the offence and its location; personal discipline follows conduct and context. A careless challenge can mean a direct free kick without a card, a reckless one requires yellow, and excessive force requires red. Misconduct can also bring a card when play is already stopped; later misconduct does not change the original restart.' },
        ],
        source: source('Regla 12.1 y 12.4 · Faltas y medidas disciplinarias', 'Law 12.1 and 12.4 · Fouls and disciplinary action', '123–124, 128–132', '115–116, 119–123', 123, 115),
      },
      {
        id: 'yellow-and-red',
        title: { es: 'Amonestación y expulsión', en: 'Caution and sending-off' },
        paragraphs: [
          { es: 'Son motivos habituales de amarilla la conducta antideportiva, protestar con palabras o acciones, retrasar una reanudación, no respetar la distancia y entrar o salir sin permiso. Entre los motivos de roja están el juego brusco grave, la conducta violenta, escupir o morder, el lenguaje o gestos ofensivos y recibir una segunda amonestación en el mismo partido.', en: 'Common cautionable offences include unsporting behaviour, dissent by word or action, delaying a restart, failing to respect distance, and entering or leaving without permission. Sending-off offences include serious foul play, violent conduct, spitting or biting, offensive language or gestures, and a second caution in the same match.' },
        ],
        source: source('Regla 12.4 · Infracciones sancionables con amonestación o expulsión', 'Law 12.4 · Cautionable and sending-off offences', '129–133', '120–124', 129, 120),
      },
      {
        id: 'dogso-and-spa',
        title: { es: 'Ataque prometedor y ocasión manifiesta', en: 'Promising attack and obvious opportunity' },
        paragraphs: [
          { es: 'Para una ocasión manifiesta de gol, examiná la distancia a la meta, la dirección de la jugada, la probabilidad de controlar el balón y el número y la posición de defensores. Evitarla mediante falta suele ser roja. Si se concede penal y la falta fue un intento de disputar el balón, puede reducirse a amarilla; sujetar, empujar o no intentar jugarlo no obtiene esa reducción.', en: 'For an obvious goal-scoring opportunity, consider distance to goal, direction of play, likelihood of controlling the ball, and defenders’ number and position. Denying it by a foul usually means red. If a penalty is awarded and the foul was an attempt to play the ball, discipline can reduce to yellow; holding, pushing or no attempt to play the ball does not gain that reduction.' },
          { es: 'Cortar un ataque prometedor mediante infracción normalmente se amonesta. Si el árbitro aplica ventaja en una falta que impedía un ataque prometedor, o concede penal por una falta que intentaba jugar el balón, las excepciones disciplinarias de la Regla deben revisarse antes de mostrar tarjeta.', en: 'Stopping a promising attack with an offence normally brings a caution. If the referee applies advantage to a foul stopping a promising attack, or awards a penalty for a foul attempting to play the ball, check the Law’s disciplinary exceptions before showing a card.' },
        ],
        source: source('Regla 12.4 · Evitar gol u ocasión manifiesta; ataque prometedor', 'Law 12.4 · Denying a goal or obvious opportunity; promising attack', '130–133', '121–124', 130, 121),
      },
    ],
  },
  {
    slug: 'offside-position-and-involvement', number: 11, sections: [
      {
        id: 'freeze-the-moment',
        title: { es: 'Congelá el instante del pase', en: 'Freeze the moment of the pass' },
        paragraphs: [
          { es: 'La referencia es el primer contacto de un compañero que juega o toca el balón; para un lanzamiento con la mano del guardameta, el último contacto. El atacante está en posición adelantada solo si parte de su cabeza, tronco o piernas está en la mitad rival, sin contar la línea central, y más cerca de la meta que tanto el balón como el penúltimo adversario. Manos y brazos no cuentan; estar a la misma altura no es posición adelantada.', en: 'Use the first contact when a team-mate plays or touches the ball; for a goalkeeper’s hand throw, use the last contact. An attacker is in offside position only if part of the head, body or legs is in the opponents’ half, excluding halfway, and nearer goal than both the ball and second-last opponent. Hands and arms do not count; being level is not offside position.' },
        ],
        source: source('Regla 11.1 · Posición de fuera de juego', 'Law 11.1 · Offside position', '117', '109', 117, 109),
      },
      {
        id: 'involvement',
        title: { es: 'Luego observá la intervención', en: 'Then observe involvement' },
        paragraphs: [
          { es: 'La posición por sí sola no se sanciona. Hay infracción cuando el jugador participa en el juego tocando el balón enviado por un compañero, interfiere en un adversario —por ejemplo, obstruye claramente la visión o disputa el balón— o gana ventaja de un rebote, desvío o salvada. La decisión se toma cuando ocurre esa intervención, aunque la posición se haya fijado antes.', en: 'Position alone is not punished. An offence occurs when the player interferes with play by touching a team-mate’s ball, interferes with an opponent, for example by clearly blocking vision or challenging for the ball, or gains an advantage from a rebound, deflection or save. Decide at involvement, although the position was fixed earlier.' },
          { es: 'Una jugada deliberada y controlable del defensor puede iniciar una fase nueva; una salvada o un desvío no borra la posición anterior. Si el atacante recibe directamente un saque de meta, banda o esquina, no hay infracción de fuera de juego.', en: 'A defender’s deliberate, controllable play may start a new phase; a save or deflection does not erase the earlier position. There is no offside offence on receiving directly from a goal kick, throw-in or corner kick.' },
        ],
        source: source('Regla 11.2–3 · Infracción; situaciones sin infracción', 'Law 11.2–3 · Offside offence; no offence', '117–119', '109–111', 117, 109),
      },
      {
        id: 'decision-and-restart',
        title: { es: 'Lugar y resultado de la decisión', en: 'Location and consequence' },
        paragraphs: [
          { es: 'El tiro libre indirecto se ejecuta donde el jugador adelantado intervino, incluso si regresó a su propia mitad antes de hacerlo. Si un defensor comete una falta contra ese atacante antes de su intervención, evaluá primero esa falta: todavía no se había consumado la infracción de fuera de juego.', en: 'The indirect free kick is taken where the offside player became involved, even if they returned to their own half before doing so. If a defender fouls that attacker before involvement, assess that foul first: the offside offence had not yet occurred.' },
        ],
        source: source('Regla 11.4 · Infracciones y sanciones', 'Law 11.4 · Offences and sanctions', '119–120', '111–112', 119, 111),
      },
    ],
  },
  {
    slug: 'penalty-procedure', number: 14, sections: [
      {
        id: 'setup-before-signal',
        title: { es: 'Preparación antes de la señal', en: 'Set-up before the signal' },
        paragraphs: [
          { es: 'El balón debe estar inmóvil y tocar o sobresalir parcialmente del centro del punto penal. Se identifica al ejecutor. El guardameta se ubica entre los postes, sobre la línea de meta y frente al ejecutor. Los demás jugadores esperan dentro del campo, fuera del área penal, detrás del punto y a 9,15 m como mínimo. El árbitro da la señal cuando todos ocupan su posición.', en: 'The stationary ball must touch or partly overhang the centre of the penalty mark. Identify the kicker. The goalkeeper stands between the posts, on the goal line, facing the kicker. All other players remain on the field, outside the penalty area, behind the mark and at least 9.15 m away. The referee signals when everyone is positioned.' },
        ],
        source: source('Regla 14.1 · Procedimiento', 'Law 14.1 · Procedure', '145–146', '135–136', 145, 135),
      },
      {
        id: 'kick-and-encroachment',
        title: { es: 'Ejecución y adelantamiento', en: 'Kick and encroachment' },
        paragraphs: [
          { es: 'El ejecutor patea hacia delante; se permite el tacón si el balón avanza. En el momento del golpeo, al menos una parte de un pie del guardameta toca la línea de meta, está alineada con ella o detrás. El balón entra en juego al ser pateado y moverse claramente; el ejecutor espera otro toque antes de volver a jugarlo.', en: 'The kicker plays the ball forward; a backheel is permitted if the ball moves forward. At the kick, at least part of one goalkeeper foot touches, is in line with or is behind the goal line. The ball is in play when kicked and clearly moving; the kicker must wait for another player’s touch before playing it again.' },
          { es: 'El adelantamiento de otro jugador se sanciona cuando afecta claramente al adversario correspondiente o cuando juega o disputa el rebote y altera la jugada. La infracción del guardameta que evita un gol puede obligar a repetir; el resultado también depende de si su acción afectó claramente al ejecutor. No todo paso temprano produce repetición automática.', en: 'Another player’s encroachment is penalised when it clearly affects the relevant opponent or when that player plays or challenges for the rebound and changes the play. A goalkeeper offence that prevents a goal may require a retake; the outcome also depends on whether it clearly affected the kicker. Not every early step automatically means a retake.' },
        ],
        source: source('Regla 14.1–2 · Procedimiento; infracciones y sanciones', 'Law 14.1–2 · Procedure; offences and sanctions', '145–149', '135–139', 145, 135),
      },
      {
        id: 'double-touch-and-feint',
        title: { es: 'Doble toque y amague', en: 'Double touch and feinting' },
        paragraphs: [
          { es: 'Si el ejecutor golpea accidentalmente el balón con ambos pies a la vez, o el balón toca su pierna de apoyo inmediatamente después del remate, se repite si entra directamente. Si no entra, se concede libre indirecto, salvo que el guardameta también haya cometido una infracción: en ese caso se repite. Un segundo toque deliberado antes de otro jugador produce libre indirecto, o libre directo si constituye mano sancionable.', en: 'If the kicker accidentally strikes the ball with both feet at once, or it immediately touches the standing leg after the kick, retake if it goes directly into goal. If it does not, award an indirect free kick unless the goalkeeper also committed an offence; then retake. A deliberate second touch before another player touches it brings an indirect free kick, or a direct free kick if it is a punishable handball.' },
          { es: 'Se puede amagar durante la carrera; amagar el golpeo una vez terminada la carrera es infracción y amonestación. Cambiar de ejecutor después de la señal también se sanciona: hay que identificarlo antes de ejecutar.', en: 'Feinting during the run-up is permitted; feinting the kick after the run-up is complete is an offence and a caution. Changing the kicker after the signal is also punished: the kicker must be identified before the kick.' },
        ],
        source: source('Regla 14.2–3 · Infracciones y resumen', 'Law 14.2–3 · Offences and summary', '146–150', '136–139', 146, 136),
      },
    ],
  },
  ...restartTopicDepths,
  ...outcomeFreeKickTopicDepths,
  ...playersRefereeTimeTopicDepths,
  ...foundationOfficialsTopicDepths,
];

export function getTopicDepth(slug: string): TopicDepth {
  const topic = topicDepths.find((entry) => entry.slug === slug);
  if (!topic) throw new Error(`Missing topic ${slug} depth`);
  return topic;
}
