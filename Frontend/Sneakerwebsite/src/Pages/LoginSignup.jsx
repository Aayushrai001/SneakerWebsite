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
    newPassword: '',
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
      else if (!validatePassword(formData.password))
        newErrors.password =
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    if (state === 'ResetPassword') {
      if (!formData.newPassword.trim()) newErrors.newPassword = 'New password is required';
      else if (!validatePassword(formData.newPassword))
        newErrors.newPassword =
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    if (state === 'VerifyOTP') {
      if (!otp.trim()) newErrors.otp = 'OTP is required';
      else if (!/^\d{6}$/.test(otp)) newErrors.otp = 'OTP must be a 6-digit number';
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

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    setErrors({ ...errors, otp: '' });
  };

  const login = async () => {
    if (!validateForm()) return;
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
        navigate('/', { replace: true });
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
        body: JSON.stringify(formData),
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
          api: responseData.message || 'Signup failed',
        });
      }
    } catch (error) {
      console.error('Error during signup:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!validateForm()) return;
    try {
      const response = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        setState('Login');
        setSignupMessage('Your email has been verified. Please log in.');
        setOtp('');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    }
  };

  const resendOtp = async () => {
    try {
      const response = await fetch('http://localhost:5000/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        setSignupMessage('OTP resent to your email.');
      } else {
        setErrors({ ...errors, api: responseData.message || 'Failed to resend OTP' });
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      setErrors({ ...errors, api: 'An error occurred. Please try again.' });
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        {isSendingOtp ? (
          <div className="sending-message">
            <h2>Sending...</h2>
          </div>
        ) : (
          <>
            <h1>{state === 'VerifyOTP' ? 'Verify OTP' : state}</h1>
            <div className="loginsignup-fields">
              {state === 'Sign Up' && (
                <>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={changeHandler}
                  />
                  {errors.name && <p className="error">{errors.name}</p>}
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={changeHandler}
                  />
                  {errors.address && <p className="error">{errors.address}</p>}
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={changeHandler}
                  />
                  {errors.phone && <p className="error">{errors.phone}</p>}
                </>
              )}
              {['Sign Up', 'Login', 'ForgotPassword', 'ResetPassword'].includes(state) && (
                <>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={changeHandler}
                  />
                  {errors.email && <p className="error">{errors.email}</p>}
                </>
              )}
              {['Sign Up', 'Login'].includes(state) && (
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
              )}
              {errors.password && <p className="error">{errors.password}</p>}
              {state === 'VerifyOTP' && (
                <>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={handleOtpChange}
                  />
                  {errors.otp && <p className="error">{errors.otp}</p>}
                </>
              )}
            </div>

            {state === 'VerifyOTP' ? (
              <>
                <button onClick={verifyOtp}>Verify OTP</button>
                <p className="loginsignup-login">
                  Didn't receive OTP? <span onClick={resendOtp}>Resend OTP</span>
                </p>
              </>
            ) : (
              <button onClick={state === 'Sign Up' ? signup : login}>Continue</button>
            )}

            {state === 'Sign Up' && (
              <div className="loginsignup-agree">
                <input type="checkbox" checked={isTermsAccepted} onChange={handleTermsChange} />
                <p>I agree to the terms of use & privacy policy</p>
                {errors.terms && <p className="error">{errors.terms}</p>}
              </div>
            )}

            {state === 'Login' && (
              <p className="loginsignup-login">
                Forgot Password? <span onClick={() => setState('ForgotPassword')}>Reset Here</span>
              </p>
            )}

            {errors.api && <p className="error">{errors.api}</p>}
            {signupMessage && <p className="signup-message">{signupMessage}</p>}

            {state !== 'VerifyOTP' && (
              <p className="loginsignup-login">
                {state === 'Sign Up' ? 'Already have an account? ' : 'Don’t have an account? '}
                <span
                  onClick={() => {
                    setState(state === 'Sign Up' ? 'Login' : 'Sign Up');
                    setErrors({});
                    setSignupMessage('');
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      address: '',
                      phone: '',
                      newPassword: '',
                    });
                    setIsTermsAccepted(false);
                  }}
                >
                  {state === 'Sign Up' ? 'Login Here' : 'Click Here'}
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