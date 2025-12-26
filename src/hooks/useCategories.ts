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
    try {
      await categoriesApi.create(data);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
      throw err;
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      await categoriesApi.update(id, data);
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category"
      );
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      await fetchCategories();
    } catch (err) {
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
