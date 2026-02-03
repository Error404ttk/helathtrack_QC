import { LucideIcon, Shield, LayoutDashboard, Database, Star, FileText } from 'lucide-react';

export interface ChangeLogItem {
    icon: LucideIcon;
    iconColor: string; // e.g., "text-emerald-600"
    title: string;
    items: string[];
}

export interface ReleaseNote {
    version: string;
    date: string;
    description?: string;
    changes: ChangeLogItem[];
    isMajor?: boolean;
}

export const changelogData: ReleaseNote[] = [
    {
        version: "2.0.1",
        date: "3 ก.พ. 2026",
        isMajor: false,
        description: "New Feature: Hospital Profile Tracking",
        changes: [
            {
                icon: FileText,
                iconColor: "text-indigo-600",
                title: "Hospital Profile",
                items: [
                    "เพิ่มระบบติดตามเอกสาร Hospital Profile (ข้อมูลองค์กรประจำปี)",
                    "รองรับการอัปโหลดไฟล์ PDF แยกตามปี พ.ศ.",
                    "ระบบจัดการไฟล์: อัปโหลด, ดูไฟล์, แก้ไข (อัปโหลดทับ), และลบไฟล์",
                    "เพิ่มยืนยันการลบแบบ Modal และแจ้งเตือนสถานะการทำงานด้วย Notification Toast"
                ]
            }
        ]
    },
    {
        version: "2.0.0",
        date: "28 ม.ค. 2026",
        isMajor: true,
        description: "Major UI update and security enhancements",
        changes: [
            {
                icon: Shield,
                iconColor: "text-emerald-600",
                title: "Security Improvements",
                items: [
                    "เพิ่มระบบป้องกันการเข้าถึงไฟล์ (Unauthorized Access Prevention)",
                    "ปรับปรุง Popup แจ้งเตือนเมื่อไม่มีสิทธิ์เข้าถึงให้สวยงามและเข้าใจง่าย",
                    "แก้ไขบั๊ก Authentication ที่ปุ่มเมนูค้างหลัง Logout"
                ]
            },
            {
                icon: LayoutDashboard,
                iconColor: "text-blue-600",
                title: "UI/UX Enhancements",
                items: [
                    "ปรับดีไซน์ Footer ใหม่ (Version 2)",
                    "เพิ่มหน้า Changelog เพื่อแจ้งข่าวสารการอัปเดต"
                ]
            }
        ]
    },
    {
        version: "1.0.0",
        date: "1 ม.ค. 2026",
        changes: [
            {
                icon: Database,
                iconColor: "text-purple-600",
                title: "Initial Release",
                items: [
                    "ระบบจัดการเอกสารคุณภาพ (Quality Document Management)",
                    "ระบบติดตามสถานะ Service Profile และ CQI",
                    "Dashboard แสดงภาพรวมแยกตามแผนก",
                    "ระบบจัดการผู้ใช้งาน (Admin/User)"
                ]
            }
        ]
    }
];

export const getLatestVersion = () => changelogData[0];
