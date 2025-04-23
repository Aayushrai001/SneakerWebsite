import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CSS/LoginSignup.css';
import eyeOpen from '../Component/assets/visible.png';
import eyeClosed from '../Component/assets/hidden.png';

const LoginSignup = () => {
  const [state, setState] = useState('Sign Up');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    address: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setUserName } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is already logged in and redirect
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      navigate('/', { replace: true }); // Redirect to homepage if logged in
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setState('Login');
      setSignupMessage('Your email has been verified. Please log in.');
    }
  }, [location]);

  const validateEmail = (email) => /^[a-zA-Z0-9]+@gmail\.com$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const validateForm = () => {
    const newErrors = {};
    if (state === 'Sign Up') {
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return false;
      }
      if (!formData.address.trim()) {
        toast.error('Address is required');
        return false;
      }
      if (!formData.phone.trim()) {
        toast.error('Phone number is required');
        return false;
      }
      else if (!validatePhone(formData.phone)) {
        toast.error('Phone number must be 10 digits');
        return false;
      }
      if (!isTermsAccepted) {
        toast.error('You must agree to the terms and privacy policy');
        return false;
      }
    }
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
    return true;
  };

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);

  const handleTermsChange = () => {
    setIsTermsAccepted(!isTermsAccepted);
  };

  const handleResendEmailChange = (e) => {
    setResendEmail(e.target.value);
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const login = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        localStorage.setItem('auth-token', responseData.token);
        setUserName(responseData.name);
        toast.success('Login successful!');
        navigate('/', { replace: true });
      } else {
        setErrors({ ...errors, api: responseData.errors || 'Login failed' });
        toast.error(responseData.errors || 'Login failed');
        if (responseData.errors === 'Email not verified') {
          setResendEmail(formData.email);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async () => {
    if (!validateForm()) return;
    setIsSendingOtp(true);
    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const responseData = await response.json();
      if (responseData.success) {
        setVerificationEmail(formData.email);
        setState('VerifyOTP');
        setSignupMessage('OTP sent to your email. Please enter it below.');
        toast.success('OTP sent to your email!');
      } else {
        console.error('Signup error:', responseData.error);
        setErrors({
          ...errors,
          api: responseData.message || 'Signup failed',
        });
        toast.error(responseData.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Error during signup:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        if (state === 'VerifyOTP' && signupMessage.includes('Password reset OTP')) {
          setState('ResetPassword');
          setSignupMessage('Please enter your new password.');
          toast.success('OTP verified successfully!');
        } else {
          setState('Login');
          setSignupMessage('Your email has been verified. Please log in.');
          setOtp('');
          toast.success('Email verified successfully!');
        }
      } else {
        setErrors({ ...errors, api: responseData.message || 'Invalid OTP' });
        toast.error(responseData.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        setSignupMessage('OTP resent to your email.');
        toast.success('OTP resent successfully!');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Failed to resend OTP' });
        toast.error(responseData.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        setVerificationEmail(formData.email);
        setState('VerifyOTP');
        setSignupMessage('Password reset OTP sent to your email. Please enter it below.');
        toast.success('OTP sent to your email!');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Failed to send reset OTP' });
        toast.error(responseData.message || 'Failed to send reset OTP');
      }
    } catch (error) {
      console.error('Error during forgot password:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
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
        setState('Login');
        setSignupMessage('Password reset successful. Please log in with your new password.');
        setOtp('');
        toast.success('Password reset successful!');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Failed to reset password' });
        toast.error(responseData.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (newState) => {
    setState(newState);
    setErrors({});
    setSignupMessage('');
    setOtp('');
    
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
      setIsTermsAccepted(false);
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

  return (
    <div className="loginsignup">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="loginsignup-container">
        {isSendingOtp || isLoading ? (
          <div className="sending-message">
            <h2>{isSendingOtp ? 'Sending...' : 'Processing...'}</h2>
          </div>
        ) : (
          <>
            <h1>
              {state === 'VerifyOTP' 
                ? 'Verify OTP' 
                : state === 'ForgotPassword' 
                  ? 'Forgot Password' 
                  : state === 'ResetPassword' 
                    ? 'Reset Password' 
                    : state}
            </h1>
            <div className="loginsignup-fields">
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
              {['Sign Up', 'Login', 'ForgotPassword', 'ResetPassword'].includes(state) && (
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={changeHandler}
                    disabled={state === 'ResetPassword'}
                  />
                </div>
              )}
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
                    <img
                      src={showPassword ? eyeOpen : eyeClosed}
                      alt="Toggle Password"
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                    />
                  </div>
                </div>
              )}
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

            {state === 'Login' && (
              <p className="loginsignup-login">
                Forgot Password? <span onClick={() => handleStateChange('ForgotPassword')}>Reset Here</span>
              </p>
            )}

            {signupMessage && <p className="signup-message">{signupMessage}</p>}

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