import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Admin Layout & Pages
import Sidebar from "./components/admin/layouts/Sidebar";
import DashboardHeader from "./components/admin/layouts/DashboardHeader";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/products/ProductsPage";
import ProductEditPage from "./pages/admin/products/ProductEditPage";
import ProductDetailPage from "./pages/admin/products/ProductDetailPage";
import ProductCreatePage from "./pages/admin/products/ProductCreatePage";
import ProductCategoryPage from "./pages/admin/product-category/ProductCategoryPage";
import ProductCategoryCreatePage from "./pages/admin/product-category/ProductCategoryCreatePage";
import ProductCategoryDetailPage from "./pages/admin/product-category/ProductCategoryDetailPage";
import ProductCategoryEditPage from "./pages/admin/product-category/ProductCategoryEditPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import RoleDetailPage from "./pages/admin/roles/RoleDetailPage";
import RoleEditPage from "./pages/admin/roles/RoleEditPage";
import RoleCreatePage from "./pages/admin/roles/RoleCreatePage";
import PermissionsPage from "./pages/admin/roles/PermissionsPage";
import UsersPage from "./pages/admin/users/UsersPage";
import UserCreatePage from "./pages/admin/users/UserCreatePage";
import UserEditPage from "./pages/admin/users/UserEditPage";
import UserDetailPage from "./pages/admin/users/UserDetailPage";
import OrdersPage from "./pages/admin/orders/OrdersPage";
import OrdersDetailPageAdmin from "./pages/admin/orders/OrdersDetailPageAdmin";
import OrderDeliveryTimelinePage from "./pages/admin/orders/OrderDeliveryTimelinePage";
import SettingsGeneralPage from "./pages/admin/settings/SettingsGeneralPage";
import { AdminToastProvider } from "./context/AdminToastContext";
import ProductOriginPage from "./pages/admin/product-origin/ProductOriginPage";
import ProductOriginCreatePage from "./pages/admin/product-origin/ProductOriginCreatePage";
import ProductOriginDetailPage from "./pages/admin/product-origin/ProductOriginDetailPage";
import ProductOriginEditPage from "./pages/admin/product-origin/ProductOriginEditPage";
import ProductTagPage from "./pages/admin/product-tags/ProductTagPage";
import ProductTagCreatePage from "./pages/admin/product-tags/ProductTagCreatePage";
import ProductTagDetailPage from "./pages/admin/product-tags/ProductTagDetailPage";
import ProductTagEditPage from "./pages/admin/product-tags/ProductTagEditPage";

// Client Layout & Pages
import HomePage from "./pages/client/Home/HomePage";
import ProductClientDetailPage from "./pages/client/Product/ProductDetailPage";
import Header from "./components/client/layouts/Header";
import CartPage from "./pages/client/Cart/CartPage";
import CheckoutPage from "./pages/client/Checkout/CheckoutPage";
import LoginPage from "./pages/client/Auth/LoginPage";
import RegisterPage from "./pages/client/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/client/Auth/ForgotPasswordPage";
import ProfilePage from "./pages/client/Profile/ProfilePage";
import OrderHistoryPage from "./pages/client/Order/OrderHistoryPage";
import OrderDetailPage from "./pages/client/Order/OrderDetailPage";
import ProductListPage from "./components/client/product/ProductList";
import LoginPageAdmin from "./pages/admin/LoginPageAdmin";
import RequireAuth from "./auth/RequireAuth";
import AboutPage from "./pages/client/Other/AboutPage";
import ContactPage from "./pages/client/Other/ContactPage";
import PrivacyPolicyPage from "./pages/client/Other/PrivacyPolicyPage";
import TermsOfUsePage from "./pages/client/Other/TermsOfUsePage";
import FAQPage from "./pages/client/Other/FAQPage";
import ReturnPolicyPage from "./pages/client/Other/ReturnPolicyPage";
import ShippingPolicyPage from "./pages/client/Other/ShippingPolicyPage";
import { ToastProvider } from "./context/ToastContext";
// import Footer from "./components/client/layout/Footer"; //

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AdminToastProvider>
            <ToastProvider>
              <Routes>
                {/* ================= ADMIN ================= */}
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
                              <Route
                                path="dashboard"
                                element={<DashboardPage />}
                              />
                              <Route
                                path="products"
                                element={<ProductsPage />}
                              />
                              <Route
                                path="products/create"
                                element={<ProductCreatePage />}
                              />
                              <Route
                                path="products/edit/:id"
                                element={<ProductEditPage />}
                              />
                              <Route
                                path="products/:id"
                                element={<ProductDetailPage />}
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
                                path="roles/create"
                                element={<RoleCreatePage />}
                              />
                              <Route
                                path="roles/edit/:id"
                                element={<RoleEditPage />}
                              />
                              <Route
                                path="roles/detail/:id"
                                element={<RoleDetailPage />}
                              />
                              <Route
                                path="roles/permissions"
                                element={<PermissionsPage />}
                              />

                              <Route path="users" element={<UsersPage />} />
                              <Route
                                path="users/create"
                                element={<UserCreatePage />}
                              />
                              <Route
                                path="users/edit/:id"
                                element={<UserEditPage />}
                              />
                              <Route
                                path="users/detail/:id"
                                element={<UserDetailPage />}
                              />

                              <Route path="orders" element={<OrdersPage />} />
                              <Route
                                path="orders/detail/:id"
                                element={<OrdersDetailPageAdmin />}
                              />
                              <Route
                                path="orders/:id/timeline"
                                element={<OrderDeliveryTimelinePage />}
                              />
                              <Route
                                path="settings/general"
                                element={<SettingsGeneralPage />}
                              />
                              <Route
                                path="product-origin"
                                element={<ProductOriginPage />}
                              />
                              <Route
                                path="product-origin/create"
                                element={<ProductOriginCreatePage />}
                              />
                              <Route
                                path="product-origin/detail/:id"
                                element={<ProductOriginDetailPage />}
                              />
                              <Route
                                path="product-origin/edit/:id"
                                element={<ProductOriginEditPage />}
                              />
                              <Route
                                path="product-tags"
                                element={<ProductTagPage />}
                              />
                              <Route
                                path="product-tags/create"
                                element={<ProductTagCreatePage />}
                              />
                              <Route
                                path="product-tags/detail/:id"
                                element={<ProductTagDetailPage />}
                              />
                              <Route
                                path="product-tags/edit/:id"
                                element={<ProductTagEditPage />}
                              />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </RequireAuth>
                  }
                />

                {/* === Admin Login (Public) === */}
                <Route path="/admin/auth/login" element={<LoginPageAdmin />} />

                {/* ================= CLIENT ================= */}
                <Route
                  path="/*"
                  element={
                    <>
                      <Header />
                      <main className="min-h-screen bg-white text-gray-800">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route
                            path="/products"
                            element={<ProductListPage />}
                          />
                          <Route
                            path="/products/:id"
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
                          <Route
                            path="/orders"
                            element={<OrderHistoryPage />}
                          />
                          <Route
                            path="/orders/:id"
                            element={<OrderDetailPage />}
                          />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route
                            path="/privacy-policy"
                            element={<PrivacyPolicyPage />}
                          />
                          <Route path="/terms" element={<TermsOfUsePage />} />
                          <Route path="/faq" element={<FAQPage />} />
                          <Route
                            path="/return-policy"
                            element={<ReturnPolicyPage />}
                          />
                          <Route
                            path="/shipping-policy"
                            element={<ShippingPolicyPage />}
                          />
                        </Routes>
                      </main>
                      {/* <Footer /> */}
                    </>
                  }
                />
              </Routes>
            </ToastProvider>
          </AdminToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
