import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface DashboardStats {
  activeTests: number;
  totalVisitors: number;
  averageConversionRate: number;
  totalRevenue: number;
  monthlyGrowth: {
    tests: number;
    visitors: number;
    conversionRate: number;
    revenue: number;
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    activeTests: 0,
    totalVisitors: 0,
    averageConversionRate: 0,
    totalRevenue: 0,
    monthlyGrowth: {
      tests: 0,
      visitors: 0,
      conversionRate: 0,
      revenue: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Get active tests count
      const { count: activeTests } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['running', 'paused']);

      // Get total visitors from all user's tests
      const { data: visitorData } = await supabase
        .from('test_sessions')
        .select('test_id, tests!inner(project_id, projects!inner(user_id))')
        .eq('tests.projects.user_id', user?.id);

      const totalVisitors = visitorData?.length || 0;

      // Get conversion data
      const { data: conversionData } = await supabase
        .from('conversions')
        .select('event_value, test_id, tests!inner(project_id, projects!inner(user_id))')
        .eq('tests.projects.user_id', user?.id);

      const totalConversions = conversionData?.length || 0;
      const averageConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
      
      const totalRevenue = conversionData?.reduce((sum, conversion) => {
        return sum + (Number(conversion.event_value) || 0);
      }, 0) || 0;

      // Mock monthly growth data (in a real app, you'd calculate this from historical data)
      const monthlyGrowth = {
        tests: Math.floor(Math.random() * 5) + 1,
        visitors: Math.floor(Math.random() * 20) + 5,
        conversionRate: Math.random() * 2,
        revenue: Math.floor(Math.random() * 15) + 3,
      };

      setStats({
        activeTests: activeTests || 0,
        totalVisitors,
        averageConversionRate: Number(averageConversionRate.toFixed(2)),
        totalRevenue,
        monthlyGrowth,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchDashboardStats,
  };
}