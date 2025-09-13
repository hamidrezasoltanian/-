export const formatDuration = (ms: number): string => {
    if (isNaN(ms) || ms < 0) ms = 0;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} روز و ${hours % 24} ساعت`;
    if (hours > 0) return `${hours} ساعت و ${minutes % 60} دقیقه`;
    if (minutes > 0) return `${minutes} دقیقه و ${seconds % 60} ثانیه`;
    if (seconds > 0) return `${seconds} ثانیه`;
    return 'کمتر از یک ثانیه';
};
