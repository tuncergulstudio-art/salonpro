'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { Plus, Search, Bell, TrendingUp, Calendar, Users, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Appointment, DashboardStats } from '../types';

// Kart Bileşeni
const StatCard: React.FC<{ title: string; value: string; subValue: string; icon: any; color: string }> = ({ 
  title, value, subValue, icon: Icon, color 
}) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-slate-950 ${color.replace('text-', 'text-opacity-80 ')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500">{subValue}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    totalRevenue: 0,
    activeStaff: 0,
    occupancyRate: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Randevuları çek (bugün için)
      const { data: appts, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(full_name),
          profile:profiles(full_name)
        `)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const appointmentList = appts as Appointment[] || [];
      setRecentAppointments(appointmentList);

      // İstatistik Hesapla
      const revenue = appointmentList.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
      
      setStats({
        totalAppointments: appointmentList.length,
        totalRevenue: revenue,
        activeStaff: new Set(appointmentList.map(a => a.profile_id)).size,
        occupancyRate: Math.min(Math.round((appointmentList.length / 20) * 100), 100) // Basit bir doluluk hesabı
      });

    } catch (error) {
      console.error("Dashboard veri hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-violet-500/30">
      <Sidebar />
      
      <main className="md:ml-64 min-h-screen p-4 md:p-8">
        {/* Topbar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Genel Bakış</h2>
            <p className="text-slate-400 text-sm mt-1">Hoşgeldiniz, bugün salonunuz oldukça yoğun.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 w-64">
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="Randevu veya müşteri ara..." 
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
              />
            </div>
            
            <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-violet-900/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Randevu</span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Günlük Ciro" 
            value={`${stats.totalRevenue.toLocaleString('tr-TR')} ₺`} 
            subValue="Düne göre +%12" 
            icon={DollarSign}
            color="text-emerald-500"
          />
          <StatCard 
            title="Randevular" 
            value={stats.totalAppointments.toString()} 
            subValue="4 iptal, 2 bekleyen" 
            icon={Calendar}
            color="text-blue-500"
          />
          <StatCard 
            title="Aktif Personel" 
            value={stats.activeStaff.toString()} 
            subValue="Toplam 8 personel" 
            icon={Users}
            color="text-violet-500"
          />
          <StatCard 
            title="Doluluk Oranı" 
            value={`%${stats.occupancyRate}`} 
            subValue="Öğleden sonra yoğun" 
            icon={TrendingUp}
            color="text-amber-500"
          />
        </div>

        {/* Calendar / Schedule Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Bugünün Programı</h3>
            <div className="flex gap-2">
                <select className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-violet-600">
                    <option>Tüm Personel</option>
                </select>
            </div>
          </div>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                Yükleniyor...
             </div>
          ) : recentAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
              <Calendar className="w-10 h-10 mb-2 opacity-50" />
              <p>Bugün için henüz randevu yok.</p>
              <button onClick={() => setIsModalOpen(true)} className="text-violet-500 hover:underline mt-2 text-sm">Hemen oluştur</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-800">
                    <th className="font-medium p-4">Saat</th>
                    <th className="font-medium p-4">Müşteri</th>
                    <th className="font-medium p-4">Personel</th>
                    <th className="font-medium p-4">Tutar</th>
                    <th className="font-medium p-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentAppointments.map((appt) => {
                    const start = new Date(appt.start_time).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                    const end = new Date(appt.end_time).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                    
                    return (
                      <tr key={appt.id} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4">
                            <span className="font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs">
                                {start} - {end}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="font-medium text-white">{appt.client?.full_name || 'Misafir'}</div>
                            <div className="text-xs text-slate-500">Yeni Müşteri</div>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-violet-900/50 flex items-center justify-center text-xs text-violet-300 font-bold">
                                    {appt.profile?.full_name?.charAt(0) || 'P'}
                                </div>
                                <span className="text-sm text-slate-300">{appt.profile?.full_name || 'Atanmamış'}</span>
                            </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-200">
                            {appt.total_price} ₺
                        </td>
                        <td className="p-4">
                           <span className={`
                             px-2.5 py-1 rounded-full text-xs font-medium border
                             ${appt.status === 'confirmed' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 
                               appt.status === 'pending' ? 'bg-amber-950/30 text-amber-400 border-amber-900/50' : 
                               'bg-slate-800 text-slate-400 border-slate-700'}
                           `}>
                             {appt.status === 'confirmed' ? 'Onaylandı' : appt.status === 'pending' ? 'Bekliyor' : appt.status}
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <NewAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}