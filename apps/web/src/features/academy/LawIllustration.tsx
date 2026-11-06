import { useId, type ReactNode } from 'react';

type Locale = 'es' | 'en';
const ink = '#edf5ea';
const mint = '#9cdfaa';
const lime = '#c7e76b';
const coral = '#ef9e83';
const field = '#184338';

const descriptions: Record<number, { es: string; en: string; detailEs: string; detailEn: string }> = {
  1: { es: 'Terreno de juego', en: 'Field of play', detailEs: 'Ejemplo de campo de 105 por 68 metros con áreas, círculo central, punto penal y portería señalados.', detailEn: 'Example 105 by 68 metre pitch with areas, centre circle, penalty mark and goal labelled.' },
  2: { es: 'El balón', en: 'The ball', detailEs: 'Circunferencia de 68 a 70 centímetros, masa inicial de 410 a 450 gramos y presión reglamentaria.', detailEn: 'Circumference 68 to 70 centimetres, initial mass 410 to 450 grams and regulation pressure.' },
  3: { es: 'Los jugadores', en: 'The players', detailEs: 'Dos equipos de hasta once jugadores; se requieren al menos siete para empezar o continuar.', detailEn: 'Two teams of up to eleven players; at least seven are needed to start or continue.' },
  4: { es: 'Equipamiento obligatorio', en: 'Compulsory equipment', detailEs: 'Camiseta, pantalón corto, medias, espinilleras cubiertas por las medias y calzado.', detailEn: 'Shirt, shorts, socks, shin guards covered by the socks and footwear.' },
  5: { es: 'Decisiones del árbitro', en: 'Referee decisions', detailEs: 'Ventaja, reanudación del juego y medidas disciplinarias.', detailEn: 'Advantage, restart of play and disciplinary measures.' },
  6: { es: 'Equipo arbitral', en: 'Match officials', detailEs: 'Árbitro asistente fuera del terreno junto a la línea de banda, con banderín.', detailEn: 'Assistant referee outside the field beside the touchline, with flag.' },
  7: { es: 'Duración del partido', en: 'Duration of the match', detailEs: 'Dos tiempos de 45 minutos, descanso de hasta 15 y tiempo adicional.', detailEn: 'Two 45-minute halves, an interval of up to 15 minutes and added time.' },
  8: { es: 'Saque inicial', en: 'Kick-off', detailEs: 'Salvo el ejecutor, los jugadores permanecen en su propio campo y los adversarios quedan al menos a 9,15 metros del balón.', detailEn: 'Except for the kicker, players stay in their own half and opponents remain at least 9.15 metres from the ball.' },
  9: { es: 'Balón en juego y fuera', en: 'Ball in and out of play', detailEs: 'Un balón que se superpone a la línea sigue en juego; sale cuando la atraviesa por completo.', detailEn: 'A ball overlapping the line remains in play; it is out when it wholly crosses.' },
  10: { es: 'Gol válido', en: 'Scoring a goal', detailEs: 'El balón completo cruza la línea de meta entre los postes y bajo el travesaño.', detailEn: 'The whole ball crosses the goal line between the posts and under the crossbar.' },
  11: { es: 'Posición de fuera de juego', en: 'Offside position', detailEs: 'La posición se juzga al toque del compañero con referencia al balón y al penúltimo defensor; la posición por sí sola no constituye infracción.', detailEn: 'Position is judged at the team-mate’s touch relative to the ball and second-last defender; position alone is not an offence.' },
  12: { es: 'Faltas y disciplina', en: 'Fouls and misconduct', detailEs: 'Se distingue la reanudación debida a una infracción de la sanción disciplinaria.', detailEn: 'Restart for an offence is distinct from disciplinary sanction.' },
  13: { es: 'Tiros libres', en: 'Free kicks', detailEs: 'Distancia habitual de adversarios de 9,15 metros y distinción entre tiro directo e indirecto.', detailEn: 'Usual opponent distance of 9.15 metres and distinction between direct and indirect free kicks.' },
  14: { es: 'Tiro penal', en: 'Penalty kick', detailEs: 'Balón a 11 metros, guardameta en la línea de meta, ejecutor identificado y demás jugadores fuera del área y arco penal.', detailEn: 'Ball 11 metres out, goalkeeper on the goal line, identified kicker and others outside the penalty area and arc.' },
  15: { es: 'Saque de banda', en: 'Throw-in', detailEs: 'Ambas manos desde detrás y encima de la cabeza; parte de cada pie en la línea o fuera del terreno.', detailEn: 'Both hands from behind and over the head; part of each foot on the line or outside the field.' },
  16: { es: 'Saque de meta', en: 'Goal kick', detailEs: 'Balón en cualquier punto del área de meta y rivales fuera del área penal hasta estar en juego.', detailEn: 'Ball anywhere in the goal area and opponents outside the penalty area until it is in play.' },
  17: { es: 'Saque de esquina', en: 'Corner kick', detailEs: 'Balón en el área de esquina de radio un metro, banderín en la intersección y adversarios al menos a 9,15 metros del arco.', detailEn: 'Ball in the one-metre-radius corner area, flag at the intersection and opponents at least 9.15 metres from the arc.' },
};

function Txt({ x, y, children, color = ink, size = 15, anchor = 'start' }: { x: number; y: number; children: ReactNode; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end' }) {
  return <text x={x} y={y} fill={color} fontFamily="Source Sans 3, Segoe UI, sans-serif" fontSize={size} fontWeight="700" textAnchor={anchor}>{children}</text>;
}
function Ball({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return <g><circle cx={x} cy={y} r={r} fill="#f7f4df" stroke={ink} strokeWidth="2" /><circle cx={x} cy={y} r={Math.max(2, r * .34)} fill={field} /></g>;
}
function Player({ x, y, color = mint, r = 10 }: { x: number; y: number; color?: string; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke="#102b27" strokeWidth="2" />;
}
function Line({ x1, y1, x2, y2, color = ink, dashed = false, width = 2 }: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; width?: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 6' : undefined} />;
}

function scene(number: number, locale: Locale): ReactNode {
  const t = (es: string, en: string) => locale === 'es' ? es : en;
  switch (number) {
    case 1: return <>
      <rect x="192" y="70" width="336" height="218" fill={field} stroke={ink} strokeWidth="2" />
      <Line x1={360} y1={70} x2={360} y2={288} /><circle cx="360" cy="179" r="29.3" fill="none" stroke={ink} strokeWidth="2" /><circle cx="360" cy="179" r="3" fill={ink} />
      <path d="M192 114.3h52.8v129.4H192m336-129.4h-52.8v129.4H528M192 149.7h17.6v58.6H192m336-58.6h-17.6v58.6H528" fill="none" stroke={ink} strokeWidth="2" />
      <circle cx="227.2" cy="179" r="3" fill={lime} /><circle cx="492.8" cy="179" r="3" fill={lime} /><path d="M244.8 156a29.3 29.3 0 0 1 0 46m230.4-46a29.3 29.3 0 0 0 0 46" fill="none" stroke={mint} strokeWidth="2" />
      <path d="M192 167.3h-9v23.4h9m336-23.4h9v23.4h-9" fill="none" stroke={lime} strokeWidth="3" />
      <Txt x={360} y={42} anchor="middle">105 m · {t('ejemplo', 'example')}</Txt><Txt x={166} y={184} anchor="middle" size={13}>68 m</Txt>
      <Txt x={35} y={100} size={13}>{t('Área penal', 'Penalty area')} 16,5 m</Txt><Line x1={177} y1={105} x2={227} y2={114} color={mint} />
      <Txt x={28} y={251} size={13}>{t('Área de meta', 'Goal area')} 5,5 m</Txt><Line x1={178} y1={245} x2={204} y2={207} color={mint} />
      <Txt x={548} y={97} size={13}>{t('Círculo', 'Circle')} 9,15 m</Txt><Line x1={545} y1={102} x2={385} y2={163} color={mint} />
      <Txt x={548} y={213} size={13}>{t('Penal', 'Penalty')} 11 m</Txt><Line x1={544} y1={206} x2={495} y2={181} color={lime} />
      <Txt x={360} y={323} anchor="middle" size={13}>{t('Portería', 'Goal')} 7,32 × 2,44 m · {t('esquina', 'corner')} 1 m</Txt>
    </>;
    case 2: return <>
      <circle cx="258" cy="179" r="100" fill={field} stroke={mint} strokeWidth="2" strokeDasharray="6 7" /><Ball x={258} y={179} r={77} />
      <path d="M142 169a116 116 0 0 1 232 0" fill="none" stroke={lime} strokeWidth="3" />
      <Txt x={455} y={127}>{t('Circunferencia', 'Circumference')}</Txt><Txt x={455} y={156} color={lime} size={23}>68–70 cm</Txt>
      <Txt x={455} y={215}>{t('Masa inicial', 'Initial mass')}</Txt><Txt x={455} y={244} color={mint} size={23}>410–450 g</Txt>
      <Txt x={360} y={318} anchor="middle" size={13}>{t('Presión: 0,6–1,1 atm al nivel del mar', 'Pressure: 0.6–1.1 atm at sea level')}</Txt>
    </>;
    case 3: return <>
      <Line x1={360} y1={50} x2={360} y2={284} dashed /><Txt x={220} y={66} anchor="middle">{t('Equipo A', 'Team A')}</Txt><Txt x={500} y={66} anchor="middle">{t('Equipo B', 'Team B')}</Txt>
      {Array.from({ length: 11 }, (_, i) => <Player key={`a${i}`} x={137 + i % 4 * 49} y={104 + Math.floor(i / 4) * 62} r={9} />)}
      {Array.from({ length: 11 }, (_, i) => <Player key={`b${i}`} x={410 + i % 4 * 49} y={104 + Math.floor(i / 4) * 62} color={coral} r={9} />)}
      <Txt x={168} y={289} size={14}>{t('Máximo 11 por equipo', 'Maximum 11 per team')}</Txt><Txt x={426} y={289} size={14}>{t('Mínimo 7', 'Minimum 7')}</Txt>
      <Player x={284} y={322} r={7} /><Line x1={299} y1={322} x2={339} y2={322} color={lime} /><Txt x={351} y={327} size={13}>{t('Sustitución: línea media + permiso', 'Substitution: halfway + permission')}</Txt>
    </>;
    case 4: return <>
      <path d="M148 88h129l18 49-27 11-8-20v52h-92v-52l-8 20-27-11z" fill={mint} stroke={ink} strokeWidth="3" /><Txt x={213} y={215} anchor="middle">{t('Camiseta', 'Shirt')}</Txt>
      <path d="M332 90h94l-9 70h-30l-8-35-8 35h-30z" fill={coral} stroke={ink} strokeWidth="3" /><Txt x={379} y={215} anchor="middle">{t('Pantalón', 'Shorts')}</Txt>
      <path d="M523 81h54v157h-54z" fill={mint} stroke={ink} strokeWidth="3" /><rect x="531" y="111" width="38" height="68" rx="5" fill={lime} stroke={ink} strokeWidth="2" /><path d="M523 166h54v72h-54z" fill={mint} stroke={ink} strokeWidth="3" />
      <Txt x={550} y={270} anchor="middle" size={14}>{t('Media cubre', 'Sock covers')}</Txt><Txt x={550} y={290} anchor="middle" size={14}>{t('espinillera', 'shin guard')}</Txt>
      <path d="M174 273h90v22h-97z" fill={ink} /><Txt x={300} y={295} size={14}>{t('Calzado obligatorio', 'Footwear required')}</Txt>
    </>;
    case 5: return <>
      <Player x={136} y={167} r={18} /><Player x={239} y={167} color={coral} r={18} /><Ball x={188} y={211} r={12} />
      <path d="M267 183h85m-13-11 13 11-13 11" fill="none" stroke={lime} strokeWidth="4" /><Txt x={308} y={150} anchor="middle" color={lime}>{t('Ventaja', 'Advantage')}</Txt>
      <Line x1={386} y1={96} x2={386} y2={255} color={mint} /><rect x="441" y="101" width="52" height="72" rx="3" fill={lime} /><rect x="535" y="101" width="52" height="72" rx="3" fill={coral} />
      <Txt x={467} y={202} anchor="middle" size={13}>{t('Amonestación', 'Caution')}</Txt><Txt x={561} y={202} anchor="middle" size={13}>{t('Expulsión', 'Sending-off')}</Txt>
      <Txt x={360} y={294} anchor="middle" size={14}>{t('El árbitro decide la reanudación y la disciplina', 'Referee decides restart and discipline')}</Txt>
    </>;
    case 6: return <>
      <rect x="102" y="61" width="426" height="229" fill={field} stroke={ink} strokeWidth="3" /><Line x1={528} y1={61} x2={528} y2={290} color={lime} width={5} />
      <Player x={581} y={174} r={18} /><Line x1={589} y1={161} x2={615} y2={98} color={ink} width={5} /><path d="M615 98V35l70 22-70 22" fill={coral} stroke={ink} strokeWidth="2" />
      <Txt x={574} y={230} size={14}>{t('Asistente', 'Assistant')}</Txt><Txt x={345} y={317} anchor="middle" size={14}>{t('Línea de banda', 'Touchline')}</Txt><Txt x={592} y={317} anchor="middle" size={14}>{t('Fuera del campo', 'Outside field')}</Txt>
    </>;
    case 7: return <>
      <rect x="82" y="130" width="225" height="74" rx="5" fill={field} stroke={mint} strokeWidth="3" /><rect x="413" y="130" width="225" height="74" rx="5" fill={field} stroke={coral} strokeWidth="3" />
      <Txt x={194} y={177} anchor="middle" size={28}>45 min</Txt><Txt x={526} y={177} anchor="middle" size={28}>45 min</Txt>
      <Line x1={307} y1={168} x2={413} y2={168} color={lime} /><Txt x={360} y={144} anchor="middle" size={13}>{t('Descanso', 'Interval')}</Txt><Txt x={360} y={190} anchor="middle" color={lime} size={14}>≤ 15 min</Txt>
      <Txt x={360} y={261} anchor="middle" size={15}>{t('Tiempo adicional por el tiempo perdido', 'Allowance for time lost')}</Txt>
    </>;
    case 8: return <>
      <rect x="105" y="61" width="510" height="235" fill={field} stroke={ink} strokeWidth="2" /><Line x1={360} y1={61} x2={360} y2={296} /><circle cx="360" cy="179" r="44.5" fill="none" stroke={lime} strokeWidth="2" /><Ball x={360} y={179} r={9} />
      <Player x={334} y={179} /><Player x={247} y={123} /><Player x={255} y={230} /><Player x={456} y={125} color={coral} /><Player x={467} y={232} color={coral} />
      <Txt x={320} y={152} anchor="end" size={13}>{t('Ejecutor', 'Kicker')}</Txt><Txt x={480} y={96} anchor="middle" size={13}>{t('Rivales', 'Opponents')}</Txt>
      <Txt x={360} y={326} anchor="middle" size={14}>{t('9,15 m · los demás permanecen en su mitad', '9.15 m · all others stay in their half')}</Txt>
    </>;
    case 9: return <>
      <Txt x={360} y={68} anchor="middle">{t('La línea forma parte del terreno', 'The line is part of the field')}</Txt><rect x="347" y="95" width="12" height="195" fill={ink} />
      <Txt x={257} y={111} anchor="middle" size={13}>{t('Dentro', 'Inside')}</Txt><Txt x={467} y={111} anchor="middle" size={13}>{t('Fuera', 'Outside')}</Txt>
      <Ball x={366} y={169} r={27} /><Ball x={409} y={241} r={27} />
      <Txt x={190} y={174} color={lime}>{t('Aún en juego', 'Still in play')}</Txt><Line x1={315} y1={170} x2={332} y2={170} color={lime} />
      <Txt x={462} y={245} color={coral}>{t('Cruce completo', 'Wholly crossed')}</Txt><Line x1={443} y1={240} x2={456} y2={240} color={coral} />
      <Txt x={360} y={321} anchor="middle" size={13}>{t('Mismo criterio por tierra o aire', 'Same test on the ground or in the air')}</Txt>
    </>;
    case 10: return <>
      <Line x1={360} y1={71} x2={360} y2={287} color={ink} width={9} /><rect x="361" y="92" width="215" height="178" fill="none" stroke={mint} strokeWidth="3" />
      <Txt x={468} y={75} anchor="middle" size={13}>{t('Entre postes · bajo travesaño', 'Between posts · under crossbar')}</Txt>
      <Ball x={354} y={179} r={20} /><Ball x={406} y={219} r={20} />
      <Txt x={197} y={185} color={coral}>{t('No cruzó', 'Not crossed')}</Txt><Txt x={452} y={242} color={lime}>{t('Cruzó por completo', 'Wholly crossed')}</Txt>
      <Txt x={360} y={318} anchor="middle" size={13}>{t('Sin infracción previa del equipo que marca', 'No prior offence by the scoring team')}</Txt>
    </>;
    case 11: return <>
      <rect x="92" y="74" width="535" height="212" fill={field} stroke={ink} strokeWidth="2" /><Line x1={360} y1={74} x2={360} y2={286} color={ink} /><Line x1={445} y1={74} x2={445} y2={286} color={lime} dashed width={3} />
      <Player x={253} y={162} /><Ball x={279} y={179} r={10} /><Player x={487} y={206} /><Player x={445} y={125} color={coral} /><Player x={562} y={177} color={coral} />
      <path d="M301 178h128m-12-10 12 10-12 10" fill="none" stroke={mint} strokeWidth="3" /><Txt x={294} y={146} size={13}>{t('Toque del compañero', 'Team-mate’s touch')}</Txt>
      <Txt x={455} y={103} size={13}>{t('Penúltimo defensor', 'Second-last defender')}</Txt><Txt x={486} y={241} anchor="middle" size={13}>{t('Posición', 'Position')}</Txt>
      <Txt x={360} y={318} anchor="middle" size={13}>{t('Ataque → · posición sola ≠ infracción; importa intervenir', 'Attack → · position alone ≠ offence; involvement matters')}</Txt>
    </>;
    case 12: return <>
      <Player x={142} y={138} /><Player x={201} y={138} color={coral} /><Ball x={173} y={172} r={11} /><Txt x={171} y={229} anchor="middle" size={14}>{t('Infracción', 'Offence')}</Txt>
      <path d="M239 158h90m-12-10 12 10-12 10" fill="none" stroke={mint} strokeWidth="3" /><Txt x={418} y={119} anchor="middle" size={14}>{t('Reanudación', 'Restart')}</Txt>
      <rect x="351" y="139" width="134" height="47" rx="4" fill={field} stroke={mint} strokeWidth="2" /><Txt x={418} y={168} anchor="middle" size={13}>{t('Libre / penal', 'Free kick / penalty')}</Txt>
      <path d="M490 158h43m-12-10 12 10-12 10" fill="none" stroke={coral} strokeWidth="3" /><rect x="558" y="104" width="42" height="61" fill={lime} /><rect x="617" y="104" width="42" height="61" fill={coral} />
      <Txt x={608} y={198} anchor="middle" size={13}>{t('Disciplina', 'Discipline')}</Txt><Txt x={360} y={286} anchor="middle" size={14}>{t('El tipo de falta y la gravedad se evalúan por separado', 'Offence type and severity are assessed separately')}</Txt>
    </>;
    case 13: return <>
      <Ball x={150} y={177} r={13} /><circle cx="150" cy="177" r="86" fill="none" stroke={lime} strokeWidth="2" strokeDasharray="5 6" /><Player x={286} y={157} color={coral} /><Player x={286} y={198} color={coral} />
      <Txt x={264} y={85} color={lime} size={14}>≥ 9,15 m</Txt><Line x1={260} y1={92} x2={224} y2={125} color={lime} />
      <Line x1={331} y1={84} x2={331} y2={270} color={mint} /><Txt x={379} y={123} size={16}>{t('Directo', 'Direct')}</Txt><Txt x={379} y={150} size={14}>{t('Puede marcar directamente', 'Can score directly')}</Txt>
      <Txt x={379} y={210} size={16}>{t('Indirecto', 'Indirect')}</Txt><Txt x={379} y={237} size={14}>{t('Requiere otro toque', 'Needs another touch')}</Txt>
      <Txt x={360} y={316} anchor="middle" size={13}>{t('Balón inmóvil; en juego al patearlo y moverlo claramente', 'Stationary ball; in play when kicked and clearly moves')}</Txt>
    </>;
    case 14: return <>
      <rect x="189.5" y="68" width="341" height="140" fill={field} stroke={ink} strokeWidth="2" /><path d="M329 68v-9h62v9" fill="none" stroke={lime} strokeWidth="4" />
      <rect x="282.5" y="68" width="155" height="46.5" fill="none" stroke={ink} strokeWidth="2" /><path d="M299 208a77.4 77.4 0 0 0 122 0" fill="none" stroke={mint} strokeWidth="2" />
      <Player x={360} y={72} color={coral} r={9} /><Ball x={360} y={161} r={9} /><Player x={360} y={250} /><Player x={216} y={260} /><Player x={505} y={260} color={coral} />
      <Line x1={469} y1={72} x2={469} y2={161} color={lime} dashed /><Txt x={482} y={122} color={lime} size={13}>11 m</Txt>
      <Txt x={110} y={56} size={13}>{t('Guardameta en línea', 'Keeper on line')}</Txt><Txt x={381} y={270} size={13}>{t('Ejecutor identificado', 'Identified kicker')}</Txt>
      <Txt x={360} y={318} anchor="middle" size={13}>{t('Demás: fuera de área y arco, detrás del punto', 'Others: outside area and arc, behind the mark')}</Txt>
    </>;
    case 15: return <>
      <Line x1={470} y1={67} x2={470} y2={287} color={lime} width={6} /><Txt x={483} y={90} size={13}>{t('Campo', 'Field')}</Txt>
      <circle cx="319" cy="162" r="21" fill={mint} /><path d="M294 188h50l20 65h-92z" fill={mint} stroke={ink} strokeWidth="2" />
      <path d="M288 199q-35-57 14-96m54 96q35-57-14-96" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" /><Ball x={322} y={88} r={18} />
      <path d="M287 254v29h28m32-29v29h28" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" />
      <Txt x={113} y={73} size={14}>{t('Ambas manos', 'Both hands')}</Txt><Line x1={237} y1={78} x2={286} y2={127} color={mint} />
      <Txt x={103} y={318} size={14}>{t('Parte de cada pie en línea o fuera', 'Part of each foot on line or outside')}</Txt>
      <Txt x={507} y={197} size={14}>{t('Por encima de', 'Over the head')}</Txt>{locale === 'es' && <Txt x={507} y={217} size={14}>la cabeza</Txt>}
    </>;
    case 16: return <>
      <rect x="100" y="65" width="520" height="230" fill={field} stroke={ink} strokeWidth="2" /><path d="M100 112h147v136H100m0-41h55v-54h-55" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M100 169H84v22h16" fill="none" stroke={lime} strokeWidth="3" /><Ball x={132} y={181} r={9} /><Player x={288} y={120} color={coral} /><Player x={290} y={240} color={coral} />
      <path d="M156 181h152m-13-11 13 11-13 11" fill="none" stroke={mint} strokeWidth="3" />
      <Txt x={168} y={94} size={13}>{t('Área penal', 'Penalty area')}</Txt><Txt x={107} y={272} size={13}>{t('Área de meta', 'Goal area')}</Txt>
      <Txt x={416} y={147} size={14}>{t('Rivales esperan fuera', 'Opponents wait outside')}</Txt><Txt x={416} y={168} size={14}>{t('del área penal', 'the penalty area')}</Txt>
      <Txt x={360} y={322} anchor="middle" size={13}>{t('En juego al patearlo y moverlo claramente', 'In play when kicked and clearly moves')}</Txt>
    </>;
    case 17: return <>
      <Line x1={166} y1={64} x2={166} y2={303} width={3} /><Line x1={166} y1={64} x2={617} y2={64} width={3} />
      <path d="M166 88a24 24 0 0 0 24-24" fill="none" stroke={lime} strokeWidth="3" /><Line x1={166} y1={64} x2={166} y2={27} width={4} /><path d="M166 27l56 19-56 18" fill={coral} stroke={ink} strokeWidth="2" />
      <Ball x={178} y={76} r={9} /><path d="M410 64a244 244 0 0 1-244 244" fill="none" stroke={mint} strokeWidth="2" strokeDasharray="6 7" /><Player x={448} y={146} color={coral} />
      <Txt x={251} y={101} color={lime} size={14}>{t('Arco: radio 1 m', 'Arc: radius 1 m')}</Txt><Line x1={252} y1={106} x2={190} y2={87} color={lime} />
      <Txt x={407} y={189} color={mint} size={14}>{t('Rival ≥ 9,15 m del arco', 'Opponent ≥ 9.15 m from arc')}</Txt>
      <Txt x={360} y={319} anchor="middle" size={13}>{t('Banderín en la intersección · no se retira', 'Flag at intersection · do not move it')}</Txt>
    </>;
    default: return null;
  }
}

/** Original RefView instructional schematics, not reproductions of IFAB artwork. */
export function LawIllustration({ number, locale }: { number: number; locale: Locale }) {
  const id = useId();
  const description = descriptions[number];
  if (!description) return null;
  return <svg role="img" aria-labelledby={`${id}-title ${id}-description`} viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet" width="100%" xmlns="http://www.w3.org/2000/svg">
    <title id={`${id}-title`}>{description[locale]}</title>
    <desc id={`${id}-description`}>{locale === 'es' ? description.detailEs : description.detailEn}</desc>
    <rect width="720" height="360" rx="22" fill="#102b27" />
    {scene(number, locale)}
  </svg>;
}
