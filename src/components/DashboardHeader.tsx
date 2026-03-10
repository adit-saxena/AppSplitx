// src/components/DashboardHeader.tsx

import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, User, LogOut, ChevronDown, Check, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();

  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left Side: Logo & Project Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <img src="/logo.png" alt="SplitX" className="w-8 h-8" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900 hidden md:block">SplitX AI</h1>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          {/* Project Switcher */}
          <div className="relative" ref={projectDropdownRef}>
            <button
              onClick={() => setIsProjectOpen(!isProjectOpen)}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-black transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm w-48 justify-between"
            >
              <span className="truncate">{activeProject ? activeProject.name : 'Select Project'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProjectOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProjectOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Projects
                </div>
                {projects.length > 0 ? (
                  projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setIsProjectOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black flex items-center justify-between group"
                    >
                      <span className="truncate">{project.name}</span>
                      {selectedProjectId === project.id && <Check className="w-4 h-4 text-black" />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-400">No projects found</div>
                )}
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => navigate('/onboarding')} // Assuming onboarding is where you create projects
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          <div className="relative ml-2" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border border-gray-200 hover:ring-2 hover:ring-black/5 transition-all"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-gray-400" />
                    Account
                  </button>
                </div>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}