import React from 'react';
import ProductList from '../../components/client/product/ProductList';

const Products = () => {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">All Products</h1>
        <ProductList />
      </div>
    </div>
  );
};

export default Products;