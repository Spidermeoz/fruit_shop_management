import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc] text-slate-600 font-sans overflow-clip selection:bg-green-200 selection:text-green-900 relative">
      <Header />
      <main className="flex-1 pt-20 relative w-full z-10">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-green-50/80 to-transparent pointer-events-none -z-10"></div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
