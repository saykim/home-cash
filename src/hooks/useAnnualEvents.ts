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
    try {
      const result = await annualEventsApi.create(data);
      await fetchAnnualEvents();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add annual event"
      );
      throw err;
    }
  };

  const updateAnnualEvent = async (id: string, data: Partial<AnnualEvent>) => {
    try {
      await annualEventsApi.update(id, data);
      await fetchAnnualEvents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update annual event"
      );
      throw err;
    }
  };

  const deleteAnnualEvent = async (id: string) => {
    try {
      await annualEventsApi.delete(id);
      await fetchAnnualEvents();
    } catch (err) {
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
