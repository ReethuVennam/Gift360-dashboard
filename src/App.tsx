import { Route, Routes } from "react-router-dom";
import { Layout } from "./shared/Layout";
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

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
