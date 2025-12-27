import { useState, useEffect, useCallback } from "react";
import { annualEventsApi } from "@/lib/api";
import type { AnnualEvent } from "@/types";

export function useAnnualEvents() {
  const [allAnnualEvents, setAllAnnualEvents] = useState<AnnualEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnualEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await annualEventsApi.getAll();
      // Convert decimal strings to numbers
      const normalized = data.map((e: any) => ({
        ...e,
        amount: e.amount ? Number(e.amount) : undefined,
      }));
      setAllAnnualEvents(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch annual events"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnualEvents();
  }, [fetchAnnualEvents]);

  // Only return active events by default
  const annualEvents = allAnnualEvents.filter((e) => e.isActive);

  const addAnnualEvent = async (
    data: Omit<AnnualEvent, "id" | "createdAt" | "updatedAt">
  ) => {
    // Optimistic update: 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticEvent: AnnualEvent = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    setAllAnnualEvents((prev) => [...prev, optimisticEvent]);

    try {
      const result = await annualEventsApi.create(data);
      // 임시 데이터를 실제 서버 응답으로 교체
      setAllAnnualEvents((prev) =>
        prev.map((e) =>
          e.id === tempId
            ? {
                ...result,
                amount: result.amount ? Number(result.amount) : undefined,
              }
            : e
        )
      );
      setError(null);
      return result;
    } catch (err) {
      // 실패 시 optimistic update 롤백
      setAllAnnualEvents((prev) => prev.filter((e) => e.id !== tempId));
      setError(
        err instanceof Error ? err.message : "Failed to add annual event"
      );
      throw err;
    }
  };

  const updateAnnualEvent = async (id: string, data: Partial<AnnualEvent>) => {
    // Optimistic update: 즉시 로컬 상태 업데이트
    const previousEvents = allAnnualEvents;
    setAllAnnualEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      )
    );

    try {
      const updated = await annualEventsApi.update(id, data);
      // 실제 서버 응답으로 교체
      setAllAnnualEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...updated,
                amount: updated.amount ? Number(updated.amount) : undefined,
              }
            : e
        )
      );
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setAllAnnualEvents(previousEvents);
      setError(
        err instanceof Error ? err.message : "Failed to update annual event"
      );
      throw err;
    }
  };

  const deleteAnnualEvent = async (id: string) => {
    // Optimistic update: 즉시 로컬에서 제거
    const previousEvents = allAnnualEvents;
    setAllAnnualEvents((prev) => prev.filter((e) => e.id !== id));

    try {
      await annualEventsApi.delete(id);
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setAllAnnualEvents(previousEvents);
      setError(
        err instanceof Error ? err.message : "Failed to delete annual event"
      );
      throw err;
    }
  };

  const toggleActiveStatus = async (id: string) => {
    const event = allAnnualEvents.find((e) => e.id === id);
    if (event) {
      await updateAnnualEvent(id, { isActive: !event.isActive });
    }
  };

  return {
    annualEvents,
    allAnnualEvents,
    loading,
    error,
    addAnnualEvent,
    updateAnnualEvent,
    deleteAnnualEvent,
    toggleActiveStatus,
    refetch: fetchAnnualEvents,
  };
}
