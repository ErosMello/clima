const API_KEY = 'YOUR_OPENWEATHER_API_KEY';

const elements = {
  button: document.getElementById('search-button'),
  input: document.getElementById('city-input'),
  info: document.getElementById('weather-info'),
};

elements.button.addEventListener('click', searchCity);
elements.input.addEventListener('keypress', e => {
  if (e.key === 'Enter') searchCity();
});

function searchCity() {
  const city = elements.input.value.trim();
  if (!city) {
    updateInfo('Por favor, insira uma cidade.');
    return;
  }
  fetchWeather(city);
}

async function fetchWeather(city) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=pt_br&appid=${API_KEY}`);
    if (!res.ok) throw new Error('Cidade não encontrada.');
    const data = await res.json();
    showWeather(data);
  } catch (err) {
    updateInfo(err.message);
  }
}

function showWeather({ name, weather, main }) {
  const description = capitalize(weather[0].description);
  elements.info.innerHTML = `
    <h2>${name}</h2>
    <p>${description}</p>
    <p>Temperatura: ${main.temp}°C</p>
    <p>Sensação térmica: ${main.feels_like}°C</p>
    <p>Umidade: ${main.humidity}%</p>
  `;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function updateInfo(message) {
  elements.info.innerHTML = `<p>${message}</p>`;
}