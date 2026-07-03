import { Model } from '@nozbe/watermelondb';

export default class RecurringTemplate extends Model {
  static table = 'recurring_templates';

  get categoryId(): string { return this._getRaw('category_id') as string; }
  get type(): string { return this._getRaw('type') as string; }
  get amount(): number { return this._getRaw('amount') as number; }
  get dayOfMonth(): number { return this._getRaw('day_of_month') as number; }
  get notes(): string { return (this._getRaw('notes') as string) ?? ''; }
  get isActive(): boolean { return this._getRaw('is_active') as boolean; }
  get userId(): string { return this._getRaw('user_id') as string; }
  get isDeleted(): boolean { return this._getRaw('is_deleted') as boolean; }
  get createdAt(): number { return this._getRaw('created_at') as number; }
  get updatedAt(): number { return this._getRaw('updated_at') as number; }
}
