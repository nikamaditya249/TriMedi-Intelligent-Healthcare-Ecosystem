import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { useState } from "react";

// Public Pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";

// Layout & App Shell
import Navbar from "./components/Navbar";
import AppShell from "./components/layout/AppShell";

// Dashboards
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PharmacyDashboard from "./pages/dashboards/PharmacyDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

// Subpages
import {
  MyDoctorsPage,
  PrescriptionsPage,
  AppointmentsPage,
  InventoryPage,
  OrdersPage,
  SystemManagementPage,
} from "./pages/dashboards/RoleSubpages";

// Real-Time Chat
import ChatPage from "./pages/chat/ChatPage";

// Route wrapper to render Navbar for public views and AppShell for application views
function AppContent() {
  const [search, setSearch] = useState("");
  const { activeRole } = useAuth();
  const location = useLocation();

  const isAppRoute = location.pathname.startsWith("/app");

  return (
    <>
      {!isAppRoute && <Navbar search={search} setSearch={setSearch} />}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/products" element={<Products search={search} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/profile"
          element={
            <div className="py-8 px-4 sm:px-6">
              <Profile />
            </div>
          }
        />

        {/* SHARED REAL-TIME CHAT */}
        <Route
          path="/app/chat"
          element={
            <AppShell>
              <ChatPage />
            </AppShell>
          }
        />

        {/* PATIENT ROUTES */}
        <Route
          path="/app/patient/dashboard"
          element={
            <AppShell>
              <PatientDashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/patient/doctors"
          element={
            <AppShell>
              <MyDoctorsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/patient/prescriptions"
          element={
            <AppShell>
              <PrescriptionsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/patient/orders"
          element={
            <AppShell>
              <OrdersPage />
            </AppShell>
          }
        />
        <Route
          path="/app/patient/messages"
          element={
            <AppShell>
              <ChatPage />
            </AppShell>
          }
        />

        {/* DOCTOR ROUTES */}
        <Route
          path="/app/doctor/dashboard"
          element={
            <AppShell>
              <DoctorDashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/doctor/patients"
          element={
            <AppShell>
              <MyDoctorsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/doctor/prescriptions"
          element={
            <AppShell>
              <PrescriptionsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/doctor/appointments"
          element={
            <AppShell>
              <AppointmentsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/doctor/messages"
          element={
            <AppShell>
              <ChatPage />
            </AppShell>
          }
        />

        {/* PHARMACY ROUTES */}
        <Route
          path="/app/pharmacy/dashboard"
          element={
            <AppShell>
              <PharmacyDashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/pharmacy/orders"
          element={
            <AppShell>
              <OrdersPage />
            </AppShell>
          }
        />
        <Route
          path="/app/pharmacy/inventory"
          element={
            <AppShell>
              <InventoryPage />
            </AppShell>
          }
        />
        <Route
          path="/app/pharmacy/patients"
          element={
            <AppShell>
              <MyDoctorsPage />
            </AppShell>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/app/admin/dashboard"
          element={
            <AppShell>
              <AdminDashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/admin/users"
          element={
            <AppShell>
              <AdminDashboard />
            </AppShell>
          }
        />
        <Route
          path="/app/admin/doctors"
          element={
            <AppShell>
              <MyDoctorsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/admin/patients"
          element={
            <AppShell>
              <MyDoctorsPage />
            </AppShell>
          }
        />
        <Route
          path="/app/admin/orders"
          element={
            <AppShell>
              <OrdersPage />
            </AppShell>
          }
        />
        <Route
          path="/app/admin/system"
          element={
            <AppShell>
              <SystemManagementPage />
            </AppShell>
          }
        />

        {/* Unified redirect helper */}
        <Route
          path="/app/dashboard"
          element={<Navigate to={`/app/${activeRole || "patient"}/dashboard`} replace />}
        />
        <Route path="/app" element={<Navigate to={`/app/${activeRole || "patient"}/dashboard`} replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;