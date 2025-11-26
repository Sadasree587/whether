// Demo: uses open-mock data unless you add an API key.
// To use real API, sign up at openweathermap.org and replace API_KEY.
const API_KEY = ''; // add your API key here
const fetchBtn = document.getElementById('fetch');
const cityInput = document.getElementById('city');
const result = document.getElementById('result');
const loc = document.getElementById('loc');
const temp = document.getElementById('temp');
const desc = document.getElementById('desc');

fetchBtn.addEventListener('click', async ()=>{
  const city = cityInput.value.trim();
  if(!city){alert('Enter a city');return;}
  if(!API_KEY){
    // Show fake data
    loc.textContent = city;
    temp.textContent = '26°C';
    desc.textContent = 'Partly cloudy';
    result.hidden = false;
    return;
  }
  try{
    const res = await fetch(https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY});
    if(!res.ok) throw new Error('City not found');
    const d = await res.json();
    loc.textContent = ${d.name}, ${d.sys.country};
    temp.textContent = ${Math.round(d.main.temp)}°C;
    desc.textContent = d.weather[0].description;
    result.hidden = false;
  }catch(e){alert(e.message)}
});js/
