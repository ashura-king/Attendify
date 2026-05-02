import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons'
import { supabase } from '../../lib/supabaseClient'

function Login() {
  const [username, setUsername] = useState('')  
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

   
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('full_name', username)
      .single()

    if (profileError || !profile) {
      alert('Username not found!')
      setLoading(false)
      return
    }

   
    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
    setLoading(false)
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
          <div className="auth-tabs">
            <div className="tab-slider" />
            <button className="tab-btn active" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="tab-btn" onClick={() => navigate('/register')}>
              Register
            </button>
          </div>
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
                placeholder="Enter your full name"
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
                  {showPassword
                    ? <FontAwesomeIcon icon={faEyeSlash} />
                    : <FontAwesomeIcon icon={faEye} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login