// src/components/DashboardSidebar.tsx

import { Link } from 'react-router-dom';
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
    <div className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-6 pb-6 pt-4">
        <Link to="/experiments/new" className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 flex items-center justify-center shadow-lg shadow-black/5 hover:scale-[1.02]">
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Link>
      </div>

      <nav className="px-6">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${item.current
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${item.current ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}