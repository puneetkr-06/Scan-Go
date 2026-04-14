import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BudgetProvider } from './contexts/BudgetContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BudgetProvider>
      <App />
    </BudgetProvider>
  </StrictMode>,
)
