import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import ChallansPage from './pages/challans/ChallansPage';
import CreateChallanPage from './pages/challans/CreateChallanPage';
import ChallanDetailPage from './pages/challans/ChallanDetailPage';
import UsersPage from './pages/users/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Customers */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
          </Route>

          {/* Products & Inventory */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']} />}>
            <Route path="/products" element={<ProductsPage />} />
          </Route>

          {/* Challans */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']} />}>
            <Route path="/challans" element={<ChallansPage />} />
            <Route path="/challans/new" element={<CreateChallanPage />} />
            <Route path="/challans/:id" element={<ChallanDetailPage />} />
          </Route>

          {/* Users (Admin Only) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
