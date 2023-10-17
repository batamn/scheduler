import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { createColumnHelper } from '@tanstack/react-table';
import {
    DAYS,
    DAY_TYPES,
    EMPLOYEES,
    LOCATIONS,
    LUNCH_LOCATIONS,
    makeLoadLunchData,
    makeLoadTableData
} from './makeData';
import { Table } from './Table';

const columnHelper = createColumnHelper();

function App() {
    const [events, setEvents] = useState();
    const [loadData, setLoadData] = useState([]);

    // calculates invalid options for select component
    const calculateOptions = (list, day, shift) => {
        return list.filter(employee => {
            if (employee.total >= 7) return true;
            return employee[day].some(task => task?.type === shift)
        });
    };

    // gets a random number between max and min (both inclusive)
    const getRandomNumber = (max, min) => Math.floor(Math.random() * (max - min + 1) + min);

    // get random employee id 
    const generateRandomEmployeeId = (max, min, invalidData) => {
        let found = false;
        let randomEmployeeId;
        while (!found) {
            randomEmployeeId = getRandomNumber(max, min);
            if (invalidData.length === 0) found = true;
            if (invalidData.length === max) {
                found = true;
                randomEmployeeId = undefined;
            }
            if (!invalidData.some(emp => emp.staffMember === randomEmployeeId)) {
                found = true;
            }
        }

        return randomEmployeeId;
    }

    // Populates the table whether to fill out empty shifts or beginning with empty table
    // TODO: Refactor for code repitition
    const populateList = () => {
        let newList = [];
        // populating the morning and afternoon shifts
        events?.forEach((event, index) => {
            let row = event;
            Object.keys(event).forEach((day) => {
                if (DAYS.includes(day) && event[day].employeeId === undefined && row.type !== 'Lunch') {
                    // making sure to check every change
                    const currentLoadData = makeLoadTableData([...events.slice(0, index), row, ...events.slice(index)]);
                    let invalidOptions = calculateOptions(currentLoadData, day, row.type);
                    let randomEmployeeId = generateRandomEmployeeId(EMPLOYEES.length, 1, invalidOptions);
                    row[day].employeeId = randomEmployeeId;
                }
                newList[index] = row;
            })
        });

        // populating the lunch slots
        // Assuming that only employees who work in the morning and afternoon can book a lunch slot
        newList.forEach((event, index) => {
            let row = event;
            const currentLoadData = makeLoadTableData([...events.slice(0, index), row, ...events.slice(index)]);
            Object.keys(event).forEach((day) => {
                if (DAYS.includes(day) && event.type === 'Lunch') {
                    let invalidLunchOptions = [...calculateOptions(makeLoadLunchData(events), day, row.type), ...(currentLoadData.filter(data => data[day].length === 0))]
                    let randomEmployeeId = generateRandomEmployeeId(EMPLOYEES.length, 1, invalidLunchOptions);
                    row[day].employeeId = randomEmployeeId;
                }
            })
            newList[index] = row;
        })

        setEvents(newList);
        return newList;
    };

    const TableCell = ({ getValue, row: { index }, column: { id }, table }) => {
        const initialValue = getValue();
        const options = useMemo(() =>
            events[index].type !== 'Lunch' ?
                calculateOptions(makeLoadTableData(events), id, events[index].type) :
                calculateOptions(makeLoadLunchData(events), id, events[index].type)
            , [loadData]);

        const [value, setValue] = useState(initialValue);

        const onChange = (value) => {
            table.options.meta?.updateData(index, id, { employeeId: parseInt(value) })
        }

        useEffect(() => {
            setValue(initialValue);
        }, [initialValue]);

        if (id === 'shiftName') return <span>{initialValue}</span>;

        return (
            <select
                name="employees"
                onChange={e => onChange(e.target.value)}
                value={value.employeeId || 'placeholder'}
            >
                <option value="placeholder" disabled>Select your option</option>
                {EMPLOYEES.map((employee) =>
                    <option
                        key={employee.employeeId + '_' + employee.name}
                        disabled={options.some(emp => emp.staffMember === employee.employeeId)}
                        value={employee.employeeId}
                    >
                        {employee.name}
                    </option>
                )}
            </select>
        )
    };

    const columns = useMemo(() => {
        return [
            columnHelper.accessor(row => `${row.type} ${row.location}`, {
                header: () => "",
                id: 'shiftName',
            }),
            columnHelper.accessor('Monday', {
                header: () => "Monday",
                cell: TableCell,

            }),
            columnHelper.accessor('Tuesday', {
                header: () => "Tuesday",
                cell: TableCell,

            }),
            columnHelper.accessor('Wednesday', {
                header: () => "Wednesday",
                cell: TableCell,
            }),
            columnHelper.accessor('Thursday', {
                header: () => "Thursday",
                cell: TableCell,

            }),
            columnHelper.accessor('Friday', {
                header: () => "Friday",
                cell: TableCell,
            }),
        ]
    }, [loadData]);

    const loadColumns = useMemo(() => [
        columnHelper.accessor('staffMember', {
            header: () => "Staff Member",
            cell: info => EMPLOYEES.find(emp => emp.employeeId === info.getValue()).name,

        }),
        columnHelper.accessor('Monday', {
            header: () => "Monday",
            cell: info => info.getValue().length,

        }),
        columnHelper.accessor('Tuesday', {
            header: () => "Tuesday",
            cell: info => info.getValue().length,

        }),
        columnHelper.accessor('Wednesday', {
            header: () => "Wednesday",
            cell: info => info.getValue().length,

        }),
        columnHelper.accessor('Thursday', {
            header: () => "Thursday",
            cell: info => info.getValue().length,

        }),
        columnHelper.accessor('Friday', {
            header: () => "Friday",
            cell: info => info.getValue().length,
        }),
        columnHelper.accessor('total', {
            header: () => "Totals",
            cell: info => info.getValue(),
        }),
    ], [loadData])

    const onInitialize = () => {
        const shifts = [];
        DAY_TYPES.forEach((type) => {
            let locationList;
            if (type === 'Lunch') {
                locationList = LUNCH_LOCATIONS;
            } else {
                locationList = LOCATIONS;
            }

            locationList.forEach((location) => {
                let shift = { type: type, location: location };
                DAYS.forEach((day) => {

                    shift = {
                        ...shift,
                        [day]: { employeeId: undefined },
                    };

                })
                shifts.push(shift);
            })
        })
        setEvents(shifts);
    }

    useEffect(() => {
        const eventsData = JSON.parse(localStorage.getItem('eventsData'));
        if (eventsData) {
            setEvents(eventsData);
        } else {
            onInitialize();
        }
    }, []);

    useEffect(() => {
        // save current progress to local storage
        if (events) {
            localStorage.setItem('eventsData', JSON.stringify(events));
        }
        // re organizing data on shifts to suit the table for Load
        const loadTableData = makeLoadTableData(events);
        setLoadData(loadTableData);
    }, [events]);

    const options = {
        updateData: (rowIndex, columnName, value) => {
            setEvents(old =>
                old.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...old[rowIndex],
                            [columnName]: value,
                        }
                    }
                    return row
                })
            )
        },
    };

    if (events === undefined) return <></>;

    return (
        <div className="App">
            <h2>Schedule</h2>
            <Table data={events} columns={columns} options={options} />
            <h2>Load</h2>
            <Table data={loadData} columns={loadColumns} />
            <div className='buttonGroup'>
                <button onClick={() => populateList()}>Populate</button>
                <button onClick={() => onInitialize()}>Reset</button>
            </div>
        </div>
    );
}

export default App;
