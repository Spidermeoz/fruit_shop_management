import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/client/layout/Layout";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const validateEmail = (): boolean => {
    if (!email) {
      setError("Vui lòng nhập email");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email không hợp lệ");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    // Giả lập API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <Layout>
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Quên mật khẩu</h1>
          <p className="text-gray-700">Khôi phục mật khẩu tài khoản của bạn</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Quên mật khẩu</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-8">
              {!isSubmitted ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-green-800 mb-2">
                      Quên mật khẩu?
                    </h2>
                    <p className="text-gray-600">
                      Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={email}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            error ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="Nhập email của bạn"
                        />
                      </div>
                      {error && (
                        <p className="mt-1 text-sm text-red-500">{error}</p>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        "Gửi link đặt lại mật khẩu"
                      )}
                    </button>
                  </form>

                  {/* Back to login */}
                  <div className="text-center mt-6">
                    <p className="text-gray-600">
                      <Link to="/login" className="text-green-600 hover:text-green-700 font-medium transition">
                        ← Quay lại đăng nhập
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-green-800 mb-2">
                    Kiểm tra email của bạn
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Chúng tôi đã gửi link đặt lại mật khẩu đến <span className="font-medium">{email}</span>
                  </p>
                  <p className="text-gray-600 text-sm mb-6">
                    Không nhận được email? Kiểm tra thư mục spam hoặc{" "}
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail("");
                      }}
                      className="text-green-600 hover:text-green-700 font-medium transition"
                    >
                      thử lại
                    </button>
                  </p>
                  <Link
                    to="/login"
                    className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;