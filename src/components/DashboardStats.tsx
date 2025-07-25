import React from 'react';
import { TrendingUp, Target, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '../hooks/useDashboardStats';

interface DashboardStatsProps {
  stats: DashboardStatsType;
  loading: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const statsData = [
    {
      name: 'Active Tests',
      value: loading ? '...' : stats.activeTests.toString(),
      change: loading ? '...' : `+${stats.monthlyGrowth.tests}`,
      changeType: 'increase' as const,
      icon: Target,
    },
    {
      name: 'Conversion Rate',
      value: loading ? '...' : `${stats.averageConversionRate}%`,
      change: loading ? '...' : `+${stats.monthlyGrowth.conversionRate.toFixed(2)}%`,
      changeType: 'increase' as const,
      icon: TrendingUp,
    },
    {
      name: 'Monthly Visitors',
      value: loading ? '...' : formatNumber(stats.totalVisitors),
      change: loading ? '...' : `+${stats.monthlyGrowth.visitors}%`,
      changeType: 'increase' as const,
      icon: Users,
    },
    {
      name: 'Revenue Impact',
      value: loading ? '...' : formatCurrency(stats.totalRevenue),
      change: loading ? '...' : `+${stats.monthlyGrowth.revenue}%`,
      changeType: 'increase' as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => (
        <div key={stat.name} className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <stat.icon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {stat.changeType === 'increase' ? (
              <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}