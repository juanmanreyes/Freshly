import { useState, useEffect } from 'react';
import { FoodItem } from '../services/geminiService';

export function useInventory() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: FoodItem) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const removeItem = async (id: number) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) fetchItems();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return { items, loading, addItem, removeItem, refresh: fetchItems };
}
