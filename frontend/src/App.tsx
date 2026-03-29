import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider as ClientAuthProvider } from "./context/AuthContext";
import { AuthProvider as AdminAuthProvider } from "./context/AuthContextAdmin";
import { CartProvider } from "./context/CartContext";

// Admin Layout & Pages
import Sidebar from "./components/admin/layouts/Sidebar";
import DashboardHeader from "./components/admin/layouts/DashboardHeader";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/products/ProductsPage";
import ProductEditPage from "./pages/admin/products/ProductEditPage";
import ProductDetailPage from "./pages/admin/products/ProductDetailPage";
import ProductCreatePage from "./pages/admin/products/ProductCreatePage";
import ProductCategoryPage from "./pages/admin/categories/ProductCategoryPage";
import ProductCategoryCreatePage from "./pages/admin/categories/ProductCategoryCreatePage";
import ProductCategoryDetailPage from "./pages/admin/categories/ProductCategoryDetailPage";
import ProductCategoryEditPage from "./pages/admin/categories/ProductCategoryEditPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import RoleDetailPage from "./pages/admin/roles/RoleDetailPage";
import RoleEditPage from "./pages/admin/roles/RoleEditPage";
import RoleCreatePage from "./pages/admin/roles/RoleCreatePage";
import PermissionsPage from "./pages/admin/roles/PermissionsPage";

import InternalUsersPage from "./pages/admin/users/internal/InternalUsersPage";
import InternalUserCreatePage from "./pages/admin/users/internal/InternalUserCreatePage";
import InternalUserEditPage from "./pages/admin/users/internal/InternalUserEditPage";
import InternalUserDetailPage from "./pages/admin/users/internal/InternalUserDetailPage";

import CustomersPage from "./pages/admin/users/customers/CustomersPage";
import CustomerCreatePage from "./pages/admin/users/customers/CustomerCreatePage";
import CustomerEditPage from "./pages/admin/users/customers/CustomerEditPage";
import CustomerDetailPage from "./pages/admin/users/customers/CustomerDetailPage";

import OrdersPage from "./pages/admin/orders/OrdersPage";
import OrdersDetailPageAdmin from "./pages/admin/orders/OrdersDetailPageAdmin";
import OrderDeliveryTimelinePage from "./pages/admin/orders/OrderDeliveryTimelinePage";
import SettingsGeneralPage from "./pages/admin/settings/SettingsGeneralPage";
import { AdminToastProvider } from "./context/AdminToastContext";
import ProductOriginPage from "./pages/admin/origins/ProductOriginPage";
import ProductTagPage from "./pages/admin/tags/ProductTagPage";
import BranchesPage from "./pages/admin/branches/BranchesPage";
import BranchCreatePage from "./pages/admin/branches/BranchCreatePage";
import BranchDetailPage from "./pages/admin/branches/BranchDetailPage";
import BranchEditPage from "./pages/admin/branches/BranchEditPage";
import InventoryPage from "./pages/admin/inventory/InventoryPage";
import InventoryTransactionHistoryPage from "./pages/admin/inventory/InventoryTransactionHistoryPage";

// Shipping admin pages
import ShippingZonesPage from "./pages/admin/shipping/ShippingZonesPage";
import ShippingZoneCreatePage from "./pages/admin/shipping/ShippingZoneCreatePage";
import ShippingZoneDetailPage from "./pages/admin/shipping/ShippingZoneDetailPage";
import ShippingZoneEditPage from "./pages/admin/shipping/ShippingZoneEditPage";

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

const AdminShell: React.FC = () => {
  return (
    <AdminAuthProvider>
      <RequireAuth>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-roboto">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />

                <Route path="products" element={<ProductsPage />} />
                <Route path="products/create" element={<ProductCreatePage />} />
                <Route path="products/edit/:id" element={<ProductEditPage />} />
                <Route
                  path="products/origins"
                  element={<ProductOriginPage />}
                />
                <Route path="products/tags" element={<ProductTagPage />} />
                <Route
                  path="products/categories"
                  element={<ProductCategoryPage />}
                />
                <Route
                  path="products/categories/create"
                  element={<ProductCategoryCreatePage />}
                />
                <Route
                  path="products/categories/detail/:id"
                  element={<ProductCategoryDetailPage />}
                />
                <Route
                  path="products/categories/edit/:id"
                  element={<ProductCategoryEditPage />}
                />
                <Route path="products/:id" element={<ProductDetailPage />} />

                <Route path="roles" element={<RolesPage />} />
                <Route path="roles/create" element={<RoleCreatePage />} />
                <Route path="roles/edit/:id" element={<RoleEditPage />} />
                <Route path="roles/detail/:id" element={<RoleDetailPage />} />
                <Route path="roles/permissions" element={<PermissionsPage />} />

                <Route
                  path="users"
                  element={<Navigate to="/admin/users/internal" replace />}
                />

                <Route path="users/internal" element={<InternalUsersPage />} />
                <Route
                  path="users/internal/create"
                  element={<InternalUserCreatePage />}
                />
                <Route
                  path="users/internal/edit/:id"
                  element={<InternalUserEditPage />}
                />
                <Route
                  path="users/internal/detail/:id"
                  element={<InternalUserDetailPage />}
                />

                <Route path="users/customers" element={<CustomersPage />} />
                <Route
                  path="users/customers/create"
                  element={<CustomerCreatePage />}
                />
                <Route
                  path="users/customers/edit/:id"
                  element={<CustomerEditPage />}
                />
                <Route
                  path="users/customers/detail/:id"
                  element={<CustomerDetailPage />}
                />

                <Route path="branches" element={<BranchesPage />} />
                <Route path="branches/create" element={<BranchCreatePage />} />
                <Route
                  path="branches/detail/:id"
                  element={<BranchDetailPage />}
                />
                <Route path="branches/edit/:id" element={<BranchEditPage />} />

                <Route path="inventory" element={<InventoryPage />} />
                <Route
                  path="inventory/history"
                  element={<InventoryTransactionHistoryPage />}
                />

                <Route path="shipping/zones" element={<ShippingZonesPage />} />
                <Route
                  path="shipping/zones/create"
                  element={<ShippingZoneCreatePage />}
                />
                <Route
                  path="shipping/zones/detail/:id"
                  element={<ShippingZoneDetailPage />}
                />
                <Route
                  path="shipping/zones/edit/:id"
                  element={<ShippingZoneEditPage />}
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
              </Routes>
            </main>
          </div>
        </div>
      </RequireAuth>
    </AdminAuthProvider>
  );
};

const ClientShell: React.FC = () => {
  return (
    <ClientAuthProvider>
      <CartProvider>
        <ToastProvider>
          <>
            <Header />
            <main className="min-h-screen bg-white text-gray-800">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route
                  path="/products/:slug"
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
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfUsePage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/return-policy" element={<ReturnPolicyPage />} />
                <Route
                  path="/shipping-policy"
                  element={<ShippingPolicyPage />}
                />
              </Routes>
            </main>
          </>
        </ToastProvider>
      </CartProvider>
    </ClientAuthProvider>
  );
};

const AdminLoginShell: React.FC = () => {
  return (
    <AdminAuthProvider>
      <LoginPageAdmin />
    </AdminAuthProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AdminToastProvider>
        <Routes>
          <Route path="/admin/auth/login" element={<AdminLoginShell />} />
          <Route path="/admin/*" element={<AdminShell />} />
          <Route path="/*" element={<ClientShell />} />
        </Routes>
      </AdminToastProvider>
    </ThemeProvider>
  );
};

export default App;
