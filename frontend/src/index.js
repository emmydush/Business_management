import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/filters.css';
import App from './App';
import { CurrencyProvider } from './context/CurrencyContext';
import I18nProvider from './i18n/I18nProvider';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </I18nProvider>
  </React.StrictMode>
);
