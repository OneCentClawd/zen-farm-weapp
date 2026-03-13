/**
 * 地块系统 - 管理多块地和植物
 */

import { PlantType, HealthState, PLANT_CONFIGS } from './PlantTypes.js';
import { updateSoilMoisture, getSunlightBonus, getRainFertilizerBonus } from './Environment.js';
import { createPlant, simulateDay, simulateOffline } from './Plant.js';

/**
 * 地块数据
 * @typedef {Object} PlotData
 * @property {number} id
 * @property {import('./PlantTypes.js').PlantData|null} plant
 * @property {number} soilMoisture
 * @property {number} lastUpdatedAt
 * @property {boolean} hasShelter          - 是否有遮雨棚（每日重置）
 * @property {boolean} hasDehumidifier     - 是否有除湿器
 * @property {number} shelterInstalledAt   - 遮雨棚安装时间（用于每日重置）
 */

/**
 * 游戏存档数据
 * @typedef {Object} GameSaveData
 * @property {number} version
 * @property {PlotData[]} plots
 * @property {number} unlockedPlots      - 已解锁地块数
 * @property {number} lastOnlineAt       - 上次在线时间
 * @property {{ lat: number, lon: number }} location
 * @property {number} totalHarvests      - 总收获次数
 */

/**
 * 创建新地块
 * @param {number} id
 * @returns {PlotData}
 */
export function createPlot(id) {
  return {
    id,
    plant: null,
    soilMoisture: 50,
    lastUpdatedAt: Date.now(),
    hasShelter: false,
    hasDehumidifier: false,
    shelterInstalledAt: 0,
  };
}

/**
 * 种植
 * @param {PlotData} plot
 * @param {string} type
 * @param {boolean} hardMode
 * @returns {PlotData}
 */
export function plantSeed(plot, type, hardMode = false) {
  return {
    ...plot,
    plant: createPlant(type, hardMode),
    lastUpdatedAt: Date.now(),
  };
}

/**
 * 浇水
 * @param {PlotData} plot
 * @returns {PlotData}
 */
export function waterPlot(plot) {
  const newMoisture = Math.min(100, plot.soilMoisture + 5);
  return {
    ...plot,
    soilMoisture: newMoisture,
    plant: plot.plant ? { ...plot.plant, lastWateredAt: Date.now() } : null,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * 收获
 * @param {PlotData} plot
 * @returns {{ plot: PlotData, harvested: boolean }}
 */
export function harvestPlot(plot) {
  if (!plot.plant) return { plot, harvested: false };
  
  const config = PLANT_CONFIGS[plot.plant.type];
  
  // 只有成熟且健康的植物才能收获
  if (plot.plant.growthProgress < 1.0 || plot.plant.healthState === HealthState.DEAD) {
    return { plot, harvested: false };
  }
  
  // 一年生植物收获后死亡（用 isAnnual 判断，而不是 lifespan）
  if (config.isAnnual) {
    return {
      plot: {
        ...plot,
        plant: null,
        lastUpdatedAt: Date.now(),
      },
      harvested: true,
    };
  }
  
  // 多年生植物可以继续收获
  return {
    plot: {
      ...plot,
      plant: {
        ...plot.plant,
        harvestCount: plot.plant.harvestCount + 1,
      },
      lastUpdatedAt: Date.now(),
    },
    harvested: true,
  };
}

/**
 * 挖掉植物
 * @param {PlotData} plot
 * @returns {PlotData}
 */
export function removePlant(plot) {
  return {
    ...plot,
    plant: null,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * 更新地块（实时）
 * @param {PlotData} plot
 * @param {import('./Environment.js').WeatherData} weather
 * @returns {PlotData}
 */
export function updatePlot(plot, weather) {
  // 计算经过的小时数
  const now = Date.now();
  const hours = (now - plot.lastUpdatedAt) / (1000 * 60 * 60);
  
  // 不足 1 小时不更新
  if (hours < 1) return plot;
  
  // 检查遮雨棚是否过期（24小时后自动移除）
  let shelterActive = plot.hasShelter;
  let shelterExpired = false;
  if (plot.hasShelter && plot.shelterInstalledAt > 0) {
    const shelterAge = (now - plot.shelterInstalledAt) / (1000 * 60 * 60);
    if (shelterAge >= 24) {
      shelterActive = false;
      shelterExpired = true;
      console.log('🏠 遮雨棚已过期（24小时）');
    }
  }
  
  // 调整天气效果（遮雨棚/除湿器）
  let effectiveWeather = { ...weather };
  
  // 遮雨棚：阻挡降雨、风、阳光
  if (shelterActive) {
    effectiveWeather.precipitation = 0;
    effectiveWeather.windSpeed = 0;
    effectiveWeather.sunlight *= 0.3;  // 阳光大幅减弱
  }
  
  // 更新土壤湿度（传入 shelter 状态）
  let newMoisture = updateSoilMoisture(plot.soilMoisture, effectiveWeather, hours, false, shelterActive);
  
  // 除湿器：每小时降低 2% 湿度
  if (plot.hasDehumidifier) {
    newMoisture = Math.max(0, newMoisture - hours * 2);
  }
  
  // 构建更新后的 plot
  let updatedPlot = {
    ...plot,
    soilMoisture: newMoisture,
    lastUpdatedAt: now,
  };
  
  // 如果遮雨棚过期，移除它
  if (shelterExpired) {
    updatedPlot.hasShelter = false;
    updatedPlot.shelterInstalledAt = 0;
  }
  
  // 没有植物，返回
  if (!plot.plant) {
    return updatedPlot;
  }
  
  // 按天模拟植物
  const days = Math.floor(hours / 24);
  if (days >= 1) {
    const result = simulateDay(plot.plant, plot.soilMoisture, effectiveWeather, false);
    return {
      ...updatedPlot,
      plant: result.plant,
      soilMoisture: result.newSoilMoisture,
    };
  }
  
  return updatedPlot;
}

/**
 * 安装遮雨棚
 * @param {PlotData} plot
 * @returns {PlotData}
 */
export function installShelter(plot) {
  return { 
    ...plot, 
    hasShelter: true,
    shelterInstalledAt: Date.now(),
  };
}

/**
 * 移除遮雨棚
 * @param {PlotData} plot
 * @returns {PlotData}
 */
export function removeShelter(plot) {
  return { ...plot, hasShelter: false };
}

/**
 * 安装除湿器
 * @param {PlotData} plot
 * @returns {PlotData}
 */
export function installDehumidifier(plot) {
  return { ...plot, hasDehumidifier: true };
}

/**
 * 移除除湿器
 * @param {PlotData} plot
 * @returns {PlotData}
 */
export function removeDehumidifier(plot) {
  return { ...plot, hasDehumidifier: false };
}

/**
 * 离线补算
 * @param {PlotData} plot
 * @param {import('./Environment.js').WeatherData[]} weatherHistory
 * @returns {PlotData}
 */
export function updatePlotOffline(plot, weatherHistory) {
  if (!plot.plant || weatherHistory.length === 0) return plot;
  
  const result = simulateOffline(plot.plant, plot.soilMoisture, weatherHistory);
  
  return {
    ...plot,
    plant: result.plant,
    soilMoisture: result.soilMoisture,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * 初始化新游戏存档
 * @param {number} lat
 * @param {number} lon
 * @returns {GameSaveData}
 */
export function createNewGame(lat = 31.23, lon = 121.47) {
  return {
    version: 1,
    plots: [createPlot(0)],  // 初始只有1个地块，种成解锁新地块
    unlockedPlots: 1,
    lastOnlineAt: Date.now(),
    location: { lat, lon },
    totalHarvests: 0,
  };
}

/**
 * 解锁新地块
 * @param {GameSaveData} save
 * @returns {GameSaveData}
 */
export function unlockPlot(save) {
  const newPlotId = save.plots.length;
  return {
    ...save,
    plots: [...save.plots, createPlot(newPlotId)],
    unlockedPlots: save.unlockedPlots + 1,
  };
}
