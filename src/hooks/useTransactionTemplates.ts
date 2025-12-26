import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { TransactionTemplate, TransactionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useTransactionTemplates() {
  const templates = useLiveQuery(
    () => db.transactionTemplates.orderBy('createdAt').reverse().toArray()
  ) || [];

  const addTemplate = async (data: Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();

    const newTemplate: TransactionTemplate = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };

    await db.transactionTemplates.add(newTemplate);
    return newTemplate;
  };

  const updateTemplate = async (id: string, data: Partial<Omit<TransactionTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await db.transactionTemplates.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteTemplate = async (id: string) => {
    await db.transactionTemplates.delete(id);
  };

  const getTemplatesByType = (type: TransactionType) => {
    return templates.filter((t) => t.type === type);
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByType
  };
}
