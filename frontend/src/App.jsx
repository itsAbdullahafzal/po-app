import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import NewPO from './pages/NewPO.jsx';
import PODetail from './pages/PODetail.jsx';
import Fulfillment from './pages/Fulfillment.jsx';
import NewFulfillment from './pages/NewFulfillment.jsx';
import FulfillmentDetail from './pages/FulfillmentDetail.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminOrders from './pages/AdminOrders.jsx';

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pending" element={<PendingApproval />} />

          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/purchase-orders" element={<AppLayout><PurchaseOrders /></AppLayout>} />
          <Route path="/purchase-orders/new" element={<AppLayout><NewPO /></AppLayout>} />
          <Route path="/purchase-orders/:id" element={<AppLayout><PODetail /></AppLayout>} />

          <Route path="/fulfillment" element={<AppLayout><Fulfillment /></AppLayout>} />
          <Route path="/fulfillment/new" element={<AppLayout><NewFulfillment /></AppLayout>} />
          <Route path="/fulfillment/:id" element={<AppLayout><FulfillmentDetail /></AppLayout>} />

          <Route path="/admin" element={<ProtectedRoute managerOnly><Layout><AdminPanel /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute managerOnly><Layout><AdminUsers /></Layout></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute managerOnly><Layout><AdminOrders /></Layout></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
