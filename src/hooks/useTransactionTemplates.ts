import { useState, useEffect, useCallback } from "react";
import { transactionTemplatesApi } from "@/lib/api";
import type { TransactionTemplate, TransactionType } from "@/types";

export function useTransactionTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionTemplatesApi.getAll();
      // Convert decimal strings to numbers
      const normalized = data.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
      }));
      setTemplates(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = async (
    data: Omit<TransactionTemplate, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const result = await transactionTemplatesApi.create(data);
      await fetchTemplates();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add template");
      throw err;
    }
  };

  const updateTemplate = async (
    id: string,
    data: Partial<Omit<TransactionTemplate, "id" | "createdAt" | "updatedAt">>
  ) => {
    try {
      await transactionTemplatesApi.update(id, data);
      await fetchTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update template"
      );
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await transactionTemplatesApi.delete(id);
      await fetchTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete template"
      );
      throw err;
    }
  };

  const getTemplatesByType = (type: TransactionType) => {
    return templates.filter((t) => t.type === type);
  };

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByType,
    refetch: fetchTemplates,
  };
}
