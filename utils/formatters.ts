// This file was renamed to formatters.js to fix MIME type issues on static hosting.

export const formatNumber = (num) => {
    const number = Number(num);
    if (num === null || num === undefined || isNaN(number)) {
        return '';
    }
    return new Intl.NumberFormat('fa-IR').format(number);
};
