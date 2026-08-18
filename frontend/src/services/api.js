const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Custom fetch request helper injecting auth token and formatting response.
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // Throw error object returned by backend or default error
    const errorMsg =
      data.error?.message || "Something went wrong. Please try again.";
    throw new Error(errorMsg);
  }

  return data.data;
};

const api = {
  // Auth API
  auth: {
    register: (name, email, password) =>
      request("/auth/register", {
        method: "POST",
        body: { name, email, password },
      }),

    login: (email, password) =>
      request("/auth/login", { method: "POST", body: { email, password } }),

    getMe: () => request("/auth/me", { method: "GET" }),
  },

  // Loans API
  loans: {
    create: (requested_amount, purpose, duration_months) =>
      request("/loans", {
        method: "POST",
        body: { requested_amount, purpose, duration_months },
      }),

    list: (filters = {}) => {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.search) queryParams.append("search", filters.search);
      const queryStr = queryParams.toString();
      return request(`/loans${queryStr ? `?${queryStr}` : ""}`, {
        method: "GET",
      });
    },

    getById: (id) => request(`/loans/${id}`, { method: "GET" }),

    updateStatus: (id, payload) =>
      request(`/loans/${id}/status`, {
        method: "PATCH",
        body: payload,
      }),

    recordRepayment: (id, amount, payment_reference) =>
      request(`/loans/${id}/repayments`, {
        method: "POST",
        body: { amount, payment_reference },
      }),
  },

  // Dashboard API
  dashboard: {
    getSummary: () => request("/dashboard/summary", { method: "GET" }),
  },
};

export default api;
