import { useState, useEffect, useCallback } from "react";
import { categoriesApi } from "@/lib/api";
import type { Category, CategoryKind } from "@/types";

export function useCategories(kind?: CategoryKind) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll();
      setAllCategories(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categories = kind
    ? allCategories.filter((c) => c.kind === kind)
    : allCategories;

  const incomeCategories = allCategories.filter((c) => c.kind === "INCOME");
  const expenseCategories = allCategories.filter((c) => c.kind === "EXPENSE");

  const addCategory = async (data: Omit<Category, "id" | "createdAt">) => {
    // Optimistic update: 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = crypto.randomUUID();
    const optimisticCategory: Category = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    setAllCategories((prev) => [...prev, optimisticCategory]);

    try {
      const created = await categoriesApi.create(data);
      // 임시 데이터를 실제 서버 응답으로 교체
      setAllCategories((prev) =>
        prev.map((c) => (c.id === tempId ? created : c))
      );
      setError(null);
    } catch (err) {
      // 실패 시 optimistic update 롤백
      setAllCategories((prev) => prev.filter((c) => c.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to add category");
      throw err;
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    // Optimistic update: 즉시 로컬 상태 업데이트
    const previousCategories = allCategories;
    setAllCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );

    try {
      const updated = await categoriesApi.update(id, data);
      // 실제 서버 응답으로 교체
      setAllCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setAllCategories(previousCategories);
      setError(
        err instanceof Error ? err.message : "Failed to update category"
      );
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    // Optimistic update: 즉시 로컬에서 제거
    const previousCategories = allCategories;
    setAllCategories((prev) => prev.filter((c) => c.id !== id));

    try {
      await categoriesApi.delete(id);
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setAllCategories(previousCategories);
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
      throw err;
    }
  };

  return {
    categories,
    allCategories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
