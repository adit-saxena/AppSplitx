// src/pages/Dashboard.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardStats } from '../components/DashboardStats';
import { TestCard } from '../components/TestCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useProjects } from '../hooks/useProjects';
import { useTests } from '../hooks/useTests';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Zap } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { projects, loading: projectsLoading } = useProjects();
  const { tests, loading: testsLoading } = useTests();

  const isLoading = statsLoading || projectsLoading || testsLoading;

  useEffect(() => {
    if (!projectsLoading && projects.length === 0) {
      navigate('/onboarding');
    }
  }, [projectsLoading, projects, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Column 1: Sidebar */}
      <DashboardSidebar />
      {/* Column 2: Header + scrollable content stacked vertically */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Dashboard Stats */}
              <DashboardStats stats={stats} loading={statsLoading} />

              {/* System Suggestions Panel */}
              <div className="mb-8 mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Opportunities</h2>
                <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-start md:items-center mb-4 md:mb-0">
                    <div className="p-3 bg-blue-50 rounded-xl mr-4">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-medium">Optimize Pricing Page CTA</h3>
                      <p className="text-sm text-gray-500">Potential to increase conversions by ~12% based on traffic patterns.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/experiments/new')}
                    className="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-black/5"
                  >
                    Start Experiment
                  </button>
                </div>
              </div>

              {/* Recent Tests */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Live Experiments</h2>
                  <button
                    onClick={() => navigate('/experiments/new')}
                    className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-black transition-colors text-sm font-medium"
                  >
                    Create New Test
                  </button>
                </div>

                {tests.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active experiments</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">You haven't launched any experiments yet. Start optimizing your website today.</p>
                    <button
                      onClick={() => navigate('/experiments/new')}
                      className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Create Your First Test
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests.map((test) => (
                      <div key={test.id} onClick={() => navigate(`/experiments/${test.id}`)} className="cursor-pointer">
                        <TestCard test={test} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projects Overview - Simplified for MVP */}
              {projects.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div key={project.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{project.domain}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                          <span className="text-blue-600">{project.goal_type?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};