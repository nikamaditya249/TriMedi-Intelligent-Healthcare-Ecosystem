import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { useState, useEffect } from "react";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import CategoryExplorer from "./pages/commerce/CategoryExplorer";
import HealthConcernsExplorer from "./pages/commerce/HealthConcernsExplorer";
import BrandDirectoryPage from "./pages/commerce/BrandDirectoryPage";
import ProductListingPage from "./pages/commerce/ProductListingPage";
import ProductDetailPage from "./pages/commerce/ProductDetailPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";

// Layout & Route Protection
import Navbar from "./components/Navbar";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Dashboards
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PharmacyDashboard from "./pages/dashboards/PharmacyDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ReceptionDashboard from "./pages/dashboards/ReceptionDashboard";

// Subpages
import {
  MyDoctorsPage,
  MyPatientsPage,
  PrescriptionsPage,
  AppointmentsPage,
  InventoryPage,
  OrdersPage,
  SystemManagementPage,
  AdminDoctorsPage,
  AdminPatientsPage,
  PharmacyPatientsPage,
} from "./pages/dashboards/RoleSubpages";

// Real-Time Chat
import ChatPage from "./pages/chat/ChatPage";

// Scroll restoration helper on route transition
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Route wrapper to render Navbar for public views and AppShell for application views
function AppContent() {
  const [search, setSearch] = useState("");
  const { activeRole } = useAuth();
  const location = useLocation();

  const isAppRoute = location.pathname.startsWith("/app");

  return (
    <>
      <ScrollToTop />
      {!isAppRoute && <Navbar search={search} setSearch={setSearch} />}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth" element={<Auth />} />
        {/* COMMERCE DISCOVERY & PROGRESSIVE DISCLOSURE ROUTES */}
        <Route path="/products" element={<Products search={search} />} />
        <Route path="/products/categories" element={<CategoryExplorer />} />
        <Route
          path="/products/category/:slug"
          element={<ProductListingPage mode="category" search={search} />}
        />
        <Route path="/products/concerns" element={<HealthConcernsExplorer />} />
        <Route
          path="/products/concern/:slug"
          element={<ProductListingPage mode="concern" search={search} />}
        />
        <Route path="/products/brands" element={<BrandDirectoryPage />} />
        <Route
          path="/products/brand/:slug"
          element={<ProductListingPage mode="brand" search={search} />}
        />
        <Route
          path="/products/medicines"
          element={<ProductListingPage mode="medicines" search={search} />}
        />
        <Route
          path="/products/devices"
          element={<ProductListingPage mode="devices" search={search} />}
        />
        <Route
          path="/products/wellness"
          element={<ProductListingPage mode="wellness" search={search} />}
        />
        <Route
          path="/products/personal-care"
          element={<ProductListingPage mode="personalCare" search={search} />}
        />
        <Route
          path="/products/search"
          element={<ProductListingPage mode="search" search={search} />}
        />
        <Route path="/products/:productId" element={<ProductDetailPage />} />

        {/* LEGACY SHORTCUTS */}
        <Route path="/medicines" element={<Navigate to="/products/medicines" replace />} />
        <Route path="/consult" element={<Navigate to="/app/patient/doctors" replace />} />
        <Route path="/orders" element={<Navigate to="/app/patient/orders" replace />} />
        <Route path="/records" element={<Navigate to="/app/patient/dashboard?tab=medical_record" replace />} />
        <Route path="/health-records" element={<Navigate to="/app/patient/dashboard?tab=medical_record" replace />} />
        <Route path="/lab-reports" element={<Navigate to="/app/patient/dashboard?tab=medical_record" replace />} />
        <Route path="/help" element={<Navigate to="/#help" replace />} />
        <Route path="/offers" element={<Navigate to="/#offers" replace />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="py-8 px-4 sm:px-6">
                <Profile />
              </div>
            </ProtectedRoute>
          }
        />

        {/* SHARED REAL-TIME CHAT */}
        <Route
          path="/app/chat"
          element={
            <ProtectedRoute>
              <AppShell>
                <ChatPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* PATIENT ROUTES (Strictly Patient Isolated) */}
        <Route
          path="/app/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppShell>
                <PatientDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppShell>
                <AppointmentsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/patient/doctors"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppShell>
                <MyDoctorsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/patient/prescriptions"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppShell>
                <PrescriptionsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/patient/orders"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppShell>
                <OrdersPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/patient/messages"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppShell>
                <ChatPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/app/patient" element={<Navigate to="/app/patient/dashboard" replace />} />

        {/* DOCTOR ROUTES (Strictly Doctor Isolated) */}
        <Route
          path="/app/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <AppShell>
                <DoctorDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <AppShell>
                <MyPatientsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/doctor/prescriptions"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <AppShell>
                <PrescriptionsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <AppShell>
                <AppointmentsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/doctor/messages"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <AppShell>
                <ChatPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/app/doctor" element={<Navigate to="/app/doctor/dashboard" replace />} />

        {/* PHARMACY ROUTES (Strictly Pharmacy Isolated) */}
        <Route
          path="/app/pharmacy/dashboard"
          element={
            <ProtectedRoute allowedRoles={["pharmacy"]}>
              <AppShell>
                <PharmacyDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/pharmacy/orders"
          element={
            <ProtectedRoute allowedRoles={["pharmacy"]}>
              <AppShell>
                <OrdersPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/pharmacy/inventory"
          element={
            <ProtectedRoute allowedRoles={["pharmacy"]}>
              <AppShell>
                <InventoryPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/pharmacy/patients"
          element={
            <ProtectedRoute allowedRoles={["pharmacy"]}>
              <AppShell>
                <PharmacyPatientsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/app/pharmacy" element={<Navigate to="/app/pharmacy/dashboard" replace />} />

        {/* ADMIN ROUTES (Strictly Admin Isolated) */}
        <Route
          path="/app/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <AdminDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <AdminDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/doctors"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <AdminDoctorsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/patients"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <AdminPatientsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <OrdersPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/system"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <SystemManagementPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/app/admin" element={<Navigate to="/app/admin/dashboard" replace />} />

        {/* RECEPTION ROUTES (Strictly Reception Isolated) */}
        <Route
          path="/app/reception/dashboard"
          element={
            <ProtectedRoute allowedRoles={["reception"]}>
              <AppShell>
                <ReceptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception/queue"
          element={
            <ProtectedRoute allowedRoles={["reception"]}>
              <AppShell>
                <ReceptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception/appointments"
          element={
            <ProtectedRoute allowedRoles={["reception"]}>
              <AppShell>
                <ReceptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception/patients"
          element={
            <ProtectedRoute allowedRoles={["reception"]}>
              <AppShell>
                <ReceptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/app/reception" element={<Navigate to="/app/reception/dashboard" replace />} />

        {/* Unified redirect helpers */}
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