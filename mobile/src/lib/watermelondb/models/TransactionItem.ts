import { Model } from '@nozbe/watermelondb';

export default class TransactionItem extends Model {
  static table = 'transaction_items';

  get transactionId(): string { return this._getRaw('transaction_id') as string; }
  get name(): string { return this._getRaw('name') as string; }
  get amount(): number { return this._getRaw('amount') as number; }
  get quantity(): number { return this._getRaw('quantity') as number; }
  get isDeleted(): boolean { return this._getRaw('is_deleted') as boolean; }
  get createdAt(): Date { return new Date(this._getRaw('created_at') as number); }
  get updatedAt(): Date { return new Date(this._getRaw('updated_at') as number); }
}
