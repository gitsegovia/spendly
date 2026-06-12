import { Model } from '@nozbe/watermelondb';

export default class Transaction extends Model {
  static table = 'transactions';

  get categoryId(): string { return this._getRaw('category_id') as string; }
  get type(): string { return this._getRaw('type') as string; }
  get amount(): number { return this._getRaw('amount') as number; }
  get date(): string { return this._getRaw('date') as string; }
  get notes(): string { return (this._getRaw('notes') as string) ?? ''; }
  get userId(): string { return this._getRaw('user_id') as string; }
  get isDeleted(): boolean { return this._getRaw('is_deleted') as boolean; }
  get createdAt(): Date { return new Date(this._getRaw('created_at') as number); }
  get updatedAt(): Date { return new Date(this._getRaw('updated_at') as number); }
}
