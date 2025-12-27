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
    // Optimistic update: 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticTemplate: TransactionTemplate = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    setTemplates((prev) => [...prev, optimisticTemplate]);

    try {
      const result = await transactionTemplatesApi.create(data);
      // 임시 데이터를 실제 서버 응답으로 교체
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === tempId ? { ...result, amount: Number(result.amount) } : t
        )
      );
      setError(null);
      return result;
    } catch (err) {
      // 실패 시 optimistic update 롤백
      setTemplates((prev) => prev.filter((t) => t.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to add template");
      throw err;
    }
  };

  const updateTemplate = async (
    id: string,
    data: Partial<Omit<TransactionTemplate, "id" | "createdAt" | "updatedAt">>
  ) => {
    // Optimistic update: 즉시 로컬 상태 업데이트
    const previousTemplates = templates;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      )
    );

    try {
      const updated = await transactionTemplatesApi.update(id, data);
      // 실제 서버 응답으로 교체
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...updated, amount: Number(updated.amount) } : t
        )
      );
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setTemplates(previousTemplates);
      setError(
        err instanceof Error ? err.message : "Failed to update template"
      );
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    // Optimistic update: 즉시 로컬에서 제거
    const previousTemplates = templates;
    setTemplates((prev) => prev.filter((t) => t.id !== id));

    try {
      await transactionTemplatesApi.delete(id);
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setTemplates(previousTemplates);
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
