import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, Scissors, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Service, Client, Profile } from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Veri State'leri
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form State'leri
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Veri Çekme (İlk açılışta)
  useEffect(() => {
    if (isOpen) {
      fetchFormData();
      // Reset form
      setSelectedClientId('');
      setSelectedStaffId('');
      setSelectedServiceIds([]);
      setError(null);
      // Varsayılan olarak bugünün tarihi
      const today = new Date().toISOString().split('T')[0];
      setAppointmentDate(today);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchFormData = async () => {
    setLoadingData(true);
    try {
      // Paralel veri çekimi
      const [clientsRes, servicesRes, staffRes] = await Promise.all([
        supabase.from('clients').select('*').order('full_name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('profiles').select('*').order('full_name'),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (staffRes.error) throw staffRes.error;

      setClients(clientsRes.data || []);
      setServices(servicesRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err: any) {
      console.error('Veri çekme hatası:', err);
      // Demo amaçlı dummy veri (Eğer Supabase bağlantısı yoksa UI testi için)
      if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL)) {
          setClients([{id: '1', full_name: 'Ayşe Yılmaz', phone: '5551234567'} as any]);
          setServices([
              {id: '1', name: 'Saç Kesimi', price: 500, duration: 45},
              {id: '2', name: 'Boya', price: 1500, duration: 120},
              {id: '3', name: 'Fön', price: 200, duration: 30}
          ] as any[]);
          setStaff([{id: '1', full_name: 'Mehmet Kuaför', role: 'staff'} as any]);
      } else {
          setError('Veriler yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Canlı Hesaplama
  const calculation = useMemo(() => {
    const selected = services.filter(s => selectedServiceIds.includes(s.id));
    const totalAmount = selected.reduce((sum, item) => sum + item.price, 0);
    const totalDuration = selected.reduce((sum, item) => sum + item.duration, 0); // dakika

    // Bitiş saati tahmini
    let endTimeDisplay = '';
    if (startTime && totalDuration > 0) {
      const [hours, mins] = startTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, mins + totalDuration);
      endTimeDisplay = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    return { totalAmount, totalDuration, endTimeDisplay };
  }, [selectedServiceIds, services, startTime]);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedClientId || !selectedStaffId || selectedServiceIds.length === 0 || !appointmentDate || !startTime) {
      setError('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Tarih ve Saat oluşturma
      const startDateTime = new Date(`${appointmentDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + calculation.totalDuration * 60000);

      // 2. Appointments tablosuna ekle
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: selectedClientId,
          profile_id: selectedStaffId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          total_price: calculation.totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;
      if (!appointmentData) throw new Error('Randevu oluşturulamadı.');

      // 3. Appointment Items tablosuna hizmetleri ekle
      const itemsToInsert = selectedServiceIds.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        return {
          appointment_id: appointmentData.id,
          service_id: serviceId,
          price: service?.price || 0
        };
      });

      const { error: itemsError } = await supabase
        .from('appointment_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Başarılı
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error('Kayıt hatası:', err);
      setError(err.message || 'Randevu kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            Yeni Randevu Oluştur
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Müşteri Seçimi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Müşteri
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={loadingData}
              >
                <option value="">Seçiniz...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.full_name}</option>
                ))}
              </select>
            </div>

            {/* Personel Seçimi */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Personel
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={loadingData}
              >
                <option value="">Seçiniz...</option>
                {staff.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            {/* Tarih */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Tarih
              </label>
              <input
                type="date"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none color-white-scheme"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>

            {/* Saat */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Başlangıç Saati
              </label>
              <input
                type="time"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Hizmet Seçimi (Multi-Select) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 block mb-2">Hizmetler</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {services.map(service => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`
                      cursor-pointer p-3 rounded-lg border transition-all flex items-center justify-between
                      ${isSelected 
                        ? 'bg-violet-900/20 border-violet-600/50 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{service.name}</span>
                      <span className="text-xs opacity-70">{service.duration} dk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{service.price} ₺</span>
                      {isSelected && <Check className="w-4 h-4 text-violet-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer / Summary Bar */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Toplam Tutar</span>
                <span className="text-xl font-bold text-violet-400">{calculation.totalAmount} ₺</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Toplam Süre</span>
                <span className="text-white font-medium">{calculation.totalDuration} dk</span>
              </div>
              {calculation.endTimeDisplay && (
                <div>
                  <span className="text-slate-400 block text-xs">Tahmini Bitiş</span>
                  <span className="text-white font-medium">{calculation.endTimeDisplay}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`
                px-6 py-3 rounded-lg font-semibold text-white shadow-lg shadow-violet-900/20
                flex items-center gap-2 transition-all
                ${isSubmitting 
                  ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                  : 'bg-violet-600 hover:bg-violet-700 hover:scale-105 active:scale-95'}
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Randevuyu Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};