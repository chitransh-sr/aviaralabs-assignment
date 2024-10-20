import React, { useState, useEffect } from 'react';
import './WeatherApp.css';
const apiKey = process.env.REACT_APP_API_KEY;

function WeatherApp() {
    const [city, setCity] = useState(localStorage.getItem('lastCitySearched') || ''); // Load last searched city from local storage
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [error, setError] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [favoriteWeather, setFavoriteWeather] = useState([]); // State to store weather data of favorite cities
    const [editIndex, setEditIndex] = useState(-1);
    const [editCity, setEditCity] = useState('');
    const [unit, setUnit] = useState('metric'); // 'metric' for Celsius, 'imperial' for Fahrenheit
    const [isCelsius, setIsCelsius] = useState(true); // Toggle between Celsius and Fahrenheit

    useEffect(() => {
        const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(savedFavorites);

        // Load weather for last searched city if available
        if (city) {
            getWeather(city);
        }

        // Load weather for favorite cities
        if (savedFavorites.length > 0) {
            fetchFavoriteWeather(savedFavorites);
        }
    }, []); // Only run on initial render

    const getWeather = (selectedCity = city) => {
        if (selectedCity.trim() === '') {
            setError('Please enter a city name.');
            setWeather(null);
            setForecast([]);
            return;
        }

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${selectedCity}&appid=${apiKey}&units=${unit}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${selectedCity}&appid=${apiKey}&units=${unit}`;

        // Fetch current weather
        fetch(weatherUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('City not found');
                }
                return response.json();
            })
            .then((data) => {
                setError('');
                setWeather({
                    cityName: data.name,
                    temperature: data.main.temp,
                    description: data.weather[0].description,
                    humidity: data.main.humidity,
                });

                // Save last searched city in local storage
                localStorage.setItem('lastCitySearched', selectedCity);
            })
            .catch((error) => {
                setError(error.message);
                setWeather(null);
                setForecast([]);
            });

        // Fetch 5-day forecast
        fetch(forecastUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('City not found');
                }
                return response.json();
            })
            .then((data) => {
                setForecast(
                    data.list.filter((item, index) => index % 8 === 0).map((forecast) => ({
                        date: forecast.dt_txt.split(' ')[0],
                        temperature: forecast.main.temp,
                        description: forecast.weather[0].description,
                    }))
                );
            })
            .catch((error) => {
                setError(error.message);
                setForecast([]);
            });
    };

    const fetchFavoriteWeather = (cities) => {
        const promises = cities.map((favCity) => {
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${favCity}&appid=${apiKey}&units=${unit}`;
            return fetch(weatherUrl)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('City not found');
                    }
                    return response.json();
                })
                .then((data) => ({
                    cityName: data.name,
                    temperature: data.main.temp,
                    description: data.weather[0].description,
                    humidity: data.main.humidity,
                }));
        });

        Promise.all(promises)
            .then((weatherData) => {
                setFavoriteWeather(weatherData);
            })
            .catch((error) => {
                console.error("Error fetching favorite city weather:", error);
                setFavoriteWeather([]); // Reset on error
            });
    };

    const addFavorite = () => {
        if (city && !favorites.includes(city)) {
            const updatedFavorites = [...favorites, city];
            setFavorites(updatedFavorites);
            localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
            setCity('');
            fetchFavoriteWeather(updatedFavorites); // Fetch weather for the newly added favorite
        }
    };

    const deleteFavorite = (index) => {
        const updatedFavorites = favorites.filter((_, i) => i !== index);
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        fetchFavoriteWeather(updatedFavorites); // Fetch weather for updated favorites
    };

    const startEditing = (index) => {
        setEditIndex(index);
        setEditCity(favorites[index]);
    };

    const saveEdit = () => {
        const updatedFavorites = [...favorites];
        updatedFavorites[editIndex] = editCity;
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setEditIndex(-1);
        setEditCity('');
        fetchFavoriteWeather(updatedFavorites); // Fetch weather for updated favorites
    };

    const toggleUnit = () => {
        const newUnit = isCelsius ? 'imperial' : 'metric'; // Toggle between metric and imperial
        setIsCelsius(!isCelsius);
        setUnit(newUnit);

        // Refresh weather and forecast with the new unit
        if (city) {
            getWeather();
        }
        fetchFavoriteWeather(favorites); // Refresh favorite city weather with the new unit
    };

    return (
        <div className="weather-app">
            <h1>City Weather</h1>
            <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name..."
            />
            <button onClick={() => getWeather()}>Get Weather</button>
            <button onClick={addFavorite} disabled={!city}>
                Add to Favorites
            </button>

            <button onClick={toggleUnit}>
                Switch to {isCelsius ? 'Fahrenheit' : 'Celsius'}
            </button>

            {error && <p className="error-message">{error}</p>}

            <div className="content-sections">
                {/* Current Weather Section */}
                {weather && (
                    <div className="weather-info">
                        <h2>Weather in {weather.cityName}</h2>
                        <p>Temperature: {weather.temperature}°{isCelsius ? 'C' : 'F'}</p>
                        <p>Description: {weather.description}</p>
                        <p>Humidity: {weather.humidity}%</p>
                    </div>
                )}

                {/* 5-Day Forecast Section */}
                {forecast.length > 0 && (
                    <div className="forecast-section">
                        <h2>5-Day Forecast</h2>
                        <ul>
                            {forecast.map((day, index) => (
                                <li key={index}>
                                    <p>{day.date} ----- Temp: {day.temperature}°{isCelsius ? 'C' : 'F'} ----- {day.description}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Favorites Section */}
                {favorites.length > 0 && (
                    <div className="favorites-section">
                        <h2>Favorite Cities</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>City</th>
                                    <th>Weather Details</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {favorites.map((fav, index) => (
                                    <tr key={index}>
                                        <td>
                                            {editIndex === index ? (
                                                <input
                                                    type="text"
                                                    value={editCity}
                                                    onChange={(e) => setEditCity(e.target.value)}
                                                />
                                            ) : (
                                                fav
                                            )}
                                        </td>
                                        <td>
                                            {favoriteWeather[index] ? (
                                                <>
                                                    <p>Temperature: {favoriteWeather[index].temperature}°{isCelsius ? 'C' : 'F'}</p>
                                                    <p>Description: {favoriteWeather[index].description}</p>
                                                    <p>Humidity: {favoriteWeather[index].humidity}%</p>
                                                </>
                                            ) : (
                                                <p>Loading...</p>
                                            )}
                                        </td>
                                        <td>
                                            {editIndex === index ? (
                                                <>
                                                    <button onClick={saveEdit}>Save</button>
                                                    <button onClick={() => setEditIndex(-1)}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEditing(index)}>Edit</button>
                                                    <button onClick={() => deleteFavorite(index)}>Delete</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WeatherApp;
