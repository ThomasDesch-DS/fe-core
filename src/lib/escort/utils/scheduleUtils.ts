/**
 * Parse a schedule string into structured data
 */
export function parseSchedule(text: string, daysMap: Record<string, string>) {
    return text.split(';').map(part => {
        const [d, slots] = part.trim().split(' ');
        if (!daysMap[d?.toUpperCase()]) return null;
        return {
            day: daysMap[d.toUpperCase()],
            slots: slots.split(',').map(s => {
                const [start, end] = s.split('-');
                return { startHourWithMinutes: start.trim(), endHourWithMinutes: end.trim() };
            })
        };
    }).filter(Boolean);
}

/**
 * Add a new time slot for a specific day
 */
export function addTimeSlot(daySlots, day) {
    const updatedSlots = {
        ...daySlots,
        [day]: [...daySlots[day], {start: '', end: ''}]
    };
    return updatedSlots;
}

/**
 * Remove a time slot for a specific day and index
 */
export function removeTimeSlot(daySlots, day, index) {
    const newDaySlots = {...daySlots};
    newDaySlots[day].splice(index, 1);
    return newDaySlots;
}

/**
 * Copy schedule from one day to all other days
 */
export function copyScheduleToAllDays(daySlots, sourceDay) {
    const sourceSlots = [...daySlots[sourceDay]];
    const updatedSlots = {...daySlots};
    
    // Copy to all other days
    Object.keys(updatedSlots).forEach(day => {
        if (day !== sourceDay) {
            updatedSlots[day] = sourceSlots.map(slot => ({ start: slot.start, end: slot.end }));
        }
    });
    
    return updatedSlots;
}