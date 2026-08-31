import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./shared/Layout";
import { useAuth } from "./shared/AuthContext";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { BusinessOverview } from "./pages/BusinessOverview";
import { Orders } from "./pages/Orders";
import { Reports } from "./pages/Reports";
import { Customers } from "./pages/Customers";
import { Vouchers } from "./pages/Vouchers";
import { Wallet } from "./pages/Wallet";
import { Refunds } from "./pages/Refunds";
import { Exceptions } from "./pages/Exceptions";
import { AuditLog } from "./pages/AuditLog";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Overview />} />
        <Route path="business" element={<BusinessOverview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="reports" element={<Reports />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vouchers" element={<Vouchers />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="refunds" element={<Refunds />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  );
}

export default App;
