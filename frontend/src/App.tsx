import React from 'react'; // Import React để sử dụng kiểu React.FC
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import DashboardPage from './pages/DashboardPage';
import Sidebar from './components/ui/Sidebar';
import DashboardHeader from './components/DashboardHeader';

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
              <Route path="/" element={<DashboardPage />} />
              {/* Thêm các route khác tại đây */}
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;