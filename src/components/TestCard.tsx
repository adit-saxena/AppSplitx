import React from 'react';
import { useState, useEffect } from 'react';
import { Play, Pause, MoreHorizontal, TrendingUp } from 'lucide-react';
import { Test, useTests } from '../hooks/useTests';

interface TestCardProps {
  test: Test;
}

export function TestCard({ test }: TestCardProps) {
  const { getTestStats, updateTestStatus } = useTests();
  const [stats, setStats] = useState({
    visitors: 0,
    conversions: 0,
    conversion_rate: 0,
    improvement: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const testStats = await getTestStats(test.id);
        setStats(testStats);
      } catch (error) {
        console.error('Error fetching test stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [test.id, getTestStats]);

  const handleStatusToggle = async () => {
    try {
      const newStatus = test.status === 'running' ? 'paused' : 'running';
      await updateTestStatus(test.id, newStatus);
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const formatEndDate = (dateString?: string) => {
    if (!dateString) return 'No end date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    running: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{test.name}</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[test.status]}`}>
            {test.status}
          </span>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-lg font-semibold text-gray-900">
            {loading ? '...' : `${stats.conversion_rate}%`}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Visitors</p>
          <p className="text-lg font-semibold text-gray-900">
            {loading ? '...' : stats.visitors.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm font-medium text-green-600">
            {loading ? '...' : `+${stats.improvement}%`}
          </span>
          <span className="text-sm text-gray-500 ml-1">improvement</span>
        </div>
        <div className="flex items-center space-x-2">
          {test.status === 'running' ? (
            <button 
              onClick={handleStatusToggle}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : test.status === 'paused' ? (
            <button 
              onClick={handleStatusToggle}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {test.status === 'completed' ? 'Completed' : `Ends ${formatEndDate(test.end_date)}`}
        </p>
      </div>
    </div>
  );
}