import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { StoreProvider } from './contexts/StoreContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { StoreGate } from './components/StoreGate'
import { AuthCallbackPage } from './pages/AuthCallback'
import { LoginPage } from './pages/Login'
import { SignupPage } from './pages/Signup'
import { StoreSelectPage } from './pages/StoreSelect'
import { ScanPage } from './pages/Scan'
import { CartPage } from './pages/CartPage'
import { PaymentPage } from './pages/Payment'
import { OrderSuccessPage } from './pages/OrderSuccess'
import { BudgetProvider } from './contexts/BudgetContext'
import { OrdersPage }  from './pages/OrdersPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
      <StoreProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route
                path="/stores"
                element={
                  <ProtectedRoute>
                    <StoreSelectPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scan"
                element={
                  <ProtectedRoute>
                    <StoreGate>
                      <ScanPage />
                    </StoreGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <StoreGate>
                      <CartPage />
                    </StoreGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <StoreGate>
                      <PaymentPage />
                    </StoreGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-success"
                element={
                  <ProtectedRoute>
                    <OrderSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/orders"  element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </StoreProvider>
      </BudgetProvider>
    </AuthProvider>
  )
}
