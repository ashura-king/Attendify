import { BrowserRouter as Router, Route, Navigate, Routes } from "react-router-dom";
import { useEffect } from "react"; // ⬅️ add this
import { supabase } from "./lib/supabaseClient"; // ⬅️ add this
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminPanel from "./pages/Admin/AdminPanel"; // ⬅️ also fixed double slash //

function App() {
  useEffect(() => {
    const checkConnection = async () => {
      const { data, error } = await supabase.from('profiles').select('count')
      if (error) {
        console.log('❌ Supabase NOT connected:', error.message)
      } else {
        console.log('✅ Supabase Connected!')
      }
    }
    checkConnection()
  }, [])

  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;