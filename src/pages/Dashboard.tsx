import React from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardStats } from '../components/DashboardStats';
import { TestCard } from '../components/TestCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useProjects } from '../hooks/useProjects';
import { useTests } from '../hooks/useTests';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { projects, loading: projectsLoading } = useProjects();
  const { tests, loading: testsLoading } = useTests();

  const isLoading = statsLoading || projectsLoading || testsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Dashboard Stats */}
            <DashboardStats stats={stats} />

            {/* Recent Tests */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Tests</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Create New Test
                </button>
              </div>
              
              {tests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500 mb-4">No tests found. Create your first A/B test to get started.</p>
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                    Create Your First Test
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tests.map((test) => (
                    <TestCard key={test.id} test={test} />
                  ))}
                </div>
              )}
            </div>

            {/* Projects Overview */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
                <button className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                  Add Project
                </button>
              </div>
              
              {projects.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500 mb-4">No projects found. Add your first website to start testing.</p>
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                    Add Your First Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{project.domain}</p>
                      {project.description && (
                        <p className="text-sm text-gray-500 mb-4">{project.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                          View Tests
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};