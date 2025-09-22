import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { store } from './store';
import { useAppDispatch } from './store/hooks';
import { initializeAuth } from './store/slices/authSlice';

function AppContent(): JSX.Element {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state on app startup
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<div>Products Page (Coming Soon)</div>} />
          <Route path="inventory" element={<div>Inventory Page (Coming Soon)</div>} />
          <Route path="orders" element={<div>Orders Page (Coming Soon)</div>} />
          <Route path="customers" element={<div>Customers Page (Coming Soon)</div>} />
          <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
        </Route>

        {/* Fallback routes */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Unauthorized</h1>
                <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
              </div>
            </div>
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
                <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
