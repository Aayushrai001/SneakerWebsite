// Importing necessary dependencies from React and other modules
import React, { useState, useEffect } from 'react';
import './Login.css'; 
import { useNavigate, useLocation } from 'react-router-dom'; 

// Defining the functional Login component
const Login = () => {
  // State variables for email, password, OTP, current step (login or OTP), error/message display, and loading indicator
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login'); // Indicates the current form step: 'login' or 'otp'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Tracks whether the request is being processed

  // Hooks for navigation and accessing route state
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect hook that runs on component mount and route changes
  useEffect(() => {
    // Check if a user token already exists in localStorage (user is logged in)
    const token = localStorage.getItem('auth-token');
    if (token) {
      // Redirect to admin overview if already logged in
      navigate('/admin/overview', { replace: true });
    }

    // Check if the session_expired query param is set
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('session_expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [navigate, location]);

  // Handles submission of login form (email/password)
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsLoading(true); // Start loading
    setError('');
    setMessage('');

    // Input validation: empty fields
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Input validation: invalid email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      setIsLoading(false);
      return;
    }

    try {
      // Debug log: show login attempt data
      console.log('Sending login request:', { email, password });

      // Send POST request to backend API for login
      const response = await fetch('http://localhost:5000/adminlogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Parse JSON response from backend
      const data = await response.json();
      console.log('Backend response:', data); // Debug log: backend response

      // If login successful, switch to OTP step
      if (data.success) {
        setError('');
        setMessage('OTP has been sent to your email');
        setStep('otp');
      } else {
        // Show error message from backend
        setError(data.message || 'Invalid email or password');
        setMessage('');
      }
    } catch (error) {
      // Handle unexpected errors (e.g., network issue)
      setError('An error occurred. Please try again.');
      setMessage('');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Handles OTP verification form submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsLoading(true);
    setError('');
    setMessage('');

    // Check if OTP is empty
    if (!otp) {
      setError('Please enter the OTP');
      setIsLoading(false);
      return;
    }

    try {
      // Send OTP verification request to backend
      const response = await fetch('http://localhost:5000/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      // Parse JSON response
      const data = await response.json();

      // If OTP is valid and token received
      if (data.success && data.token) {
        // Store token in localStorage for session persistence
        localStorage.setItem('auth-token', data.token);
        setError('');
        setMessage('Login successful! Redirecting...');
        // Redirect to admin overview after 1 second
        setTimeout(() => {
          navigate('/admin/overview', { replace: true });
        }, 1000);
      } else {
        // Show backend error if OTP is invalid
        setError(data.message || 'Invalid OTP');
        setMessage('');
      }
    } catch (error) {
      // Handle unexpected errors
      setError('An error occurred. Please try again.');
      setMessage('');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="login-container"> {/* Wrapper container */}
      <div className="login-card"> {/* Styled card for form */}
        <h2>Admin Login</h2>

        {/* Conditional rendering based on step (login or OTP) */}
        {step === 'login' ? (
          // Login form
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update state on change
                placeholder="Enter your email"
                autoComplete="email"
                disabled={isLoading} // Disable input if loading
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update state on change
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {/* Display error or success message */}
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {/* Submit button */}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            {/* Optional: Forgot password link */}
            {/* <div className="forgot-password">
              <a href="/forgot-password">Forgot Password?</a>
            </div> */}
          </form>
        ) : (
          // OTP verification form
          <form onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)} // Update OTP state
                placeholder="Enter the OTP sent to your email"
                disabled={isLoading}
                maxLength="6"
                pattern="[0-9]*"
                inputMode="numeric" // Ensures number keyboard on mobile
              />
            </div>

            {/* Display error or success message */}
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {/* Submit button for OTP */}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            {/* Button to go back to login form */}
            <div className="back-to-login">
              <button
                type="button"
                onClick={() => {
                  // Reset to login step
                  setStep('login');
                  setError('');
                  setMessage('');
                  setOtp('');
                }}
                className="back-button"
                disabled={isLoading}
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
