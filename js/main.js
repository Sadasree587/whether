// Weather App main.js
// IMPORTANT: Get an API key from OpenWeatherMap and paste into OWM_API_KEY below.
// Sign up: https://openweathermap.org/ (free tier available)
const OWM_API_KEY = 'REPLACE_WITH_YOUR_OPENWEATHERMAP_API_KEY'; // <-- add your key
const BASE_WEATHER = 'https://api.openweathermap.org/data/2.5/weather';
const BASE_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast'; // 3h forecast

// DOM
const cityEl = document.getElementById('city');
const timeEl = document.getElementById('time');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const iconEl = document.getElementById('icon');
const feelsEl = document.getElementById('feels');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const forecastEl = document.getElementById('forecast');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const bg = document.getElementById('bg');

let history = JSON.parse(localStorage.getItem('cw_history') || '[]');

function saveHistory(city){
  if(!city) return;
  city = city.trim();
  history = history.filter(c=>c.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  if(history.length>8) history.pop();
  localStorage.setItem('cw_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  historyList.innerHTML = '';
  history.forEach(city=>{
    const b = document.createElement('button');
    b.textContent = city;
    b.onclick = ()=> fetchByCity(city);
    historyList.appendChild(b);
  });
}
renderHistory();

clearHistoryBtn.addEventListener('click', ()=>{
  history = [];
  localStorage.removeItem('cw_history');
  renderHistory();
});

// helpers
function formatTime(dt, tzOffset = 0){
  // dt in seconds, tzOffset in seconds
  const d = new Date((dt + tzOffset) * 1000);
  return d.toLocaleString(undefined, {weekday:'short', hour:'2-digit', minute:'2-digit'});
}

function setBGForWeather(main){
  // simple gradient choices based on weather main string
  let g;
  switch((main||'').toLowerCase()){
    case 'clear': g = 'linear-gradient(135deg,#ffb734 0%, #06b6d4 100%)'; break;
    case 'clouds': g = 'linear-gradient(135deg,#9aa5b1 0%, #2b3945 100%)'; break;
    case 'rain':
    case 'drizzle': g = 'linear-gradient(135deg,#6b8fb6 0%, #1f2937 100%)'; break;
    case 'thunderstorm': g = 'linear-gradient(135deg,#2b2d42 0%, #1b1f3b 100%)'; break;
    case 'snow': g = 'linear-gradient(135deg,#e6f0ff 0%, #9fc5ff 100%)'; break;
    case 'mist':
    case 'fog': g = 'linear-gradient(135deg,#cbd5e1 0%, #94a3b8 100%)'; break;
    default: g = 'linear-gradient(135deg,#0ea5a4 0%, #0f1724 100%)';
  }
  bg.style.background = g;
  // subtle animated shapes using CSS will be visible due to blur in CSS.
}

async function fetchByCity(city){
  if(!city) return;
  try{
    const url = `${BASE_WEATHER}?q=${encodeURIComponent(city)}&units=metric&appid=${OWM_API_KEY}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('City not found');
    const data = await res.json();
    renderWeather(data);
    saveHistory(data.name);
    // fetch short forecast
    fetchForecast(data.coord.lat, data.coord.lon);
  }catch(err){
    alert('Unable to find that city. Please check the name or API key.');
    console.error(err);
  }
}

async function fetchByCoords(lat, lon){
  try{
    const url = `${BASE_WEATHER}?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Location weather not available');
    const data = await res.json();
    renderWeather(data);
    saveHistory(data.name);
    fetchForecast(lat, lon);
  }catch(err){
    alert('Unable to fetch weather for your location.');
    console.error(err);
  }
}

function renderWeather(data){
  const {name, dt, weather, main, wind, sys, timezone} = data;
  cityEl.textContent = `${name}, ${sys.country || ''}`;
  timeEl.textContent = formatTime(dt, timezone);
  tempEl.textContent = `${Math.round(main.temp)}°C`;
  descEl.textContent = weather[0].description;
  feelsEl.textContent = `${Math.round(main.feels_like)}°C`;
  humidityEl.textContent = `${main.humidity}%`;
  windEl.textContent = `${wind.speed} m/s`;

  // icon
  const iconCode = weather[0].icon; // e.g., 01d
  iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  iconEl.alt = weather[0].description;

  setBGForWeather(weather[0].main);
}

async function fetchForecast(lat, lon){
  try{
    const url = `${BASE_FORECAST}?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Forecast fetch failed');
    const data = await res.json();
    // pick next 5 unique days midday forecast
    const daily = [];
    const seen = new Set();
    for(const item of data.list){
      const d = new Date(item.dt * 1000);
      const key = d.toLocaleDateString();
      const hour = d.getHours();
      if(!seen.has(key) && (hour === 12 || daily.length < 5)){
        seen.add(key);
        daily.push(item);
      }
      if(daily.length>=5) break;
    }
    renderForecast(daily);
  }catch(err){
    console.error(err);
  }
}

function renderForecast(items){
  forecastEl.innerHTML = '';
  items.forEach(it=>{
    const d = new Date(it.dt * 1000);
    const day = d.toLocaleDateString(undefined, {weekday:'short'});
    const icon = it.weather[0].icon;
    const temp = Math.round(it.main.temp);
    const el = document.createElement('div');
    el.className = 'day';
    el.innerHTML = `<div style="font-weight:600">${day}</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${it.weather[0].description}" />
      <div style="margin-top:6px">${temp}°C</div>`;
    forecastEl.appendChild(el);
  });
}

// event bindings
searchBtn.addEventListener('click', ()=> {
  const q = searchInput.value.trim();
  if(!q) return;
  fetchByCity(q);
});
searchInput.addEventListener('keydown', e=>{
  if(e.key === 'Enter') searchBtn.click();
});

locBtn.addEventListener('click', ()=>{
  if(!navigator.geolocation){
    alert('Geolocation not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos=>{
    fetchByCoords(pos.coords.latitude, pos.coords.longitude);
  }, (err)=>{
    alert('Unable to get your location.');
  }, {timeout:8000});
});

// initial load: try to load last searched or geolocation
const last = history[0];
if(last){
  fetchByCity(last);
} else if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{
    fetchByCoords(pos.coords.latitude, pos.coords.longitude);
  }, ()=> {
    // fallback: show a default city
    fetchByCity('New Delhi');
  }, {timeout:7000});
} else {
  fetchByCity('New Delhi');
}
