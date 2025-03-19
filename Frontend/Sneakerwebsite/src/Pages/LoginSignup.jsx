import React, { useState } from 'react';
import './CSS/LoginSignup.css';

const LoginSignup = () => {
  const [state, setState] = useState("Sign Up");
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    email: ""
  });

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const login = async () => {
    console.log("Login Function Executed", formData);
    try {
      console.log("Signup Function Executed", formData);
      let responseData;

      await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
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
        alert(responseData.errors || "Signup failed.");
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    }
  };

  const signup = async () => {
    try {
      console.log("Signup Function Executed", formData);
      let responseData;

      await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
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
        alert(responseData.errors || "Signup failed.");
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    }
  };

  return (
    <div className='loginsignup'>
      <div className='loginsignup-container'>
        <h1>{state}</h1>
        <div className='loginsignup-fields'>
          {state === "Sign Up" && (
            <input name="name" value={formData.name} onChange={changeHandler} type='text' placeholder='Your name..' />)}
          <input name="email" value={formData.email} onChange={changeHandler} type='email' placeholder='Your Email..' />
          <input name="password" value={formData.password} onChange={changeHandler} type='password' placeholder='Enter Your Password..' />
        </div>
        <button onClick={state === "Sign Up" ? signup : login}>Continue</button>
        {state === "Sign Up"
          ? <p className='loginsignup-login'>Already have an account? <span onClick={() => setState("Login")}>Login Here</span></p>
          : <p className='loginsignup-login'>Create an account? <span onClick={() => setState("Sign Up")}>Click Here</span></p>}
        <div className='loginsignup-agree'>
          <input type='checkbox' id='terms' />
          <p>By continuing, I agree to the Terms of Use & Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
