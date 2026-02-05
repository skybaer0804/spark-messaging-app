import { useState, useEffect } from 'preact/hooks';
import { getLocalStorage, setLocalStorage } from '@/core/utils/storageCache';

const STORAGE_KEY = 'frequent-emojis';
const MAX_FREQUENT = 20;

export function useFrequentEmojis() {
  const [frequent, setFrequent] = useState<string[]>([]);
  
  useEffect(() => {
    const stored = getLocalStorage(STORAGE_KEY);
    if (stored) {
      try {
        setFrequent(JSON.parse(stored));
      } catch {
        setFrequent([]);
      }
    }
  }, []);
  
  const addFrequent = (emoji: string) => {
    setFrequent(prev => {
      const filtered = prev.filter(e => e !== emoji);
      const updated = [emoji, ...filtered].slice(0, MAX_FREQUENT);
      setLocalStorage(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  
  return { frequent, addFrequent };
}
