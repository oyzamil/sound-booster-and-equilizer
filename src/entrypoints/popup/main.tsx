import { StrictMode } from 'react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import Eq from './Eq.jsx';
import { store } from './store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);

export default function App() {
  return (
    <ThemeProvider>
      <Eq />
      <LicenseModal />
    </ThemeProvider>
  );
}
