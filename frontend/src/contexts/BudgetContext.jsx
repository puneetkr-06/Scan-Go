import { createContext, useContext, useState, useEffect } from 'react'

const BudgetContext = createContext(null)

const STORAGE_KEY = 'scanGoBudget'

export function BudgetProvider({ children }) {
  const [budgetMode, setBudgetMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return saved.budgetMode ?? false
    } catch { return false }
  })
  const [budget, setBudget] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return saved.budget ?? 500
    } catch { return 500 }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ budgetMode, budget }))
  }, [budgetMode, budget])

  return (
    <BudgetContext.Provider value={{ budgetMode, setBudgetMode, budget, setBudget }}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudget must be inside BudgetProvider')
  return ctx
}
