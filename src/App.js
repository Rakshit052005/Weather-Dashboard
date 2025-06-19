import { useEffect, useState } from 'react';
import { WiHumidity } from 'react-icons/wi';
import './App.css';

const API_KEY = "8109a0ce89900cb8aa4e0b79d761db4a";

const App = () => {
  const [city, setCity] = useState("Delhi");
  const [inputCity, setInputCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unit, setUnit] = useState("metric");
  const [recentCities, setRecentCities] = useState(
    JSON.parse(localStorage.getItem("recentCities")) || []
  );

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setErrorMsg("");

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}`;

    Promise.all([
      fetch(weatherUrl).then(res => res.json()),
      fetch(forecastUrl).then(res => res.json())
    ])
      .then(([weatherRes, forecastRes]) => {
        if (weatherRes.cod === 200 && forecastRes.cod === "200") {
          setWeatherData(weatherRes);
          const daily = forecastRes.list.filter(item =>
            item.dt_txt.includes("12:00:00")
          );
          setForecast(daily);

          if (!recentCities.includes(city)) {
            const updated = [city, ...recentCities.slice(0, 4)];
            setRecentCities(updated);
            localStorage.setItem("recentCities", JSON.stringify(updated));
          }
        } else {
          setWeatherData(null);
          setForecast([]);
          setErrorMsg("City not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg("Error fetching data.");
        setWeatherData(null);
        setForecast([]);
        setLoading(false);
      });
  }, [city, unit]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`)
          .then(res => res.json())
          .then(data => {
            if (data.name) setCity(data.name);
          });
      },
      err => console.warn("Geolocation error:", err)
    );
  }, []);

  const handleSearch = () => {
    if (inputCity.trim()) {
      setCity(inputCity.trim());
      setInputCity("");
    }
  };

  const toggleUnit = () => {
    setUnit(prev => (prev === "metric" ? "imperial" : "metric"));
  };

  const clearRecent = () => {
    setRecentCities([]);
    localStorage.removeItem("recentCities");
  };

  const getLocalTime = () => {
    if (!weatherData) return "";
    const offset = weatherData.timezone;
    const localDate = new Date(Date.now() + offset * 1000);
    return localDate.toUTCString().slice(17, 25);
  };

  return (
    <div className={`app-container ${weatherData ? weatherData.weather[0].main.toLowerCase() : "default"}`}>
      <h1>🌦️ Weather Dashboard</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Enter city name..."
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={toggleUnit}>
          {unit === "metric" ? "°F" : "°C"}
        </button>
      </div>

      {recentCities.length > 0 && (
        <div className="recent-box">
          <h4>Recent:</h4>
          {recentCities.map((c, i) => (
            <button key={i} onClick={() => setCity(c)}>{c}</button>
          ))}
          <div style={{ marginTop: "0.8rem" }}>
            <button className="clear-btn" onClick={clearRecent}>Clear Recent</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading...</p>
      ) : errorMsg ? (
        <p className="error">{errorMsg}</p>
      ) : weatherData ? (
        <div className="weather-section">
          <div className="weather-details">
            <h2>{weatherData.name}, {weatherData.sys.country}</h2>
            <p>🕓 Local time: {getLocalTime()}</p>
            <img
              src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
              alt="icon"
            />
            <p><strong>{weatherData.weather[0].main}</strong> - {weatherData.weather[0].description}</p>
            <p>🌡️ Temp: {weatherData.main.temp}°{unit === "metric" ? "C" : "F"}</p>
            <p><WiHumidity size={24} /> Humidity: {weatherData.main.humidity}%</p>
            <p>💨 Wind: {weatherData.wind.speed} {unit === "metric" ? "m/s" : "mph"} {weatherData.wind.deg}°</p>
          </div>

          <h3>📅 5-Day Forecast</h3>
          <div className="forecast">
            {forecast.map((item, idx) => (
              <div className="forecast-card" key={idx}>
                <p>{item.dt_txt.split(" ")[0]}</p>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                  alt="forecast"
                />
                <p>{item.main.temp}°</p>
                <p>{item.weather[0].main}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default App;
