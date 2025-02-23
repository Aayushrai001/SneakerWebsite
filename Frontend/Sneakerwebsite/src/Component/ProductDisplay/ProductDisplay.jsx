import React from 'react'
import './ProductDisplay.css'
import star_icon from '../assets/star_icon.png'
import star_dull_icon from '../assets/star_dull_icon.png'

const ProductDisplay = (props) => {
    const { product } = props;
    return (
        <div className="productdisplay">
            <div className="productdisplay-left">
                <div className="productdisplay-img-list">
                    <img src={product.image} alt="" />
                    <img src={product.image} alt="" />
                    <img src={product.image} alt="" />
                    <img src={product.image} alt="" />
                </div>
                <div className="productdisplay-img">
                    <img src={product.image} alt="" className="productdisplay-main-img" />
                </div>
            </div>
            <div className="productdisplay-right">
                <h1>{product.name}</h1>
                <div className="productdisplay-right-star">
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_dull_icon} alt="" />
                    <p>(122)</p>
                </div>
                <div className="productdisplay-right-prices">
                    <div className="productdisplay-right-price-new">${product.new_price}</div>
                </div>
                <div className="productdisplay-right-description">
                    jsdcvkhsdkjfcisdh fvhdosihfs ishdgfviusag iushgviufg viusfgiuvs iugsiuvusv ishdgfviusagsifgusfs
                    hvuisfvihs isfvissh iushisaklgb8ui7awerfg ofhfiusbfs 8 9gfusavjkfhwd8 usgdufysgu
                </div>
                <div className="productdislay-right-size">
                    <h1>Select Size</h1>
                    <div className="productdisplay-right-size">
                        <div>22</div>
                        <div>27</div>
                        <div>39</div>
                        <div>42</div>
                        <div>44</div>
                    </div>
                </div>
                <div className="productdisplay-right-buttons">
                    <button className='productdisplay-right-cart'>ADD TO CART</button>
                    <button className='productdisplay-right-favorite'>ADD TO FAVORITE</button>
                </div>
                <p className='productdisplay-right-category'><span>Category :</span> Mens and Women</p>
                <p className='productdisplay-right-category'><span>Tags :</span> Modern, Latest</p>
            </div>
        </div>
    )
}

export default ProductDisplay
