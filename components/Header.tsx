import React from 'react';
import { Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">HealthTrack QC</h1>
            <p className="text-xs text-emerald-100 font-light opacity-90">ระบบติดตามงานของศูนย์คุณภาพ</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">ศูนย์คุณภาพ โรงพยาบาลสารภี</p>
            <p className="text-xs text-emerald-200">ผู้ดูแลระบบ</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold border-2 border-white/30">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};