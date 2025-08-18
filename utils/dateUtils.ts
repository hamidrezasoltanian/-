// This requires persian-date to be loaded globally from index.html
declare const persianDate: any;

const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toEnglishDigits(str: string): string {
    if (!str) return '';
    let result = String(str);
    for (let i = 0; i < 10; i++) {
        const farsiReg = new RegExp(farsiDigits[i], 'g');
        const arabicReg = new RegExp(arabicDigits[i], 'g');
        result = result.replace(farsiReg, String(i)).replace(arabicReg, String(i));
    }
    return result;
}


export const toJalali = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  // Add a guard to prevent crashes if executed in an environment where the script hasn't loaded (e.g., SSR)
  if (typeof persianDate === 'undefined') {
    console.warn("persian-date library not loaded. Cannot convert to Jalali.");
    return dateString; // Fallback to original string to avoid crashing
  }
  try {
    return new persianDate(new Date(dateString)).format('YYYY/MM/DD');
  } catch (e) {
    console.warn("Could not convert to Jalali:", dateString, e);
    return '';
  }
};

export const fromJalali = (jalaliString: string | null | undefined): string => {
  if (!jalaliString) return '';
  // Add a guard for safety
  if (typeof persianDate === 'undefined') {
    console.warn("persian-date library not loaded. Cannot convert from Jalali.");
    return ''; // Cannot proceed without the library
  }
  try {
    // 1. Convert any Farsi/Arabic digits to English digits and trim whitespace
    const englishDateString = toEnglishDigits(String(jalaliString).trim());

    // 2. Use a regex to extract all number sequences. This is very robust.
    const numbers = englishDateString.match(/\d+/g);

    // We should find exactly 3 parts (year, month, day).
    if (!numbers || numbers.length !== 3) {
      console.warn("Jalali date format not recognized:", jalaliString, "Found parts:", numbers);
      return '';
    }

    const [year, month, day] = numbers.map(n => parseInt(n, 10));

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.warn("Could not parse date parts:", { year, month, day });
        return '';
    }
    
    // Basic validation for Jalali date parts to prevent crashes in persian-date
    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn("Invalid Jalali date parts:", { year, month, day });
        return '';
    }

    // 3. Convert to Gregorian and then to ISO string
    return new persianDate([year, month, day]).toDate().toISOString();
  } catch (e) {
    console.warn("Could not convert from Jalali:", jalaliString, e);
    return '';
  }
};