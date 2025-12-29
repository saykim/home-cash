import { useState, useCallback } from "react";
import { assetBalanceHistoryApi } from "@/lib/api";
import type { AssetBalanceHistory } from "@/types";

export function useAssetBalanceHistory(assetId: string | null) {
  const [history, setHistory] = useState<AssetBalanceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!assetId) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      const data = await assetBalanceHistoryApi.getByAssetId(assetId);
      // Convert decimal strings to numbers
      const normalized = data.map((h: any) => ({
        ...h,
        previousBalance: Number(h.previousBalance),
        newBalance: Number(h.newBalance),
      }));
      setHistory(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch asset balance history"
      );
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  return {
    history,
    loading,
    error,
    fetchHistory,
  };
}
