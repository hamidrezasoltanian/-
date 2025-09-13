export const formatNumber = (num) => {
    const number = Number(num);
    if (num === null || num === undefined || isNaN(number)) {
        return '';
    }
    return new Intl.NumberFormat('fa-IR').format(number);
};