import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import { ClockIcon } from '../shared/Icons.tsx';

const ActivityView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { activityLogs, users } = context;

    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return activityLogs;
        const lowercasedFilter = searchTerm.toLowerCase();
        return activityLogs.filter(log =>
            log.username.toLowerCase().includes(lowercasedFilter) ||
            log.details.toLowerCase().includes(lowercasedFilter) ||
            log.entityType.toLowerCase().includes(lowercasedFilter)
        );
    }, [activityLogs, searchTerm]);
    
    const formatTimestamp = (iso: string) => {
        const date = new Date(iso);
        return `${toJalali(iso)} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
            <input 
                type="text" 
                placeholder="جستجو در فعالیت‌ها (نام کاربر، نوع عملیات، جزئیات...)" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex-grow bg-white shadow-lg rounded-xl overflow-auto">
                <ul className="divide-y divide-gray-200">
                    {filteredLogs.map(log => (
                        <li key={log.id} className="p-4 flex items-start space-x-4 space-x-reverse">
                            <div className="flex-shrink-0 pt-1">
                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                </span>
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-700">{log.details}</p>
                                <div className="text-xs text-gray-500 mt-1">
                                    توسط <strong className="font-semibold">{log.username}</strong> در تاریخ {formatTimestamp(log.timestamp)}
                                </div>
                            </div>
                        </li>
                    ))}
                     {filteredLogs.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <p>هیچ فعالیتی برای نمایش یافت نشد.</p>
                        </div>
                     )}
                </ul>
            </div>
        </div>
    );
};

export default ActivityView;