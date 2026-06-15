import { Model } from '@nozbe/watermelondb';

export default class Budget extends Model {
  static table = 'budgets';

  get categoryId(): string { return this._getRaw('category_id') as string; }
  get amount(): number { return this._getRaw('amount') as number; }
  get userId(): string { return this._getRaw('user_id') as string; }
  get isDeleted(): boolean { return this._getRaw('is_deleted') as boolean; }
  get createdAt(): number { return this._getRaw('created_at') as number; }
  get updatedAt(): number { return this._getRaw('updated_at') as number; }
}
