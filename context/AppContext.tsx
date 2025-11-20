import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Category, Item, ShoppingList, Message, CategoryStats } from '../types';
import { supabase } from '../supabaseClient';

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (userData: any) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  categories: Category[];
  addCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  archiveCategory: (categoryId: string) => void;
  updateCategory: (categoryId: string, name: string) => void;
  items: Item[];
  addItem: (name: string, price: number, categoryId: string, link?: string, observation?: string) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;
  toggleItemCompleted: (itemId: string) => void;
  currentList: ShoppingList | null;
  messages: Message[];
  addMessage: (text: string) => void;
  categoryStats: Record<string, CategoryStats>;
  grandTotal: number;
  grandTotalPaid: number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  
  // Estados derivados (calculados automaticamente)
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandTotalPaid, setGrandTotalPaid] = useState(0);

  // Função PURA para calcular estatísticas locais
  const calculateLocalStats = (currentItems: Item[]) => {
    const stats: Record<string, CategoryStats> = {};
    let total = 0;
    let totalPaid = 0;
    
    currentItems.forEach(item => {
      // Garante conversão numérica
      const price = Number(item.price) || 0;
      
      // Totais Globais
      total += price;
      if (item.completed) {
        totalPaid += price;
      }

      // Totais por Categoria
      if (!stats[item.categoryId]) {
        stats[item.categoryId] = {
          categoryId: item.categoryId,
          total: 0,
          paid: 0,
          pending: 0
        };
      }
      
      stats[item.categoryId].total += price;
      
      if (item.completed) {
        stats[item.categoryId].paid += price;
      } else {
        stats[item.categoryId].pending += price;
      }
    });
    
    return { stats, total, totalPaid };
  };

  // Recalcula tudo sempre que 'items' mudar
  useEffect(() => {
    const { stats, total, totalPaid } = calculateLocalStats(items);
    setCategoryStats(stats);
    setGrandTotal(total);
    setGrandTotalPaid(totalPaid);
  }, [items]);

  // Verificar sessão ativa ao iniciar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        setLoading(false);
      } else {
        setUser(null);
        setCategories([]);
        setItems([]);
        setMessages([]);
        setCategoryStats({});
        setGrandTotal(0);
        setGrandTotalPaid(0);
        setCurrentList(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados quando o usuário logar
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // 1. Buscar ou Criar Lista
        let listId = null;
        const { data: lists } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(1);

        if (lists && lists.length > 0) {
          setCurrentList(lists[0]);
          listId = lists[0].id;
        } else {
          // Criar primeira lista
          const newList = {
            name: 'Minha Lista de Compras',
            userId: user.id,
            createdAt: new Date().toISOString()
          };
          const { data: createdList } = await supabase
            .from('shopping_lists')
            .insert([newList])
            .select()
            .single();
          
          if (createdList) {
            setCurrentList(createdList);
            listId = createdList.id;
          }
        }

        // 2. Buscar Categorias
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('userId', user.id);
        if (cats) setCategories(cats);

        // 3. Buscar Itens e Mensagens se tiver lista
        if (listId) {
          const { data: listItems } = await supabase
            .from('items')
            .select('*')
            .eq('listId', listId);
          
          if (listItems) {
              // Sanitização crítica: garante que string vire number
              const sanitizedItems = listItems.map(item => ({
                  ...item,
                  price: Number(item.price)
              }));
              setItems(sanitizedItems);
          }

          const { data: listMsgs } = await supabase
            .from('messages')
            .select('*')
            .eq('listId', listId)
            .order('timestamp', { ascending: true });
          if (listMsgs) setMessages(listMsgs);
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, [user]);

  const login = async (userData: any) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password,
    });
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (userData: any) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  const resetPassword = async (email: string) => {
    const redirectTo = window.location.origin + '/#/update-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
    if (error) {
      console.error('Erro ao resetar senha:', error);
      return false;
    }
    return true;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return false;
    }
    return true;
  };
  
  const addCategory = async (name: string) => {
    if (!user) return;
    const newCategory = {
      name,
      userId: user.id
    };
    const { data, error } = await supabase.from('categories').insert([newCategory]).select().single();
    if (data && !error) {
      setCategories(prev => [...prev, data]);
    }
  };

  const updateCategory = async (categoryId: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name } : c));
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', categoryId);
    if (error) console.error("Erro ao atualizar categoria:", error);
  };

  const archiveCategory = async (categoryId: string) => {
      if (!user) return;
      deleteCategory(categoryId);
  };

  const deleteCategory = async (categoryId: string) => {
      if (!user) return;
      
      try {
          // Tenta deletar direto (confiando no ON DELETE CASCADE do banco)
          const { error: catError } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

          if (catError) {
               // Fallback: Se falhar, tenta deletar itens manualmente
              const { error: itemsError } = await supabase
                  .from('items')
                  .delete()
                  .eq('categoryId', categoryId);
              
              if (itemsError) {
                  alert("Erro ao limpar itens: " + itemsError.message);
                  return;
              }
              
              const { error: catRetryError } = await supabase
                  .from('categories')
                  .delete()
                  .eq('id', categoryId);
                  
              if (catRetryError) {
                  alert("Erro ao excluir categoria: " + catRetryError.message);
                  return;
              }
          }

          // Atualiza UI
          setCategories(prev => prev.filter(c => c.id !== categoryId));
          setItems(prev => prev.filter(i => i.categoryId !== categoryId));

      } catch (error: any) {
          console.error("Erro inesperado:", error);
      }
  };
  
  const addItem = async (name: string, price: number, categoryId: string, link?: string, observation?: string) => {
      if(!user || !currentList) return;
      
      // Garante que price é um número
      const numericPrice = Number(price);

      const newItem = {
          name,
          price: numericPrice,
          categoryId,
          userId: user.id,
          listId: currentList.id,
          completed: false,
          link: link || null,
          observation: observation || null
      };
      
      // Optimistic UI: Adiciona temporariamente com ID temporário
      const tempId = `temp-${Date.now()}`;
      setItems(prev => [...prev, { ...newItem, id: tempId }]);
      
      const { data, error } = await supabase.from('items').insert([newItem]).select().single();
      
      if (data && !error) {
        // Substitui o item temporário pelo real do banco e garante que o preço seja número
        setItems(prev => prev.map(i => i.id === tempId ? { ...data, price: Number(data.price) } : i));
      } else if (error) {
          console.error("Erro ao adicionar item:", error);
          // Reverte em caso de erro
          setItems(prev => prev.filter(i => i.id !== tempId));
      }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
      // Garante que, se houver atualização de preço, ele seja numérico na UI otimista
      const cleanUpdates = { ...updates };
      if (cleanUpdates.price !== undefined) {
          cleanUpdates.price = Number(cleanUpdates.price);
      }

      setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...cleanUpdates } : item));
      
      const { error } = await supabase.from('items').update(cleanUpdates).eq('id', itemId);
      if (error) console.error("Erro ao atualizar item:", error);
  };

  const deleteItem = async (itemId: string) => {
      setItems(prev => prev.filter(i => i.id !== itemId));
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) console.error("Erro ao deletar item:", error);
  };

  const toggleItemCompleted = async (itemId: string) => {
      const itemToUpdate = items.find(i => i.id === itemId);
      if (itemToUpdate) {
          const updatedStatus = !itemToUpdate.completed;
          setItems(prev => prev.map(item => item.id === itemId ? { ...item, completed: updatedStatus } : item));
          await supabase.from('items').update({ completed: updatedStatus }).eq('id', itemId);
      }
  }

  const addMessage = async (text: string) => {
      if(!user || !currentList) return;
      const newMessage = {
          text,
          userId: user.id,
          listId: currentList.id,
          timestamp: new Date().toISOString(),
          userEmail: user.email,
      };
      const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
      if (data && !error) {
        setMessages(prev => [...prev, data]);
      }
  }

  return (
    <AppContext.Provider value={{ 
        user, loading, login, logout, register, resetPassword, updatePassword,
        categories, addCategory, deleteCategory, archiveCategory, updateCategory,
        items, addItem, updateItem, deleteItem, toggleItemCompleted, 
        currentList, messages, addMessage, categoryStats,
        grandTotal, grandTotalPaid
    }}>
      {children}
    </AppContext.Provider>
  );
};