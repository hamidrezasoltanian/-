import { generateId } from './idUtils.ts';

// Helper to ensure an array exists and is an array
const ensureArray = (arr) => Array.isArray(arr) ? arr : [];

// Migrate a single Field
const migrateField = (field) => ({
    id: field.id || generateId('field'),
    name: field.name || `field_${Date.now()}`,
    label: field.label || 'فیلد جدید',
    type: ['text', 'number', 'date', 'textarea', 'checkbox', 'select', 'product'].includes(field.type) ? field.type : 'text',
    required: typeof field.required === 'boolean' ? field.required : false,
    width: ['half', 'full'].includes(field.width) ? field.width : 'half',
    options: ensureArray(field.options),
});

// Migrate a single Step
const migrateStep = (step) => ({
    id: step.id || generateId('step'),
    title: step.title || 'مرحله جدید',
    fields: ensureArray(step.fields).map(migrateField),
});

// Migrate a single Workflow
export const migrateWorkflow = (workflow) => ({
    id: workflow.id || generateId('wf'),
    name: workflow.name || 'فرآیند بازیابی شده',
    steps: ensureArray(workflow.steps).map(migrateStep),
});

// Migrate OrderProductItem
const migrateOrderProductItem = (item) => ({
    productId: item.productId || '',
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
});

// Migrate a single Order
export const migrateOrder = (order) => {
    const migratedStepsData = {};
    if (order.steps_data && typeof order.steps_data === 'object') {
        Object.keys(order.steps_data).forEach(stepId => {
            const stepData = order.steps_data[stepId];
            if (stepData && typeof stepData.data === 'object') {
                const migratedData = {};
                Object.keys(stepData.data).forEach(fieldId => {
                    const value = stepData.data[fieldId];
                    // Heuristic to detect and migrate a product list
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'productId' in value[0]) {
                        migratedData[fieldId] = ensureArray(value).map(migrateOrderProductItem);
                    } else {
                        migratedData[fieldId] = value;
                    }
                });
                 migratedStepsData[stepId] = {
                    data: migratedData,
                    completed_at: stepData.completed_at,
                };
            }
        });
    }

    return {
        id: order.id || generateId('order'),
        workflowId: order.workflowId || '',
        created_at: order.created_at || new Date().toISOString(),
        title: order.title || 'سفارش بازیابی شده',
        steps_data: migratedStepsData,
    };
};

// Migrate a single Product
export const migrateProduct = (product) => ({
    id: product.id || generateId('prod'),
    name: product.name || 'کالای بازیابی شده',
    code: product.code || 'N/A',
    irc: product.irc || '',
    netWeight: String(product.netWeight || ''),
    grossWeight: String(product.grossWeight || ''),
    description: product.description || '',
    currencyPrice: String(product.currencyPrice || '0'),
    currencyType: ['USD', 'EUR', 'AED'].includes(product.currencyType) ? product.currencyType : 'USD',
    manufacturer: product.manufacturer || '',
});

// Migrate ProformaItem
const migrateProformaItem = (item) => ({
    productId: item.productId || '',
    name: item.name || '',
    code: item.code || '',
    irc: item.irc || '',
    netWeight: String(item.netWeight || ''),
    grossWeight: String(item.grossWeight || ''),
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    price: typeof item.price === 'number' ? item.price : 0,
    currency: ['USD', 'EUR', 'AED'].includes(item.currency) ? item.currency : 'USD',
});

// Migrate a single Proforma
export const migrateProforma = (proforma) => ({
    id: proforma.id || generateId('prof'),
    companyName: proforma.companyName || 'شرکت بازیابی شده',
    date: proforma.date || new Date().toISOString(),
    items: ensureArray(proforma.items).map(migrateProformaItem),
    total: typeof proforma.total === 'number' ? proforma.total : 0,
});

// Migrate a single User
export const migrateUser = (user) => ({
    id: user.id || generateId('user'),
    username: user.username || 'user_restored',
    password: user.password, // Keep password if it exists
    role: ['admin', 'sales', 'procurement'].includes(user.role) ? user.role : 'admin',
});