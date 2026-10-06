import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createServices } from './composition/container';
import './styles/tokens.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Elemento #root não encontrado no index.html.');
}

// Ponto de entrada: as dependencias sao montadas uma unica vez, aqui, e entregues a arvore.
const services = createServices();

createRoot(container).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
);
