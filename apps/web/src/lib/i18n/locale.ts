export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export function resolveLocale(value: string | undefined): Locale {
  return value === 'en' ? 'en' : 'es';
}

export const copy = {
  es: {
    eyebrow: 'REFVIEW / BASE DE SIMULACIÓN',
    title: 'La cancha se aprende desde adentro.',
    intro: 'Una plataforma para observar, decidir y entender el arbitraje. Esta primera vista comprueba la base de la aplicación y el renderizado 3D; todavía no es una jugada jugable.',
    scene: 'Prueba de campo 3D',
    sceneDescription: 'Geometría ilustrativa. Sin jugadores, incidente ni evaluación.',
    loading: 'Cargando vista 3D…',
    ready: 'Vista 3D lista',
    unsupported: 'Este navegador no admite WebGL. Podés seguir usando el resto de RefView.',
    error: 'No se pudo mostrar la vista 3D. Recargá la página para volver a intentar.',
    prototype: 'Explorar el concepto completo',
    status: 'Fundación técnica · RV-004',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    next: 'Después: movimiento, posición y primera jugada validada',
  },
  en: {
    eyebrow: 'REFVIEW / SIMULATOR FOUNDATION',
    title: 'Learn the game from inside the moment.',
    intro: 'A platform to observe, decide, and understand refereeing. This first view checks the application foundation and 3D rendering; it is not a playable incident yet.',
    scene: '3D field test',
    sceneDescription: 'Illustrative geometry. No players, incident, or evaluation.',
    loading: 'Loading 3D view…',
    ready: '3D view ready',
    unsupported: 'This browser does not support WebGL. You can still use the rest of RefView.',
    error: 'The 3D view could not be displayed. Reload the page to try again.',
    prototype: 'Explore the full concept',
    status: 'Technical foundation · RV-004',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    next: 'Next: movement, positioning, and a reviewed first incident',
  },
} as const;
