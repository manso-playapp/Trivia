// Banco de preguntas Feller (fuente: "TRIVIA Juego para Stand FNA Manso.docx" en Drive).
// El juego toma las primeras 5 preguntas (ver app/feller/[mode]/page.tsx).
// Las explicaciones marcadas en el documento como "Aca si indicar" se usan textuales;
// el resto se redactó a partir de la respuesta correcta y conviene revisarlas con Feller.
export interface FellerQuestion {
  text: string;
  visual?: string; // emoji/ilustración opcional sobre la pregunta
  options: string[];
  correct: number;
  explanation: string; // se muestra si se equivoca: respuesta correcta + por qué
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
    explanation: 'No: el color de la cáscara depende de la raza de la gallina, no de la calidad ni del valor nutricional.',
  },
  {
    text: '¿Aproximadamente cuántas horas le toma a una gallina producir y poner 1 huevo?',
    options: ['Entre 4 y 6 horas.', 'Entre 24 y 26 horas.', '48 horas completas.'],
    correct: 1,
    explanation: 'Una gallina tarda entre 24 y 26 horas en producir y poner un huevo.',
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
    explanation: 'La yema concentra la mayor cantidad de vitaminas (A, D, E, K) y minerales.',
  },
  {
    text: '¿Cuál de las siguientes preparaciones NO lleva huevo entre sus ingredientes principales?',
    options: ['Tortilla.', 'Fideos.', 'Pan tradicional.'],
    correct: 2,
    explanation: 'El pan tradicional no lleva huevo entre sus ingredientes principales.',
  },
  {
    text: '¿Cuántos gramos de proteína aporta un huevo?',
    options: ['6 gramos.', '8 gramos.', '12 gramos.'],
    correct: 0,
    explanation: 'Un huevo aporta alrededor de 6 gramos de proteína.',
  },
  {
    text: '¿Cuál es el consumo promedio por persona de huevos en Argentina?',
    options: ['180', '250', '406'],
    correct: 2,
    explanation: 'El consumo promedio por persona en Argentina es de 406.',
  },
  {
    text: '¿Cuánto pesa un huevo promedio?',
    options: ['40 gramos.', '60 gramos.', '80 gramos.'],
    correct: 1,
    explanation: 'Un huevo promedio pesa unos 60 gramos.',
  },
  {
    text: '¿A qué edad aproximada una gallina ponedora comienza a poner huevos?',
    options: ['Al año de vida.', 'Entre las 18 y 20 semanas.', 'Entre las 5 y 6 semanas.'],
    correct: 1,
    explanation: 'Las gallinas ponedoras empiezan a poner entre las 18 y 20 semanas de vida.',
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
    explanation: 'Falso: una fisura en la cáscara rompe la barrera natural del huevo y expone su interior a bacterias del ambiente.',
  },
  {
    text: '¿Qué parte del huevo tiene más proteína?',
    options: ['La clara.', 'La yema.', 'Las dos por igual.'],
    correct: 0,
    explanation: 'La clara es la parte del huevo que tiene más proteína.',
  },
  {
    text: '¿De qué está hecha principalmente la cáscara del huevo?',
    options: ['Proteína.', 'Hierro.', 'Calcio.'],
    correct: 2,
    explanation: 'La cáscara está hecha principalmente de calcio.',
  },
  {
    text: '¿En qué momento del día es recomendable consumir huevo?',
    options: [
      'Principalmente en el desayuno.',
      'Únicamente en el almuerzo o la cena.',
      'En cualquier momento del día.',
    ],
    correct: 2,
    explanation: 'El huevo se puede consumir en cualquier momento del día.',
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
    explanation: 'Una gallina ponedora pesa entre 1,8 y 2,2 kg.',
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
    explanation: 'No es recomendable por el riesgo de bacterias como Salmonella.',
  },
  {
    text: '¿Qué efecto principal produce el consumo de huevo en las comidas principales?',
    options: [
      'Da saciedad y ayuda a regular el apetito.',
      'Produce somnolencia.',
      'Dificulta la digestión.',
    ],
    correct: 0,
    explanation: 'El huevo da saciedad y ayuda a regular el apetito.',
  },
  {
    text: '¿La edad de la gallina influye en el tamaño del huevo que pone?',
    options: [
      'No, el tamaño nunca cambia.',
      'Sí, a mayor edad, huevos más grandes.',
      'Depende de la cantidad de agua que toma.',
    ],
    correct: 1,
    explanation: 'A mayor edad de la gallina, los huevos que pone son más grandes.',
  },
];

export const QUESTION_SECONDS = 15;
