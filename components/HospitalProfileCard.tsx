import React, { useState, useEffect } from 'react';
import { HospitalProfile, User } from '../types';
import { FileText, Upload, Eye, CheckCircle, AlertCircle, Calendar, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HospitalProfileProps {
    currentUser: User | null;
    onRequestLogin: () => void;
}

export const HospitalProfileCard: React.FC<HospitalProfileProps> = ({ currentUser, onRequestLogin }) => {
    const currentYear = new Date().getFullYear() + 543; // Convert to Thai Year
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [profile, setProfile] = useState<HospitalProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Custom UI States
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Generate year options (current year + 1 down to current year - 4)
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchProfile = async (year: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/hospital-profiles/${year}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error("Failed to fetch hospital profile:", error);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile(selectedYear);
    }, [selectedYear]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            showNotification('กรุณาอัปโหลดไฟล์ PDF เท่านั้น', 'error');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/hospital-profiles/${selectedYear}`, {
                method: 'PUT',
                body: formData,
            });

            if (res.ok) {
                await fetchProfile(selectedYear); // Refresh
                showNotification('อัปโหลดไฟล์เรียบร้อยแล้ว');
            } else {
                showNotification('เกิดข้อผิดพลาดในการอัปโหลด', 'error');
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleViewFile = () => {
        if (!currentUser) {
            onRequestLogin();
            return;
        }

        if (profile?.filePath) {
            window.open(`/api/uploads/${profile.filePath}`, '_blank');
        }
    };

    const confirmDelete = async () => {
        setShowDeleteConfirm(false);
        setIsLoading(true);
        try {
            const res = await fetch(`/api/hospital-profiles/${selectedYear}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchProfile(selectedYear); // Refresh
                showNotification('ลบไฟล์เรียบร้อยแล้ว');
            } else {
                showNotification('เกิดข้อผิดพลาดในการลบไฟล์', 'error');
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            showNotification('เกิดข้อผิดพลาดในการเชื่มต่อ', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4 relative">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Hospital Profile</h3>
                        <p className="text-xs text-slate-500">ข้อมูลองค์กรประจำปี</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="flex-1 py-1.5 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all cursor-pointer font-medium text-slate-700"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>พ.ศ. {year}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 flex flex-col justify-center min-h-[60px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                            กำลังโหลด...
                        </div>
                    ) : profile ? (
                        <div className="flex flex-col gap-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-semibold">มีไฟล์เอกสารแล้ว</span>
                            </div>

                            <button
                                onClick={handleViewFile}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Eye className="w-4 h-4" />
                                ดูไฟล์แนบ
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-400 bg-slate-50 rounded-lg p-3 border border-slate-100 border-dashed">
                            <AlertCircle className="w-5 h-5 opacity-50" />
                            <span className="text-xs">ยังไม่มีเอกสาร</span>
                        </div>
                    )}
                </div>

                {/* Upload & Delete Area */}
                {currentUser && (currentUser.role === 'ADMIN') && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                        <label className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-dashed border-slate-300 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 text-slate-500 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-4 h-4" />
                            {isUploading ? 'กำลังอัปโหลด...' : (profile ? 'อัปโหลดทับไฟล์เดิม' : 'อัปโหลดไฟล์ใหม่')}
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </label>

                        {profile && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                ลบไฟล์
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Notification Toast */}
            {notification && (
                <div className="fixed top-24 right-4 z-[70] animate-slide-in-right">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm ${notification.type === 'success'
                            ? 'bg-emerald-600/95 border-emerald-500 text-white'
                            : 'bg-red-600/95 border-red-500 text-white'
                        }`}>
                        <div className="p-1 bg-white/20 rounded-full">
                            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-sm">{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="ml-2 opacity-70 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบไฟล์?</h3>
                            <p className="text-slate-500 mb-6">
                                คุณต้องการลบไฟล์เอกสารของปี พ.ศ. {selectedYear} ใช่หรือไม่? <br />
                                <span className="text-xs text-red-500 mt-1 block">การกระทำนี้ไม่สามารถเรียกคืนได้</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-colors"
                                >
                                    ยืนยันลบ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
