import React, { useState, useEffect } from 'react';
import { HospitalProfile, User } from '../types';
import { FileText, Upload, Eye, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

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
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Generate year options (current year + 1 down to current year - 4)
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

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
            alert('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
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
                alert('อัปโหลดไฟล์เรียบร้อยแล้ว');
            } else {
                alert('เกิดข้อผิดพลาดในการอัปโหลด');
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
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

            {/* Upload Button - Conditional? Assuming existing logic where users can upload or maybe just admins. 
          The request says "Select year to attach file". 
          I will allow upload if user is present (or maybe restrict to admin if strict). 
          For now, I'll allow it if logged in, or if it's open. The prompt implies "Ability to attach". 
          Let's show it but maybe protect endpoint or check role if needed. 
          Given the context, I'll show it if currentUser is present (consistent with "Login before view", maybe upload too).
          Actually let's restrict upload to ADMIN or if user is logged in. 
          Dashboard usually shows Edit controls for ADMIN.
      */}
            {currentUser && (currentUser.role === 'ADMIN') && (
                <div className="pt-2 border-t border-slate-100">
                    <label className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-dashed border-slate-300 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 text-slate-500 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ใหม่'}
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            )}
        </div>
    );
};
