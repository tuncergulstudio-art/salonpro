'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Scissors, Clock, Tag, MoreVertical, X, Pencil, Trash2 } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Yeni Hizmet State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Düzenleme ve Silme State'leri
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Veritabanından hizmetleri çeken fonksiyon
  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setServices(data);
    } catch (error) {
      console.error("Hizmet çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Arama motoru
  const filteredServices = services.filter(service => {
    const nameMatch = service.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = service.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || categoryMatch;
  });

  // Yeni Hizmet Kaydetme
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice || !newDuration) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ 
          name: newName, 
          category: newCategory, 
          price: parseFloat(newPrice), 
          duration: parseInt(newDuration) 
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setServices(prev => [...prev, data]);
        setIsModalOpen(false);
        setNewName('');
        setNewCategory('');
        setNewPrice('');
        setNewDuration('');
      }
    } catch (error) {
      console.error("Hizmet ekleme hatası:", error);
      alert("Hizmet eklenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hizmet Silme
  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı hizmeti silmek istediğinize emin misiniz?`)) {
      setActiveDropdown(null);
      return;
    }

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      
      setServices(prev => prev.filter(service => service.id !== id));
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Hizmet silinirken bir hata oluştu.");
    } finally {
      setActiveDropdown(null);
    }
  };

  // Düzenleme Penceresini Aç
  const openEditModal = (service: any) => {
    setEditingService(service);
    setEditName(service.name);
    setEditCategory(service.category || '');
    setEditPrice(service.price.toString());
    setEditDuration(service.duration.toString());
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  // Hizmet Güncelleme
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPrice || !editDuration || !editingService) return;

    setIsEditSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .update({ 
          name: editName, 
          category: editCategory, 
          price: parseFloat(editPrice), 
          duration: parseInt(editDuration) 
        })
        .eq('id', editingService.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setServices(prev => prev.map(s => s.id === editingService.id ? data : s));
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Hizmet güncellenirken bir hata oluştu.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex selection:bg-violet-500/30">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 ml-64 max-h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Hizmetler ve Fiyatlar</h2>
            <p className="text-slate-400 text-sm mt-1">Salonunuzda sunduğunuz işlemleri, sürelerini ve fiyatlarını yönetin.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 w-64">
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="İşlem veya kategori ara..." 
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-violet-900/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Hizmet</span>
            </button>
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                Hizmetler yükleniyor...
             </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
              <Scissors className="w-10 h-10 mb-2 opacity-50" />
              <p>Henüz bir hizmet eklenmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-800">
                    <th className="font-medium p-4">Hizmet Adı</th>
                    <th className="font-medium p-4">Kategori</th>
                    <th className="font-medium p-4">Süre</th>
                    <th className="font-medium p-4">Fiyat</th>
                    <th className="font-medium p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-rose-900/50 flex items-center justify-center text-sm text-rose-300 font-bold">
                                  <Scissors className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-white">{service.name}</span>
                          </div>
                      </td>
                      <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-300 text-sm">
                              <Tag className="w-4 h-4 text-slate-500" />
                              {service.category || 'Genel'}
                          </div>
                      </td>
                      <td className="p-4">
                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                              <Clock className="w-4 h-4 text-slate-500" />
                              {service.duration} dk
                          </div>
                      </td>
                      <td className="p-4">
                            <div className="flex items-center gap-1 font-semibold text-emerald-400">
                              {service.price} ₺
                          </div>
                      </td>
                      <td className="p-4 text-right relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === service.id ? null : service.id)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                              <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === service.id && (
                            <div className="absolute right-8 top-10 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                              <button 
                                onClick={() => openEditModal(service)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                              >
                                <Pencil className="w-4 h-4" /> Düzenle
                              </button>
                              <div className="h-px bg-slate-700 w-full"></div>
                              <button 
                                onClick={() => handleDeleteService(service.id, service.name)}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Sil
                              </button>
                            </div>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Yeni Hizmet Modal'ı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Yeni Hizmet Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Hizmet Adı <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  placeholder="Örn: Saç Kesimi"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Kategori</label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  placeholder="Örn: Saç, Bakım, Makyaj..."
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400 block mb-2">Süre (Dakika) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                    placeholder="Örn: 45"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400 block mb-2">Fiyat (₺) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                    placeholder="Örn: 250"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-lg font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors shadow-lg shadow-violet-900/20 ${isSubmitting ? 'bg-slate-700 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}>
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenleme (Edit) Modal'ı */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Hizmet Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateService} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Hizmet Adı <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Kategori</label>
                <input 
                  type="text" 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400 block mb-2">Süre (Dakika) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400 block mb-2">Fiyat (₺) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 rounded-lg font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={isEditSubmitting} className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors shadow-lg shadow-violet-900/20 ${isEditSubmitting ? 'bg-slate-700 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}>
                  {isEditSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}