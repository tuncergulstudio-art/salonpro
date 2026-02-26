'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Search, Plus, UserCircle, Phone, Briefcase, MoreVertical, X, Pencil, Trash2 } from 'lucide-react';

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Yeni Personel State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Düzenleme ve Silme State'leri
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Veritabanından personelleri çeken fonksiyon
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      if (data) setStaffList(data);
    } catch (error) {
      console.error("Personel çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Arama motoru
  const filteredStaff = staffList.filter(staff => {
    const nameMatch = staff.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = staff.role?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || roleMatch;
  });

  // Yeni Personel Kaydetme
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([{ full_name: newName, role: newRole, phone: newPhone }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setStaffList(prev => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)));
        setIsModalOpen(false);
        setNewName('');
        setNewRole('');
        setNewPhone('');
      }
    } catch (error) {
      console.error("Personel ekleme hatası:", error);
      alert("Personel eklenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Personel Silme
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      setActiveDropdown(null);
      return;
    }

    try {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      
      setStaffList(prev => prev.filter(staff => staff.id !== id));
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Personel silinirken bir hata oluştu.");
    } finally {
      setActiveDropdown(null);
    }
  };

  // Düzenleme Penceresini Aç
  const openEditModal = (staff: any) => {
    setEditingStaff(staff);
    setEditName(staff.full_name);
    setEditRole(staff.role || '');
    setEditPhone(staff.phone || '');
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  // Personel Güncelleme
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingStaff) return;

    setIsEditSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .update({ full_name: editName, role: editRole, phone: editPhone })
        .eq('id', editingStaff.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setStaffList(prev => prev.map(s => s.id === editingStaff.id ? data : s).sort((a, b) => a.full_name.localeCompare(b.full_name)));
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Personel güncellenirken bir hata oluştu.");
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
            <h2 className="text-2xl font-bold text-white">Personel Yönetimi</h2>
            <p className="text-slate-400 text-sm mt-1">Ekibinizi ve çalışanlarınızı buradan yönetebilirsiniz.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 w-64">
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="İsim veya unvan ara..." 
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
              <span>Yeni Personel</span>
            </button>
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                Personel listesi yükleniyor...
             </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
              <UserCircle className="w-10 h-10 mb-2 opacity-50" />
              <p>Henüz personel eklenmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-800">
                    <th className="font-medium p-4">Personel Adı</th>
                    <th className="font-medium p-4">Unvan / Rol</th>
                    <th className="font-medium p-4">Telefon</th>
                    <th className="font-medium p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-sm text-emerald-300 font-bold">
                                  {staff.full_name?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <span className="font-medium text-white">{staff.full_name}</span>
                          </div>
                      </td>
                      <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-300 text-sm">
                              <Briefcase className="w-4 h-4 text-slate-500" />
                              {staff.role || 'Belirtilmemiş'}
                          </div>
                      </td>
                      <td className="p-4">
                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                              <Phone className="w-4 h-4 text-slate-500" />
                              {staff.phone || 'Belirtilmemiş'}
                          </div>
                      </td>
                      <td className="p-4 text-right relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === staff.id ? null : staff.id)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                              <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === staff.id && (
                            <div className="absolute right-8 top-10 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                              <button 
                                onClick={() => openEditModal(staff)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                              >
                                <Pencil className="w-4 h-4" /> Düzenle
                              </button>
                              <div className="h-px bg-slate-700 w-full"></div>
                              <button 
                                onClick={() => handleDeleteStaff(staff.id, staff.full_name)}
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

      {/* Yeni Personel Modal'ı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Yeni Personel Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Ad Soyad <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  placeholder="Örn: Ahmet Usta"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Unvan / Rol</label>
                <input 
                  type="text" 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  placeholder="Örn: Kıdemli Stilist, Berber vb."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Telefon</label>
                <input 
                  type="tel" 
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                  placeholder="Örn: 0555 555 55 55"
                />
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
              <h2 className="text-xl font-bold text-white">Personel Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Ad Soyad <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Unvan / Rol</label>
                <input 
                  type="text" 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-2">Telefon</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-600 outline-none"
                />
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