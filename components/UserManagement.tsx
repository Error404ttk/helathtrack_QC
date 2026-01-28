
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Plus, Trash2, Edit2, Shield, ShieldCheck } from 'lucide-react';

interface UserManagementProps {
    onLogout: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onLogout }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, role }),
            });

            if (res.ok) {
                setShowAddModal(false);
                resetForm();
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add user');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Error adding user');
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const body: any = { role };
            if (password) body.password = password;

            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowEditModal(false);
                resetForm();
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setUsername(user.username); // Read-only in edit
        setRole(user.role);
        setPassword(''); // Reset password field
        setShowEditModal(true);
    };

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setRole('USER');
        setEditingUser(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">จัดการผู้ใช้งาน (User Management)</h2>
                    <p className="text-sm text-slate-500 mt-1">เพิ่ม ลบ แก้ไขสิทธิ์การเข้าใช้งานระบบ</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มผู้ใช้งาน
                    </button>
                    <button
                        onClick={onLogout}
                        className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        ออกจากระบบ
                    </button>
                </div>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="mt-2 text-slate-500">Loading users...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Username</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-slate-500 text-xs">#{user.id}</td>
                                        <td className="p-4 font-medium text-slate-800">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400">
                                            ไม่พบผู้ใช้งานในระบบ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">เพิ่มผู้ใช้งานใหม่</h3>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="e.g. admin"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                >
                                    <option value="USER">User (ผู้ใช้งานทั่วไป)</option>
                                    <option value="ADMIN">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">แก้ไขผู้ใช้งาน</h3>
                            <p className="text-sm text-slate-500">Username: {username}</p>
                        </div>
                        <form onSubmit={handleEditUser} className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Update only if changing"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                >
                                    <option value="USER">User (ผู้ใช้งานทั่วไป)</option>
                                    <option value="ADMIN">Admin (ผู้ดูแลระบบ)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                                >
                                    อัปเดต
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
