/* Ruleta Pilar XV — contenido editable.
   Si cambiás premios o cantidades acá, cambiá también "id" para que el stock guardado se reinicie. */
window.RULETA_CONFIG = {
  id: 'pilar-xv-1',
  pin: '1234',
  premios: [
    { id: 'bolsa',   nombre: 'Bolsa',   articulo: 'una', stock: 35, fondo: '#f6cfae', texto: '#2a1838' },
    { id: 'remera',  nombre: 'Remera',  articulo: 'una', stock: 25, fondo: '#4b2d70', texto: '#fbeee4' },
    { id: 'botella', nombre: 'Botella', articulo: 'una', stock: 20, fondo: '#dc7f92', texto: '#2a1838' },
    { id: 'piluso',  nombre: 'Piluso',  articulo: 'un',  stock: 25, fondo: '#191335', texto: '#fbeee4' }
  ],
  /* orden de los gajos en la rueda, en sentido horario desde arriba */
  gajos: ['bolsa', 'remera', 'botella', 'piluso', 'bolsa', 'remera', 'botella', 'piluso']
};
