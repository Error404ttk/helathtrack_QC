import React from 'react';
import { Activity, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
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
          {user ? (
            <>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-emerald-200">{user.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold border-2 border-white/30">
                <UserIcon className="w-5 h-5" />
              </div>
              <button
                onClick={onLogout}
                className="ml-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/30">
              <UserIcon className="w-5 h-5 opacity-50" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};