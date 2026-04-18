import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, RegisteredUser } from "../types";

export type Role = "consumer" | "seller" | null;

interface AuthContextType {
  role: Role;
  profile: UserProfile;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "consumer" | "seller";
  }) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (profile: UserProfile) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  phone: "",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Demo accounts injected for developer testing ──────────────────────────────
export const DEMO_ACCOUNTS: RegisteredUser[] = [
  {
    name: "Khách Hàng Demo",
    email: "consumer@demo.com",
    phone: "0901 234 567",
    password: "demo123",
    role: "consumer",
  },
  {
    name: "Người Bán Demo",
    email: "seller@demo.com",
    phone: "0912 345 678",
    password: "demo123",
    role: "seller",
  },
];

// Seed demo accounts on first load (safe to call multiple times)
function seedDemoAccounts() {
  const users = getRegisteredUsers();
  let changed = false;
  for (const demo of DEMO_ACCOUNTS) {
    if (!users.some((u) => u.email.toLowerCase() === demo.email.toLowerCase())) {
      users.push(demo);
      changed = true;
    }
  }
  if (changed) saveRegisteredUsers(users);
}
// ──────────────────────────────────────────────────────────────────────────────

// Helper: get registered users from localStorage
function getRegisteredUsers(): RegisteredUser[] {
  const raw = localStorage.getItem("registered_users");
  return raw ? JSON.parse(raw) : [];
}

// Helper: save registered users to localStorage
function saveRegisteredUsers(users: RegisteredUser[]) {
  localStorage.setItem("registered_users", JSON.stringify(users));
}

// Run once at module level so demo accounts are always available
seedDemoAccounts();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    const savedRole = localStorage.getItem("user_role");
    return (savedRole as Role) || null;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("user_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const isAuthenticated = role !== null;

  useEffect(() => {
    localStorage.setItem("user_profile", JSON.stringify(profile));
  }, [profile]);

  const register = (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "consumer" | "seller";
  }): { success: boolean; error?: string } => {
    const users = getRegisteredUsers();

    // Check if email already exists
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "Email này đã được đăng ký. Vui lòng đăng nhập." };
    }

    // Save new user
    const newUser: RegisteredUser = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    };
    users.push(newUser);
    saveRegisteredUsers(users);

    // Auto-login after registration
    setRole(data.role);
    localStorage.setItem("user_role", data.role);
    const newProfile: UserProfile = {
      name: data.name,
      email: data.email,
      phone: data.phone,
    };
    setProfile(newProfile);
    localStorage.setItem("user_profile", JSON.stringify(newProfile));
    localStorage.setItem("current_user_email", data.email);

    return { success: true };
  };

  const login = (
    email: string,
    password: string
  ): { success: boolean; error?: string } => {
    const users = getRegisteredUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return { success: false, error: "Email không tồn tại. Vui lòng đăng ký tài khoản mới." };
    }

    if (user.password !== password) {
      return { success: false, error: "Mật khẩu không chính xác. Vui lòng thử lại." };
    }

    // Successful login
    setRole(user.role);
    localStorage.setItem("user_role", user.role);
    const userProfile: UserProfile = {
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
    setProfile(userProfile);
    localStorage.setItem("user_profile", JSON.stringify(userProfile));
    localStorage.setItem("current_user_email", user.email);

    return { success: true };
  };

  const logout = () => {
    setRole(null);
    setProfile(DEFAULT_PROFILE);
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("current_user_email");
  };

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);

    // Also update the registered user record
    const currentEmail = localStorage.getItem("current_user_email");
    if (currentEmail) {
      const users = getRegisteredUsers();
      const idx = users.findIndex(
        (u) => u.email.toLowerCase() === currentEmail.toLowerCase()
      );
      if (idx !== -1) {
        users[idx].name = newProfile.name;
        users[idx].email = newProfile.email;
        users[idx].phone = newProfile.phone;
        saveRegisteredUsers(users);
        localStorage.setItem("current_user_email", newProfile.email);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ role, profile, isAuthenticated, login, logout, register, updateProfile }}
    >
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
