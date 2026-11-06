import type { LawDepth, LawSourceRef } from './law-depth-contract';

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

export const lawDepth9to17: readonly LawDepth[] = [
  {
    number: 9,
    sections: [
      {
        id: 'whole-ball-and-stoppage',
        title: { es: 'Cuándo deja de estar en juego', en: 'When play stops' },
        paragraphs: [
          { es: 'Para decidir si salió, observá el balón completo: debe cruzar totalmente la línea de banda o de meta, por el suelo o por el aire. Si todavía se superpone a la línea, continúa en juego. La detención del árbitro también lo deja fuera de juego, aunque siga dentro del campo.', en: 'Judge the entire ball at a boundary: it must wholly cross the touchline or goal line, on the ground or in the air. Any overlap with the line means it remains in play. The referee stopping play also makes the ball out of play, even while it is on the field.' },
        ],
        source: source('Regla 9.1 · Balón no en juego', 'Law 9.1 · Ball out of play', '109', '101', 109, 101),
      },
      {
        id: 'rebounds-and-officials',
        title: { es: 'Rebotes y contactos con árbitros', en: 'Rebounds and match officials' },
        paragraphs: [
          { es: 'Un rebote en un poste, travesaño o banderín no interrumpe el juego si el balón permanece en el campo. Un contacto con un miembro del equipo arbitral tampoco lo interrumpe por sí solo.', en: 'A rebound from a post, crossbar or corner flag does not stop play if the ball stays on the field. Contact with a match official does not automatically stop it either.' },
          { es: 'Si el balón toca a un árbitro y queda en el terreno, se detiene y se da un balón a tierra cuando el contacto genera un ataque prometedor, cambia al equipo en posesión o envía el balón directamente a la portería. Esos efectos, y no cualquier roce, determinan la reanudación especial.', en: 'If the ball hits an official and stays on the field, stop and use a dropped ball when the contact starts a promising attack, changes the team in possession or sends the ball directly into goal. Those outcomes, rather than every touch, trigger the special restart.' },
        ],
        source: source('Regla 9.1–2 · Balón no en juego; balón en juego', 'Law 9.1–2 · Ball out of play; ball in play', '109', '101', 109, 101),
      },
    ],
  },
  {
    number: 10,
    sections: [
      {
        id: 'goal-criteria',
        title: { es: 'Cuándo se concede un gol', en: 'When a goal counts' },
        paragraphs: [
          { es: 'Todo el balón debe atravesar la línea de meta entre los postes y por debajo del travesaño. Además, el equipo que marca no debe haber cometido antes una infracción. Que el balón toque la línea o cruce fuera del marco no alcanza.', en: 'The whole ball must cross the goal line between the posts and below the crossbar, and the scoring team must not have committed an earlier offence. A ball touching the line or crossing outside the goal frame is insufficient.' },
          { es: 'Si el guardameta lanza el balón con la mano directamente al arco rival, la reanudación es saque de meta. Si el árbitro concede erróneamente un gol antes del cruce completo, reanuda con balón a tierra.', en: 'A goalkeeper throwing the ball directly into the opponents’ goal produces a goal kick. If the referee signals a goal before the ball has wholly crossed the line, play restarts with a dropped ball.' },
        ],
        source: source('Regla 10.1 · Gol válido', 'Law 10.1 · Goal scored', '111–112', '103–104', 111, 103),
      },
      {
        id: 'winner-and-draw',
        title: { es: 'Resultado y desempate', en: 'Result and tie breakers' },
        paragraphs: [
          { es: 'Gana quien marca más goles; con igual cantidad, el partido termina empatado. Si la competición exige un vencedor, su reglamento puede combinar goles de visitante, dos períodos suplementarios iguales de hasta 15 minutos cada uno y tanda de penales.', en: 'The team with more goals wins; equal totals produce a draw. Where competition rules require a winner, they may combine away goals, two equal extra-time periods of no more than 15 minutes each and a penalty shoot-out.' },
        ],
        source: source('Regla 10.2 · Equipo ganador', 'Law 10.2 · Winning team', '111', '103', 111, 103),
      },
      {
        id: 'shootout',
        title: { es: 'Tanda de penales', en: 'Penalty shoot-out' },
        paragraphs: [
          { es: 'La tanda ocurre después del partido. Participan quienes estaban habilitados al finalizarlo; un expulsado no puede lanzar. Si un equipo tiene más jugadores habilitados, reduce su número para igualar al rival. Un sorteo fija la portería, sujeto a seguridad o estado del campo, y otro permite elegir quién lanza primero.', en: 'The shoot-out takes place after the match. Eligible players are those entitled to take part at its end; a sent-off player cannot kick. A team with more eligible players reduces its number to match the opponent. One coin toss selects the goal, subject to safety or field conditions; another lets a team choose who kicks first.' },
          { es: 'Los equipos alternan hasta cinco tiros cada uno, salvo que uno ya no pueda ser alcanzado. Si persiste el empate, siguen pares de tiros hasta que uno tenga ventaja tras el mismo número de intentos. Cada habilitado debe lanzar una vez antes de que alguien repita; los goles de la tanda no cambian el marcador del partido.', en: 'Teams alternate up to five kicks each unless one can no longer be caught. If level, paired kicks continue until one team leads after the same number of attempts. Every eligible player must kick before anyone takes a second turn; shoot-out goals do not change the match score.' },
        ],
        source: source('Regla 10.3 · Tanda de penales', 'Law 10.3 · Penalties (penalty shoot-out)', '113–115', '103–107', 113, 103),
      },
    ],
  },
  {
    number: 11,
    sections: [
      {
        id: 'position-at-touch',
        title: { es: 'Posición en el instante correcto', en: 'Position at the relevant touch' },
        paragraphs: [
          { es: 'Estar en posición adelantada no es una infracción. Al toque o jugada de un compañero, se compara cabeza, tronco y piernas del atacante con el balón y el penúltimo adversario: debe estar en la mitad rival, excluida la línea central, y más cerca de la meta rival que ambos. Manos y brazos no cuentan; estar a la misma altura tampoco es posición de fuera de juego.', en: 'An offside position is not itself an offence. At a team-mate’s play or touch, compare the attacker’s head, body and legs with the ball and second-last opponent: the attacker must be in the opponents’ half, excluding halfway, and nearer the opponents’ goal than both. Hands and arms do not count, and being level is not offside position.' },
        ],
        source: source('Regla 11.1 · Posición de fuera de juego', 'Law 11.1 · Offside position', '117', '109', 117, 109),
      },
      {
        id: 'active-involvement',
        title: { es: 'De la posición a la infracción', en: 'From position to offence' },
        paragraphs: [
          { es: 'Solo se sanciona si ese jugador luego participa: toca un balón enviado por un compañero, interfiere claramente con un adversario —por ejemplo, tapándole la visión o disputando el balón—, o aprovecha un rebote, desvío o salvada. Una jugada voluntaria y controlable de un defensor puede iniciar una nueva fase; una salvada no elimina la ventaja de la posición previa.', en: 'Penalise only if that player then becomes involved: touching a team-mate’s ball, clearly interfering with an opponent, such as blocking sight or challenging, or gaining from a rebound, deflection or save. A defender’s deliberate, controllable play may begin a new phase; a save does not erase the earlier positional advantage.' },
          { es: 'La referencia temporal normal es el primer contacto del compañero con el balón; para un lanzamiento del guardameta con la mano se usa el último contacto. Una falta al atacante antes de que participe puede preceder a cualquier infracción de fuera de juego.', en: 'The usual time reference is the team-mate’s first point of contact with the ball; for a goalkeeper’s hand throw, use the final point of contact. A foul against the attacker before active involvement can precede any offside offence.' },
        ],
        source: source('Regla 11.1–2 · Posición e infracción por fuera de juego', 'Law 11.1–2 · Offside position and offence', '117–119', '109–111', 117, 109),
      },
      {
        id: 'exceptions-and-restart',
        title: { es: 'Excepciones y reanudación', en: 'Exceptions and restart' },
        paragraphs: [
          { es: 'Recibir directamente un saque de meta, de banda o de esquina no produce infracción de fuera de juego. Tras una infracción real, se concede libre indirecto en el lugar donde el atacante intervino, incluso si ese lugar está en su propia mitad.', en: 'Receiving directly from a goal kick, throw-in or corner kick cannot produce an offside offence. After an actual offence, award an indirect free kick where the attacker became involved, even if that place is in the attacker’s own half.' },
        ],
        source: source('Regla 11.3–4 · Situaciones sin infracción; sanciones', 'Law 11.3–4 · No offence; offences and sanctions', '119–120', '111–112', 119, 111),
      },
    ],
  },
  {
    number: 12,
    sections: [
      {
        id: 'direct-and-severity',
        title: { es: 'Falta, contacto y gravedad', en: 'Foul, contact and severity' },
        paragraphs: [
          { es: 'Una carga, entrada, empujón o zancadilla contra un adversario puede dar libre directo si se comete de forma imprudente, temeraria o con fuerza excesiva; el contacto físico de una falta lleva a esa reanudación. En el área propia del infractor, la falta de libre directo con el balón en juego normalmente da penal.', en: 'A charge, challenge, push or trip against an opponent may yield a direct free kick when careless, reckless or using excessive force; physical contact in a foul leads to that restart. In the offender’s own penalty area, a direct free kick offence while the ball is in play normally yields a penalty.' },
          { es: 'La imprudencia no exige tarjeta por sí sola. La temeridad exige amonestación y la fuerza excesiva o el peligro para la integridad del rival exige expulsión. Determiná primero conducta y gravedad; luego ubicación y reanudación.', en: 'Carelessness does not itself require a card. Recklessness requires a caution; excessive force or endangering an opponent’s safety requires a sending-off. Identify conduct and severity first, then place and restart.' },
        ],
        source: source('Regla 12.1 · Tiro libre directo', 'Law 12.1 · Direct free kick', '123–124', '115–116', 123, 115),
      },
      {
        id: 'handball-and-indirect',
        title: { es: 'Mano y libre indirecto', en: 'Handball and indirect free kick' },
        paragraphs: [
          { es: 'No todo contacto con mano o brazo es falta. Importan el movimiento deliberado hacia el balón y una posición del brazo que agrande el cuerpo de manera injustificable para esa acción. También se invalida el gol marcado directamente con mano o brazo, o inmediatamente después de ese contacto del propio goleador, aunque haya sido accidental.', en: 'Not every hand or arm contact is an offence. Consider a deliberate movement towards the ball and an arm position that unjustifiably makes the body bigger for that action. A goal scored directly with hand or arm, or immediately after the scorer’s own contact, is also disallowed even if accidental.' },
          { es: 'Juego peligroso y obstaculizar sin contacto suelen dar libre indirecto. Para el guardameta dentro de su área, volver a tomar con la mano un balón ya soltado antes de otro toque, o tomar un pase deliberado con el pie de un compañero, también puede dar libre indirecto; fuera de su área se aplican las restricciones comunes de mano.', en: 'Dangerous play and impeding without contact usually yield an indirect free kick. Inside their area, a goalkeeper handling a ball after releasing it before another player touches it, or handling a deliberate kick from a team-mate, may also concede an indirect free kick; outside the area ordinary handball restrictions apply.' },
        ],
        source: source('Regla 12.1–2 · Tiro libre directo; tiro libre indirecto', 'Law 12.1–2 · Direct and indirect free kicks', '124–127', '116–119', 124, 116),
      },
      {
        id: 'keeper-eight-seconds',
        title: { es: 'Ocho segundos del guardameta', en: 'Goalkeeper eight second limit' },
        paragraphs: [
          { es: 'Cuando el guardameta controla el balón con manos o brazos dentro de su área durante más de ocho segundos antes de soltarlo, el rival recibe un saque de esquina, no un libre indirecto. El control incluye sostenerlo, apoyarlo entre brazo y cuerpo o suelo, hacerlo rebotar o lanzarlo al aire. El árbitro decide cuándo empieza el control y señala con la mano alzada los últimos cinco segundos.', en: 'If the goalkeeper controls the ball with hands or arms inside their area for more than eight seconds before releasing it, the opponents receive a corner kick, not an indirect free kick. Control includes holding it, pinning it between arm and body or ground, bouncing it or throwing it in the air. The referee judges when control begins and signals the final five seconds with a raised hand.' },
          { es: 'Mientras dura ese control, ningún adversario puede disputar el balón. Esta consecuencia especial por tiempo no sustituye los libres indirectos por otras infracciones de manejo del guardameta.', en: 'No opponent may challenge for the ball during that control. This special time consequence does not replace indirect free kicks for other goalkeeper handling offences.' },
        ],
        source: source('Regla 12.2–3 · Tiro libre indirecto; saque de esquina', 'Law 12.2–3 · Indirect free kick; corner kick', '126–128', '118–120', 126, 118),
      },
      {
        id: 'discipline-and-opportunity',
        title: { es: 'Tarjetas y ocasión de gol', en: 'Cards and goal-scoring opportunity' },
        paragraphs: [
          { es: 'La tarjeta amarilla comunica una amonestación y la roja una expulsión. Retrasar la reanudación, protestar o cometer una entrada temeraria puede merecer amonestación; el juego brusco grave y la conducta violenta exigen expulsión. La decisión disciplinaria es distinta del tipo de reanudación.', en: 'A yellow card communicates a caution and a red card a sending-off. Delaying a restart, dissent or a reckless challenge may warrant a caution; serious foul play and violent conduct require a sending-off. The disciplinary decision is separate from the restart type.' },
          { es: 'Para una ocasión manifiesta de gol se consideran distancia a meta, dirección, posibilidad de controlar el balón y número y posición de defensores. Si se concede penal por una falta al disputar el balón, la respuesta disciplinaria puede reducirse a amarilla; sujetar, empujar o no intentar jugarlo no recibe automáticamente esa reducción.', en: 'For an obvious goal-scoring opportunity, consider distance to goal, direction, likelihood of controlling the ball and the number and position of defenders. If a penalty is awarded for a foul while challenging for the ball, discipline may be reduced to a caution; holding, pushing or no attempt to play the ball does not automatically gain that reduction.' },
        ],
        source: source('Regla 12.4 · Medidas disciplinarias', 'Law 12.4 · Disciplinary action', '128–136', '120–126', 128, 120),
      },
    ],
  },
  {
    number: 13,
    sections: [
      {
        id: 'direct-indirect-results',
        title: { es: 'Directo, indirecto y gol', en: 'Direct, indirect and goal' },
        paragraphs: [
          { es: 'Un libre directo puede marcar gol directamente en el arco rival. Un libre indirecto necesita un toque de otro jugador para que ese gol valga; el árbitro señala su carácter indirecto con el brazo levantado. Si entra directamente, corresponde saque de meta. Si cualquiera de los dos tiros entra directamente en la propia portería, corresponde córner.', en: 'A direct free kick can score directly against the opponents. An indirect free kick needs a touch by another player for that goal to count; the referee signals it with a raised arm. A direct entry from an indirect kick gives a goal kick. Either type entering the kicker’s own goal directly gives a corner.' },
        ],
        source: source('Regla 13.1 · Tipos de tiros libres', 'Law 13.1 · Types of free kick', '141', '131', 141, 131),
      },
      {
        id: 'placement-distance-second-touch',
        title: { es: 'Lugar, distancias y segundo toque', en: 'Location, distances and second touch' },
        paragraphs: [
          { es: 'Por regla general se ejecuta donde ocurrió la infracción. Hay ubicaciones especiales, como un libre indirecto atacante por infracción dentro del área de meta rival: se lleva a la línea del área de meta paralela a la línea de meta, al punto más cercano. El balón queda en juego al ser pateado y moverse claramente.', en: 'The usual location is where the offence occurred. Special placements include an attacking indirect free kick for an offence in the opponents’ goal area: move it to the nearest point of the goal-area line parallel to the goal line. The ball is in play when kicked and clearly moving.' },
          { es: 'Los adversarios guardan 9,15 m, con las excepciones de la Regla; los atacantes deben quedar al menos a 1 m de una barrera de tres o más defensores. El ejecutor no vuelve a tocar el balón antes de otro jugador: la consecuencia normal es libre indirecto, o libre directo/penal si comete una infracción por mano.', en: 'Opponents stay 9.15 m away, subject to the Law’s exceptions; attackers must remain at least 1 m from a wall of three or more defenders. The kicker must wait for another player’s touch: a second touch normally gives an indirect free kick, or a direct free kick/penalty for a handball offence.' },
        ],
        source: source('Regla 13.2–3 · Procedimiento; infracciones y sanciones', 'Law 13.2–3 · Procedure; offences and sanctions', '141–143', '131–133', 141, 131),
      },
    ],
  },
  {
    number: 14,
    sections: [
      {
        id: 'penalty-setup',
        title: { es: 'Concesión y preparación', en: 'Award and setup' },
        paragraphs: [
          { es: 'Se concede penal por una infracción sancionable con libre directo de un defensor en su área, o en ciertos hechos fuera del campo vinculados con el juego. El balón inmóvil debe tocar o sobresalir en parte del centro del punto penal; se identifica al ejecutor. El guardameta espera entre postes, sobre su línea y frente al ejecutor.', en: 'Award a penalty for a defender’s direct free kick offence in their penalty area, or certain off-field acts connected to play. The stationary ball must touch or partly overhang the centre of the penalty mark, and the kicker is identified. The goalkeeper waits between the posts, on the goal line and facing the kicker.' },
          { es: 'Los demás jugadores permanecen fuera del área penal, detrás del punto, dentro del campo y a 9,15 m como mínimo. El árbitro da la señal cuando todos están ubicados. El remate va hacia delante; al golpeo, al menos parte de un pie del guardameta debe estar en contacto con la línea, sobre ella o detrás.', en: 'Other players remain outside the penalty area, behind the mark, on the field and at least 9.15 m away. The referee signals once they are positioned. The ball is kicked forward; at the kick, at least part of one goalkeeper foot must touch, be in line with or be behind the goal line.' },
        ],
        source: source('Regla 14.1 · Procedimiento', 'Law 14.1 · Procedure', '145–146', '135–136', 145, 135),
      },
      {
        id: 'encroachment-and-keeper',
        title: { es: 'Adelantamiento e infracción del guardameta', en: 'Encroachment and goalkeeper offence' },
        paragraphs: [
          { es: 'El adelantamiento de un compañero del ejecutor o del guardameta se sanciona cuando influye claramente en el rival correspondiente, o cuando el jugador adelantado disputa o juega el balón y altera una ocasión o el gol. El resultado del tiro y qué equipo infringió determinan si se valida el gol, se repite o se concede libre indirecto.', en: 'Encroachment by a team-mate of the kicker or goalkeeper is penalised when it clearly affects the relevant opponent, or when the encroaching player challenges or plays the ball and changes a chance or goal. The shot’s result and the offending team determine whether to allow the goal, retake or award an indirect free kick.' },
          { es: 'Si el guardameta infringe y detiene un remate que iba a entrar, se repite. Si no lo detuvo, la repetición depende de que su infracción afectara claramente al ejecutor. La primera infracción que obliga a repetir trae advertencia; las siguientes, amonestación.', en: 'If the goalkeeper offends and prevents the ball entering, retake. If the goalkeeper did not save it, a retake depends on whether the offence clearly affected the kicker. A first offence requiring a retake brings a warning; later ones bring a caution.' },
        ],
        source: source('Regla 14.2–3 · Infracciones y sanciones; resumen', 'Law 14.2–3 · Offences and sanctions; summary', '147–150', '137–139', 147, 137),
      },
      {
        id: 'double-touch-and-feint',
        title: { es: 'Doble toque y finta', en: 'Double touch and feint' },
        paragraphs: [
          { es: 'Si el ejecutor golpea accidentalmente con ambos pies a la vez o el balón toca el pie de apoyo inmediatamente después, se repite cuando entra directamente. Si no entra, se da libre indirecto, excepto cuando el guardameta también comete una infracción: entonces se repite. Un segundo toque intencional antes de que toque otro jugador se sanciona con libre indirecto, o directo si es mano. La diferencia entre accidental e intencional cambia el resultado.', en: 'If the kicker accidentally strikes with both feet at once or the ball hits the standing leg immediately after the kick, retake if it enters directly. If it does not, award an indirect free kick unless the goalkeeper also commits an offence; then retake. A deliberate second touch before another player touches it gives an indirect free kick, or a direct free kick for handball. Accidental and deliberate contact have different outcomes.' },
          { es: 'Se permite fintar durante la carrera, pero fingir al golpear tras terminarla trae amonestación y libre indirecto. También da libre indirecto ejecutar hacia atrás o dejar patear a un jugador no designado; este último recibe amarilla.', en: 'Feinting during the run-up is allowed, but feinting at the kick after completing the run-up brings a caution and an indirect free kick. Kicking backwards or allowing an unidentified player to take the kick also gives an indirect free kick; the latter player is cautioned.' },
        ],
        source: source('Regla 14.2–3 · Infracciones y sanciones; resumen', 'Law 14.2–3 · Offences and sanctions; summary', '146–150', '136–139', 146, 136),
      },
    ],
  },
  {
    number: 15,
    sections: [
      {
        id: 'throw-in-award',
        title: { es: 'A quién corresponde', en: 'Who receives the throw-in' },
        paragraphs: [
          { es: 'Cuando todo el balón cruza la banda, saca el equipo contrario al último jugador que lo tocó. La Regla también transfiere el saque al rival cuando se sanciona la demora del equipo que debía ejecutarlo. No se puede marcar directamente: si entra en la meta rival, saque de meta; si entra en la propia, córner.', en: 'When the whole ball crosses the touchline, the opponents of the last player to touch it take the throw. The Law also transfers the throw to opponents when the original team is penalised for delaying it. A direct goal is impossible: entry into the opponents’ goal gives a goal kick; entry into the thrower’s own goal gives a corner.' },
        ],
        source: source('Regla 15 · Concesión del saque de banda', 'Law 15 · Award of a throw-in', '153', '141', 153, 141),
      },
      {
        id: 'throw-in-technique',
        title: { es: 'Técnica y balón en juego', en: 'Technique and ball in play' },
        paragraphs: [
          { es: 'El ejecutor mira al campo, apoya parte de ambos pies sobre la línea o fuera de ella y lanza con ambas manos desde atrás y por encima de la cabeza, desde donde salió el balón. Los rivales quedan al menos a 2 m del punto de saque sobre la banda. El balón entra en juego al entrar en el terreno; si toca el suelo antes, se repite desde el mismo sitio.', en: 'The thrower faces the field, keeps part of both feet on or outside the touchline and throws with both hands from behind and over the head, where the ball went out. Opponents stay at least 2 m from the throw-in point on the line. The ball is in play when it enters the field; if it hits the ground first, retake from the same place.' },
          { es: 'Un lanzamiento técnicamente incorrecto pasa al adversario. Tras uno correcto, el ejecutor debe esperar el toque de otro jugador antes de volver a jugar el balón.', en: 'An incorrectly taken throw passes to the opponents. After a correct one, the thrower must wait for another player’s touch before playing the ball again.' },
        ],
        source: source('Regla 15.1–2 · Procedimiento; infracciones y sanciones', 'Law 15.1–2 · Procedure; offences and sanctions', '153–154', '141–142', 153, 141),
      },
      {
        id: 'throw-in-countdown',
        title: { es: 'Cuenta atrás por demora', en: 'Countdown for delay' },
        paragraphs: [
          { es: 'Ante una demora injusta, el árbitro pita y señala con la mano alzada una cuenta de cinco segundos. Si el saque no se efectúa antes de terminar, lo recibe el adversario. La tarjeta amarilla por demora se reserva para quien retrasa excesivamente la reanudación después de esa transferencia.', en: 'For unfair delay, the referee whistles and signals a five-second countdown with a raised hand. If the throw is not taken before it ends, the opponents receive it. A caution for delay applies only if the player excessively delays the restart after that transfer.' },
        ],
        source: source('Regla 15.2 · Infracciones y sanciones', 'Law 15.2 · Offences and sanctions', '154', '142', 154, 142),
      },
    ],
  },
  {
    number: 16,
    sections: [
      {
        id: 'goal-kick-award',
        title: { es: 'Concesión y gol directo', en: 'Award and direct goal' },
        paragraphs: [
          { es: 'Se concede saque de meta cuando todo el balón cruza la línea de meta, no hay gol y el último toque fue atacante. También puede corresponder por otras reanudaciones que entran directamente en la meta rival. Desde un saque de meta se puede marcar directamente solo al rival; si el balón entra directamente en la meta propia, se concede córner.', en: 'Award a goal kick when the whole ball crosses the goal line, no goal is scored and an attacker touched it last. Other restarts entering the opponents’ goal directly may also lead to a goal kick. A goal kick can score directly only against opponents; direct entry into the kicker’s own goal gives a corner.' },
        ],
        source: source('Regla 16 · Concesión del saque de meta', 'Law 16 · Award of a goal kick', '157', '145', 157, 145),
      },
      {
        id: 'goal-kick-procedure',
        title: { es: 'Desde el área de meta', en: 'From the goal area' },
        paragraphs: [
          { es: 'Un defensor patea el balón inmóvil desde cualquier lugar del área de meta. Está en juego al ser pateado y moverse claramente, sin necesidad de salir del área penal. Los adversarios deben permanecer fuera del área penal hasta ese momento.', en: 'A defender kicks the stationary ball from anywhere in the goal area. It is in play when kicked and clearly moving, without having to leave the penalty area. Opponents must stay outside the penalty area until then.' },
          { es: 'Si un rival no tuvo tiempo de salir, el árbitro permite continuar; si toca o disputa el balón antes de que esté en juego, se repite el saque. Un segundo toque del ejecutor después de ponerlo en juego, antes de cualquier otro jugador, da libre indirecto salvo una infracción por mano con su propia consecuencia.', en: 'If an opponent had no time to leave, the referee allows play to continue; if that opponent touches or challenges for the ball before it is in play, retake the kick. A second touch by the kicker after putting it in play, before anyone else touches it, gives an indirect free kick unless a handball offence has its own consequence.' },
        ],
        source: source('Regla 16.1–2 · Procedimiento; infracciones y sanciones', 'Law 16.1–2 · Procedure; offences and sanctions', '157–158', '145–146', 157, 145),
      },
      {
        id: 'goal-kick-countdown',
        title: { es: 'Demora que concede córner', en: 'Delay that awards a corner' },
        paragraphs: [
          { es: 'Si un jugador demora injustamente el saque de meta de su equipo, el árbitro pita e inicia una cuenta visible de cinco segundos. Si no se ejecuta a tiempo, concede córner al contrario. Solo una demora excesiva posterior a esa concesión justifica amonestación por esta conducta.', en: 'If a player unfairly delays their team’s goal kick, the referee whistles and begins a visible five-second countdown. Failure to take it in time awards a corner to the opponents. Only excessive further delay after that award warrants a caution for this conduct.' },
        ],
        source: source('Regla 16.2 · Infracciones y sanciones', 'Law 16.2 · Offences and sanctions', '157', '145', 157, 145),
      },
    ],
  },
  {
    number: 17,
    sections: [
      {
        id: 'corner-award',
        title: { es: 'Tres caminos al córner', en: 'Three paths to a corner' },
        paragraphs: [
          { es: 'El camino habitual es el cruce completo de la línea de meta, sin gol, tras el último toque de un defensor. También se concede cuando el guardameta controla el balón con manos o brazos más de ocho segundos en su área, o cuando un equipo agota la cuenta de cinco segundos por demorar su saque de meta.', en: 'The usual path is the whole ball crossing the goal line without a goal after a defender’s last touch. A corner is also awarded when a goalkeeper controls the ball with hands or arms for more than eight seconds in their area, or when a team runs out the five-second countdown for delaying its goal kick.' },
        ],
        source: source('Regla 17 · Concesión del saque de esquina', 'Law 17 · Award of a corner kick', '161', '149', 161, 149),
      },
      {
        id: 'corner-position-and-kick',
        title: { es: 'Cuadrante y ejecución', en: 'Corner area and kick' },
        paragraphs: [
          { es: 'El balón inmóvil se coloca en el cuadrante más cercano a donde salió por la línea de meta o a donde estaba el guardameta sancionado. Un atacante patea; el balón entra en juego cuando se mueve claramente, aunque permanezca dentro del cuadrante. No se mueve el banderín y los rivales guardan 9,15 m del arco del cuadrante.', en: 'Place the stationary ball in the corner area nearest where it crossed the goal line or where the penalised goalkeeper stood. An attacker kicks; the ball is in play when clearly moving, even while still inside the corner area. Do not move the flagpost, and opponents stay 9.15 m from the corner arc.' },
          { es: 'Puede marcarse directamente en la meta rival. Si un córner entra directamente en la meta del propio ejecutor, se concede córner al contrario.', en: 'A corner can score directly against the opponents. If it enters the kicker’s own goal directly, award a corner to the opponents.' },
        ],
        source: source('Regla 17.1 · Procedimiento', 'Law 17.1 · Procedure', '161', '149', 161, 149),
      },
      {
        id: 'corner-second-touch',
        title: { es: 'Segundo toque y otras infracciones', en: 'Second touch and other offences' },
        paragraphs: [
          { es: 'El ejecutor espera a que otro jugador toque el balón. Si vuelve a jugarlo antes, se da libre indirecto; una infracción por mano del ejecutor puede dar libre directo o penal según el lugar, con la excepción propia del guardameta en su área. Otras infracciones del procedimiento normalmente obligan a repetir el saque.', en: 'The kicker waits for another player to touch the ball. Playing it again first gives an indirect free kick; the kicker’s handball offence can give a direct free kick or penalty depending on location, subject to the goalkeeper exception in their area. Other procedure breaches normally require a retake.' },
        ],
        source: source('Regla 17.2 · Infracciones y sanciones', 'Law 17.2 · Offences and sanctions', '162', '150', 162, 150),
      },
    ],
  },
];
