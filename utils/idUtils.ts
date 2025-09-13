// This file was renamed to idUtils.js to fix MIME type issues on static hosting.
export const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
