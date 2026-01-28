import React, { useState } from 'react';
import { X, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { changelogData, ReleaseNote, ChangeLogItem } from '../src/data/changelog';

interface ChangelogModalProps {
    onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
    // Always start with the latest version selected
    const [selectedVersion, setSelectedVersion] = useState<ReleaseNote>(changelogData[0]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            🎉 What's New
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
                                v{selectedVersion.version}
                            </span>
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            อัปเดตล่าสุด: {selectedVersion.date}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Main Content (Selected Version) */}
                    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {selectedVersion.description && (
                            <div className="mb-6 p-4 bg-emerald-50 rounded-lg text-emerald-800 text-sm border border-emerald-100">
                                {selectedVersion.description}
                            </div>
                        )}

                        <div className="space-y-4">
                            {selectedVersion.changes.map((change, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <change.icon className={`w-4 h-4 ${change.iconColor}`} />
                                        {change.title}
                                    </h4>
                                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside ml-1">
                                        {change.items.map((item, itemIdx) => (
                                            <li key={itemIdx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar / History List */}
                    <div className="w-48 bg-slate-50 border-l border-slate-200 overflow-y-auto hidden md:block">
                        <div className="p-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                History
                            </h4>
                            <div className="space-y-1">
                                {changelogData.map((release) => (
                                    <button
                                        key={release.version}
                                        onClick={() => setSelectedVersion(release)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${selectedVersion.version === release.version
                                                ? 'bg-emerald-100 text-emerald-700 font-medium'
                                                : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        <span>v{release.version}</span>
                                        {selectedVersion.version === release.version && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile History Selection (Only visible on small screens to replace sidebar) */}
                <div className="md:hidden border-t border-slate-100 p-3 bg-slate-50 overflow-x-auto flex gap-2">
                    {changelogData.map((release) => (
                        <button
                            key={release.version}
                            onClick={() => setSelectedVersion(release)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${selectedVersion.version === release.version
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-600 border-slate-200'
                                }`}
                        >
                            v{release.version}
                        </button>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
};
