import React from 'react';
import { Home, Plus, Map, User, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../App';
import { translations, Language } from './translations';

interface BottomNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  language: Language;
}

export function BottomNavigation({ currentScreen, onScreenChange, language }: BottomNavigationProps) {
  const t = translations[language];

  const navItems = [
    { id: 'home' as Screen, icon: Home, label: t.home },
    { id: 'map' as Screen, icon: Map, label: t.map },
    {
      id: 'report' as Screen, icon: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      ), label: t.report
    },
    { id: 'analytics' as Screen, icon: BarChart3, label: t.analyticsDashboard },
    { id: 'profile' as Screen, icon: User, label: t.profile },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 w-full bg-white px-2 py-3 z-[9999] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon as any;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              className={`flex items-center gap-2 py-2 px-3 transition-colors ${isActive ? 'text-[#059669]' : 'text-[#94a3b8]'
                }`}
              onClick={() => onScreenChange(item.id)}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className={`text-[12px] font-bold ${isActive ? 'inline' : 'hidden md:inline'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}