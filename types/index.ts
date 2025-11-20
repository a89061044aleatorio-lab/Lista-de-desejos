export interface User {
  id: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  userId: string;
  listId: string;
  completed: boolean;
  link: string | null;        // Alterado de ? (undefined) para string | null
  observation: string | null; // Alterado de ? (undefined) para string | null
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  userId: string;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  listId: string;
  timestamp: string;
  userEmail: string;
}

export interface CategoryStats {
  categoryId: string;
  total: number;
  paid: number;
  pending: number;
}