import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Component/Navbar/Navbar'; 
import Shop from './Pages/Shop';
import ShopCategory from './Pages/ShopCategory';
import Product from './Pages/Product';
import Personalize from './Pages/Personalize';
import AboutUs from './Pages/AboutUs';
import Cart from './Pages/Cart';
import Favourite from './Pages/Favourite';
import LoginSignup from './Pages/LoginSignup';
import Footer from './Component/Footer/Footer';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Shop />} />
          <Route path='/mens' element={<ShopCategory category="mens" />} />
          <Route path='/womens' element={<ShopCategory category="womens" />} />
          <Route path='/kids' element={<ShopCategory category="kids" />} />
          <Route path='/personalize' element={<Personalize />} />
          <Route path='/aboutUs' element={<AboutUs />} />
          <Route path="/product" element={<Product />} />
          <Route path=':productId' element={<Product />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/favourite' element={<Favourite />} />
          <Route path='/login' element={<LoginSignup />} />
        </Routes>
        <Footer />
        
      </BrowserRouter>
    </div>
  );
}

export default App;
