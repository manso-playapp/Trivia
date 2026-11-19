/* Ruleta Pilar XV — valores de fábrica. Durante el evento todo se edita desde el panel de operador.
   Si cambiás algo acá, cambiá también "id" para que el dispositivo descarte lo que tenía guardado. */
window.RULETA_CONFIG = {
  id: 'pilar-xv-2',
  pin: '1234',
  segundosGiro: 6,
  segundosCartel: 12,
  premios: [
    { nombre: 'Bolsa',   articulo: 'una', stock: 35 },
    { nombre: 'Remera',  articulo: 'una', stock: 25 },
    { nombre: 'Botella', articulo: 'una', stock: 20 },
    { nombre: 'Piluso',  articulo: 'un',  stock: 25 }
  ],
  /* colores de los gajos, en orden; se repiten si hay más premios */
  paleta: [
    { fondo: '#f4c9a4', texto: '#2a1838' },
    { fondo: '#5a3488', texto: '#fff3e6' },
    { fondo: '#e07f96', texto: '#2a1838' },
    { fondo: '#1d1640', texto: '#fff3e6' },
    { fondo: '#f0a58a', texto: '#2a1838' },
    { fondo: '#8a5bb5', texto: '#fff3e6' }
  ]
};
