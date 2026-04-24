// ─── LifeSolver Extension API Layer ───

const DEFAULT_API_URL = "https://lifeos-test.vercel.app/api";

export const API = {
  getApiUrl: async () => {
    const result = await chrome.storage.local.get("ls_api_url");
    return result.ls_api_url || DEFAULT_API_URL;
  },
  
  getToken: async () => {
    const result = await chrome.storage.local.get("ls_token");
    return result.ls_token || null;
  },
  
  setToken: async (token: string) => {
    await chrome.storage.local.set({ ls_token: token });
  },
  
  setUser: async (user: any) => {
    await chrome.storage.local.set({ ls_user: user });
  },
  
  getUser: async () => {
    const result = await chrome.storage.local.get("ls_user");
    return result.ls_user || null;
  },
  
  clearAuth: async () => {
    await chrome.storage.local.remove(["ls_token", "ls_user"]);
  },

  login: async (email: string, password: string) => {
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        await API.setToken(data.token);
        await API.setUser(data.user);
        return { success: true, user: data.user, token: data.token };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Network error" };
    }
  },

  verifyAuth: async () => {
    const token = await API.getToken();
    const user = await API.getUser();
    if (!token || !user) return { authenticated: false };
    
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        // Only clear auth if the token is explicitly rejected as invalid (401/403)
        if (res.status === 401 || res.status === 403) {
          await API.clearAuth();
          return { authenticated: false };
        }
        // If it's a 500 error, just use cached data
        return { authenticated: true, user };
      }
      
      const data = await res.json();
      if (data.success && data.user) {
        await API.setUser(data.user);
        return { authenticated: true, user: data.user };
      }
      return { authenticated: false };
    } catch {
      // Network error (offline or CORS). Don't log them out!
      return { authenticated: true, user };
    }
  },

  fetchTasks: async () => {
    const token = await API.getToken();
    if (!token) return [];
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/data/tasks`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  fetchHabits: async () => {
    const token = await API.getToken();
    if (!token) return [];
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/data/habits`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  fetchFinance: async () => {
    const token = await API.getToken();
    if (!token) return [];
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/data/finance`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  fetchBudgets: async () => {
    const token = await API.getToken();
    if (!token) return [];
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/data/budgets`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  sendAIMessage: async (messages: any[]) => {
    const token = await API.getToken();
    if (!token) return { error: "Not authenticated" };
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/ai/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) return { error: "AI request failed" };
      const data = await res.json();
      return { success: true, content: data.content };
    } catch {
      return { error: "Network error" };
    }
  },

  requestDetoxOtp: async () => {
    const token = await API.getToken();
    if (!token) return { success: false, error: "Not authenticated" };
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/auth/request-detox-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: "Network error" };
    }
  },

  verifyDetoxOtp: async (otp: string) => {
    const token = await API.getToken();
    if (!token) return { success: false, error: "Not authenticated" };
    try {
      const apiUrl = await API.getApiUrl();
      const res = await fetch(`${apiUrl}/auth/verify-detox-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: "Network error" };
    }
  }
};
