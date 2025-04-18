import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; 
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'white',
              width: '500px',
              color: 'black',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
            success: {
              style: {
                background: 'white',
              },
            },
            error: {
              style: {
                background: 'white',
              },
            },
            loading: {
              style: {
                background: 'white',
              },
            },
          }}
        />
    </BrowserRouter>
  </StrictMode>
);
