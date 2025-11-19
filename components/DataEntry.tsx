import React, { useState } from 'react';
import { Department, Team, DocStatus, TeamCategory } from '../types';
import { Plus, Trash2, FileCheck, UploadCloud, Building2, Users, LogOut, Shield, Briefcase, AlertTriangle, X, Filter, Search, CheckCircle2 } from 'lucide-react';

interface DataEntryProps {
  departments: Department[];
  teams: Team[];
  onAddDepartment: (name: string) => void;
  onAddTeam: (deptId: string | null, name: string, category: TeamCategory) => void;
  onUpdateStatus: (teamId: string, type: 'SP' | 'CQI') => void;
  onDeleteTeam: (teamId: string) => void;
  onLogout: () => void;
}

export const DataEntry: React.FC<DataEntryProps> = ({ 
  departments, 
  teams, 
  onAddDepartment, 
  onAddTeam, 
  onUpdateStatus,
  onDeleteTeam,
  onLogout
}) => {
  const [newDeptName, setNewDeptName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<TeamCategory>('DEPARTMENT');
  
  // Filters
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'DEPARTMENT' | 'FA_TEAM'>('ALL');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeptName.trim()) {
      onAddDepartment(newDeptName);
      setNewDeptName('');
      showNotification('เพิ่มกลุ่มงานสำเร็จ');
    }
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const isDeptRequired = selectedCategory === 'DEPARTMENT';
    
    if (newTeamName.trim()) {
      if (isDeptRequired && !selectedDeptId) return;

      onAddTeam(isDeptRequired ? selectedDeptId : null, newTeamName, selectedCategory);
      setNewTeamName('');
      showNotification(`เพิ่ม${selectedCategory === 'FA_TEAM' ? 'ทีม FA' : 'หน่วยงาน'}สำเร็จ`);
      // We don't reset dept/category to allow rapid entry
    }
  };

  const initiateDelete = (teamId: string) => {
    setTeamToDelete(teamId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (teamToDelete) {
      onDeleteTeam(teamToDelete);
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);
      showNotification('ลบทีมสำเร็จ');
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTeamToDelete(null);
  };

  const filteredTeams = teams.filter(t => {
    const matchesDept = filterDept === 'ALL' || t.departmentId === filterDept;
    const matchesCat = filterCategory === 'ALL' || t.category === filterCategory;
    return matchesDept && matchesCat;
  });

  const teamToDeleteName = teams.find(t => t.id === teamToDelete)?.name || 'ทีมนี้';

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
          }`}>
            <div className="p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 text-white p-5 rounded-xl shadow-lg mb-6 border-b-4 border-emerald-500">
        <div className="flex items-center gap-4 mb-3 sm:mb-0">
           <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Shield className="w-8 h-8 text-emerald-400" />
           </div>
           <div>
              <h2 className="font-bold text-xl tracking-tight">ระบบจัดการข้อมูล (Admin Panel)</h2>
              <p className="text-sm text-slate-300 flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                กำลังใช้งานในโหมดผู้ดูแลระบบ
              </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:block text-right mr-2">
              <p className="text-xs text-slate-400">รายการทั้งหมด</p>
              <p className="text-xl font-bold text-white">{teams.length} <span className="text-xs font-normal text-slate-400">ทีม</span></p>
           </div>
           <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 text-slate-200 hover:text-white px-4 py-2.5 rounded-lg transition-all border border-slate-600 text-sm font-medium shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Management Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Add Department */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <div className="flex items-center gap-2 mb-4 text-slate-800 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg">1. จัดการกลุ่มงาน (Dept)</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">เพิ่มรายชื่อกลุ่มงานหลักเพื่อใช้เป็นสังกัดของทีมย่อย</p>
          <form onSubmit={handleAddDept} className="space-y-3">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="ระบุชื่อกลุ่มงาน (เช่น องค์กรพยาบาล)"
              className="w-full px-4 py-2.5 border border-slate-700 bg-slate-800 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm placeholder-slate-400"
            />
            <button 
              type="submit"
              disabled={!newDeptName.trim()}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Plus className="w-4 h-4" /> เพิ่มกลุ่มงาน
            </button>
          </form>
        </div>

        {/* Right Col: Add Team */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800 pb-3 border-b border-slate-100">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg">2. ลงทะเบียนทีม (Register Team)</h3>
          </div>
          
          <form onSubmit={handleAddTeam} className="space-y-5">
             
             {/* Type Selector */}
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">เลือกประเภททีม</label>
               <div className="grid grid-cols-2 gap-4">
                 <label className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCategory === 'DEPARTMENT' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-500'}`}>
                   <input 
                      type="radio" 
                      name="cat" 
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                      checked={selectedCategory === 'DEPARTMENT'} 
                      onChange={() => setSelectedCategory('DEPARTMENT')} 
                   />
                   <Briefcase className={`w-6 h-6 ${selectedCategory === 'DEPARTMENT' ? 'text-emerald-600' : 'text-slate-400'}`} /> 
                   <div className="text-center">
                      <span className="block font-bold text-sm">หน่วยงาน (Unit)</span>
                      <span className="text-[10px] opacity-70">ติดตาม SP + CQI</span>
                   </div>
                   {selectedCategory === 'DEPARTMENT' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500"></div>}
                 </label>

                 <label className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCategory === 'FA_TEAM' ? 'border-amber-500 bg-amber-50/50 text-amber-800 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-500'}`}>
                   <input 
                      type="radio" 
                      name="cat" 
                      className="absolute opacity-0 w-full h-full cursor-pointer" 
                      checked={selectedCategory === 'FA_TEAM'} 
                      onChange={() => setSelectedCategory('FA_TEAM')} 
                   />
                   <Users className={`w-6 h-6 ${selectedCategory === 'FA_TEAM' ? 'text-amber-600' : 'text-slate-400'}`} /> 
                   <div className="text-center">
                      <span className="block font-bold text-sm">ทีม FA (PCT)</span>
                      <span className="text-[10px] opacity-70">ติดตาม CQI เท่านั้น</span>
                   </div>
                   {selectedCategory === 'FA_TEAM' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500"></div>}
                 </label>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Conditionally Render Department Select */}
                {selectedCategory === 'DEPARTMENT' && (
                  <div className="animate-fade-in">
                      <label className="block text-sm font-medium text-slate-700 mb-1">สังกัด / กลุ่มงาน <span className="text-red-500">*</span></label>
                      <select 
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-700 bg-slate-800 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                      >
                        <option value="" disabled className="text-slate-400">-- เลือกกลุ่มงาน --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                  </div>
                )}
                
                <div className={selectedCategory === 'FA_TEAM' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อทีม / หน่วยงาน</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder={selectedCategory === 'DEPARTMENT' ? "ระบุชื่อหน่วยงาน (เช่น Ward 1)" : "ระบุชื่อทีม (เช่น PCT อายุรกรรม)"}
                        className="flex-1 px-4 py-2.5 border border-slate-700 bg-slate-800 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm placeholder-slate-400 transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={!newTeamName.trim() || (selectedCategory === 'DEPARTMENT' && !selectedDeptId)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50 disabled:shadow-none min-w-[100px] justify-center"
                      >
                        <Plus className="w-5 h-5" /> บันทึก
                      </button>
                    </div>
                    {selectedCategory === 'FA_TEAM' && (
                       <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                         <AlertTriangle className="w-3 h-3" />
                         ทีม FA จะถูกจัดเข้ากลุ่ม "คณะกรรมการ/ทีมนำทาง" โดยอัตโนมัติ
                       </p>
                    )}
                </div>
             </div>
          </form>
        </div>
      </div>

      {/* Tracking List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              บันทึกสถานะการส่งงาน (Status Tracking)
            </h3>
            <p className="text-sm text-slate-500 mt-1">คลิกที่ปุ่มสถานะในตารางเพื่อเปลี่ยนสถานะ (ส่งแล้ว/ยังไม่ส่ง)</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 px-2 text-slate-500">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Filters</span>
             </div>
             <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
             
             {/* Category Filter */}
             <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50 hover:bg-slate-100"
             >
               <option value="ALL">ทุกประเภททีม</option>
               <option value="DEPARTMENT">เฉพาะหน่วยงาน (Unit)</option>
               <option value="FA_TEAM">เฉพาะทีม FA (PCT)</option>
             </select>

             {/* Department Filter */}
             <select 
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50 hover:bg-slate-100 max-w-[200px]"
             >
               <option value="ALL">ทุกกลุ่มงาน (All Depts)</option>
               {departments.map(d => (
                 <option key={d.id} value={d.id}>{d.name}</option>
               ))}
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ประเภท</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">สังกัด (Dept)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อทีม (Team Name)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-40">Service Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-40">CQI</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-20">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-16 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <span>ไม่พบข้อมูลทีมในเงื่อนไขที่เลือก</span>
                   </td>
                </tr>
              )}
              {filteredTeams.map((team) => {
                const deptName = departments.find(d => d.id === team.departmentId)?.name || 'Unknown';
                const isFATeam = team.category === 'FA_TEAM';

                return (
                  <tr key={team.id} className={`hover:bg-slate-50 transition-colors group ${isFATeam ? 'bg-amber-50/10' : ''}`}>
                    <td className="px-6 py-4">
                       {isFATeam ? (
                         <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold border border-amber-200">
                           <Users className="w-3 h-3" /> FA Team
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold border border-emerald-200">
                           <Briefcase className="w-3 h-3" /> Unit
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-normal">{deptName}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{team.name}</td>
                    
                    {/* Service Profile Toggle */}
                    <td className="px-6 py-4 text-center">
                      {isFATeam ? (
                        <span className="text-slate-300 text-xs italic bg-slate-50 px-2 py-1 rounded">N/A</span>
                      ) : (
                        <button 
                          onClick={() => onUpdateStatus(team.id, 'SP')}
                          className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 shadow-sm hover:shadow ${
                            team.serviceProfileStatus === DocStatus.SUBMITTED
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {team.serviceProfileStatus === DocStatus.SUBMITTED ? (
                            <>
                              <FileCheck className="w-3 h-3 mr-1" /> ส่งแล้ว
                            </>
                          ) : 'ยังไม่ส่ง'}
                        </button>
                      )}
                    </td>

                    {/* CQI Toggle */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onUpdateStatus(team.id, 'CQI')}
                        className={`relative inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 shadow-sm hover:shadow ${
                          team.cqiStatus === DocStatus.SUBMITTED
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                         {team.cqiStatus === DocStatus.SUBMITTED ? (
                          <>
                            <FileCheck className="w-3 h-3 mr-1" /> ส่งแล้ว
                          </>
                        ) : 'ยังไม่ส่ง'}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => initiateDelete(team.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 group-hover:text-slate-400"
                        title="ลบทีม"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in ring-1 ring-white/20">
             <div className="p-8 text-center">
               <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-bounce-small">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบข้อมูล?</h3>
               <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                 คุณต้องการลบทีม <br/><span className="font-bold text-slate-800 text-base">"{teamToDeleteName}"</span><br/> ใช่หรือไม่? 
               </p>
               <div className="flex gap-3 justify-center">
                 <button 
                   onClick={cancelDelete}
                   className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                 >
                   ยกเลิก
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                 >
                   ลบข้อมูล
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};