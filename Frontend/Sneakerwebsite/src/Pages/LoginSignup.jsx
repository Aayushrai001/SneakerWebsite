import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import { toast } from 'react-hot-toast';
import './CSS/LoginSignup.css';
import eyeOpen from '../Component/assets/visible.png';
import eyeClosed from '../Component/assets/hidden.png';

// Define the LoginSignup component
const LoginSignup = () => {
  // State to manage the current form mode (e.g., 'Sign Up', 'Login', 'VerifyOTP', etc.)
  const [state, setState] = useState('Sign Up');
  // State to store form input data
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    address: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
  });
  // State to store validation errors
  const [errors, setErrors] = useState({});
  // State to toggle visibility of password input
  const [showPassword, setShowPassword] = useState(false);
  // State to toggle visibility of new password input (for reset password)
  const [showNewPassword, setShowNewPassword] = useState(false);
  // State to track if terms and conditions are accepted (for sign-up)
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  // State to display messages to the user (e.g., after signup or OTP verification)
  const [signupMessage, setSignupMessage] = useState('');
  // State to store email for resending OTP
  const [resendEmail, setResendEmail] = useState('');
  // State to store email for OTP verification
  const [verificationEmail, setVerificationEmail] = useState('');
  // State to store OTP input
  const [otp, setOtp] = useState('');
  // State to track if OTP is being sent
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  // State to track loading state during API calls
  const [isLoading, setIsLoading] = useState(false);

  // Access setUserName from ShopContext to update username after login
  const { setUserName } = useContext(ShopContext);
  // Hook to access the current location (URL) for query parameters
  const location = useLocation();
  // Hook to programmatically navigate to different routes
  const navigate = useNavigate();

  // useEffect to check if user is already logged in and redirect to homepage
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      navigate('/', { replace: true }); // Redirect to homepage if logged in
    }
  }, [navigate]); // Dependency on navigate to ensure latest navigate function

  // useEffect to handle email verification status from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setState('Login'); // Switch to Login mode
      setSignupMessage('Your email has been verified. Please log in.');
    }
  }, [location]); // Dependency on location to react to query parameter changes

  // Function to validate email (must be a Gmail address)
  const validateEmail = (email) => /^[a-zA-Z0-9]+@gmail\.com$/.test(email);
  // Function to validate password (must include uppercase, lowercase, number, and special character, minimum 8 characters)
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  // Function to validate phone number (must be 10 digits)
  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  // Function to validate form inputs based on the current state
  const validateForm = () => {
    const newErrors = {};
    if (state === 'Sign Up') {
      // Validate name for sign-up
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return false;
      }
      // Validate address for sign-up
      if (!formData.address.trim()) {
        toast.error('Address is required');
        return false;
      }
      // Validate phone number for sign-up
      if (!formData.phone.trim()) {
        toast.error('Phone number is required');
        return false;
      }
      else if (!validatePhone(formData.phone)) {
        toast.error('Phone number must be 10 digits');
        return false;
      }
      // Check if terms are accepted for sign-up
      if (!isTermsAccepted) {
        toast.error('You must agree to the terms and privacy policy');
        return false;
      }
    }
    // Validate email for all relevant states
    if (['Sign Up', 'Login', 'ForgotPassword', 'ResetPassword'].includes(state)) {
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return false;
      }
      else if (!validateEmail(formData.email)) {
        toast.error('Please enter a valid Gmail address');
        return false;
      }
    }
    // Validate password for sign-up and login
    if (state === 'Login' || state === 'Sign Up') {
      if (!formData.password.trim()) {
        toast.error('Password is required');
        return false;
      }
      else if (!validatePassword(formData.password)) {
        toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        return false;
      }
    }
    // Validate new password and confirm password for reset password
    if (state === 'ResetPassword') {
      if (!formData.newPassword.trim()) {
        toast.error('New password is required');
        return false;
      }
      else if (!validatePassword(formData.newPassword)) {
        toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        return false;
      }
      if (!formData.confirmPassword.trim()) {
        toast.error('Please confirm your password');
        return false;
      }
      else if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }
    // Validate OTP for verification
    if (state === 'VerifyOTP') {
      if (!otp.trim()) {
        toast.error('OTP is required');
        return false;
      }
      else if (!/^\d{6}$/.test(otp)) {
        toast.error('OTP must be a 6-digit number');
        return false;
      }
    }
    return true; // Return true if all validations pass
  };

  // Function to handle input changes and update formData state
  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  // Function to toggle new password visibility (for reset password)
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);

  // Function to toggle terms and conditions checkbox
  const handleTermsChange = () => {
    setIsTermsAccepted(!isTermsAccepted);
  };

  // Function to handle changes to the resend email input
  const handleResendEmailChange = (e) => {
    setResendEmail(e.target.value);
  };

  // Function to handle OTP input changes
  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  // Function to handle login API call
  const login = async () => {
    if (!validateForm()) return; // Validate form before proceeding
    setIsLoading(true); // Set loading state
    try {
      // Send login request to backend
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        // Store token and set username on successful login
        localStorage.setItem('auth-token', responseData.token);
        setUserName(responseData.name);
        toast.success('Login successful!');
        navigate('/', { replace: true }); // Redirect to homepage
      } else {
        // Handle login errors
        setErrors({ ...errors, api: responseData.errors || 'Login failed' });
        toast.error(responseData.errors || 'Login failed');
        if (responseData.errors === 'Email not verified') {
          setResendEmail(formData.email); // Set email for resending OTP
        }
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during login:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Function to handle signup API call
  const signup = async () => {
    if (!validateForm()) return; // Validate form before proceeding
    setIsSendingOtp(true); // Set OTP sending state
    try {
      // Send signup request to backend
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const responseData = await response.json();
      if (responseData.success) {
        // Switch to OTP verification mode on successful signup
        setVerificationEmail(formData.email);
        setState('VerifyOTP');
        setSignupMessage('OTP sent to your email. Please enter it below.');
        toast.success('OTP sent to your email!');
      } else {
        // Handle signup errors
        console.error('Signup error:', responseData.error);
        setErrors({
          ...errors,
          api: responseData.message || 'Signup failed',
        });
        toast.error(responseData.message || 'Signup failed');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during signup:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSendingOtp(false); // Reset OTP sending state
    }
  };

  // Function to handle OTP verification API call
  const verifyOtp = async () => {
    if (!validateForm()) return; // Validate OTP before proceeding
    setIsLoading(true); // Set loading state
    try {
      // Send OTP verification request to backend
      const response = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        // Handle successful OTP verification
        if (state === 'VerifyOTP' && signupMessage.includes('Password reset OTP')) {
          setState('ResetPassword'); // Switch to reset password mode
          setSignupMessage('Please enter your new password.');
          toast.success('OTP verified successfully!');
        } else {
          setState('Login'); // Switch to login mode
          setSignupMessage('Your email has been verified. Please log in.');
          setOtp(''); // Clear OTP input
          toast.success('Email verified successfully!');
        }
      } else {
        // Handle OTP verification errors
        setErrors({ ...errors, api: responseData.message || 'Invalid OTP' });
        toast.error(responseData.message || 'Invalid OTP');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during OTP verification:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Function to resend OTP
  const resendOtp = async () => {
    setIsLoading(true); // Set loading state
    try {
      // Send resend OTP request to backend
      const response = await fetch('http://localhost:5000/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        // Notify user of successful OTP resend
        setSignupMessage('OTP resent to your email.');
        toast.success('OTP resent successfully!');
      } else {
        // Handle resend OTP errors
        setErrors({ ...errors, api: responseData.message || 'Failed to resend OTP' });
        toast.error(responseData.message || 'Failed to resend OTP');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during OTP resend:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Function to handle forgot password API call
  const forgotPassword = async () => {
    if (!validateForm()) return; // Validate email before proceeding
    setIsLoading(true); // Set loading state
    try {
      // Send forgot password request to backend
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        // Switch to OTP verification mode for password reset
        setVerificationEmail(formData.email);
        setState('VerifyOTP');
        setSignupMessage('Password reset OTP sent to your email. Please enter it below.');
        toast.success('OTP sent to your email!');
      } else {
        // Handle forgot password errors
        setErrors({ ...errors, api: responseData.message || 'Failed to send reset OTP' });
        toast.error(responseData.message || 'Failed to send reset OTP');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during forgot password:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Function to handle password reset API call
  const resetPassword = async () => {
    if (!validateForm()) return; // Validate form before proceeding
    setIsLoading(true); // Set loading state
    try {
      // Send password reset request to backend
      const response = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: verificationEmail, 
          otp: otp,
          newPassword: formData.newPassword 
        }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        // Switch to login mode on successful password reset
        setState('Login');
        setSignupMessage('Password reset successful. Please log in with your new password.');
        setOtp(''); // Clear OTP input
        toast.success('Password reset successful!');
      } else {
        // Handle password reset errors
        setErrors({ ...errors, api: responseData.message || 'Failed to reset password' });
        toast.error(responseData.message || 'Failed to reset password');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during password reset:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Function to handle state changes (e.g., switching between Login and Sign Up)
  const handleStateChange = (newState) => {
    setState(newState); // Update form mode
    setErrors({}); // Clear errors
    setSignupMessage(''); // Clear signup message
    setOtp(''); // Clear OTP input
    
    // Reset form data based on the new state
    if (newState === 'Login') {
      setFormData({
        ...formData,
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else if (newState === 'Sign Up') {
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        phone: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsTermsAccepted(false); // Reset terms checkbox
    } else if (newState === 'ForgotPassword') {
      setFormData({
        ...formData,
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else if (newState === 'ResetPassword') {
      setFormData({
        ...formData,
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  // JSX rendering of the component
  return (
    // Main container for the login/signup form
    <div className="loginsignup">
      <div className="loginsignup-container">
        {/* Display loading message during OTP sending or processing */}
        {isSendingOtp || isLoading ? (
          <div className="sending-message">
            <h2>{isSendingOtp ? 'Sending...' : 'Processing...'}</h2>
          </div>
        ) : (
          <>
            {/* Display the current form title based on state */}
            <h1>
              {state === 'VerifyOTP' 
                ? 'Verify OTP' 
                : state === 'ForgotPassword' 
                  ? 'Forgot Password' 
                  : state === 'ResetPassword' 
                    ? 'Reset Password' 
                    : state}
            </h1>
            {/* Container for form inputs */}
            <div className="loginsignup-fields">
              {/* Sign-up specific fields */}
              {state === 'Sign Up' && (
                <>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={changeHandler}
                    />
                  </div>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={changeHandler}
                    />
                  </div>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={changeHandler}
                    />
                  </div>
                </>
              )}
              {/* Email input for relevant states */}
              {['Sign Up', 'Login', 'ForgotPassword', 'ResetPassword'].includes(state) && (
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={changeHandler}
                    disabled={state === 'ResetPassword'} // Disable email input during reset password
                  />
                </div>
              )}
              {/* Password input for sign-up and login */}
              {['Sign Up', 'Login'].includes(state) && (
                <div className="input-wrapper">
                  <div className="password-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={changeHandler}
                    />
                    {/* Toggle password visibility icon */}
                    <img
                      src={showPassword ? eyeOpen : eyeClosed}
                      alt="Toggle Password"
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                    />
                  </div>
                </div>
              )}
              {/* New password and confirm password inputs for reset password */}
              {state === 'ResetPassword' && (
                <>
                  <div className="input-wrapper">
                    <div className="password-container">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        placeholder="New Password"
                        value={formData.newPassword}
                        onChange={changeHandler}
                      />
                      {/* Toggle new password visibility icon */}
                      <img
                        src={showNewPassword ? eyeOpen : eyeClosed}
                        alt="Toggle Password"
                        onClick={toggleNewPasswordVisibility}
                        className="password-toggle"
                      />
                    </div>
                  </div>
                  <div className="input-wrapper">
                    <div className="password-container">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        value={formData.confirmPassword}
                        onChange={changeHandler}
                      />
                    </div>
                  </div>
                </>
              )}
              {/* OTP input for verification */}
              {state === 'VerifyOTP' && (
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={handleOtpChange}
                  />
                </div>
              )}
            </div>

            {/* Conditional rendering of buttons based on state */}
            {state === 'VerifyOTP' ? (
              <>
                <button 
                  onClick={verifyOtp} 
                  className="primary-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <p className="loginsignup-login">
                  Didn't receive OTP? <span onClick={resendOtp}>Resend OTP</span>
                </p>
              </>
            ) : state === 'ResetPassword' ? (
              <button 
                onClick={resetPassword} 
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Reset Password'}
              </button>
            ) : (
              <button 
                onClick={
                  state === 'Sign Up' 
                    ? signup 
                    : state === 'Login' 
                      ? login 
                      : state === 'ForgotPassword' 
                        ? forgotPassword 
                        : null
                } 
                className="primary-button"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </button>
            )}

            {/* Terms and conditions checkbox for sign-up */}
            {state === 'Sign Up' && (
              <div className="loginsignup-agree">
                <input 
                  type="checkbox" 
                  checked={isTermsAccepted} 
                  onChange={handleTermsChange}
                />
                <p>I agree to the terms of use & privacy policy</p>
              </div>
            )}

            {/* Forgot password link for login mode */}
            {state === 'Login' && (
              <p className="loginsignup-login">
                Forgot Password? <span onClick={() => handleStateChange('ForgotPassword')}>Reset Here</span>
              </p>
            )}

            {/* Display signup or verification message */}
            {signupMessage && <p className="signup-message">{signupMessage}</p>}

            {/* Toggle between login, sign-up, and forgot password modes */}
            {state !== 'VerifyOTP' && (
              <p className="loginsignup-login">
                {state === 'Sign Up' 
                  ? 'Already have an account? ' 
                  : state === 'ForgotPassword' 
                    ? 'Remember your password? ' 
                    : "Don't have an account? "}
                <span
                  onClick={() => {
                    if (state === 'Sign Up') {
                      handleStateChange('Login');
                    } else if (state === 'Login') {
                      handleStateChange('Sign Up');
                    } else if (state === 'ForgotPassword') {
                      handleStateChange('Login');
                    }
                  }}
                >
                  {state === 'Sign Up' ? 'Login Here' : state === 'ForgotPassword' ? 'Login Here' : 'Click Here'}
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;