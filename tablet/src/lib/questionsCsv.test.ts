import { describe, expect, it } from 'vitest';
import { parseCsv, questionsFromCsv, QUESTIONS_TEMPLATE } from './questionsCsv';

describe('parseCsv', () => {
  it('separa por ; o , y respeta comillas', () => {
    expect(parseCsv('a;b\r\n"x;1";"di ""hola"""')).toEqual([['a', 'b'], ['x;1', 'di "hola"']]);
    expect(parseCsv('a,b\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('questionsFromCsv', () => {
  it('lee la plantilla', () => {
    const { questions, errors } = questionsFromCsv(QUESTIONS_TEMPLATE);
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({ options: ['365', '366', '364'], correct: 1, active: true });
    expect(questions[1].options).toEqual(['Verdadero', 'Falso']);
  });
  it('acepta encabezados con mayúsculas y tildes, y marca filas con errores', () => {
    const csv = 'Pregunta,Opción_A,Opcion_B,Correcta,Activa\nHola?,Sí,No,a,no\nSin opciones,x,,A,si\nMal,1,2,C,si';
    const { questions, errors } = questionsFromCsv(csv);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ correct: 0, active: false });
    expect(errors).toHaveLength(2);
  });
  it('avisa si faltan columnas', () => {
    expect(questionsFromCsv('id,texto\n1,hola').errors[0]).toMatch(/Faltan columnas/);
  });
});
