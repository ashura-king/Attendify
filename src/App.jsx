import { BrowserRouter as Router, Route, Navigate, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminPanel from "./pages/Admin/AdminPanel";
import PageLoader from "./components/PageLoader";
import usePageLoader from "./hooks/usePageLoader";

// ⚠️ Separate component because usePageLoader needs to be INSIDE <Router>
function AppRoutes() {
  const loading = usePageLoader();

  return (
    <>
      {loading && <PageLoader />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'employee']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;