import React, { useEffect, useMemo, useRef } from 'react';
import { fromJalali, toJalali } from '../../utils/dateUtils.ts';
import { generateId } from '../../utils/idUtils.ts';
import { CalendarIcon } from './Icons.tsx';

// @FIX: Declare kamaDatepicker as a global variable to resolve TypeScript error.
declare const kamaDatepicker: any;

const KamaDatePicker = ({ value, onChange, name, error }) => {
    const inputId = useMemo(() => `datepicker-${name}-${generateId()}`, [name]);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (typeof kamaDatepicker === 'undefined') {
            console.error('kamaDatepicker is not loaded.');
            return;
        }

        const datePickerOptions = {
            closeafterselect: true,
            nextButtonIcon: "→",
            previousButtonIcon: "←",
            forceFarsiDigits: true,
            markToday: true,
            gotoToday: true,
            onclose: () => {
                // @FIX: Cast element to HTMLInputElement to access 'value' property.
                const inputElement = document.getElementById(inputId) as HTMLInputElement | null;
                if (inputElement && inputElement.value) {
                    const isoDate = fromJalali(inputElement.value);
                    if (isoDate && isoDate !== value) {
                        onChangeRef.current({ target: { name, value: isoDate } });
                    }
                }
            }
        };

        const instance = kamaDatepicker(inputId, datePickerOptions);
        
        return () => {
            try {
                if (instance && typeof instance.destroy === 'function') {
                    instance.destroy();
                }
                 const pickerElement = document.querySelector('.bd-main');
                if (pickerElement) {
                    pickerElement.remove();
                }
            } catch (e) {
                // KamaDatePicker might not have a clean destroy method
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputId, name]);

    useEffect(() => {
        // @FIX: Cast element to HTMLInputElement to access 'value' property.
        const inputElement = document.getElementById(inputId) as HTMLInputElement | null;
        if (inputElement) {
            const jalaliDate = toJalali(value);
            if (inputElement.value !== jalaliDate) {
                 inputElement.value = jalaliDate;
            }
        }
    }, [value, inputId]);

    const handleBlur = (e) => {
        const manualValue = e.target.value;
        const currentValueInJalali = toJalali(value);
        
        if (manualValue !== currentValueInJalali) {
            const isoDate = fromJalali(manualValue);
            onChangeRef.current({ target: { name, value: isoDate } });
        }
    };

    return (
        <div className="date-input-container">
            <input
                id={inputId}
                type="text"
                defaultValue={toJalali(value)}
                onBlur={handleBlur}
                className={`w-full border rounded-lg shadow-sm p-3 date-input text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="YYYY/MM/DD"
                autoComplete="off"
                name={name}
            />
            <div className="date-input-icon">
                <CalendarIcon className="h-5 w-5" />
            </div>
        </div>
    );
};

export default KamaDatePicker;