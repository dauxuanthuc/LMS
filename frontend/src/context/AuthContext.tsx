import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  status: "ACTIVE" | "LOCKED";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    const token = localStorage.getItem("lms_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Authentication check failed:", error);
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: loggedUser } = response.data;
      
      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Đăng nhập không thành công.");
    }
  };

  const logout = () => {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
