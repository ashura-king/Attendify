import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import './Register.css';
import { supabase } from "../../lib/supabaseClient";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: username }
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.user) {
      alert("Registration successful! Please check your email to confirm your account.");
      navigate("/login");
      return;
    }

    
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert([{
        id: data.user.id,
        full_name: username,
        email,
        department,       // ← was missing before
        role: "employee",
      }]);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    navigate("/login");
  };

  return (
    <div className="register-wrapper">
      <div className="register-left">
        <div className="liquid-bg" />
        <div className="brand">
          <div className="brandIcon">
            <h1>Attendify</h1>
            <p>Manage your team's attendance with ease</p>
          </div>
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">

          <div className="auth-tabs">
            <div className="tab-slider tab-slider--right" />
            <button className="tab-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="tab-btn active" onClick={() => navigate('/register')}>
              Register
            </button>
          </div>

          <h2>Create Account</h2>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Accounting">Accounting</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            
            <button type="submit" className="create_account">
              Create Account
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default Register;