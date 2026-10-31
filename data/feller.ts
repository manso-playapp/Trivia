// CONTENIDO PROVISORIO: Feller enviará el material de preguntas actualizado
// (más cortas, algunas visuales). Reemplazar este archivo; el resto del juego no cambia.
export interface FellerQuestion {
  text: string;
  visual?: string; // emoji/ilustración opcional sobre la pregunta
  options: string[];
  correct: number;
  explanation: string; // se muestra si se equivoca: respuesta correcta + por qué
}

export const FELLER_QUESTIONS: FellerQuestion[] = [
  {
    text: '¿Cuánto pesa una gallina ponedora?',
    visual: '🐔',
    options: ['1,8 a 2,2 kg', '4 a 5 kg', 'Menos de 1 kg'],
    correct: 0,
    explanation: 'Una gallina ponedora pesa entre 1,8 y 2,2 kg.',
  },
  {
    text: '¿Cuándo conviene comer huevo?',
    visual: '🍳',
    options: ['Solo en el desayuno', 'A cualquier hora del día'],
    correct: 1,
    explanation: 'El huevo se puede incorporar en cualquier momento del día.',
  },
  {
    text: 'Un huevo con la cáscara rota, ¿se puede consumir?',
    visual: '🥚',
    options: ['Verdadero', 'Falso'],
    correct: 1,
    explanation: 'Falso: una cáscara rota deja pasar bacterias. Hay que descartarlo.',
  },
  {
    text: '¿Dónde se guarda mejor el huevo?',
    visual: '🧊',
    options: ['En la heladera', 'Al sol'],
    correct: 0,
    explanation: 'En la heladera, en su maple, se conserva mejor.',
  },
  {
    text: 'El huevo es una buena fuente de proteínas.',
    visual: '💪',
    options: ['Verdadero', 'Falso'],
    correct: 0,
    explanation: 'Verdadero: es un superalimento, con proteínas de alta calidad.',
  },
];

export const QUESTION_SECONDS = 15;
