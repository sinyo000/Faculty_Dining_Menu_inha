ㅊonst { useState, useEffect } = React;

function formatDate(date) {
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return month + day;
}

function getFullDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' };
    return new Intl.DateTimeFormat('ko-KR', options).format(date);
}

let menuData = [];

function fetchMenuData(callback) {
    fetch('/menu')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            menuData = data;
            console.log('Received data:', data);
            callback();
        })
        .catch(error => console.error('Error fetching data:', error));
}

function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        fetchMenuData(() => updateFilteredData(currentDate));
    }, []);

    const updateFilteredData = (date) => {
        const formattedDate = formatDate(date);
        const newFilteredData = menuData.filter(item => {
            const itemDate = item.날짜.split(' ')[1].replace('(', '').replace(')', '').replace('.', '').trim();
            const itemMonthDay = itemDate.slice(0, 2) + itemDate.slice(2, 4);
            return itemMonthDay === formattedDate;
        }).filter(item => !item.구분.includes('조식') && !item.구분.includes('스낵')); // 조식과 스낵 필터링
        setFilteredData(newFilteredData);
    };

    const findValidDate = (startDate, step) => {
        let date = new Date(startDate);
        while (true) {
            date.setDate(date.getDate() + step);
            // 주말을 패스하는 로직
            if (date.getDay() === 0) { // 일요일
                date.setDate(date.getDate() + 1);
            } else if (date.getDay() === 6) { // 토요일
                date.setDate(date.getDate() + 2);
            }

            const formattedDate = formatDate(date);
            const isValidDate = menuData.some(item => {
                const itemDate = item.날짜.split(' ')[1].replace('(', '').replace(')', '').replace('.', '').trim();
                const itemMonthDay = itemDate.slice(0, 2) + itemDate.slice(2, 4);
                return itemMonthDay === formattedDate;
            });

            if (isValidDate) {
                return date;
            }
        }
    };

    const handlePrevDay = () => {
        const newDate = findValidDate(currentDate, -1);
        setCurrentDate(newDate);
        updateFilteredData(newDate);
    };

    const handleNextDay = () => {
        const newDate = findValidDate(currentDate, 1);
        setCurrentDate(newDate);
        updateFilteredData(newDate);
    };


    return (
        <div className="bg-background text-foreground p-8 md:p-12 lg:p-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-center">식단 메뉴</h1>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => handleDateChange(-1)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md">어제</button>
                    <p id="current-date" className="text-muted-foreground">{getFullDate(currentDate)}</p>
                    <button onClick={() => handleDateChange(1)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md">내일</button>
                </div>
                <div className="grid gap-12" id="menu-sections">
                    {filteredData.map((item, index) => (
                        <section key={index}>
                            <h2 className="text-2xl font-bold mb-4">{item.구분.split('(')[0].trim()}</h2>
                            <div className="grid gap-6">
                                {item.메뉴.split(',').map((menu, menuIndex) => (
                                    <div key={menuIndex} className="grid grid-cols-[1fr_auto] items-start gap-4">
                                        <div>
                                            <ul className="list-disc pl-4">
                                                <li>{menu.trim()}</li>
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-muted-foreground">{item.구분.split('(')[1].split(')')[0]}</p>
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
