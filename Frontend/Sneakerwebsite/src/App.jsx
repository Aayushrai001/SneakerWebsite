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
import men_banner from './Component/assets/banner_mens.png'
import women_banner from './Component/assets/banner_women.png'
import kid_banner from './Component/assets/banner_kids.png'
import UserPanel from './Component/UserPanel/UserPanel';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Shop />} />
          <Route path='/mens' element={<ShopCategory banner={men_banner} category="men" />} />
          <Route path='/womens' element={<ShopCategory banner={women_banner} category="women" />} />
          <Route path='/kids' element={<ShopCategory banner={kid_banner} category="kid" />} />
          <Route path='/personalize' element={<Personalize />} />
          <Route path='/aboutUs' element={<AboutUs />} />
          <Route path="/product" element={<Product />} >
          <Route path=':productId' element={<Product />} />
          </Route>
          <Route path='/cart' element={<Cart />} />
          <Route path='/favourite' element={<Favourite />} />
          <Route path='/login' element={<LoginSignup/>} />
          <Route path='/UserPanel' element={<UserPanel/>} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
