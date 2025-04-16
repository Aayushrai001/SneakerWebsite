import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      // Make API call to initiate admin login and send OTP
      const response = await fetch('http://localhost:5000/adminlogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.success) {
        setError('');
        setMessage(data.message);
        setStep('otp'); // Move to OTP entry step
      } else {
        setError(data.message || 'Invalid email or password');
        setMessage('');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setMessage('');
      console.error('Login error:', error);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      // Make API call to verify OTP
      const response = await fetch('http://localhost:5000/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('auth-token', data.token);
        setError('');
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/admin/overview', { replace: true });
        }, 1000);
      } else {
        setError(data.message || 'Invalid OTP');
        setMessage('');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setMessage('');
      console.error('OTP verification error:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Login</h2>
        {step === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="login-button">
              Send OTP
            </button>

            <div className="forgot-password">
              <a href="/forgot-password">Forgot Password?</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the OTP sent to your email"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="login-button">
              Verify OTP
            </button>

            <div className="back-to-login">
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setError('');
                  setMessage('');
                  setOtp('');
                }}
                className="back-button"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;