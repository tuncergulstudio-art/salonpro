'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Plus, Clock, User, Scissors, MoreVertical, X, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: appData } = await supabase
        .from('appointments')
        .select(`*, clients ( full_name ), staff ( full_name ), services ( name, duration, price )`)
        .order('appointment_date', { ascending: true });
      if (appData) setAppointments(appData);
      const { data: c } = await supabase.from('clients').select('*');
      const { data: s } = await supabase.from('staff').select('*');
      const { data: sv } = await supabase.from('services').select('*');
      if (c) setClients(c); if (s) setStaffList(s); if (sv) setServices(sv);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const combinedDate = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();
    const { data, error } = await supabase.from('appointments').insert([{
      client_id: selectedClient, staff_id: selectedStaff, service_id: selectedService,
      appointment_date: combinedDate, status: 'Bekliyor'
    }]).select(`*, clients ( full_name ), staff ( full_name ), services ( name, duration, price )`).single();
    if (!error && data) {
      setAppointments(prev => [...prev, data]);
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="flex justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Randevular</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-violet-600 px-4 py-2 rounded-lg flex items-center gap-2"><Plus /> Yeni Randevu</button>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          {loading ? "Yükleniyor..." : appointments.map((app) => (
            <div key={app.id} className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0">
              <div className="flex items-center gap-4">
                <div className="bg-violet-900/30 p-3 rounded-lg text-violet-400 font-bold">
                  {new Date(app.appointment_date).getDate()} {new Date(app.appointment_date).toLocaleDateString('tr-TR', {month:'short'})}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2"><Clock size={16}/> {new Date(app.appointment_date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                  <div className="text-sm text-slate-400">{app.clients?.full_name} - {app.services?.name}</div>
                </div>
              </div>
              <button onClick={() => setActiveDropdown(activeDropdown === app.id ? null : app.id)}><MoreVertical /></button>
            </div>
          ))}
        </div>
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Randevu</h2>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <select onChange={e => setSelectedClient(e.target.value)} className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 text-white"><option>Müşteri Seç</option>{clients.map(c=>(<option key={c.id} value={c.id}>{c.full_name}</option>))}</select>
              <select onChange={e => setSelectedStaff(e.target.value)} className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 text-white"><option>Personel Seç</option>{staffList.map(s=>(<option key={s.id} value={s.id}>{s.full_name}</option>))}</select>
              <select onChange={e => setSelectedService(e.target.value)} className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 text-white"><option>Hizmet Seç</option>{services.map(sv=>(<option key={sv.id} value={sv.id}>{sv.name}</option>))}</select>
              <div className="flex gap-2"><input type="date" onChange={e=>setAppointmentDate(e.target.value)} className="w-1/2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-white"/><input type="time" onChange={e=>setAppointmentTime(e.target.value)} className="w-1/2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-white"/></div>
              <button className="w-full bg-violet-600 py-3 rounded-xl font-bold">{isSubmitting ? 'Kaydediliyor...' : 'Randevu Oluştur'}</button>
              <button type="button" onClick={()=>setIsModalOpen(false)} className="w-full text-slate-400">Vazgeç</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}