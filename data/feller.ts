// Banco de preguntas Feller (fuente: "TRIVIA Juego para Stand FNA Manso.docx" en Drive).
// El juego toma las primeras 5 preguntas (ver app/feller/[mode]/page.tsx).
// Solo las preguntas que el documento marca con "Aca si indicar" llevan explicación.
export interface FellerQuestion {
  text: string;
  visual?: string; // emoji/ilustración opcional sobre la pregunta
  options: string[];
  correct: number;
  explanation?: string; // se muestra si se equivoca, después de la respuesta correcta
}

export const FELLER_QUESTIONS: FellerQuestion[] = [
  {
    text: '¿El color de la cáscara (marrón o blanca) influye en la calidad o el valor nutricional del huevo?',
    options: [
      'Sí, los de color son más nutritivos.',
      'Sí, los blancos tienen menos grasa.',
      'No, el color solo depende de la raza de la gallina.',
    ],
    correct: 2,
  },
  {
    text: '¿Aproximadamente cuántas horas le toma a una gallina producir y poner 1 huevo?',
    options: ['Entre 4 y 6 horas.', 'Entre 24 y 26 horas.', '48 horas completas.'],
    correct: 1,
  },
  {
    text: 'Si un huevo sumergido en agua se hunde, ¿qué está indicando?',
    options: [
      'Que es un huevo fresco.',
      'Que ya perdió frescura y acumuló aire.',
      'No indica nada.',
    ],
    correct: 0,
    explanation: 'Los huevos frescos son más densos y se van al fondo.',
  },
  {
    text: '¿Qué parte del huevo contiene la mayor cantidad de vitaminas (A, D, E, K) y minerales?',
    options: ['La yema.', 'La clara.', 'La membrana interna.'],
    correct: 0,
  },
  {
    text: '¿Cuál de las siguientes preparaciones NO lleva huevo entre sus ingredientes principales?',
    options: ['Tortilla.', 'Fideos.', 'Pan tradicional.'],
    correct: 2,
  },
  {
    text: '¿Cuántos gramos de proteína aporta un huevo?',
    options: ['6 gramos.', '8 gramos.', '12 gramos.'],
    correct: 0,
  },
  {
    text: '¿Cuál es el consumo promedio por persona de huevos en Argentina?',
    options: ['180', '250', '406'],
    correct: 2,
  },
  {
    text: '¿Cuánto pesa un huevo promedio?',
    options: ['40 gramos.', '60 gramos.', '80 gramos.'],
    correct: 1,
  },
  {
    text: '¿A qué edad aproximada una gallina ponedora comienza a poner huevos?',
    options: ['Al año de vida.', 'Entre las 18 y 20 semanas.', 'Entre las 5 y 6 semanas.'],
    correct: 1,
  },
  {
    text: '¿Hay que lavar los huevos antes de almacenarlos?',
    options: ['No, nunca.', 'Sí, siempre con agua.', 'Solo si son blancos.'],
    correct: 0,
    explanation: 'No, porque se elimina su capa protectora natural y facilita la entrada de bacterias.',
  },
  {
    text: '"Es seguro consumir un huevo con cáscara rota". ¿Es correcta esta afirmación?',
    options: ['Verdadero.', 'Falso.'],
    correct: 1,
    explanation: 'Una fisura en la cáscara rompe la barrera natural del huevo y expone su interior a bacterias del ambiente.',
  },
  {
    text: '¿Qué parte del huevo tiene más proteína?',
    options: ['La clara.', 'La yema.', 'Las dos por igual.'],
    correct: 0,
  },
  {
    text: '¿De qué está hecha principalmente la cáscara del huevo?',
    options: ['Proteína.', 'Hierro.', 'Calcio.'],
    correct: 2,
  },
  {
    text: '¿En qué momento del día es recomendable consumir huevo?',
    options: [
      'Principalmente en el desayuno.',
      'Únicamente en el almuerzo o la cena.',
      'En cualquier momento del día.',
    ],
    correct: 2,
  },
  {
    text: '¿A qué se debe que la yema sea de color amarillo o anaranjado intenso?',
    options: ['A la genética del ave.', 'Al alimento.', 'Al tipo de crianza.'],
    correct: 1,
    explanation: 'El tono depende de los pigmentos naturales presentes en la dieta del ave.',
  },
  {
    text: '¿Cuál es el peso promedio de una gallina ponedora?',
    options: ['Entre 1,8 kg y 2,2 kg.', 'Alrededor de 4 a 5 kg.', 'Menos de 1 kg.'],
    correct: 0,
  },
  {
    text: '¿El huevo es un alimento libre de gluten de forma natural?',
    options: [
      'Sí, es 100% libre de gluten (sin TACC).',
      'No, contiene trazas de gluten.',
      'Solo el huevo de cáscara marrón.',
    ],
    correct: 0,
    explanation: 'El huevo entero en su estado natural es libre de gluten.',
  },
  {
    text: '¿Es recomendable consumir huevo crudo sin pasteurizar?',
    options: [
      'No, por el riesgo de bacterias como Salmonella.',
      'Sí, aprovecha mejor los nutrientes.',
      'Solo si es huevo blanco.',
    ],
    correct: 0,
  },
  {
    text: '¿Qué efecto principal produce el consumo de huevo en las comidas principales?',
    options: [
      'Da saciedad y ayuda a regular el apetito.',
      'Produce somnolencia.',
      'Dificulta la digestión.',
    ],
    correct: 0,
  },
  {
    text: '¿La edad de la gallina influye en el tamaño del huevo que pone?',
    options: [
      'No, el tamaño nunca cambia.',
      'Sí, a mayor edad, huevos más grandes.',
      'Depende de la cantidad de agua que toma.',
    ],
    correct: 1,
  },
];

export const QUESTION_SECONDS = 15;
