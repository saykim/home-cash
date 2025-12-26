import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Asset } from '@/types';

export function useAssets() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? [];

  const totalBalance = assets.reduce((sum, a) => sum + a.balance, 0);

  const addAsset = async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.assets.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  };

  const updateAsset = async (id: string, data: Partial<Asset>) => {
    await db.assets.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteAsset = async (id: string) => {
    await db.assets.delete(id);
  };

  const updateBalance = async (id: string, delta: number) => {
    const asset = await db.assets.get(id);
    if (asset) {
      await db.assets.update(id, {
        balance: asset.balance + delta,
        updatedAt: new Date().toISOString()
      });
    }
  };

  return {
    assets,
    totalBalance,
    addAsset,
    updateAsset,
    deleteAsset,
    updateBalance
  };
}
