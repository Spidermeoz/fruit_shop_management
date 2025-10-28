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
import ProductCreatePage from "./pages/admin/products/ProductCreatePage";
import ProductCategoryPage from "./pages/admin/product-category/ProductCategoryPage";
import ProductCategoryCreatePage from "./pages/admin/product-category/ProductCategoryCreatePage";
import ProductCategoryDetailPage from "./pages/admin/product-category/ProductCategoryDetailPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import RoleDetailPage from "./pages/admin/roles/RoleDetailPage";
import RoleEditPage from "./pages/admin/roles/RoleEditPage";
import RoleCreatePage from "./pages/admin/roles/RoleCreatePage";
import PermissionsPage from "./pages/admin/roles/PermissionsPage";
import UsersPage from "./pages/admin/users/UsersPage";
import UserCreatePage from "./pages/admin/users/UserCreatePage";
import UserEditPage from "./pages/admin/users/UserEditPage";
import UserDetailPage from "./pages/admin/users/UserDetailPage";

// 🌿 Import layout & pages cho Client
import HomePage from "./pages/client/Home/HomePage";
import ProductClientDetailPage from "./pages/client/Product/ProductDetailPage";
import Header from "./components/client/layout/Header";
import CartPage from "./pages/client/Cart/CartPage";
import CheckoutPage from "./pages/client/Checkout/CheckoutPage";
import LoginPage from "./pages/client/Auth/LoginPage";
import RegisterPage from "./pages/client/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/client/Auth/ForgotPasswordPage";
import ProfilePage from "./pages/client/Profile/ProfilePage";
import OrderHistoryPage from "./pages/client/Order/OrderHistoryPage";
import OrderDetailPage from "./pages/client/Order/OrderDetailPage";
import ProductCategoryEditPage from "./pages/admin/product-category/ProductCategoryEditPage";
import ProductListPage from "./components/client/product/ProductList";
import LoginPageAdmin from "./pages/admin/LoginPageAdmin";
import RequireAuth from "./auth/RequireAuth";
import AboutPage from "./pages/client/Other/AboutPage";
import ContactPage from "./pages/client/Other/ContactPage";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Routes>
        {/* === Admin Layout === */}
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
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
                        path="products/create"
                        element={<ProductCreatePage />}
                      />

                      <Route
                        path="product-category"
                        element={<ProductCategoryPage />}
                      />
                      <Route
                        path="product-category/create"
                        element={<ProductCategoryCreatePage />}
                      />
                      <Route
                        path="product-category/detail/:id"
                        element={<ProductCategoryDetailPage />}
                      />
                      <Route
                        path="product-category/edit/:id"
                        element={<ProductCategoryEditPage />}
                      />

                      <Route path="roles" element={<RolesPage />} />
                      <Route
                        path="roles/detail/:id"
                        element={<RoleDetailPage />}
                      />
                      <Route path="roles/edit/:id" element={<RoleEditPage />} />
                      <Route path="roles/create" element={<RoleCreatePage />} />
                      <Route
                        path="roles/permissions"
                        element={<PermissionsPage />}
                      />

                      <Route path="users" element={<UsersPage />} />
                      <Route path="users/create" element={<UserCreatePage />} />
                      <Route path="users/edit/:id" element={<UserEditPage />} />
                      <Route
                        path="users/detail/:id"
                        element={<UserDetailPage />}
                      />
                    </Routes>
                  </main>
                </div>
              </div>
            </RequireAuth>
          }
        />

        {/* === Login (Public) === */}
        <Route path="admin/auth/login" element={<LoginPageAdmin />} />

        {/* === Client Layout === */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              <main className="min-h-screen bg-white text-gray-800">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  {/* <Route path="/shop" element={<ShopPage />} /> */}
                  <Route path="/product" element={<ProductListPage />} />
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
                  <Route path="/about" element={<AboutPage/>} />
                  <Route path="/contact" element={<ContactPage/>} />
                </Routes>
              </main>
              {/* <Footer /> */}
            </>
          }
        />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
