import { useState } from "react"; // Removed 'use' from import
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faCalendarCheck } from '@fortawesome/free-regular-svg-icons'; // Added faCalendarCheck
import './Register.css';

function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault(); // Fixed typo
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        console.log('Register submitted:', { username, email, password })
    };

    return (
        <div className="register-wrapper">
            <div className="register-left">
         <div className="brand">
     <div className="brandIcon">
      <h1>Attendify</h1>
      <p>Manage your team's attendance with ease</p>
    </div>
  </div>
</div>

            <div className="register-right">
                <div className="register-card">
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
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                            />
                        </div>

                        <button type="submit">Register</button>
                    </form>
                    <p className="create_account">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;