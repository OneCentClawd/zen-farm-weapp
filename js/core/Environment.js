/**
 * 环境系统 - 天气 API + 土壤湿度计算
 */

/**
 * 天气数据
 * @typedef {Object} WeatherData
 * @property {number} temperature      - 气温 °C
 * @property {number} humidity         - 空气湿度 %
 * @property {number} precipitation    - 降水量 mm
 * @property {number} sunlight         - 日照强度 0~1（根据天气状况推算）
 * @property {number} windSpeed        - 风速 km/h
 * @property {number} windDirection    - 风向（度，0=北风，90=东风）
 * @property {number} weatherCode      - 天气代码
 * @property {number} updatedAt        - 更新时间
 */

/**
 * 环境状态
 * @typedef {Object} EnvironmentState
 * @property {WeatherData} weather
 * @property {number} soilMoisture     - 土壤湿度 0~100
 */

/**
 * WMO 天气代码到日照强度
 * @param {number} code
 * @returns {number}
 */
function weatherCodeToSunlight(code) {
  // 晴天
  if (code === 0) return 1.0;
  // 少云
  if (code === 1) return 0.9;
  // 多云
  if (code === 2) return 0.7;
  // 阴天
  if (code === 3) return 0.4;
  // 雾
  if (code >= 45 && code <= 48) return 0.3;
  // 毛毛雨
  if (code >= 51 && code <= 55) return 0.3;
  // 雨
  if (code >= 61 && code <= 67) return 0.2;
  // 雪
  if (code >= 71 && code <= 77) return 0.3;
  // 阵雨
  if (code >= 80 && code <= 82) return 0.2;
  // 雷暴
  if (code >= 95 && code <= 99) return 0.1;
  
  return 0.5;
}

/**
 * HTTP GET 请求（微信小游戏版）
 * @param {string} url
 * @returns {Promise<any>}
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 从 Open-Meteo 获取天气
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<WeatherData|null>}
 */
export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
  
  try {
    const data = await httpGet(url);
    const current = data.current;
    
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      sunlight: weatherCodeToSunlight(current.weather_code),
      windSpeed: current.wind_speed_10m || 0,
      windDirection: current.wind_direction_10m || 0,
      weatherCode: current.weather_code,
      updatedAt: Date.now(),
    };
  } catch (e) {
    console.error('获取天气失败:', e);
    return null;
  }
}

/**
 * 获取历史天气（用于离线补算）
 * @param {number} lat
 * @param {number} lon
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate
 * @returns {Promise<WeatherData[]>}
 */
export async function fetchWeatherHistory(lat, lon, startDate, endDate) {
  // 使用 archive API 获取历史数据
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_mean,precipitation_sum,weather_code,wind_speed_10m_max&start_date=${startDate}&end_date=${endDate}&timezone=auto`;
  
  try {
    const data = await httpGet(url);
    const daily = data.daily;
    
    const result = [];
    for (let i = 0; i < daily.time.length; i++) {
      result.push({
        temperature: daily.temperature_2m_mean[i],
        humidity: 60,  // 历史数据没有湿度，用默认值
        precipitation: daily.precipitation_sum[i],
        sunlight: weatherCodeToSunlight(daily.weather_code[i]),
        windSpeed: daily.wind_speed_10m_max?.[i] || 10,
        windDirection: daily.wind_direction_10m_dominant?.[i] || 0,
        weatherCode: daily.weather_code[i],
        updatedAt: new Date(daily.time[i]).getTime(),
      });
    }
    
    return result;
  } catch (e) {
    console.error('获取历史天气失败:', e);
    return [];
  }
}

/**
 * 计算土壤湿度变化
 * @param {number} currentMoisture - 当前湿度
 * @param {WeatherData} weather - 天气数据
 * @param {number} hours - 经过时间（小时）
 * @param {boolean} watered - 是否浇水
 * @param {boolean} hasShelter - 是否有遮挡（阻挡风、阳光、雨）
 * @returns {number} 新的湿度值
 */
export function updateSoilMoisture(currentMoisture, weather, hours, watered = false, hasShelter = false) {
  let moisture = currentMoisture;
  
  // 1. 浇水增加湿度
  if (watered) {
    moisture += 20;
  }
  
  // 2. 降水增加湿度（遮挡下无效）
  if (!hasShelter) {
    // 每 mm 降水约增加 3% 湿度
    moisture += weather.precipitation * 3;
  }
  
  // 3. 蒸发减少湿度
  const baseEvaporation = 2.0;  // 基础蒸发 %/小时（调快4倍）
  
  // 温度因子：温度越高蒸发越快
  const tempFactor = Math.max(0.5, 1 + (weather.temperature - 20) / 30);
  
  // 空气湿度因子：空气越干燥蒸发越快
  const humidityFactor = 1.5 - weather.humidity / 100;
  
  // 日照因子：阳光越强蒸发越快（遮挡下无阳光）
  let sunFactor = 0.5 + weather.sunlight * 0.5;
  if (hasShelter) {
    sunFactor = 0.3;  // 遮挡下阳光大幅减弱
  }
  
  // 风速因子：风越大蒸发越快（遮挡下无风）
  let windFactor = 1.0;
  if (!hasShelter) {
    // 风速每增加 10 km/h，蒸发增加 20%
    windFactor = 1 + (weather.windSpeed / 50);
  }
  
  let evaporation = baseEvaporation * tempFactor * sunFactor * humidityFactor * windFactor;
  
  // 下雨时蒸发很慢
  if (weather.precipitation > 0 && !hasShelter) {
    evaporation *= 0.1;
  }
  
  moisture -= evaporation * hours;
  
  // 限制范围
  return Math.max(0, Math.min(100, moisture));
}

/**
 * 计算阳光对生长的加成
 * @param {number} sunlight - 日照强度 0~1（已经过遮挡处理）
 * @returns {number} 生长加成系数 0.5~1.0
 */
export function getSunlightBonus(sunlight) {
  // sunlight 已经在 effectiveWeather 里处理过遮挡了
  return 0.5 + sunlight * 0.5;  // 0.5 ~ 1.0
}

/**
 * 计算雨水带来的肥料加成
 * @param {number} precipitation - 降水量 mm（已经过遮挡处理，遮挡下为0）
 * @returns {number} 肥力加成
 */
export function getRainFertilizerBonus(precipitation) {
  if (precipitation <= 0) {
    return 0;
  }
  // 每 mm 降雨带来 0.5% 的肥力加成（上限 5%）
  return Math.min(5, precipitation * 0.5);
}
