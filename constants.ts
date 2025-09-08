
import { Workflow, User } from './types.ts';
import { generateId } from './utils/idUtils.ts';

export const DEFAULT_WORKFLOW: Workflow = {
    id: generateId('wf'),
    name: 'فرآیند پیش‌فرض واردات',
    steps: [
        { 
            id: generateId('step'), 
            title: 'ثبت اولیه', 
            fields: [
                { id: generateId('field'), name: 'order_date', label: 'تاریخ ثبت', type: 'date', required: true, width: 'half' },
                { id: generateId('field'), name: 'customer_name', label: 'نام مشتری', type: 'text', required: true, width: 'half' },
                { id: generateId('field'), name: 'incoterms', label: 'اینکوترمز', type: 'select', required: true, width: 'half', options: ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] },
                { id: generateId('field'), name: 'products_list', label: 'لیست کالاها', type: 'product', required: true, width: 'full' },
            ]
        },
        { 
            id: generateId('step'), 
            title: 'ارسال', 
            fields: [
                { id: generateId('field'), name: 'shipping_date', label: 'تاریخ ارسال', type: 'date', required: false, width: 'half' },
                { id: generateId('field'), name: 'tracking_code', label: 'کد رهگیری', type: 'text', required: false, width: 'half' },
            ]
        }
    ]
};

export const DEFAULT_USERS: User[] = [
    { id: generateId('user'), username: 'admin', password: '123', role: 'admin' },
    { id: generateId('user'), username: 'sales', password: '123', role: 'admin' },
    { id: generateId('user'), username: 'procurement', password: '123', role: 'admin' },
];