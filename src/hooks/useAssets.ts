import { useState, useEffect, useCallback } from "react";
import { assetsApi } from "@/lib/api";
import type { Asset } from "@/types";

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await assetsApi.getAll();
      // Convert decimal strings to numbers
      const normalized = data.map((a: any) => ({
        ...a,
        balance: Number(a.balance),
        initialBalance: Number(a.initialBalance),
      }));
      setAssets(normalized);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const totalBalance = assets.reduce((sum, a) => sum + a.balance, 0);

  const addAsset = async (
    data: Omit<Asset, "id" | "createdAt" | "updatedAt">
  ) => {
    // Optimistic update: 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticAsset: Asset = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    setAssets((prev) => [...prev, optimisticAsset]);

    try {
      const created = await assetsApi.create(data);
      // 임시 데이터를 실제 서버 응답으로 교체
      setAssets((prev) =>
        prev.map((a) =>
          a.id === tempId
            ? {
                ...created,
                balance: Number(created.balance),
                initialBalance: Number(created.initialBalance),
              }
            : a
        )
      );
      setError(null);
    } catch (err) {
      // 실패 시 optimistic update 롤백
      setAssets((prev) => prev.filter((a) => a.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to add asset");
      throw err;
    }
  };

  const updateAsset = async (id: string, data: Partial<Asset>) => {
    // Optimistic update: 즉시 로컬 상태 업데이트
    const previousAssets = assets;
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      )
    );

    try {
      const updated = await assetsApi.update(id, data);
      // 실제 서버 응답으로 교체
      setAssets((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...updated,
                balance: Number(updated.balance),
                initialBalance: Number(updated.initialBalance),
              }
            : a
        )
      );
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setAssets(previousAssets);
      setError(err instanceof Error ? err.message : "Failed to update asset");
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    // Optimistic update: 즉시 로컬에서 제거
    const previousAssets = assets;
    setAssets((prev) => prev.filter((a) => a.id !== id));

    try {
      await assetsApi.delete(id);
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setAssets(previousAssets);
      setError(err instanceof Error ? err.message : "Failed to delete asset");
      throw err;
    }
  };

  const updateBalance = async (id: string, delta: number) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      await updateAsset(id, { balance: asset.balance + delta });
    }
  };

  return {
    assets,
    totalBalance,
    loading,
    error,
    addAsset,
    updateAsset,
    deleteAsset,
    updateBalance,
    refetch: fetchAssets,
  };
}
