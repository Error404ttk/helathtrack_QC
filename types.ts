export enum DocStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
}

export type TeamCategory = 'DEPARTMENT' | 'FA_TEAM';

export interface Department {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  category: TeamCategory; // New field
  serviceProfileStatus: DocStatus;
  cqiStatus: DocStatus;
  cqiSubmittedCount?: number;
  cqiColor?: string | null;
  serviceProfileFile?: string | null;
  cqiFile?: string | null;
  lastUpdated: string;
}

export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'USER';
  created_at?: string;
}

import React from 'react';

export type ViewMode = 'DASHBOARD' | 'ENTRY' | 'USERS';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  colorClass?: string;
}

export interface DataEntryProps {
  departments: Department[];
  teams: Team[];
  onAddDepartment: (name: string) => void;
  onAddTeam: (deptId: string | null, name: string, category: TeamCategory) => void;
  onUpdateStatus: (teamId: string, type: 'SP' | 'CQI') => void;
  onDeleteTeam: (teamId: string) => void;
  onLogout: () => void;
}