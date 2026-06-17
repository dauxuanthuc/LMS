import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LogOut,
  BookOpen,
  User as UserIcon,
  ShieldAlert,
  Sun,
  Moon,
  Trophy,
  Home,
} from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 app-surface backdrop-blur-lg border-b border-theme px-4 md:px-6 py-3.5 md:py-4 safe-top">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-lg md:text-xl tracking-tight text-main truncate block">
              LMS Portal
            </span>
            <span className="block text-[10px] text-muted font-medium tracking-widest uppercase">
              Học trực tuyến
            </span>
          </div>
        </Link>

        {/* Action Links & User Info */}
        <div className="flex items-center gap-2 md:gap-5">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 text-muted">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                isActive("/") ? "app-soft text-main" : "hover:app-soft hover:text-main"
              }`}
            >
              Khóa học
            </Link>
            {user.role === "ADMIN" ? (
              <>
                <Link
                  to="/users"
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    isActive("/users") ? "app-soft text-main" : "hover:app-soft hover:text-main"
                  }`}
                >
                  Quản lý học viên
                </Link>
                <Link
                  to="/results"
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    isActive("/results") ? "app-soft text-main" : "hover:app-soft hover:text-main"
                  }`}
                >
                  Bảng điểm tổng hợp
                </Link>
              </>
            ) : (
              <Link
                to="/results/me"
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive("/results") ? "app-soft text-main" : "hover:app-soft hover:text-main"
                }`}
              >
                Kết quả của tôi
              </Link>
            )}
          </div>

          <div className="h-6 w-px border-l border-theme hidden md:block"></div>

          {/* User profile dropdown lookalike */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Chuyển sáng" : "Chuyển tối"}
              className="p-2.5 rounded-xl hover:app-soft text-muted hover:text-main border border-transparent hover:border-theme active:scale-95 transition-all duration-200 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full app-soft border border-theme flex items-center justify-center text-muted">
                <UserIcon className="w-4.5 h-4.5" />
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-sm font-semibold text-main">{user.name}</div>
                <div className="text-[10px] text-muted">{user.email}</div>
              </div>
            </div>

            {/* Role Badge */}
            <span
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                user.role === "ADMIN"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-gradient-to-r from-brand-500/20 to-sky-500/20 text-brand-300 border border-brand-500/30"
              }`}
            >
              {user.role === "ADMIN" ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> Admin
                </>
              ) : (
                "Học viên"
              )}
            </span>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-500 border border-transparent hover:border-red-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 app-surface border-t border-theme backdrop-blur-lg safe-bottom">
        <div className="grid grid-cols-3 gap-1 px-2 py-1.5">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-semibold ${
              isActive("/") ? "app-soft text-main" : "text-muted"
            }`}
          >
            <Home className="w-4.5 h-4.5 mb-1" />
            Khóa học
          </Link>

          {user.role === "ADMIN" ? (
            <Link
              to="/users"
              className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-semibold ${
                isActive("/users") ? "app-soft text-main" : "text-muted"
              }`}
            >
              <UserIcon className="w-4.5 h-4.5 mb-1" />
              Học viên
            </Link>
          ) : (
            <Link
              to="/results/me"
              className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-semibold ${
                isActive("/results") ? "app-soft text-main" : "text-muted"
              }`}
            >
              <Trophy className="w-4.5 h-4.5 mb-1" />
              Kết quả
            </Link>
          )}

          <Link
            to="/results"
            className={`flex flex-col items-center justify-center py-2 rounded-xl text-[11px] font-semibold ${
              isActive("/results") ? "app-soft text-main" : "text-muted"
            } ${user.role !== "ADMIN" ? "hidden" : "flex"}`}
          >
            <Trophy className="w-4.5 h-4.5 mb-1" />
            Bảng điểm
          </Link>
          {user.role !== "ADMIN" && <div className="py-2" />}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
