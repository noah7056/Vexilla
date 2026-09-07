import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './styles.css';
import { FlagsProvider } from './contexts/FlagsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlagsProvider>
      <App />
    </FlagsProvider>
  </StrictMode>,
);
