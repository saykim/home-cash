// API 헬퍼 함수 - Neon DB와 통신
const API_BASE = "/api";

// Auth token storage
let authToken: string | null = null;

/**
 * Set the authentication token for API requests
 * This should be called from AuthContext when the user logs in
 */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Get headers for API requests including authentication
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    // Clear auth token
    authToken = null;

    // Redirect to login page
    window.location.href = "/login";

    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.details || error.error || "API request failed");
  }
  return response.json() as Promise<T>;
}

// Assets API
export const assetsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/assets`, { headers: getHeaders() }).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/assets?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/assets?id=${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};

// Asset Balance History API
export const assetBalanceHistoryApi = {
  getByAssetId: (assetId: string): Promise<any[]> =>
    fetch(`${API_BASE}/asset-balance-history?assetId=${assetId}`, { headers: getHeaders() }).then((r) =>
      handleResponse<any[]>(r)
    ),
};

// Categories API
export const categoriesApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/categories`, { headers: getHeaders() }).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/categories?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/categories?id=${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: {
    month?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.month) searchParams.set("month", params.month);
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    const query = searchParams.toString();
    return fetch(`${API_BASE}/transactions${query ? `?${query}` : ""}`, { headers: getHeaders() }).then(
      (r) => handleResponse<any[]>(r)
    );
  },

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/transactions?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/transactions?id=${id}`, { method: "DELETE", headers: getHeaders() }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Credit Cards API
export const creditCardsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/credit-cards`, { headers: getHeaders() }).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/credit-cards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/credit-cards?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/credit-cards?id=${id}`, { method: "DELETE", headers: getHeaders() }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Recurring Transactions API
export const recurringTransactionsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/recurring-transactions`, { headers: getHeaders() }).then((r) =>
      handleResponse<any[]>(r)
    ),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/recurring-transactions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/recurring-transactions?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/recurring-transactions?id=${id}`, {
      method: "DELETE",
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};

// Budgets API
export const budgetsApi = {
  getAll: (month?: string): Promise<any[]> => {
    const query = month ? `?month=${month}` : "";
    return fetch(`${API_BASE}/budgets${query}`, { headers: getHeaders() }).then((r) =>
      handleResponse<any[]>(r)
    );
  },

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/budgets`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/budgets?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/budgets?id=${id}`, { method: "DELETE", headers: getHeaders() }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Annual Events API
export const annualEventsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/annual-events`, { headers: getHeaders() }).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/annual-events`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/annual-events?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/annual-events?id=${id}`, { method: "DELETE", headers: getHeaders() }).then(
      (r) => handleResponse<{ success: boolean }>(r)
    ),
};

// Transaction Templates API
export const transactionTemplatesApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/transaction-templates`, { headers: getHeaders() }).then((r) =>
      handleResponse<any[]>(r)
    ),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/transaction-templates`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/transaction-templates?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/transaction-templates?id=${id}`, {
      method: "DELETE",
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};

// Benefit Tiers API
export const benefitTiersApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/benefit-tiers`, { headers: getHeaders() }).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/benefit-tiers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/benefit-tiers?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/benefit-tiers?id=${id}`, { method: "DELETE", headers: getHeaders() }).then(
      (r) => handleResponse<{ success: boolean }>(r)
    ),
};

// Card Monthly Payments API
export const cardMonthlyPaymentsApi = {
  getByMonth: (month: string): Promise<any[]> =>
    fetch(`${API_BASE}/card-monthly-payments?month=${month}`, { headers: getHeaders() }).then((r) =>
      handleResponse<any[]>(r)
    ),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/card-monthly-payments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/card-monthly-payments?id=${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/card-monthly-payments?id=${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};
