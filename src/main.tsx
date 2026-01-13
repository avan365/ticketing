import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { AdminPage } from './pages/AdminPage'
import { BouncerPage } from './pages/BouncerPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/bouncer" element={<BouncerPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)


