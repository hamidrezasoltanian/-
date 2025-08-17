
export const formatNumber = (num: number | string | null | undefined): string => {
    const number = Number(num);
    if (num === null || num === undefined || isNaN(number)) {
        return '';
    }
    return new Intl.NumberFormat('fa-IR').format(number);
};
