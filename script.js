// Configurações
const CONFIG = {
    API_KEY: '2a6f4684baf57c1fccf734b7dabaa6b9',
    STORAGE_KEY: 'weatherAppRecent',
    MAX_RECENT: 5
};

// Cache de elementos DOM
const elements = {
    form: document.getElementById('search-form'),
    input: document.getElementById('city-input'),
    weatherInfo: document.getElementById('weather-info'),
    recentSearches: document.getElementById('recent-searches'),
    themeToggle: document.getElementById('theme-toggle')
};

// Estado da aplicação
let state = {
    loading: false,
    recentSearches: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]'),
    theme: localStorage.getItem('theme') || 'light'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderRecentSearches();
    setupEventListeners();
});

function setupEventListeners() {
    elements.form.addEventListener('submit', handleSearch);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.recentSearches.addEventListener('click', handleRecentClick);
    
    // Debounce na busca
    elements.input.addEventListener('input', debounce(handleInput, 500));
}

function initTheme() {
    document.body.classList.toggle('dark-theme', state.theme === 'dark');
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    document.body.classList.toggle('dark-theme');
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleInput(event) {
    const value = event.target.value.trim();
    if (value.length >= 3) {
        try {
            await getWeather(value, true); // preview mode
        } catch (error) {
            console.log('Preview error:', error);
        }
    }
}

function handleRecentClick(event) {
    const cityBtn = event.target.closest('.recent-city');
    if (cityBtn) {
        elements.input.value = cityBtn.dataset.city;
        getWeather(cityBtn.dataset.city);
    }
}

async function handleSearch(event) {
    event.preventDefault();
    const city = elements.input.value.trim();
    
    if (!city) {
        showError('Por favor, insira uma cidade.');
        return;
    }
    
    await getWeather(city);
}

function addToRecent(city) {
    if (!state.recentSearches.includes(city)) {
        state.recentSearches.unshift(city);
        state.recentSearches = state.recentSearches.slice(0, CONFIG.MAX_RECENT);
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.recentSearches));
        renderRecentSearches();
    }
}

function renderRecentSearches() {
    if (state.recentSearches.length === 0) {
        elements.recentSearches.innerHTML = '';
        return;
    }

    elements.recentSearches.innerHTML = `
        <h3>Buscas Recentes</h3>
        <div class="recent-list">
            ${state.recentSearches.map(city => `
                <button class="recent-city" data-city="${city}">
                    <i class="fas fa-history"></i>
                    ${city}
                </button>
            `).join('')}
        </div>
    `;
}

function showError(message) {
    elements.weatherInfo.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

function showLoading() {
    state.loading = true;
    elements.weatherInfo.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Buscando informações...</p>
        </div>
    `;
}

async function getWeather(city, preview = false) {
    if (!preview) {
        showLoading();
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=pt_br&appid=${CONFIG.API_KEY}`
        );

        if (!response.ok) {
            throw new Error(response.status === 404 ? 'Cidade não encontrada.' : 'Erro ao buscar dados do clima.');
        }

        const data = await response.json();
        
        if (!preview) {
            displayWeather(data);
            addToRecent(city);
        }
    } catch (error) {
        if (!preview) {
            showError(error.message);
        }
        throw error;
    } finally {
        state.loading = false;
    }
}

function getWeatherIcon(code) {
    // Mapeamento de códigos do OpenWeather para ícones do Font Awesome
    const iconMap = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'clouds',
        '04n': 'clouds',
        '09d': 'cloud-showers-heavy',
        '09n': 'cloud-showers-heavy',
        '10d': 'cloud-rain',
        '10n': 'cloud-rain',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog'
    };
    
    return iconMap[code] || 'cloud';
}

function displayWeather(data) {
    const { name, weather, main, wind } = data;
    const description = weather[0].description;
    const icon = getWeatherIcon(weather[0].icon);
    const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
    
    elements.weatherInfo.innerHTML = `
        <div class="weather-header">
            <i class="fas fa-${icon} weather-icon"></i>
            <h2>${name}</h2>
        </div>
        
        <div class="weather-body">
            <div class="temperature">
                <span class="temp-value">${Math.round(main.temp)}°C</span>
                <span class="temp-description">${capitalizedDescription}</span>
            </div>
            
            <div class="weather-details">
                <div class="detail">
                    <i class="fas fa-temperature-low"></i>
                    <span>Sensação: ${Math.round(main.feels_like)}°C</span>
                </div>
                <div class="detail">
                    <i class="fas fa-tint"></i>
                    <span>Humidade: ${main.humidity}%</span>
                </div>
                <div class="detail">
                    <i class="fas fa-wind"></i>
                    <span>Vento: ${Math.round(wind.speed * 3.6)} km/h</span>
                </div>
            </div>
        </div>
    `;
}