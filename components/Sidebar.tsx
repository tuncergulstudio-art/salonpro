import React from 'react';
import { LayoutDashboard, CalendarDays, Users, Settings, Scissors, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Panel', active: true },
    { icon: CalendarDays, label: 'Takvim', active: false },
    { icon: Users, label: 'Müşteriler', active: false },
    { icon: Scissors, label: 'Hizmetler', active: false },
    { icon: Settings, label: 'Ayarlar', active: false },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-950 border-r border-slate-900 fixed left-0 top-0 z-30">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Salon<span className="text-violet-500">Pro</span></h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${item.active 
                ? 'bg-slate-900 text-white shadow-inner border border-slate-800' 
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}
            `}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-violet-500' : 'text-slate-500 group-hover:text-violet-400'}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-900">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-950/20">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};