import { Model } from '@nozbe/watermelondb';

export default class Category extends Model {
  static table = 'categories';

  get name(): string { return this._getRaw('name') as string; }
  get icon(): string { return this._getRaw('icon') as string; }
  get color(): string { return this._getRaw('color') as string; }
  get type(): string { return this._getRaw('type') as string; }
  get isDefault(): boolean { return this._getRaw('is_default') as boolean; }
  get userId(): string { return this._getRaw('user_id') as string; }
  get isDeleted(): boolean { return this._getRaw('is_deleted') as boolean; }
  get createdAt(): Date { return new Date(this._getRaw('created_at') as number); }
  get updatedAt(): Date { return new Date(this._getRaw('updated_at') as number); }
}
