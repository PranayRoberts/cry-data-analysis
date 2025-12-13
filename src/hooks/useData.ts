import { useState, useEffect } from 'react';

interface UseDataProps {
  dataPath: string;
}

export function useData({ dataPath }: UseDataProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(dataPath);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        const jsonData = await response.json();
        
        // Validate JSON data
        if (!jsonData || typeof jsonData !== 'object') {
          throw new Error('Invalid data format received');
        }
        
        setData(jsonData);
      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error loading data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (dataPath) {
      fetchData();
    }
  }, [dataPath]);

  return { data, loading, error };
}
