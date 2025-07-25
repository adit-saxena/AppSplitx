import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Test {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  traffic_allocation: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  project?: {
    name: string;
    domain: string;
  };
}

export interface TestStats {
  visitors: number;
  conversions: number;
  conversion_rate: number;
  improvement: number;
}

export function useTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tests')
        .select(`
          *,
          project:projects(name, domain)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async (testData: Omit<Test, 'id' | 'created_at' | 'updated_at' | 'project'>) => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .insert([testData])
        .select(`
          *,
          project:projects(name, domain)
        `)
        .single();

      if (error) throw error;
      setTests(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTestStatus = async (testId: string, status: Test['status']) => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .update({ status })
        .eq('id', testId)
        .select(`
          *,
          project:projects(name, domain)
        `)
        .single();

      if (error) throw error;
      setTests(prev => prev.map(test => test.id === testId ? data : test));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getTestStats = async (testId: string): Promise<TestStats> => {
    try {
      // Get total visitors
      const { count: visitors } = await supabase
        .from('test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId);

      // Get total conversions
      const { count: conversions } = await supabase
        .from('conversions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId);

      const conversion_rate = visitors ? (conversions || 0) / visitors * 100 : 0;
      
      // Calculate improvement (simplified - would need more complex logic for real A/B testing)
      const improvement = Math.random() * 25; // Mock improvement for demo

      return {
        visitors: visitors || 0,
        conversions: conversions || 0,
        conversion_rate: Number(conversion_rate.toFixed(2)),
        improvement: Number(improvement.toFixed(1)),
      };
    } catch (err: any) {
      console.error('Error fetching test stats:', err);
      return {
        visitors: 0,
        conversions: 0,
        conversion_rate: 0,
        improvement: 0,
      };
    }
  };

  return {
    tests,
    loading,
    error,
    createTest,
    updateTestStatus,
    getTestStats,
    refetch: fetchTests,
  };
}