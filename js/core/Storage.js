/**
 * 存储管理 - 本地数据持久化
 */

import { createNewGame } from './GameData.js';

const SAVE_KEY = 'zen_farm_save';
const WEATHER_CACHE_KEY = 'zen_farm_weather_cache';

/**
 * 保存游戏
 * @param {import('./GameData.js').GameSaveData} data
 */
export function saveGame(data) {
  try {
    const json = JSON.stringify(data);
    wx.setStorageSync(SAVE_KEY, json);
    console.log('💾 游戏已保存');
  } catch (e) {
    console.error('保存失败:', e);
  }
}

/**
 * 加载游戏
 * @returns {import('./GameData.js').GameSaveData|null}
 */
export function loadGame() {
  try {
    const json = wx.getStorageSync(SAVE_KEY);
    if (!json) return null;
    
    const data = JSON.parse(json);
    console.log('📂 存档已加载');
    return data;
  } catch (e) {
    console.error('加载失败:', e);
    return null;
  }
}

/**
 * 删除存档
 */
export function deleteSave() {
  wx.removeStorageSync(SAVE_KEY);
  console.log('🗑️ 存档已删除');
}

/**
 * 加载或创建新游戏
 * @param {number} [lat]
 * @param {number} [lon]
 * @returns {import('./GameData.js').GameSaveData}
 */
export function loadOrCreateGame(lat, lon) {
  const saved = loadGame();
  if (saved) return saved;
  return createNewGame(lat, lon);
}

/**
 * 缓存天气数据
 * @param {any} weather
 */
export function cacheWeather(weather) {
  try {
    const cache = {
      data: weather,
      timestamp: Date.now(),
    };
    wx.setStorageSync(WEATHER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('缓存天气失败:', e);
  }
}

/**
 * 获取缓存的天气（1小时内有效）
 * @returns {any|null}
 */
export function getCachedWeather() {
  try {
    const json = wx.getStorageSync(WEATHER_CACHE_KEY);
    if (!json) return null;
    
    const cache = JSON.parse(json);
    const age = Date.now() - cache.timestamp;
    
    // 超过 1 小时过期
    if (age > 60 * 60 * 1000) return null;
    
    return cache.data;
  } catch (e) {
    return null;
  }
}
