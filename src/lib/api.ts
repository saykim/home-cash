// API 헬퍼 함수 - Neon DB와 통신
const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
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
    fetch(`${API_BASE}/assets`).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/assets?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/assets?id=${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Categories API
export const categoriesApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/categories`).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/categories?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/categories?id=${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
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
    return fetch(`${API_BASE}/transactions${query ? `?${query}` : ""}`).then(
      (r) => handleResponse<any[]>(r)
    );
  },

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/transactions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/transactions?id=${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Credit Cards API
export const creditCardsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/credit-cards`).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/credit-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/credit-cards?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/credit-cards?id=${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Recurring Transactions API
export const recurringTransactionsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/recurring-transactions`).then((r) =>
      handleResponse<any[]>(r)
    ),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/recurring-transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/recurring-transactions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    return fetch(`${API_BASE}/budgets${query}`).then((r) =>
      handleResponse<any[]>(r)
    );
  },

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/budgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/budgets?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/budgets?id=${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<{ success: boolean }>(r)
    ),
};

// Annual Events API
export const annualEventsApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/annual-events`).then((r) => handleResponse<any[]>(r)),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/annual-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/annual-events?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/annual-events?id=${id}`, { method: "DELETE" }).then(
      (r) => handleResponse<{ success: boolean }>(r)
    ),
};

// Transaction Templates API
export const transactionTemplatesApi = {
  getAll: (): Promise<any[]> =>
    fetch(`${API_BASE}/transaction-templates`).then((r) =>
      handleResponse<any[]>(r)
    ),

  create: (data: any): Promise<any> =>
    fetch(`${API_BASE}/transaction-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/transaction-templates?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<any>(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/transaction-templates?id=${id}`, {
      method: "DELETE",
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};
