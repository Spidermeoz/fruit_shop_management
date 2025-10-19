// src/components/charts/BarChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Product A', sales: 4000 },
  { name: 'Product B', sales: 3000 },
  { name: 'Product C', sales: 2000 },
  { name: 'Product D', sales: 2780 },
  { name: 'Product E', sales: 1890 },
];

const SalesByCategoryChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }} />
        <Bar dataKey="sales" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesByCategoryChart;