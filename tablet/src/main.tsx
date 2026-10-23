import React from 'react';
import ReactDOM from 'react-dom/client';
// Tipografías gratuitas (SIL Open Font License) incluidas en la app: funcionan sin internet.
import '@fontsource/fira-sans/latin-400.css';
import '@fontsource/fira-sans/latin-700.css';
import '@fontsource/fira-sans/latin-800.css';
import '@fontsource/saira/latin-400.css';
import '@fontsource/saira/latin-600.css';
import './styles.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
