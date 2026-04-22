import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider as ClientAuthProvider } from "./context/AuthContext";
import { AuthProvider as AdminAuthProvider } from "./context/AuthContextAdmin";
import { CartProvider } from "./context/CartContext";

// Admin Layout & Pages
import Sidebar from "./components/admin/layouts/Sidebar";
import DashboardHeader from "./components/admin/layouts/DashboardHeader";
import DashboardPage from "./pages/admin/dashboard/DashboardPage";
import ProductsPage from "./pages/admin/products/ProductsPage";
import ProductEditPage from "./pages/admin/products/ProductEditPage";
import ProductCreatePage from "./pages/admin/products/ProductCreatePage";
import ProductCategoryPage from "./pages/admin/categories/ProductCategoryPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import RoleEditPage from "./pages/admin/roles/RoleEditPage";
import RoleCreatePage from "./pages/admin/roles/RoleCreatePage";
import PermissionsPage from "./pages/admin/roles/PermissionsPage";

import UsersHubPage from "./pages/admin/users/UsersHubPage";
import UsersPage from "./pages/admin/users/UsersPage";
import UserCreatePage from "./pages/admin/users/UserCreatePage";
import UserEditPage from "./pages/admin/users/UserEditPage";

import OrdersPage from "./pages/admin/orders/OrdersPage";
import OrderWorkspacePage from "./pages/admin/orders/OrderWorkspacePage";
import SettingsGeneralPage from "./pages/admin/settings/SettingsGeneralPage";
import { AdminToastProvider } from "./context/AdminToastContext";
import ProductOriginPage from "./pages/admin/origins/ProductOriginPage";
import ProductTagPage from "./pages/admin/tags/ProductTagPage";
import BranchesPage from "./pages/admin/branches/BranchesPage";
import BranchCreatePage from "./pages/admin/branches/BranchCreatePage";
import BranchEditPage from "./pages/admin/branches/BranchEditPage";
import InventoryPage from "./pages/admin/inventory/InventoryPage";
import InventoryTransactionHistoryPage from "./pages/admin/inventory/InventoryTransactionHistoryPage";
import ShippingDashboardPage from "./pages/admin/shipping/ShippingOverviewPage";
import ShippingZonesPage from "./pages/admin/shipping/ShippingZonesPage";
import ShippingZoneCreatePage from "./pages/admin/shipping/ShippingZoneCreatePage";
import ShippingZoneEditPage from "./pages/admin/shipping/ShippingZoneEditPage";
import BranchServiceAreasPage from "./pages/admin/shipping/BranchServiceAreasPage";
import BranchServiceAreaCreatePage from "./pages/admin/shipping/BranchServiceAreaCreatePage";
import BranchServiceAreaEditPage from "./pages/admin/shipping/BranchServiceAreaEditPage";
import DeliveryTimeSlotsPage from "./pages/admin/shipping/DeliveryTimeSlotsPage";
import DeliveryTimeSlotCreatePage from "./pages/admin/shipping/DeliveryTimeSlotCreatePage";
import DeliveryTimeSlotEditPage from "./pages/admin/shipping/DeliveryTimeSlotEditPage";
import BranchDeliveryTimeSlotsPage from "./pages/admin/shipping/BranchDeliveryTimeSlotsPage";
import BranchDeliveryTimeSlotCreatePage from "./pages/admin/shipping/BranchDeliveryTimeSlotCreatePage";
import BranchDeliveryTimeSlotEditPage from "./pages/admin/shipping/BranchDeliveryTimeSlotEditPage";
import BranchDeliverySlotCapacitiesPage from "./pages/admin/shipping/BranchDeliverySlotCapacitiesPage";
import BranchDeliverySlotCapacityCreatePage from "./pages/admin/shipping/BranchDeliverySlotCapacityCreatePage";
import BranchDeliverySlotCapacityEditPage from "./pages/admin/shipping/BranchDeliverySlotCapacityEditPage";
import PromotionsPage from "./pages/admin/promotions/PromotionsPage";
import PromotionCreatePage from "./pages/admin/promotions/PromotionCreatePage";
import PromotionEditPage from "./pages/admin/promotions/PromotionEditPage";
import PostsPage from "./pages/admin/content/PostsPage";
import PostCreatePage from "./pages/admin/content/PostCreatePage";
import PostEditPage from "./pages/admin/content/PostEditPage";
import PostCategoriesPage from "./pages/admin/content/PostCategoriesPage";
import PostTagsPage from "./pages/admin/content/PostTagsPage";
import NotificationsPage from "./pages/admin/notifications/NotificationsPage";
import AuditLogsPage from "./pages/admin/audit-logs/AuditLogsPage";

// Client Layout & Pages
import HomePage from "./pages/client/Home/HomePage";
import ProductClientDetailPage from "./pages/client/Product/ProductDetailPage";
import PostsPageClient from "./pages/client/Post/PostsPage";
import PostDetailPage from "./pages/client/Post/PostDetailPage";
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
import LoginPageAdmin from "./pages/admin/auth/LoginPageAdmin";
import RequireAuth from "./auth/RequireAuth";
import AboutPage from "./pages/client/Other/AboutPage";
import ContactPage from "./pages/client/Other/ContactPage";
import PrivacyPolicyPage from "./pages/client/Other/PrivacyPolicyPage";
import TermsOfUsePage from "./pages/client/Other/TermsOfUsePage";
import FAQPage from "./pages/client/Other/FAQPage";
import ReturnPolicyPage from "./pages/client/Other/ReturnPolicyPage";
import ShippingPolicyPage from "./pages/client/Other/ShippingPolicyPage";
import { ToastProvider } from "./context/ToastContext";
import { ChatbotProvider } from "./context/ChatbotContext";
import ChatLauncher from "./components/client/chat/ChatLauncher";

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

                <Route path="content/posts" element={<PostsPage />} />
                <Route
                  path="content/posts/create"
                  element={<PostCreatePage />}
                />
                <Route
                  path="content/posts/edit/:id"
                  element={<PostEditPage />}
                />
                <Route
                  path="content/categories"
                  element={<PostCategoriesPage />}
                />
                <Route path="content/tags" element={<PostTagsPage />} />

                <Route path="roles" element={<RolesPage />} />
                <Route path="roles/create" element={<RoleCreatePage />} />
                <Route path="roles/edit/:id" element={<RoleEditPage />} />
                <Route path="roles/permissions" element={<PermissionsPage />} />

                <Route path="users" element={<UsersPage />} />
                <Route path="users/hub" element={<UsersHubPage />} />
                <Route
                  path="users/all"
                  element={<Navigate to="/admin/users" replace />}
                />
                <Route path="users/create" element={<UserCreatePage />} />
                <Route path="users/edit/:id" element={<UserEditPage />} />

                <Route
                  path="users/internal"
                  element={
                    <Navigate to="/admin/users/all?type=internal" replace />
                  }
                />
                <Route
                  path="users/internal/create"
                  element={
                    <Navigate to="/admin/users/create?type=internal" replace />
                  }
                />
                <Route
                  path="users/customers"
                  element={
                    <Navigate to="/admin/users/all?type=customer" replace />
                  }
                />
                <Route
                  path="users/customers/create"
                  element={
                    <Navigate to="/admin/users/create?type=customer" replace />
                  }
                />

                <Route path="branches" element={<BranchesPage />} />
                <Route path="branches/create" element={<BranchCreatePage />} />
                <Route path="branches/edit/:id" element={<BranchEditPage />} />

                <Route path="inventory" element={<InventoryPage />} />
                <Route
                  path="inventory/history"
                  element={<InventoryTransactionHistoryPage />}
                />

                <Route path="shipping" element={<ShippingDashboardPage />} />
                <Route path="shipping/zones" element={<ShippingZonesPage />} />
                <Route
                  path="shipping/zones/create"
                  element={<ShippingZoneCreatePage />}
                />
                <Route
                  path="shipping/zones/edit/:id"
                  element={<ShippingZoneEditPage />}
                />

                <Route
                  path="shipping/service-areas"
                  element={<BranchServiceAreasPage />}
                />
                <Route
                  path="shipping/service-areas/create"
                  element={<BranchServiceAreaCreatePage />}
                />
                <Route
                  path="shipping/service-areas/edit/:id"
                  element={<BranchServiceAreaEditPage />}
                />

                <Route
                  path="shipping/delivery-slots"
                  element={<DeliveryTimeSlotsPage />}
                />
                <Route
                  path="shipping/delivery-slots/create"
                  element={<DeliveryTimeSlotCreatePage />}
                />
                <Route
                  path="shipping/delivery-slots/edit/:id"
                  element={<DeliveryTimeSlotEditPage />}
                />

                <Route
                  path="shipping/branch-delivery-slots"
                  element={<BranchDeliveryTimeSlotsPage />}
                />
                <Route
                  path="shipping/branch-delivery-slots/create"
                  element={<BranchDeliveryTimeSlotCreatePage />}
                />
                <Route
                  path="shipping/branch-delivery-slots/edit/:id"
                  element={<BranchDeliveryTimeSlotEditPage />}
                />

                <Route
                  path="shipping/branch-delivery-slot-capacities"
                  element={<BranchDeliverySlotCapacitiesPage />}
                />
                <Route
                  path="shipping/branch-delivery-slot-capacities/create"
                  element={<BranchDeliverySlotCapacityCreatePage />}
                />
                <Route
                  path="shipping/branch-delivery-slot-capacities/edit/:id"
                  element={<BranchDeliverySlotCapacityEditPage />}
                />

                <Route path="orders" element={<OrdersPage />} />
                <Route
                  path="orders/edit/:id"
                  element={<OrderWorkspacePage />}
                />
                <Route path="promotions" element={<PromotionsPage />} />
                <Route
                  path="promotions/create"
                  element={<PromotionCreatePage />}
                />
                <Route
                  path="promotions/edit/:id"
                  element={<PromotionEditPage />}
                />

                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
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
          <ChatbotProvider>
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
                  <Route path="/posts" element={<PostsPageClient />} />
                  <Route path="/posts/:slug" element={<PostDetailPage />} />
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
                  <Route
                    path="/privacy-policy"
                    element={<PrivacyPolicyPage />}
                  />
                  <Route path="/terms" element={<TermsOfUsePage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/return-policy" element={<ReturnPolicyPage />} />
                  <Route
                    path="/shipping-policy"
                    element={<ShippingPolicyPage />}
                  />
                </Routes>
              </main>
              <ChatLauncher />
            </>
          </ChatbotProvider>
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
