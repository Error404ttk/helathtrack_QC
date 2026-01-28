import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { Department, Team, DocStatus, TeamCategory, User, ViewMode } from './types';
import { LayoutDashboard, PenTool, Users, X, Shield, Activity } from 'lucide-react';

const API_URL = '/api'; // Use relative API base so Vite proxy/production domain works

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Fetch Initial Data
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [deptRes, teamRes] = await Promise.all([
        fetch(`${API_URL}/departments`),
        fetch(`${API_URL}/teams`)
      ]);

      if (deptRes.ok && teamRes.ok) {
        const depts = await deptRes.json();
        const teamList = await teamRes.json();
        setDepartments(depts);
        setTeams(teamList);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers connected to API
  const addDepartment = async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newDept = await res.json();
        setDepartments(prev => [...prev, newDept]);
      }
    } catch (error) {
      console.error("Error adding department", error);
    }
  };

  const addTeam = async (deptId: string | null, name: string, category: TeamCategory) => {
    let finalDeptId = deptId;

    // If adding an FA Team without a specific department, assign to default "FA/Committee" group
    if (category === 'FA_TEAM' && !finalDeptId) {
      const defaultFAName = "คณะกรรมการ/ทีมนำทาง";
      let faDept = departments.find(d => d.name === defaultFAName);

      if (!faDept) {
        // Create default dept via API
        try {
          const res = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: defaultFAName })
          });
          if (res.ok) {
            const newDept = await res.json();
            setDepartments(prev => [...prev, newDept]);
            finalDeptId = newDept.id;
          }
        } catch (e) {
          console.error("Error creating default FA dept", e);
          return;
        }
      } else {
        finalDeptId = faDept.id;
      }
    }

    if (!finalDeptId && category === 'DEPARTMENT') return;

    try {
      const res = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: finalDeptId, name, category })
      });
      if (res.ok) {
        const newTeam = await res.json();
        setTeams(prev => [newTeam, ...prev]); // Add to top
      }
    } catch (error) {
      console.error("Error adding team", error);
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const res = await fetch(`${API_URL}/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        setTeams(prev => prev.filter(t => t.id !== teamId));
      }
    } catch (error) {
      console.error("Error deleting team", error);
    }
  };

  const updateStatus = async (teamId: string, type: 'SP' | 'CQI') => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const currentStatus = type === 'SP' ? team.serviceProfileStatus : team.cqiStatus;
    const newStatus = currentStatus === DocStatus.SUBMITTED ? DocStatus.PENDING : DocStatus.SUBMITTED;

    try {
      const res = await fetch(`${API_URL}/teams/${teamId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, status: newStatus })
      });

      if (res.ok) {
        setTeams(prevTeams => prevTeams.map(t => {
          if (t.id === teamId) {
            return {
              ...t,
              serviceProfileStatus: type === 'SP' ? newStatus : t.serviceProfileStatus,
              cqiStatus: type === 'CQI' ? newStatus : t.cqiStatus,
              lastUpdated: new Date().toISOString()
            };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const updateCqiInfo = async (teamId: string, count: number, color: string | null) => {
    try {
      const res = await fetch(`${API_URL}/teams/${teamId}/cqi-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cqiSubmittedCount: count, cqiColor: color })
      });

      if (res.ok) {
        setTeams(prev => prev.map(t => {
          if (t.id === teamId) {
            return { ...t, cqiSubmittedCount: count, cqiColor: color };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error("Error updating CQI info", error);
    }
  };

  const updateFile = async (teamId: string, type: 'SP' | 'CQI', filename: string | null) => {
    try {
      const res = await fetch(`${API_URL}/teams/${teamId}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, filename })
      });

      if (res.ok) {
        setTeams(prev => prev.map(t => {
          if (t.id === teamId) {
            return {
              ...t,
              serviceProfileFile: type === 'SP' ? filename : t.serviceProfileFile,
              cqiFile: type === 'CQI' ? filename : t.cqiFile
            };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error("Error updating file", error);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (user.role === 'USER') {
      setViewMode('DASHBOARD');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST' });
    } catch (e) {
      console.error("Logout failed on server", e);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setViewMode('DASHBOARD');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header user={currentUser} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* View Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button
              onClick={() => setViewMode('DASHBOARD')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'DASHBOARD'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard ภาพรวม
            </button>
            {(!isAuthenticated || (isAuthenticated && currentUser?.role === 'ADMIN')) && (
              <button
                onClick={() => setViewMode('ENTRY')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'ENTRY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <PenTool className="w-4 h-4" />
                จัดการข้อมูล
              </button>
            )}
            {isAuthenticated && currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setViewMode('USERS')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'USERS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <Users className="w-4 h-4" />
                จัดการผู้ใช้งาน
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {isLoadingData && teams.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            viewMode === 'DASHBOARD' ? (
              <Dashboard
                departments={departments}
                teams={teams}
                onRefresh={handleRefresh}
                currentUser={currentUser}
                onRequestLogin={() => setViewMode('ENTRY')}
              />
            ) : viewMode === 'USERS' && isAuthenticated && currentUser?.role === 'ADMIN' ? (
              <UserManagement onLogout={handleLogout} />
            ) : (
              // ENTRY MODE - Should mostly be ADMIN here via button, but if condition fails it falls through
              // If not authenticated, show login
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : currentUser?.role === 'ADMIN' ? (
                <DataEntry
                  departments={departments}
                  teams={teams}
                  onAddDepartment={addDepartment}
                  onAddTeam={addTeam}
                  onUpdateStatus={updateStatus}
                  onUpdateCqiInfo={updateCqiInfo}
                  onUpdateFile={updateFile}
                  onDeleteTeam={deleteTeam}
                  onLogout={handleLogout}
                />
              ) : (
                // Fallback for USER role trying to access entry (shouldn't happen with hidden button)
                <div className="text-center py-10">
                  <p className="text-slate-500">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</p>
                </div>
              )
            )
          )}
        </div>

      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
          <p>© 2026 HealthTrack QC System. Version 2.0.0</p>
          <button
            onClick={() => setShowChangelog(true)}
            className="text-emerald-500 hover:text-emerald-400 hover:underline text-xs flex items-center gap-1 transition-colors"
          >
            <span className="bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Release Notes</span>
            ดูรายการอัปเดต
          </button>
        </div>
      </footer>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  );
};

const ChangelogModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🎉 What's New
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">v2.0.0</span>
            </h3>
            <p className="text-slate-500 text-sm mt-1">อัปเดตล่าสุด: 28 ม.ค. 2026</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Security Improvements
            </h4>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside ml-1">
              <li>เพิ่มระบบป้องกันการเข้าถึงไฟล์ (Unauthorized Access Prevention)</li>
              <li>ปรับปรุง Popup แจ้งเตือนเมื่อไม่มีสิทธิ์เข้าถึงให้สวยงามและเข้าใจง่าย</li>
              <li>แก้ไขบั๊ก Authentication ที่ปุ่มเมนูค้างหลัง Logout</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              UI/UX Enhancements
            </h4>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside ml-1">
              <li>ปรับดีไซน์ Footer ใหม่ (Version 2)</li>
              <li>เพิ่มหน้า Changelog เพื่อแจ้งข่าวสารการอัปเดต</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default App;
