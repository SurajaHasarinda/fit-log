import React from 'react';

interface WeekDaySelectorProps {
    selectedDays: string[];
    onChange: (days: string[]) => void;
    disabled?: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({ selectedDays, onChange, disabled }) => {
    const toggleDay = (day: string) => {
        if (disabled) return;
        if (selectedDays.includes(day)) {
            onChange(selectedDays.filter(d => d !== day));
        } else {
            onChange([...selectedDays, day]);
        }
    };

    return (
        <div className="flex gap-2 flex-wrap">
            {DAYS.map(day => {
                const isSelected = selectedDays.includes(day);
                return (
                    <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        disabled={disabled}
                        className={`
                            w-12 h-12 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer
                            ${isSelected
                                ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/20 scale-105'
                                : 'bg-surface-700 text-slate-400 hover:bg-surface-600 hover:text-slate-200'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {day}
                    </button>
                );
            })}
        </div>
    );
};

export default WeekDaySelector;
