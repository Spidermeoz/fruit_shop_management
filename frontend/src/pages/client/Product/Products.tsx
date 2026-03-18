import React from "react";
import { Link } from "react-router-dom";
import ProductList from "../../../components/client/product/ProductList";
import Layout from "../../../components/client/layouts/Layout";

const Products: React.FC = () => {
  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-8 text-center">
        <div className="container mx-auto relative z-10 px-4">
          <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium">
            <Link to="/" className="hover:text-green-600 transition-colors">
              Trang chủ
            </Link>
            <span className="mx-3 opacity-30">/</span>
            <span className="text-green-700 font-semibold">Sản phẩm</span>
          </div>
        </div>
      </section>

      {/* ==================== PAGE HEADER ==================== */}
      <section className="pt-8 pb-12 relative overflow-hidden">
        {/* Điểm nhấn nền (Blob) tạo cảm giác organic */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-100/40 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-700 border border-green-100 mb-6">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Thu hoạch trong ngày
          </span>

          {/* Tiêu đề chính */}
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Khám phá gian hàng <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
              Trái cây tươi sạch
            </span>
          </h1>

          {/* Mô tả ngắn */}
          <p className="text-slate-500 text-lg font-medium">
            Lựa chọn những sản phẩm tươi ngon nhất, đạt chuẩn 100% Organic và
            được kiểm định khắt khe trước khi đến tay gia đình bạn.
          </p>
        </div>
      </section>

      {/* ==================== PRODUCT LIST ==================== */}
      <section className="pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <ProductList />
        </div>
      </section>

      {/* <Footer /> */}
    </Layout>
  );
};

export default Products;
