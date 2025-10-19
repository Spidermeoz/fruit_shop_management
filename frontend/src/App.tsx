import React from "react"; // Import React để sử dụng kiểu React.FC
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ProductEditPage from "./pages/ProductEditPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import Sidebar from "./components/layouts/Sidebar";
import DashboardHeader from "./components/layouts/DashboardHeader";
// Sử dụng React.FC (Functional Component) để định nghĩa kiểu cho component
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-roboto">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
            <Routes>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductsPage />} />
              <Route path="/admin/products/:id" element={<ProductDetailPage />} />
              <Route path="/admin/products/edit/:id" element={<ProductEditPage />} />
              {/* Thêm các route khác tại đây */}
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
