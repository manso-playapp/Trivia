/* Ruleta Pilar XV — valores de fábrica. Durante el evento todo se edita desde el panel de operador.
   Si cambiás algo acá, cambiá también "id" para que el dispositivo descarte lo que tenía guardado. */
window.RULETA_CONFIG = {
  id: 'pilar-xv-3',
  pin: '1234',
  segundosGiro: 6,
  segundosCartel: 12,
  premios: [
    { nombre: 'Bolsa',   articulo: 'una', stock: 35 },
    { nombre: 'Remera',  articulo: 'una', stock: 25 },
    { nombre: 'Botella', articulo: 'una', stock: 20 },
    { nombre: 'Piluso',  articulo: 'un',  stock: 25 }
  ],
  /* gajos, en orden; se repiten si hay más premios. "tex" usa una textura de brillantina de assets/ */
  paleta: [
    { tex: 'rosa',    fondo: '#e0409a', texto: '#ffffff' },
    {                 fondo: '#2b0f57', texto: '#ffffff' },
    { tex: 'violeta', fondo: '#7a3fd0', texto: '#ffffff' },
    {                 fondo: '#ead9ff', texto: '#3a1466' },
    {                 fondo: '#b3187a', texto: '#ffffff' },
    {                 fondo: '#5a2fb0', texto: '#ffffff' }
  ]
};
