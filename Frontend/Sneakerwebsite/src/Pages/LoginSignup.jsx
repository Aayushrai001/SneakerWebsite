import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './CSS/LoginSignup.css';

const LoginSignup = () => {
  const [state, setState] = useState('Sign Up');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [signupMessage, setSignupMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setState('Login');
      setSignupMessage('Your email has been verified! Please log in.');
    }
  }, [location]);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};
    if (state === 'Sign Up') {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!validatePhone(formData.phone)) newErrors.phone = 'Phone number must be 10 digits';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!validateEmail(formData.email)) newErrors.email = 'Email must be in format: example123@gmail.com';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character';
      }
    } else {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!validateEmail(formData.email)) newErrors.email = 'Email must be in format: example123@gmail.com';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
    }
    if (!isTermsAccepted) newErrors.terms = 'You must agree to the Terms of Use & Privacy Policy';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleTermsChange = (e) => {
    setIsTermsAccepted(e.target.checked);
    setErrors({ ...errors, terms: '' });
  };

  const handleResendEmailChange = (e) => {
    setResendEmail(e.target.value);
    setErrors({ ...errors, resend: '' });
  };

  const login = async () => {
    if (!validateForm()) return;
    try {
      let responseData;
      await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => (responseData = data));

      if (responseData.success) {
        localStorage.setItem('auth-token', responseData.token);
        window.location.replace('/');
      } else {
        setErrors({ api: responseData.errors || responseData.message || 'Login failed.' });
        if (responseData.errors && responseData.errors.includes('Email not verified')) {
          setResendEmail(formData.email);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ api: 'Login failed. Please try again.' });
    }
  };

  const signup = async () => {
    if (!validateForm()) return;
    console.log('Sending formData:', formData);
    try {
      let responseData;
      await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          responseData = data;
          console.log('Backend response:', responseData);
        });

      if (responseData.success) {
        setSignupMessage(responseData.message); // e.g., 'Please check your email to verify your account.'
        setFormData({ name: '', password: '', email: '', address: '', phone: '' });
        setState('Login');
        setIsTermsAccepted(false); // Reset terms checkbox
      } else {
        const errorMsg = responseData.errors || responseData.message || 'Signup failed.';
        if (typeof errorMsg === 'string') {
          if (errorMsg.includes('valid Gmail address')) {
            setErrors({ api: 'Please enter a valid Gmail address (e.g., example123@gmail.com)' });
          } else if (errorMsg.includes('Existing user')) {
            setErrors({ api: 'This email is already registered. Please log in or use a different email.' });
          } else if (errorMsg.includes('Failed to send verification email')) {
            setErrors({ api: 'Failed to send verification email. Please check your email address or try again later.' });
          } else {
            setErrors({ api: errorMsg });
          }
        } else {
          setErrors({ api: 'Signup failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ api: 'Network error during signup. Please check your connection and try again.' });
    }
  };

  const resendVerification = async () => {
    if (!resendEmail || !validateEmail(resendEmail)) {
      setErrors({ resend: 'Please enter a valid Gmail address (e.g., example123@gmail.com)' });
      return;
    }
    try {
      let responseData;
      await fetch('http://localhost:5000/resend-verification', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      })
        .then((response) => response.json())
        .then((data) => (responseData = data));

      if (responseData.success) {
        setSignupMessage(responseData.message);
        setResendEmail('');
      } else {
        setErrors({ resend: responseData.message || 'Failed to resend verification email.' });
      }
    } catch (error) {
      console.error('Resend error:', error);
      setErrors({ resend: 'Failed to resend verification email. Please try again.' });
    }
  };

  return (
    <div className='loginsignup'>
      <div className='loginsignup-container'>
        <h1>{state}</h1>
        {signupMessage && <p className='success-message'>{signupMessage}</p>}
        <div className='loginsignup-fields'>
          {state === 'Sign Up' && (
            <>
              <div className='input-wrapper'>
                <input
                  name='name'
                  value={formData.name}
                  onChange={changeHandler}
                  type='text'
                  placeholder='Your name..'
                />
                {errors.name && <span className='error-message'>{errors.name}</span>}
              </div>
              <div className='input-wrapper'>
                <input
                  name='address'
                  value={formData.address}
                  onChange={changeHandler}
                  type='text'
                  placeholder='Your address..'
                />
                {errors.address && <span className='error-message'>{errors.address}</span>}
              </div>
              <div className='input-wrapper'>
                <input
                  name='phone'
                  value={formData.phone}
                  onChange={changeHandler}
                  type='tel'
                  placeholder='Your phone number..'
                />
                {errors.phone && <span className='error-message'>{errors.phone}</span>}
              </div>
            </>
          )}
          <div className='input-wrapper'>
            <input
              name='email'
              value={formData.email}
              onChange={changeHandler}
              type='email'
              placeholder='Your Email..'
            />
            {errors.email && <span className='error-message'>{errors.email}</span>}
          </div>
          <div className='input-wrapper'>
            <div className='password-wrapper'>
              <input
                name='password'
                value={formData.password}
                onChange={changeHandler}
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter Your Password..'
              />
              <span className='password-toggle-icon' onClick={togglePasswordVisibility}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            {errors.password && <span className='error-message'>{errors.password}</span>}
          </div>
        </div>
        {errors.api && <span className='api-error error-message'>{errors.api}</span>}
        <button onClick={state === 'Sign Up' ? signup : login}>Continue</button>
        {state === 'Login' && (
          <div className='resend-verification'>
            <p>Didn't receive the verification email?</p>
            <input
              type='email'
              value={resendEmail}
              onChange={handleResendEmailChange}
              placeholder='Enter your email..'
            />
            {errors.resend && <span className='error-message'>{errors.resend}</span>}
            <button onClick={resendVerification}>Resend Verification Email</button>
          </div>
        )}
        {state === 'Sign Up' ? (
          <p className='loginsignup-login'>
            Already have an account?{' '}
            <span
              onClick={() => {
                setState('Login');
                setSignupMessage('');
              }}
            >
              Login Here
            </span>
          </p>
        ) : (
          <p className='loginsignup-login'>
            Create an account?{' '}
            <span
              onClick={() => {
                setState('Sign Up');
                setSignupMessage('');
              }}
            >
              Click Here
            </span>
          </p>
        )}
        <div className='loginsignup-agree'>
          <input type='checkbox' id='terms' checked={isTermsAccepted} onChange={handleTermsChange} />
          <p>By continuing, I agree to the Terms of Use & Privacy Policy.</p>
          {errors.terms && <span className='error-message'>{errors.terms}</span>}
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;