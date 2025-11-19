import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { Login } from './components/Login';
import { Department, Team, DocStatus, ViewMode, TeamCategory } from './types';
import { LayoutDashboard, PenTool } from 'lucide-react';

const API_URL = '/api'; // Use relative API base so Vite proxy/production domain works

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
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

  const handleRefresh = async () => {
    await fetchData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* View Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button 
              onClick={() => setViewMode('DASHBOARD')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'DASHBOARD' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard ภาพรวม
            </button>
            <button 
              onClick={() => setViewMode('ENTRY')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'ENTRY' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <PenTool className="w-4 h-4" />
              จัดการข้อมูล
            </button>
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
              <Dashboard departments={departments} teams={teams} onRefresh={handleRefresh} />
            ) : (
              !isAuthenticated ? (
                <Login onLogin={() => setIsAuthenticated(true)} />
              ) : (
                <DataEntry 
                  departments={departments} 
                  teams={teams} 
                  onAddDepartment={addDepartment}
                  onAddTeam={addTeam}
                  onUpdateStatus={updateStatus}
                  onDeleteTeam={deleteTeam}
                  onLogout={() => setIsAuthenticated(false)}
                />
              )
            )
          )}
        </div>

      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>© 2024 HealthTrack QC System. Database Connected.</p>
      </footer>
    </div>
  );
};

export default App;
