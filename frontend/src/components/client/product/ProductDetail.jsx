import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { getProductById } from '../../utils/api';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }
  };
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link 
            to="/products" 
            className="inline-block bg-primary text-white font-medium py-2 px-6 rounded hover:bg-green-600 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-gray-500 hover:text-primary">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link to="/products" className="text-gray-500 hover:text-primary">
              Products
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-800">{product.name}</li>
        </ol>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <span className="text-2xl font-bold text-primary mr-4">${product.price.toFixed(2)}</span>
            <span className="text-gray-500">{product.unit}</span>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nutritional Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Calories:</span>
                  <span className="ml-2 font-medium">{product.nutrition.calories}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sugar:</span>
                  <span className="ml-2 font-medium">{product.nutrition.sugar}g</span>
                </div>
                <div>
                  <span className="text-gray-500">Fiber:</span>
                  <span className="ml-2 font-medium">{product.nutrition.fiber}g</span>
                </div>
                <div>
                  <span className="text-gray-500">Vitamin C:</span>
                  <span className="ml-2 font-medium">{product.nutrition.vitaminC}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Quantity</h3>
            <div className="flex items-center">
              <button 
                className="bg-gray-200 text-gray-700 w-10 h-10 rounded-l hover:bg-gray-300 transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 h-10 text-center border-t border-b border-gray-200"
              />
              <button 
                className="bg-gray-200 text-gray-700 w-10 h-10 rounded-r hover:bg-gray-300 transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="w-full bg-secondary text-white font-medium py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;