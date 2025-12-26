import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { AnnualEvent } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useAnnualEvents() {
  // Get all active annual events
  const annualEvents = useLiveQuery(
    () => db.annualEvents
      .filter(e => e.isActive)
      .toArray(),
    []
  ) ?? [];

  const addAnnualEvent = async (data: Omit<AnnualEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEvent: AnnualEvent = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    await db.annualEvents.add(newEvent);
    return newEvent;
  };

  const updateAnnualEvent = async (id: string, data: Partial<AnnualEvent>) => {
    await db.annualEvents.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteAnnualEvent = async (id: string) => {
    await db.annualEvents.delete(id);
  };

  const toggleActiveStatus = async (id: string) => {
    const event = await db.annualEvents.get(id);
    if (event) {
      await updateAnnualEvent(id, { isActive: !event.isActive });
    }
  };

  return {
    annualEvents,
    addAnnualEvent,
    updateAnnualEvent,
    deleteAnnualEvent,
    toggleActiveStatus
  };
}
