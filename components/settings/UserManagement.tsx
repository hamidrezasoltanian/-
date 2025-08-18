import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { User, UserRole } from '../../types.ts';
import { generateId } from '../../utils/idUtils.ts';
import Modal from '../shared/Modal.tsx';
import ConfirmationModal from '../shared/ConfirmationModal.tsx';

const UserForm: React.FC<{ user: Partial<User>; onSave: (user: Partial<User>) => void; onCancel: () => void; }> = ({ user, onSave, onCancel }) => {
    const [localUser, setLocalUser] = useState(user);
    const { showNotification } = useContext(AppContext)!;

    const handleChange = (field: keyof User, value: string) => {
        setLocalUser(p => ({ ...p, [field]: value }));
    };

    const handleSave = () => {
        if (!localUser.username?.trim() || !localUser.role || (!localUser.id && !localUser.password?.trim())) {
            showNotification("نام کاربری، نقش و (برای کاربر جدید) رمز عبور الزامی است.", "error");
            return;
        }
        onSave(localUser);
    };

    const isEditing = !!user.id;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEditing ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</h2>
            <div className="space-y-4">
                <input type="text" placeholder="نام کاربری" value={localUser.username || ''} onChange={e => handleChange('username', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50" />
                <input type="password" placeholder={isEditing ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'} value={localUser.password || ''} onChange={e => handleChange('password', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50" />
                <select value={localUser.role || ''} onChange={e => handleChange('role', e.target.value)} className="w-full p-3 border rounded-lg bg-white appearance-none">
                    <option value="" disabled>انتخاب نقش</option>
                    <option value="admin">مدیر</option>
                    <option value="sales">کارشناس فروش</option>
                    <option value="procurement">کارشناس بازرگانی</option>
                </select>
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">لغو</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">ذخیره</button>
            </div>
        </div>
    );
};


const UserManagement: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { users, setUsers, showNotification, currentUser, logActivity } = context;

    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleSave = (userToSave: Partial<User>) => {
        const trimmedUsername = userToSave.username?.trim();

        if (userToSave.id) { // Update
            setUsers(prev => prev.map(u => {
                if (u.id === userToSave.id) {
                    const updatedUser: User = {
                        ...u,
                        username: trimmedUsername!,
                        role: userToSave.role!
                    };
                    // Only update password if a new, non-empty one is provided
                    if (userToSave.password && userToSave.password.trim()) {
                        updatedUser.password = userToSave.password;
                    }
                    return updatedUser;
                }
                return u;
            }));
            showNotification("کاربر با موفقیت به‌روزرسانی شد");
            logActivity('UPDATE', 'User', `کاربر '${trimmedUsername}' را به‌روزرسانی کرد.`, userToSave.id);
        } else { // Create
            const newUser: User = {
                id: generateId('user'),
                username: trimmedUsername!,
                password: userToSave.password!, // Validation is in form
                role: userToSave.role!,
            };
            setUsers(prev => [...prev, newUser]);
            showNotification("کاربر با موفقیت ایجاد شد");
            logActivity('CREATE', 'User', `کاربر جدید '${newUser.username}' را با نقش '${newUser.role}' ایجاد کرد.`, newUser.id);
        }
        setEditingUser(null);
    };

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        if (deleteConfirmId === currentUser?.id) {
            showNotification("شما نمی‌توانید حساب کاربری خود را حذف کنید", "error");
            return;
        }
        const userToDelete = users.find(u => u.id === deleteConfirmId);
        setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        showNotification("کاربر با موفقیت حذف شد");
        if (userToDelete) {
            logActivity('DELETE', 'User', `کاربر '${userToDelete.username}' را حذف کرد.`, deleteConfirmId);
        }
    };

    const roleMap: Record<UserRole, string> = {
        admin: 'مدیر',
        sales: 'کارشناس فروش',
        procurement: 'کارشناس بازرگانی'
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">مدیریت کاربران</h3>
                <button onClick={() => setEditingUser({})} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg">+ افزودن کاربر</button>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['نام کاربری', 'نقش', 'عملیات'].map(h => 
                                <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                                <td className="px-6 py-4 text-gray-500">{roleMap[user.role]}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900 ml-4">ویرایش</button>
                                    <button onClick={() => setDeleteConfirmId(user.id)} className="text-red-600 hover:text-red-900">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal show={!!editingUser} onClose={() => setEditingUser(null)}>
                {editingUser && <UserForm user={editingUser} onSave={handleSave} onCancel={() => setEditingUser(null)} />}
            </Modal>
            
            <ConfirmationModal 
                show={!!deleteConfirmId}
                message="آیا از حذف این کاربر مطمئن هستید؟"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
};

export default UserManagement;