import { db } from 'src/core/db'

export const deleteReceiptMutation = async ({ id }: { id: string }): Promise<string> => {
  await db.receipts.delete(id)
  return id
}
