import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

// 🧱 Import layout & pages cho Admin
import Sidebar from "./components/layouts/Sidebar";
import DashboardHeader from "./components/layouts/DashboardHeader";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/products/ProductsPage";
import ProductEditPage from "./pages/admin/products/ProductEditPage";
import ProductDetailPage from "./pages/admin/products/ProductDetailPage";

// 🌿 Import layout & pages cho Client
import HomePage from "./pages/client/HomePage";
import ShopPage from "./pages/client/ShopPage";
import ProductClientDetailPage from "./pages/client/ProductDetailPage";
// import LoginPage from "./pages/client/LoginPage";
// import RegisterPage from "./pages/client/RegisterPage";
import Header from "./components/client/layout/Header";
import Footer from "./components/client/layout/Footer";
import CartPage from "./pages/client/CartPage";
import CheckoutPage from "./pages/client/CheckoutPage";
import LoginPage from "./pages/client/LoginPage";
import RegisterPage from "./pages/client/RegisterPage";
import ForgotPasswordPage from "./pages/client/ForgotPasswordPage";
import ProfilePage from "./pages/client/ProfilePage";
import OrderHistoryPage from "./pages/client/OrderHistoryPage";
import OrderDetailPage from "./pages/client/OrderDetailPage";
import ProductCreatePage from "./pages/admin/products/ProductCreatePage";
import ProductCategoryPage from "./pages/admin/product-category/ProductCategoryPage";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Routes>
        {/* === Admin Layout === */}
        <Route
          path="/admin/*"
          element={
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-roboto">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route
                      path="products/:id"
                      element={<ProductDetailPage />}
                    />
                    <Route
                      path="products/edit/:id"
                      element={<ProductEditPage />}
                    />
                    <Route
                      path="/products/create"
                      element={<ProductCreatePage />}
                    />
                    <Route
                      path="product-category"
                      element={<ProductCategoryPage />}
                    />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />

        {/* === Client Layout === */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              <main className="min-h-screen bg-white text-gray-800">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route
                    path="/product/:id"
                    element={<ProductClientDetailPage />}
                  />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/orders" element={<OrderHistoryPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
