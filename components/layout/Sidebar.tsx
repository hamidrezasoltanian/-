
import React from 'react';
import { View } from '../../contexts/AppContext.ts';
import { User } from '../../types.ts';
import {
    HomeIcon,
    ClipboardListIcon,
    BoxIcon,
    DocumentTextIcon,
    ChartBarIcon,
    BellIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon
} from '../shared/Icons.tsx';

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    logout: () => void;
    currentUser: User;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
    tabs: { key: View; label: string }[];
}

const iconMap: Record<View, React.ElementType> = {
    home: HomeIcon,
    workflow: ClipboardListIcon,
    products: BoxIcon,
    proforma: DocumentTextIcon,
    reports: ChartBarIcon,
    activity: BellIcon,
    settings: Cog6ToothIcon,
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, logout, currentUser, isCollapsed, setIsCollapsed, tabs }) => {
    
    const SidebarLink: React.FC<{ tab: { key: View, label: string } }> = ({ tab }) => {
        const Icon = iconMap[tab.key];
        const isActive = activeView === tab.key;
        return (
            <button
                onClick={() => setActiveView(tab.key)}
                className={`flex items-center p-3 my-1 rounded-lg w-full text-right transition-colors duration-200 ${
                    isActive
                        ? 'sidebar-link-active font-bold'
                        : 'text-gray-600 hover:bg-slate-100'
                }`}
            >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="mr-4 sidebar-link-label">{tab.label}</span>
            </button>
        );
    };

    return (
        <aside className={`sidebar bg-white flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-between border-b border-slate-200 p-4 h-[65px]">
                <div className="flex items-center">
                     <span className="text-xl p-1 bg-blue-600 text-white rounded-md font-bold">📊</span>
                    <h1 className={`text-xl font-bold text-blue-600 mr-2 sidebar-logo-text`}>EZ Dashboard</h1>
                </div>
                 <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg md:hidden">
                    <Bars3Icon className="w-6 h-6"/>
                </button>
            </div>
            
            <nav className="flex-grow px-4 py-4">
                {tabs.map(tab => (
                    <SidebarLink key={tab.key} tab={tab as { key: View; label:string }} />
                ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
                 <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg mb-4 w-full hidden md:block">
                    <Bars3Icon className="w-6 h-6 mx-auto"/>
                </button>
                <div className="flex items-center">
                     <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                        {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="mr-3 sidebar-footer-label">
                        <p className="text-sm font-semibold text-gray-800">{currentUser.username}</p>
                        <p className="text-xs text-gray-500">{currentUser.role}</p>
                    </div>
                </div>
                 <button
                    onClick={logout}
                    className="flex items-center p-3 mt-4 rounded-lg w-full text-right text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                >
                    <ArrowRightOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
                    <span className="mr-4 sidebar-footer-label">خروج</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
