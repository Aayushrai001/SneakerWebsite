import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
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
    newPassword: '', // Added for password reset
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const { setUserName } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setState('Login');
      setSignupMessage('Your email has been verified. Please log in.');
    }
  }, [location]);

  const validateEmail = (email) => /^[a-zA-Z0-9]+@gmail\.com$/.test(email);
  const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const validateForm = () => {
    const newErrors = {};
    if (state === 'Sign Up') {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!validatePhone(formData.phone)) newErrors.phone = 'Phone number must be 10 digits';
      if (!isTermsAccepted) newErrors.terms = 'You must agree to the terms and privacy policy';
    }
    if (['Sign Up', 'Login', 'ForgotPassword', 'ResetPassword'].includes(state)) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid Gmail address';
    }
    if (state === 'Login' || state === 'Sign Up') {
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    if (state === 'ResetPassword') {
      if (!formData.newPassword.trim()) newErrors.newPassword = 'New password is required';
      else if (!validatePassword(formData.newPassword)) newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleTermsChange = () => {
    setIsTermsAccepted(!isTermsAccepted);
    setErrors({ ...errors, terms: '' });
  };

  const handleResendEmailChange = (e) => {
    setResendEmail(e.target.value);
    setErrors({ ...errors, resendEmail: '' });
  };

  const login = async () => {
    if (!validateForm()) return;
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const responseData = await response.json();
      if (responseData.success) {
        localStorage.setItem('auth-token', responseData.token);
        setUserName(responseData.name);
        navigate('/');
      } else {
        setErrors({ ...errors, api: responseData.errors || 'Login failed' });
        if (responseData.errors === 'Email not verified') {
          setResendEmail(formData.email);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    }
  };

  const signup = async () => {
    if (!validateForm()) return;
    setIsSendingOtp(true);
    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const responseData = await response.json();
      if (responseData.success) {
        setVerificationEmail(formData.email);
        setState('VerifyOTP');
        setSignupMessage('OTP sent to your email. Please enter it below.');
      } else {
        console.error('Signup error:', responseData.error);
        setErrors({
          ...errors,
          api: responseData.message || 'Signup failed'
        });
      }
    } catch (error) {
      console.error('Error during signup:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const forgotPassword = async () => {
    if (!validateForm()) return;
    setIsSendingOtp(true);
    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const responseData = await response.json();
      if (responseData.success) {
        setVerificationEmail(formData.email);
        setState('VerifyResetOTP');
        setSignupMessage('OTP sent to your email for password reset.');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Failed to send OTP.' });
      }
    } catch (error) {
      console.error('Error during forgot password:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('auth-token', data.token);
        setUserName(data.name);
        setSignupMessage('Account verified and logged in successfully. Redirecting...');
        setFormData({ name: '', email: '', password: '', address: '', phone: '', newPassword: '' });
        setIsTermsAccepted(false);
        setVerificationEmail('');
        setOtp('');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setSignupMessage(data.message || 'Verification failed.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setSignupMessage('An error occurred. Please try again.');
    }
  };

  const verifyResetOtp = async () => {
    try {
      const response = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp, newPassword: formData.newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setSignupMessage('Password reset successfully. Redirecting to login...');
        setFormData({ name: '', email: '', password: '', address: '', phone: '', newPassword: '' });
        setVerificationEmail('');
        setOtp('');
        setTimeout(() => {
          setState('Login');
          setSignupMessage('Please log in with your new password.');
        }, 1000);
      } else {
        setSignupMessage(data.message || 'Verification failed.');
      }
    } catch (error) {
      console.error('Error verifying reset OTP:', error);
      setSignupMessage('An error occurred. Please try again.');
    }
  };

  const resendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const endpoint = state === 'VerifyOTP' ? 'resend-verification' : 'forgot-password';
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });
      const data = await response.json();
      if (data.success) {
        setSignupMessage('New OTP sent to your email.');
      } else {
        setSignupMessage(data.message || 'Failed to resend OTP.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setSignupMessage('An error occurred. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resendVerification = async () => {
    if (!validateEmail(resendEmail)) {
      setErrors({ ...errors, resendEmail: 'Please enter a valid Gmail address' });
      return;
    }
    setIsSendingOtp(true);
    try {
      const response = await fetch('http://localhost:5000/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      });
      const responseData = await response.json();
      if (responseData.success) {
        setVerificationEmail(resendEmail);
        setState('VerifyOTP');
        setSignupMessage('Verification OTP resent. Please check your email.');
        setResendEmail('');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Failed to resend OTP.' });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        {isSendingOtp ? (
          <div className="sending-message">
            <h2>Sending...</h2>
          </div>
        ) : state === 'VerifyOTP' ? (
          <>
            <h1>Verify OTP</h1>
            <p>Enter OTP sent to {verificationEmail}</p>
            <div className="loginsignup-fields">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button onClick={verifyOtp}>Verify</button>
            <button onClick={resendOtp}>Resend OTP</button>
            {signupMessage && <p className="signup-message">{signupMessage}</p>}
          </>
        ) : state === 'ForgotPassword' ? (
          <>
            <h1>Forgot Password</h1>
            <p>Enter your email to receive a password reset OTP</p>
            <div className="loginsignup-fields">
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={formData.email}
                onChange={changeHandler}
              />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>
            <button onClick={forgotPassword}>Send OTP</button>
            <p className="loginsignup-login">
              Back to <span onClick={() => setState('Login')}>Login</span>
            </p>
            {errors.api && <p className="error">{errors.api}</p>}
            {signupMessage && <p className="signup-message">{signupMessage}</p>}
          </>
        ) : state === 'VerifyResetOTP' ? (
          <>
            <h1>Verify Password Reset OTP</h1>
            <p>Enter OTP sent to {verificationEmail}</p>
            <div className="loginsignup-fields">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={changeHandler}
                />
                <img
                  src={showPassword ? eyeOpen : eyeClosed}
                  alt="Toggle Password Visibility"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                />
              </div>
              {errors.newPassword && <p className="error">{errors.newPassword}</p>}
            </div>
            <button onClick={verifyResetOtp}>Verify and Reset Password</button>
            <button onClick={resendOtp}>Resend OTP</button>
            {signupMessage && <p className="signup-message">{signupMessage}</p>}
          </>
        ) : state === 'ResetPassword' ? (
          <>
            <h1>Reset Password</h1>
            <p>Enter your new password</p>
            <div className="loginsignup-fields">
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={changeHandler}
                />
                <img
                  src={showPassword ? eyeOpen : eyeClosed}
                  alt="Toggle Password Visibility"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                />
              </div>
              {errors.newPassword && <p className="error">{errors.newPassword}</p>}
            </div>
            <button onClick={verifyResetOtp}>Reset Password</button>
            <p className="loginsignup-login">
              Back to <span onClick={() => setState('Login')}>Login</span>
            </p>
            {signupMessage && <p className="signup-message">{signupMessage}</p>}
          </>
        ) : (
          <>
            <h1>{state}</h1>
            <div className="loginsignup-fields">
              {state === 'Sign Up' && (
                <>
                  <input
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={changeHandler}
                  />
                  {errors.name && <p className="error">{errors.name}</p>}
                  <input
                    type="text"
                    placeholder="Address"
                    name="address"
                    value={formData.address}
                    onChange={changeHandler}
                  />
                  {errors.address && <p className="error">{errors.address}</p>}
                  <input
                    type="text"
                    placeholder="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={changeHandler}
                  />
                  {errors.phone && <p className="error">{errors.phone}</p>}
                </>
              )}
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={formData.email}
                onChange={changeHandler}
              />
              {errors.email && <p className="error">{errors.email}</p>}
              {state === 'Login' && (
                <>
                  <div className="password-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      name="password"
                      value={formData.password}
                      onChange={changeHandler}
                    />
                    <img
                      src={showPassword ? eyeOpen : eyeClosed}
                      alt="Toggle Password Visibility"
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                    />
                  </div>
                  {errors.password && <p className="error">{errors.password}</p>}
                </>
              )}
            </div>
            <button onClick={state === 'Sign Up' ? signup : login}>
              Continue
            </button>
            {state === 'Sign Up' && (
              <div className="loginsignup-agree">
                <input
                  type="checkbox"
                  checked={isTermsAccepted}
                  onChange={handleTermsChange}
                />
                <p>I agree to the terms of use & privacy policy</p>
                {errors.terms && <p className="error">{errors.terms}</p>}
              </div>
            )}
            {state === 'Login' && (
              <>
                <p className="loginsignup-login">
                  Forgot Password?{' '}
                  <span onClick={() => setState('ForgotPassword')}>
                    Reset Here
                  </span>
                </p>
                {errors.api === 'Email not verified' && (
                  <div className="resend-verification">
                    <input
                      type="email"
                      placeholder="Enter email to resend OTP"
                      value={resendEmail}
                      onChange={handleResendEmailChange}
                    />
                    {errors.resendEmail && <p className="error">{errors.resendEmail}</p>}
                    <button onClick={resendVerification}>Resend OTP</button>
                  </div>
                )}
              </>
            )}
            {errors.api && <p className="error">{errors.api}</p>}
            {signupMessage && <p className="signup-message">{signupMessage}</p>}
            <p className="loginsignup-login">
              {state === 'Sign Up'
                ? 'Already have an account? '
                : 'Don’t have an account? '}
              <span
                onClick={() => {
                  setState(state === 'Sign Up' ? 'Login' : 'Sign Up');
                  setErrors({});
                  setSignupMessage('');
                  setFormData({ name: '', email: '', password: '', address: '', phone: '', newPassword: '' });
                  setIsTermsAccepted(false);
                }}
              >
                {state === 'Sign Up' ? 'Login Here' : 'Click Here'}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;