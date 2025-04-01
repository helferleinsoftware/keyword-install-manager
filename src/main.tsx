import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Behalte globales CSS, falls vorhanden/gewünscht
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Router hier hinzufügen */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)