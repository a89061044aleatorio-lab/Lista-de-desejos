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
  price: number; // Garantindo que é sempre number
  categoryId: string;
  userId: string;
  listId: string;
  completed: boolean;
  link?: string;
  observation?: string;
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