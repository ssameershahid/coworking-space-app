import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to restore user from localStorage on initial load
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const queryClient = useQueryClient();

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          return data.user;
        }
        // Only return null for explicit auth failures (401/403)
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        // For other errors (500, network issues), keep current state
        throw new Error(`Auth check failed with status: ${response.status}`);
      } catch (error) {
        console.error("Auth check failed:", error);
        // Don't immediately log out user on network errors
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on explicit auth failures (401/403)
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      // Retry network errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 20 * 24 * 60 * 60 * 1000, // 20 days (close to 3-week session)
    gcTime: 21 * 24 * 60 * 60 * 1000, // 21 days (match server session)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true, // Only refetch when network reconnects
  });

  useEffect(() => {
    // Only update user state if we have explicit data (success or explicit auth failure)
    if (userData !== undefined) {
      setUser(userData);
      // Persist user state to localStorage
      if (userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
    // If there's an error but no userData, keep current user state (don't log out on network errors)
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      // Persist successful login to localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      // Persist successful registration to localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (userData: any) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      setUser(null);
      // Clear localStorage on logout
      localStorage.removeItem('currentUser');
      queryClient.clear();
      window.location.href = "/";
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
