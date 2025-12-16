import React, { useMemo, useState, useEffect } from 'react';
import { Department, Team, DocStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CheckCircle, AlertCircle, FileText, Users, RotateCcw, Award, Target, Activity, CheckCircle2, X, Edit2, Save, Shield } from 'lucide-react';

interface DashboardProps {
  departments: Department[];
  teams: Team[];
  onRefresh: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ departments, teams, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [manualCqiCount, setManualCqiCount] = useState<number | null>(null);
  const [isEditingCqi, setIsEditingCqi] = useState(false);
  const [tempCqiVal, setTempCqiVal] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/settings/manual_cqi_count` : '/api/settings/manual_cqi_count');
      const data = await res.json();
      if (data.value !== null && data.value !== '') {
        setManualCqiCount(parseInt(data.value, 10));
      } else {
        setManualCqiCount(null);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [isRefreshing]);

  const saveManualCqi = async () => {
    try {
      const val = tempCqiVal === '' ? null : parseInt(tempCqiVal, 10);
      await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/settings/manual_cqi_count` : '/api/settings/manual_cqi_count', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val === null ? '' : val.toString() })
      });
      setManualCqiCount(val);
      setIsEditingCqi(false);
      showNotification('บันทึกยอด CQI เรียบร้อยแล้ว');
    } catch (err) {
      showNotification('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      showNotification('อัปเดตข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      showNotification('ไม่สามารถอัปเดตข้อมูลได้', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalTeams = teams.length;

    const unitTeams = teams.filter(t => t.category === 'DEPARTMENT');
    const faTeams = teams.filter(t => t.category === 'FA_TEAM');

    const totalUnits = unitTeams.length;
    const totalFATeams = faTeams.length;

    // SP is relevant ONLY for DEPARTMENT category
    const spSubmitted = unitTeams.filter(t => t.serviceProfileStatus === DocStatus.SUBMITTED).length;

    // CQI is relevant for ALL
    const realCqiSubmitted = teams.filter(t =>
      t.cqiStatus === DocStatus.SUBMITTED || (t.cqiSubmittedCount && t.cqiSubmittedCount > 0)
    ).length;

    // Use manual global count if set (and not NaN), otherwise use sum of teams
    const cqiSubmitted = manualCqiCount !== null && !isNaN(manualCqiCount) ? manualCqiCount : realCqiSubmitted;

    // Logic for completion:
    // Unit: SP && CQI
    // FA: CQI only
    const fullyCompleteUnits = unitTeams.filter(
      t => t.serviceProfileStatus === DocStatus.SUBMITTED && t.cqiStatus === DocStatus.SUBMITTED
    ).length;

    const fullyCompleteFA = faTeams.filter(
      t => t.cqiStatus === DocStatus.SUBMITTED
    ).length;

    const totalFullyComplete = fullyCompleteUnits + fullyCompleteFA;

    // Rates
    const spRate = totalUnits > 0 ? Math.round((spSubmitted / totalUnits) * 100) : 0;
    const cqiRate = totalTeams > 0 ? Math.round((cqiSubmitted / totalTeams) * 100) : 0;
    const overallRate = totalTeams > 0 ? Math.round((totalFullyComplete / totalTeams) * 100) : 0;

    return {
      totalUnits,
      totalFATeams,
      totalTeams,
      spSubmitted,
      cqiSubmitted,
      spRate,
      cqiRate,
      overallRate,
      usingManualCqi: manualCqiCount !== null && !isNaN(manualCqiCount)
    };
  }, [teams, manualCqiCount]);

  // Chart Data Preparation
  const pieData = [
    { name: 'Completed', value: stats.overallRate },
    { name: 'Pending', value: 100 - stats.overallRate },
  ];
  const COLORS = ['#059669', '#e2e8f0'];

  // Bar Chart 1: Percent complete by Department (aggregates both Units and FA Teams belonging to that dept)
  const barData = departments.map(dept => {
    const deptTeams = teams.filter(t => t.departmentId === dept.id && t.category === 'DEPARTMENT'); // Focus on Units for this chart
    if (deptTeams.length === 0) return null;

    const completedCount = deptTeams.filter(t =>
      t.serviceProfileStatus === DocStatus.SUBMITTED && t.cqiStatus === DocStatus.SUBMITTED
    ).length;

    return {
      name: dept.name,
      total: deptTeams.length,
      submitted: completedCount,
      rate: (completedCount / deptTeams.length) * 100
    };
  })
    .filter(item => item !== null)
    .sort((a, b) => (b?.rate || 0) - (a?.rate || 0))
    .slice(0, 10);

  // Bar Chart 2: FA Teams Ranking
  const faBarData = teams
    .filter(t => t.category === 'FA_TEAM')
    .map(team => ({
      name: team.name,
      rate: team.cqiStatus === DocStatus.SUBMITTED ? 100 : 0,
      displayStatus: team.cqiStatus === DocStatus.SUBMITTED ? 'ส่งแล้ว' : 'ยังไม่ส่ง'
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10); // Limit to top 10

  return (
    <div className="space-y-8 animate-fade-in relative">

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
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

      {/* Dashboard Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ภาพรวมสถานะการส่งงาน</h2>
          <p className="text-slate-500 mt-1 text-sm">ติดตามการส่งเอกสาร Service Profile และ CQI แบบ Real-time</p>
        </div>
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-70 disabled:cursor-wait min-w-[150px]"
        >
          <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="font-medium text-sm">{isRefreshing ? 'กำลังอัปเดต...' : 'รีเฟรชข้อมูล'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">ทีมทั้งหมด</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalTeams}</h3>
              <span className="text-xs text-slate-400">(หน่วยงาน {stats.totalUnits} + FA {stats.totalFATeams})</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Service Profile</p>
            <p className="text-xs text-slate-400 mb-1">*เฉพาะหน่วยงาน</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.spRate}% <span className="text-sm text-emerald-600 font-semibold">ส่งแล้ว</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-amber-100 text-amber-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">CQI Project</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400">*ทุกทีมต้องส่ง</span>
              <button
                onClick={() => {
                  setTempCqiVal(manualCqiCount !== null ? manualCqiCount.toString() : stats.cqiSubmitted.toString());
                  setIsEditingCqi(true);
                }}
                className="text-slate-300 hover:text-emerald-600 transition-colors"
                title="แก้ไขยอดส่ง"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            {isEditingCqi ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempCqiVal}
                  onChange={(e) => setTempCqiVal(e.target.value)}
                  className="w-20 px-2 py-1 text-lg border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  autoFocus
                />
                <button onClick={saveManualCqi} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditingCqi(false)} className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {stats.cqiRate}%
                <span className="text-sm text-emerald-600 font-semibold">ส่งแล้ว ({stats.cqiSubmitted})</span>
                {stats.usingManualCqi && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200">Manual</span>}
              </h3>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className={`p-3 rounded-full ${stats.overallRate === 100 ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">ภาพรวมความสำเร็จ</p>
            <p className="text-xs text-slate-400 mb-1">KPI ของโรงพยาบาล</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.overallRate}%</h3>
          </div>
        </div>
      </div>

      {/* SECTION 1: Service Units Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 w-1 h-6 rounded-r"></div>
            <h3 className="text-lg font-bold text-slate-800">ติดตามสถานะ: หน่วยงาน</h3>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
            เป้าหมาย: Service Profile + CQI
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-600 text-sm font-semibold border-b border-slate-200">
                <th className="px-6 py-4 w-1/4">กลุ่มงาน/ฝ่าย</th>
                <th className="px-6 py-4 w-1/4">หน่วยงาน</th>
                <th className="px-6 py-4 text-center">Service Profile</th>
                <th className="px-6 py-4 text-center">สถานะ CQI</th>
                <th className="px-6 py-4 text-center">จำนวน CQI</th>
                <th className="px-6 py-4 text-right">สถานะรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.filter(t => t.category === 'DEPARTMENT').map((team) => {
                const deptName = departments.find(d => d.id === team.departmentId)?.name || 'Unknown';
                const isSpDone = team.serviceProfileStatus === DocStatus.SUBMITTED;
                const isCqiDone = team.cqiStatus === DocStatus.SUBMITTED;
                const isAllDone = isSpDone && isCqiDone;

                return (
                  <tr key={team.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-sm">
                    <td className="px-6 py-4 text-slate-500">{deptName}</td>
                    <td className="px-6 py-4 text-slate-800 font-medium">{team.name}</td>

                    {/* Service Profile */}
                    <td className="px-6 py-4 text-center">
                      {isSpDone ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> ส่งแล้ว
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* CQI Status (Reverted to badge) */}
                    <td className="px-6 py-4 text-center">
                      {isCqiDone ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> ส่งแล้ว
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* CQI Count (New Column) */}
                    <td className="px-6 py-4 text-center">
                      {(team.cqiSubmittedCount && team.cqiSubmittedCount > 0) ? (
                        <span
                          className="inline-flex items-center justify-center text-xs font-bold px-3 py-1 rounded-full border shadow-sm text-white min-w-[60px]"
                          style={{
                            backgroundColor: team.cqiColor || '#10b981',
                            borderColor: team.cqiColor || '#10b981',
                          }}
                        >
                          {team.cqiSubmittedCount} เรื่อง
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isAllDone ? (
                        <span className="text-emerald-500 font-bold text-xs flex items-center justify-end gap-1">
                          <Shield className="w-4 h-4" /> ครบถ้วน
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs font-normal">รอดำเนินการ</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {teams.filter(t => t.category === 'DEPARTMENT').length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">ไม่มีข้อมูลหน่วยงาน</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: FA Teams Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 w-1 h-6 rounded-r"></div>
            <h3 className="text-lg font-bold text-slate-800">ติดตามสถานะ: ทีมFA</h3>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100">
            เป้าหมาย: CQI เท่านั้น
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-600 text-sm font-semibold border-b border-slate-200">
                <th className="px-6 py-4 w-1/4">สังกัด/ผู้รับผิดชอบ</th>
                <th className="px-6 py-4 w-1/4">ชื่อทีม FA/PCT</th>
                <th className="px-6 py-4 text-center bg-slate-50/50 text-slate-400">Service Profile</th>
                <th className="px-6 py-4 text-center">สถานะ CQI</th>
                <th className="px-6 py-4 text-center">จำนวน CQI</th>
                <th className="px-6 py-4 text-right">สถานะรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.filter(t => t.category === 'FA_TEAM').map((team) => {
                const deptName = departments.find(d => d.id === team.departmentId)?.name || 'Unknown';
                const isComplete = team.cqiStatus === DocStatus.SUBMITTED;
                const isCqiDone = team.cqiStatus === DocStatus.SUBMITTED;

                return (
                  <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{deptName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{team.name}</td>
                    <td className="px-6 py-4 text-center bg-slate-50/50">
                      <span className="text-xs text-slate-300 font-light italic">ไม่ระบุ (N/A)</span>
                    </td>

                    {/* CQI Status */}
                    <td className="px-6 py-4 text-center">
                      {isCqiDone ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> ส่งแล้ว
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* CQI Count */}
                    <td className="px-6 py-4 text-center">
                      {(team.cqiSubmittedCount && team.cqiSubmittedCount > 0) ? (
                        <span
                          className="inline-flex items-center justify-center text-xs font-bold px-3 py-1 rounded-full border shadow-sm text-white min-w-[60px]"
                          style={{
                            backgroundColor: team.cqiColor || '#10b981',
                            borderColor: team.cqiColor || '#10b981',
                          }}
                        >
                          {team.cqiSubmittedCount} เรื่อง
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> ผ่าน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> รอ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {teams.filter(t => t.category === 'FA_TEAM').length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">ไม่มีข้อมูลทีม FA</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

        {/* Chart 1: Progress by Dept */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            อันดับการส่งงาน (หน่วยงาน)
          </h3>
          <div className="flex-1 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="rate" fill="#059669" radius={[0, 4, 4, 0]} barSize={20} name="% ความสำเร็จ" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Progress by FA Team */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            อันดับการส่งงาน (ทีม FA)
          </h3>
          <div className="flex-1 h-[300px] w-full">
            {faBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faBarData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [value === 100 ? 'ส่งแล้ว' : 'ยังไม่ส่ง', 'สถานะ']}
                  />
                  <Bar dataKey="rate" fill="#d97706" radius={[0, 4, 4, 0]} barSize={20} name="% ความสำเร็จ" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">ไม่มีข้อมูลทีม FA</div>
            )}
          </div>
        </div>

        {/* Chart 3: Overall Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-2">ภาพรวมทั้งองค์กร</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="text-3xl font-bold text-emerald-700">{stats.overallRate}%</span>
              <p className="text-xs text-slate-400">สำเร็จ</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
              <span className="text-slate-600">ส่งครบถ้วน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <span className="text-slate-600">รอดำเนินการ</span>
            </div>
          </div>
        </div>
      </div>

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

const StatusBadge: React.FC<{ status: DocStatus, label?: string }> = ({ status, label }) => {
  const isSubmitted = status === DocStatus.SUBMITTED;
  const tooltipText = isSubmitted
    ? `${label ? label + ' ' : ''}ส่งเอกสารเรียบร้อยแล้ว`
    : `${label ? label + ' ' : ''}ยังไม่ได้รับเอกสาร`;

  if (isSubmitted) {
    return (
      <div className="group relative flex flex-col items-center justify-center animate-scale-in cursor-default">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm ring-2 ring-emerald-50">
          <CheckCircle className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-emerald-600 mt-1">ส่งแล้ว</span>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[150px] px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg z-10 text-center leading-tight">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="group relative flex flex-col items-center justify-center opacity-40 cursor-default">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
      </div>
      <span className="text-[10px] font-medium text-slate-400 mt-1">รอส่ง</span>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[150px] px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg z-10 text-center leading-tight">
        {tooltipText}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};