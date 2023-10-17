// CONSTANTS - HARD_TYPED
// USUALLY RETRIEVED FROM BACKEND
export const EMPLOYEES = [{ employeeId: 1, name: 'X1' }, { employeeId: 2, name: 'X2' }, { employeeId: 3, name: 'X3' }, { employeeId: 4, name: 'X4' },
{ employeeId: 5, name: 'X5' }, { employeeId: 6, name: 'X6' }, { employeeId: 7, name: 'X7' }];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const DAY_TYPES = ['Morning', 'Lunch', 'Afternoon'];
export const LOCATIONS = ['Up Stairs', 'Down Stairs', 'Parking Lot'];
export const LUNCH_LOCATIONS = ['A', 'B', 'C', 'D'];

// constructs a data for load table from shifts data
export const makeLoadTableData = (shiftData) => {
    const tempData = [];
    EMPLOYEES.forEach((employee) => {
        let data = { staffMember: employee.employeeId, total: 0 };
        DAYS.forEach((day) => {

            data = {
                ...data,
                [day]: [],
            };

        })
        tempData.push(data);
    });
    shiftData?.forEach((event) => {
        if (event.type !== "Lunch")
            Object.keys(event).forEach((day) => {
                if (DAYS.includes(day) && event[day].employeeId) {
                    let empIndex = tempData.findIndex((data) => data.staffMember === event[day].employeeId);
                    if (empIndex >= 0) tempData[empIndex][day].push({ type: event.type, location: event.location })
                }
            })
    });
    tempData.forEach(data => {
        Object.keys(data).forEach(key => { if (DAYS.includes(key)) data.total += data[key].length; });
    });

    return tempData;
}

export const makeLoadLunchData = (shiftData) => {
    const tempData = [];
    EMPLOYEES.forEach((employee) => {
        let data = { staffMember: employee.employeeId, total: 0 };
        DAYS.forEach((day) => {

            data = {
                ...data,
                [day]: [],
            };

        })
        tempData.push(data);
    });
    shiftData?.forEach((event) => {
        if (event.type === "Lunch")
            Object.keys(event).forEach((day) => {
                if (DAYS.includes(day) && event[day].employeeId) {
                    let empIndex = tempData.findIndex((data) => data.staffMember === event[day].employeeId);
                    if (empIndex >= 0) tempData[empIndex][day].push({ type: event.type, location: event.location })
                }
            })
    });
    tempData.forEach(data => {
        Object.keys(data).forEach(key => { if (DAYS.includes(key)) data.total += data[key].length; });
    });

    return tempData;
}