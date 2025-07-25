import React from 'react';
import { Home, BarChart3, Target, Settings, Plus, Globe } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: Home, href: '#', current: true },
  { name: 'Tests', icon: Target, href: '#', current: false },
  { name: 'Analytics', icon: BarChart3, href: '#', current: false },
  { name: 'Websites', icon: Globe, href: '#', current: false },
  { name: 'Settings', icon: Settings, href: '#', current: false },
];

export function DashboardSidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center">
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </button>
      </div>

      <nav className="px-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}