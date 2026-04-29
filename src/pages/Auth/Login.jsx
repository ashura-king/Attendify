import { useState } from 'react'
import { Link} from 'react-router-dom';
import './Login.css';
import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome';
import {faEye, faEyeSlash} from '@fortawesome/free-regular-svg-icons';
function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login submitted:', { username, password })
    // TODO: connect to backend for authentication
  }

  return (
    <div className="login-wrapper">

      <div className="login-left">
        <div className="brand">
          <div className="brandIcon">
            <h1>Attendify</h1>
            <p>Manage your team's attendance with ease</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 
                  <FontAwesomeIcon icon={faEyeSlash} /> :
                  <FontAwesomeIcon icon={faEye} />}
                </button>
              </div>
            </div>

            <button type="submit">Sign In</button>
            
          </form>
          <p className="create_account">Dont have an account? <a href ="/register">Create one</a>
           </p>
          
        </div>
      </div>

    </div>
  )
}

export default Login