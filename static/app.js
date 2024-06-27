const { useState, useEffect } = React;

const emojis = ['😍', '😋', '🤩', '🥰', '😎', '😋', '😙'];

        // 주어진 배열에서 랜덤하게 하나의 이모티콘을 선택
function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
    }


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

    const handleDateChange = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
        updateFilteredData(newDate);
    };

    return (
        <div className="bg-sky-50 text-foreground p-8 md:p-12 lg:p-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-center">인하대 학식 메뉴</h1>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => handleDateChange(-1)} className="rounded-lg bg-primary text-primary-foreground px-4 py-2">어제</button>
                    <p id="current-date" className="text-muted-foreground">{getFullDate(currentDate)}</p>
                    <button onClick={() => handleDateChange(1)} className="rounded-xl bg-primary text-primary-foreground px-4 py-2">내일</button>
                </div>
                <div className="grid gap-12" id="menu-sections">
                    {filteredData.length > 0 ? filteredData.map((item, index) => (
                        <section key={index}>
                            <h2 className="text-2xl font-bold mb-4">{item.구분.split('(')[0].trim()}</h2>
                            <div className="grid gap-6">
                                {item.메뉴.split(',').map((menu, menuIndex) => (
                                    <div key={menuIndex} className="p-3 bg-indigo-950 font-semibold rounded-md grid-cols-[1fr_auto] items-start gap-4">
                                        <div>
                                            <ul className="pl-3-4 list-none text-blue-50">
                                                <li>{getRandomEmoji() + ' ' + menu.trim()}</li>
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-muted-foreground">{item.구분.split('(')[1].split(')')[0]}</p>
                            </div>
                        </section>
                    )) : (
                        <div className="text-center text-muted-foreground">
                            <p>해당 날짜에 대한 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));