import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "consumer" | "seller" | null;

interface AuthContextType {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    const savedRole = localStorage.getItem("user_role");
    return (savedRole as Role) || null;
  });

  const login = (newRole: Role) => {
    setRole(newRole);
    if (newRole) {
      localStorage.setItem("user_role", newRole);
    } else {
      localStorage.removeItem("user_role");
    }
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem("user_role");
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
