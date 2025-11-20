import Dexie, { type Table } from 'dexie';
import { User, Category, Item, ShoppingList, Message } from './types';

export class ShoppingListDB extends Dexie {
  users!: Table<User>;
  categories!: Table<Category>;
  items!: Table<Item>;
  shoppingLists!: Table<ShoppingList>;
  messages!: Table<Message>;

  constructor() {
    super('ShoppingListDB');
    // Fix: Cast this to any because TS is failing to recognize inherited version method
    (this as any).version(1).stores({
      users: 'id, email', // Primary key and indexed props
      categories: 'id, userId',
      items: 'id, categoryId, userId, listId',
      shoppingLists: 'id, userId',
      messages: 'id, listId, userId'
    });
  }
}

export const db = new ShoppingListDB();