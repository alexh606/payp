document.addEventListener('DOMContentLoaded', function() {
    // First, let's verify all our elements exist
    const elements = {
        totalPoops: document.getElementById('totalPoops'),
        totalTime: document.getElementById('totalTime'),
        totalEarned: document.getElementById('totalEarned'),
        currentEarnings: document.getElementById('currentEarnings'),
        timer: document.getElementById('timer'),
        startStop: document.getElementById('startStop'),
        weeklyChart: document.getElementById('weeklyChart'),
        funFacts: document.getElementById('funFacts'),
        salary: document.getElementById('salary'),
        salaryPeriod: document.getElementById('salaryPeriod'),
        currency: document.getElementById('currency')
    };

    // Debug check - log which elements are missing
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) {
            console.error(`Missing element: ${name}`);
        }
    });

    // Initialize variables
    let timer;
    let isRunning = false;
    let startTime;
    let elapsedTime = 0;

    const exchangeRates = {
        GBP: 1,
        EUR: 1.17,
        USD: 1.27
    };

    // Load data from localStorage
    const poopData = JSON.parse(localStorage.getItem('poopData')) || {
        totalPoops: 0,
        totalTime: 0,
        totalEarned: 0,
        sessions: []
    };

    function getCurrencySymbol() {
        const currency = elements.currency.value;
        switch(currency) {
            case 'GBP': return '£';
            case 'EUR': return '€';
            case 'USD': return '$';
            default: return '£';
        }
    }

    function updateDisplay() {
        if (!elements.totalPoops || !elements.totalTime || !elements.totalEarned) {
            console.error('Missing required elements for updateDisplay');
            return;
        }

        const currencySymbol = getCurrencySymbol();
        elements.totalPoops.textContent = poopData.totalPoops;
        elements.totalTime.textContent = Math.round(poopData.totalTime / 60) + ' minutes';
        elements.totalEarned.textContent = `${currencySymbol}${poopData.totalEarned.toFixed(2)}`;
        updateFunFacts();
        updateChart();
    }

    function updateFunFacts() {
        if (!elements.funFacts) {
            console.error('Missing funFacts element');
            return;
        }

        const facts = [];
        const currency = elements.currency.value;
        const currencySymbol = getCurrencySymbol();
        
        // Define rewards with their costs
        const rewards = [
            { cost: 0.30, name: 'Freddo', emoji: '🍫' },
            { cost: 0.85, name: 'pint of milk', emoji: '🥛' },
            { cost: 3.00, name: 'pack of loo roll', emoji: '🧻' },
            { cost: 3.50, name: 'coffee', emoji: '☕' },
            { cost: 6.50, name: 'pint of beer', emoji: '🍺' },
            { cost: 13.00, name: 'pack of cigarettes', emoji: '🚬' },
            { cost: 25.00, name: 'fancy scented candle', emoji: '🕯️' },
            { cost: 100.00, name: 'flight from London to Rome', emoji: '✈️' },
            { cost: 12.00, name: 'movie ticket', emoji: '🎬' },
            { cost: 10.00, name: 'book', emoji: '📚' },
            { cost: 150.00, name: 'dinner for two', emoji: '🍽️' },
            { cost: 75.00, name: 'spa day', emoji: '💆‍♀️' },
            { cost: 25.00, name: 'house plant', emoji: '🌱' }
        ];

        if (poopData.totalEarned > 0) {
            rewards.forEach(reward => {
                const amount = Math.floor(poopData.totalEarned / reward.cost);
                if (amount > 0) {
                    facts.push(`You've earned enough for ${amount} ${reward.name}${amount !== 1 ? 's' : ''} ${reward.emoji}`);
                }
            });
        }

        elements.funFacts.innerHTML = facts.length > 0 ? facts.join('<br>') : 'Start pooping to earn rewards! 💰';
    }

    function getWeeklyData() {
        const today = new Date();
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(today.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const dailyEarnings = {};
        last7Days.forEach(day => dailyEarnings[day] = 0);

        poopData.sessions.forEach(session => {
            const sessionDate = new Date(session.date).toISOString().split('T')[0];
            if (last7Days.includes(sessionDate)) {
                dailyEarnings[sessionDate] += session.earned;
            }
        });

        return {
            labels: last7Days.map(date => {
                const [year, month, day] = date.split('-');
                return `${day}/${month}`;
            }),
            data: Object.values(dailyEarnings)
        };
    }

    function updateChart() {
        if (!elements.weeklyChart) {
            console.error('Missing weeklyChart element');
            return;
        }

        if (window.myChart) {
            window.myChart.destroy();
        }

        const weeklyData = getWeeklyData();
        const currencySymbol = getCurrencySymbol();

        window.myChart = new Chart(elements.weeklyChart, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Daily Earnings',
                    data: weeklyData.data,
                    backgroundColor: 'rgba(0, 113, 227, 0.5)',
                    borderColor: 'rgba(0, 113, 227, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${currencySymbol}${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return `${currencySymbol}${value.toFixed(2)}`;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    function calculateHourlyRate() {
        if (!elements.salary || !elements.salaryPeriod) {
            console.error('Missing salary input elements');
            return 0;
        }

        const salary = parseFloat(elements.salary.value);
        const period = elements.salaryPeriod.value;
        
        let annualSalary;
        switch(period) {
            case 'annual':
                annualSalary = salary;
                break;
            case 'monthly':
                annualSalary = salary * 12;
                break;
            case 'weekly':
                annualSalary = salary * 52;
                break;
        }
        
        return annualSalary / (52 * 40);
    }

    function updateTimer() {
        if (!elements.timer || !elements.currentEarnings) {
            console.error('Missing timer elements');
            return;
        }

        const currentTime = new Date().getTime();
        elapsedTime = Math.floor((currentTime - startTime) / 1000);
        
        const hours = Math.floor(elapsedTime / 3600);
        const minutes = Math.floor((elapsedTime % 3600) / 60);
        const seconds = elapsedTime % 60;
        
        elements.timer.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const hourlyRate = calculateHourlyRate();
        const earned = (hourlyRate / 3600) * elapsedTime;
        const currencySymbol = getCurrencySymbol();
        elements.currentEarnings.textContent = `${currencySymbol}${earned.toFixed(2)}`;
    }

    function startStopTimer() {
        if (!elements.salary || !elements.startStop) {
            console.error('Missing required elements for timer');
            return;
        }

        if (!isRunning) {
            if (!elements.salary.value) {
                alert('Please enter your salary first!');
                return;
            }
            
            startTime = new Date().getTime();
            timer = setInterval(updateTimer, 1000);
            elements.startStop.textContent = 'Stop Pooping';
            isRunning = true;
        } else {
            clearInterval(timer);
            elements.startStop.textContent = 'Start Pooping';
            isRunning = false;
            
            const hourlyRate = calculateHourlyRate();
            const earned = (hourlyRate / 3600) * elapsedTime;
            
            poopData.totalPoops++;
            poopData.totalTime += elapsedTime;
            poopData.totalEarned += earned;
            poopData.sessions.push({
                date: new Date(),
                duration: elapsedTime,
                earned: earned
            });
            
            localStorage.setItem('poopData', JSON.stringify(poopData));
            updateDisplay();
            
            elapsedTime = 0;
            elements.timer.textContent = '00:00:00';
            elements.currentEarnings.textContent = `${getCurrencySymbol()}0.00`;
        }
    }

    // Only set up event listeners if elements exist
    if (elements.startStop) {
        elements.startStop.addEventListener('click', startStopTimer);
    }

    if (elements.currency) {
        elements.currency.addEventListener('change', function() {
            const oldCurrency = getCurrencySymbol();
            const newCurrency = this.value;
            
            if (poopData.totalEarned > 0) {
                const rate = exchangeRates[newCurrency] / exchangeRates[oldCurrency];
                poopData.totalEarned *= rate;
                
                poopData.sessions.forEach(session => {
                    session.earned *= rate;
                });
                
                localStorage.setItem('poopData', JSON.stringify(poopData));
            }
            
            updateDisplay();
        });
    }

    // Initial display update
    updateDisplay();
});