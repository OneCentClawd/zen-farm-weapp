/**
 * 🌱 佛系种地 - 主游戏控制器（Canvas 2D 版）
 * 
 * 功能：
 * - 游戏初始化、存档加载
 * - UI 创建和更新
 * - 天气获取和更新
 * - 植物/土壤/天气渲染
 * - 用户交互（种植、浇水、收获、设施）
 * - 自动保存
 */

import { PlantType, HealthState, PLANT_CONFIGS } from './core/PlantTypes.js';
import { fetchWeather } from './core/Environment.js';
import { 
  waterPlot, plantSeed, harvestPlot, updatePlot, updatePlotOffline,
  installShelter, removeShelter, installDehumidifier, removeDehumidifier
} from './core/GameData.js';
import { saveGame, loadOrCreateGame } from './core/Storage.js';
import { getCurrentStage, getPlantEmoji, getHealthEmoji } from './core/Plant.js';
import { PopupManager } from './ui/PopupManager.js';
import { PlantRenderer } from './render/PlantRenderer.js';
import { WeatherRenderer } from './render/WeatherRenderer.js';
import { SoilRenderer } from './render/SoilRenderer.js';
import { ParticleEffects } from './render/ParticleEffects.js';
import { FacilityRenderer } from './render/FacilityRenderer.js';
import { IconRenderer } from './render/IconRenderer.js';

/**
 * 主游戏类
 */
export class Game {
  
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} ctx - 已缩放的上下文
   * @param {number} width - 逻辑宽度
   * @param {number} height - 逻辑高度
   */
  constructor(canvas, ctx, width, height) {
    this.canvas = canvas;
    this.ctx = ctx;  // 使用传入的已缩放上下文
    
    this.screenWidth = width;
    this.screenHeight = height;
    
    // 响应式缩放比例（以 375px 宽度为基准）
    this.scale = width / 375;
    
    // 游戏数据
    this.gameData = null;
    this.weather = null;
    this.selectedPlot = 0;
    
    // 渲染器
    this.weatherRenderer = null;
    this.soilRenderer = null;
    this.plantRenderer = null;
    this.particleEffects = null;
    
    // UI
    this.popupManager = null;
    
    // 待种植
    this.pendingPlantType = null;
    this.pendingHardMode = false;
    
    // 计时器
    this.saveTimer = 0;
    this.updateTimer = 0;
    this.skyTimer = 0;
    
    // 触摸
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // 状态栏展开
    this.statusBarExpanded = true;
    
    // UI 元素位置（用于点击检测）
    this.buttons = [];
    
    // 顶部安全区
    this.topSafeArea = 0;
  }
  
  /**
   * 初始化游戏
   */
  async init() {
    console.log('🌱 佛系种地启动');
    
    // 获取顶部安全区（微信胶囊按钮）
    this.topSafeArea = this.getTopSafeArea();
    
    // 初始化渲染器
    this.initRenderers();
    
    // 初始化 UI
    this.popupManager = new PopupManager(this.screenWidth, this.screenHeight);
    this.initButtons();
    
    // 加载存档
    await this.initGameData();
    
    // 获取天气
    await this.updateWeather();
    
    // 绑定事件
    this.bindEvents();
    
    console.log('✅ 游戏初始化完成');
  }
  
  /**
   * 获取顶部安全区高度
   */
  getTopSafeArea() {
    if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
      try {
        const rect = wx.getMenuButtonBoundingClientRect();
        // 胶囊按钮底部 + 10px 间距
        const safeArea = rect.bottom + 10;
        console.log(`📱 胶囊按钮底部: ${rect.bottom}, 安全区: ${safeArea}`);
        return safeArea;
      } catch (e) {
        console.warn('获取安全区失败:', e);
      }
    }
    return 40;  // 默认值
  }
  
  /**
   * 初始化渲染器
   */
  initRenderers() {
    // 天空高度 = 上 2/3
    const skyHeight = this.screenHeight * 2 / 3;
    
    // 地面高度 = 下 1/3
    const groundHeight = this.screenHeight / 3;
    const groundY = skyHeight + groundHeight / 2;
    
    // 天气渲染器
    this.weatherRenderer = new WeatherRenderer(this.screenWidth, this.screenHeight);
    
    // 土壤渲染器
    this.soilRenderer = new SoilRenderer(this.screenWidth, groundHeight);
    
    // 植物渲染器
    this.plantRenderer = new PlantRenderer();
    
    // 设施渲染器
    this.facilityRenderer = new FacilityRenderer();
    
    // 粒子效果
    this.particleEffects = new ParticleEffects(this.screenWidth, this.screenHeight);
    
    // 存储关键位置
    this.groundY = groundY;
    this.groundTop = skyHeight;
    this.groundHeight = groundHeight;
  }
  
  /**
   * 初始化按钮
   */
  initButtons() {
    const btnX = this.screenWidth - this.scaled(60);
    let btnY = this.topSafeArea + this.scaled(80);
    const btnGap = this.scaled(38);
    const btnW = this.scaled(100);
    const btnH = this.scaled(35);
    
    this.buttons = [
      {
        id: 'action',
        text: '种植',
        icon: 'seedling',
        x: btnX - btnW / 2,
        y: btnY - btnH / 2,
        width: btnW,
        height: btnH,
        handler: () => this.onPlantTap(),
      },
      {
        id: 'water',
        text: '浇水',
        icon: 'raindrop',
        x: btnX - btnW / 2,
        y: btnY + btnGap - btnH / 2,
        width: btnW,
        height: btnH,
        handler: () => this.onWaterTap(),
      },
      {
        id: 'facility',
        text: '设施',
        icon: 'house',
        x: btnX - btnW / 2,
        y: btnY + btnGap * 2 - btnH / 2,
        width: btnW,
        height: btnH,
        handler: () => this.showFacilityMenu(),
      },
      {
        id: 'harvest',
        text: '收获',
        icon: 'wheat',
        x: btnX - btnW / 2,
        y: btnY + btnGap * 3 - btnH / 2,
        width: btnW,
        height: btnH,
        visible: false,
        handler: () => this.onHarvestTap(),
      },
    ];
    
    // 地块切换按钮
    this.plotSwitchBtn = {
      id: 'plotSwitch',
      text: '◀ ▶',
      x: 30,
      y: 65 + this.topSafeArea - 25,
      width: 80,
      height: 50,
      visible: false,
      handler: () => this.cyclePlot(),
    };
    
    // 展开/收起按钮（位置和渲染一致）
    this.expandBtn = {
      id: 'expand',
      text: '▲',
      x: this.screenWidth / 2 + this.scaled(100),
      y: this.topSafeArea,
      width: this.scaled(50),
      height: this.scaled(40),
      handler: () => this.toggleStatusBar(),
    };
  }
  
  /**
   * 初始化游戏数据
   */
  async initGameData() {
    try {
      this.gameData = loadOrCreateGame(31.23, 121.47);
      
      if (!this.gameData || !this.gameData.plots || this.gameData.plots.length === 0) {
        console.log('⚠️ 存档无效，创建新游戏');
        this.gameData = this.createNewGameData();
      }
      
      console.log(`📂 地块数: ${this.gameData.plots.length}`);
      
      // 离线模拟：补算离线期间的生长
      this.simulateOfflineProgress();
    } catch (e) {
      console.error('加载存档失败:', e);
      this.gameData = this.createNewGameData();
    }
  }
  
  /**
   * 离线模拟：补算离线期间的植物生长
   */
  simulateOfflineProgress() {
    if (!this.gameData || !this.gameData.lastOnlineAt) return;
    
    const now = Date.now();
    const offlineMs = now - this.gameData.lastOnlineAt;
    const offlineHours = offlineMs / (1000 * 60 * 60);
    
    // 离线不足 1 小时，不模拟
    if (offlineHours < 1) {
      console.log(`⏰ 离线 ${offlineHours.toFixed(2)} 小时，不需要模拟`);
      return;
    }
    
    console.log(`⏰ 离线 ${offlineHours.toFixed(1)} 小时，开始模拟...`);
    
    // 生成模拟用的天气历史（简化：用当前天气填充）
    // TODO: 未来可以用真实历史天气
    const mockWeather = {
      temperature: 22,
      humidity: 60,
      precipitation: 0,
      sunlight: 0.6,
      windSpeed: 5,
      weatherCode: 0,
    };
    
    // 按天数生成天气历史
    const days = Math.ceil(offlineHours / 24);
    const weatherHistory = Array(days).fill(mockWeather);
    
    // 对每个地块进行离线补算
    let updated = false;
    for (let i = 0; i < this.gameData.plots.length; i++) {
      const plot = this.gameData.plots[i];
      if (plot.plant) {
        const newPlot = updatePlotOffline(plot, weatherHistory);
        if (newPlot !== plot) {
          this.gameData.plots[i] = newPlot;
          updated = true;
          console.log(`🌱 地块 ${i + 1} 离线模拟完成`);
        }
      }
    }
    
    if (updated) {
      saveGame(this.gameData);
      console.log('✅ 离线模拟完成并保存');
    }
  }
  
  /**
   * 创建新游戏数据
   */
  createNewGameData() {
    return {
      version: 1,
      plots: [{
        id: 0,
        plant: null,
        soilMoisture: 50,
        lastUpdatedAt: Date.now(),
      }],
      unlockedPlots: 1,
      lastOnlineAt: Date.now(),
      location: { lat: 31.23, lon: 121.47 },
      totalHarvests: 0,
    };
  }
  
  /**
   * 获取天气
   */
  async updateWeather() {
    if (!this.gameData) return;
    
    const { lat, lon } = this.gameData.location;
    this.weather = await fetchWeather(lat, lon);
    
    if (this.weather) {
      console.log(`🌤️ 天气: ${this.weather.temperature.toFixed(1)}°C, 降雨: ${this.weather.precipitation}mm`);
      
      // 更新渲染器
      if (this.weatherRenderer) {
        this.weatherRenderer.updateWeather(this.weather);
      }
      
      if (this.particleEffects) {
        this.particleEffects.updateWeatherEffect(this.weather.weatherCode);
        this.particleEffects.updateWindSpeed(this.weather.windSpeed);
      }
    }
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 微信小游戏全局触摸事件（真机用这个）
    if (typeof wx !== 'undefined' && wx.onTouchStart) {
      wx.onTouchStart((e) => {
        this.onTouchStart({ touches: e.touches, changedTouches: e.changedTouches });
      });
      wx.onTouchEnd((e) => {
        this.onTouchEnd({ touches: e.touches, changedTouches: e.changedTouches });
      });
    }
    
    // Canvas 触摸事件（模拟器备用）
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    
    // 鼠标事件（模拟器调试用）
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }
  
  /**
   * 触摸开始
   */
  onTouchStart(e) {
    // 兼容微信小游戏和浏览器
    if (e.preventDefault) e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    // 微信小游戏直接用 clientX/clientY，就是逻辑像素坐标
    const x = touch.clientX || touch.x || 0;
    const y = touch.clientY || touch.y || 0;
    
    this.touchStartX = x;
    this.touchStartY = y;
    
    // 弹窗优先处理
    if (this.popupManager.isShowing()) {
      this.popupManager.handleTouchStart(x, y);
    }
  }
  
  /**
   * 触摸结束
   */
  onTouchEnd(e) {
    // 兼容微信小游戏和浏览器
    if (e.preventDefault) e.preventDefault();
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    // 微信小游戏直接用 clientX/clientY
    const x = touch.clientX || touch.x || 0;
    const y = touch.clientY || touch.y || 0;
    
    // 弹窗优先处理
    if (this.popupManager.isShowing()) {
      this.popupManager.handleTouchEnd();
      this.popupManager.handleTap(x, y);
      return;
    }
    
    // 检测滑动切换地块
    const deltaX = x - this.touchStartX;
    if (Math.abs(deltaX) > 80 && this.gameData) {
      if (deltaX > 0) {
        this.selectedPlot = Math.max(0, this.selectedPlot - 1);
      } else {
        this.selectedPlot = Math.min(this.gameData.plots.length - 1, this.selectedPlot + 1);
      }
      console.log(`📱 滑动切换到地块 ${this.selectedPlot + 1}`);
      return;
    }
    
    // 检测按钮点击
    this.handleTap(x, y);
  }
  
  /**
   * 鼠标按下（调试用）
   */
  onMouseDown(e) {
    // 微信开发者工具模拟器直接用 clientX/clientY
    const x = e.clientX;
    const y = e.clientY;
    
    this.touchStartX = x;
    this.touchStartY = y;
    
    if (this.popupManager.isShowing()) {
      this.popupManager.handleTouchStart(x, y);
    }
  }
  
  /**
   * 鼠标抬起（调试用）
   */
  onMouseUp(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    if (this.popupManager.isShowing()) {
      this.popupManager.handleTouchEnd();
      this.popupManager.handleTap(x, y);
      return;
    }
    
    this.handleTap(x, y);
  }
  
  /**
   * 处理点击
   */
  handleTap(x, y) {
    // 检查展开按钮
    if (this.isInButton(x, y, this.expandBtn)) {
      this.expandBtn.handler();
      return;
    }
    
    // 检查地块切换按钮
    if (this.plotSwitchBtn.visible && this.isInButton(x, y, this.plotSwitchBtn)) {
      this.plotSwitchBtn.handler();
      return;
    }
    
    // 检查操作按钮
    for (const btn of this.buttons) {
      if (btn.visible !== false && this.isInButton(x, y, btn)) {
        btn.handler();
        return;
      }
    }
  }
  
  /**
   * 检测点击是否在按钮内
   */
  isInButton(x, y, btn) {
    return x >= btn.x && x <= btn.x + btn.width &&
           y >= btn.y && y <= btn.y + btn.height;
  }
  
  /**
   * 游戏主循环
   * @param {number} dt - 帧间隔（秒）
   */
  update(dt) {
    // 更新天气渲染器
    if (this.weatherRenderer) {
      this.weatherRenderer.render(this.ctx, dt);
    }
    
    // 每分钟更新天色
    this.skyTimer += dt;
    if (this.skyTimer >= 60) {
      this.skyTimer = 0;
      if (this.weatherRenderer && this.weather) {
        this.weatherRenderer.updateWeather(this.weather);
      }
    }
    
    // 更新粒子（设置遮雨棚位置）
    if (this.particleEffects) {
      const plot = this.gameData?.plots[this.selectedPlot];
      if (plot?.hasShelter) {
        // 计算遮雨棚位置（和 FacilityRenderer 一致）
        const shelterWidth = 180;
        const centerX = this.screenWidth / 2;
        let plantHeight = 50;
        if (plot.plant && this.plantRenderer) {
          plantHeight = this.plantRenderer.getPlantHeight(plot.plant);
        }
        const shelterTopY = Math.min(this.groundTop - plantHeight - 50, this.groundTop - 120);
        
        this.particleEffects.setShelter(
          true,
          shelterTopY,
          centerX - shelterWidth / 2,
          centerX + shelterWidth / 2
        );
      } else {
        this.particleEffects.setShelter(false);
      }
      this.particleEffects.update(dt);
    }
    
    // 更新设施动画
    if (this.facilityRenderer) {
      this.facilityRenderer.update(dt);
    }
    
    // 更新弹窗动画
    if (this.popupManager) {
      this.popupManager.update(dt);
    }
    
    // 自动保存（每 30 秒）
    this.saveTimer += dt;
    if (this.saveTimer >= 30) {
      this.saveTimer = 0;
      if (this.gameData) {
        this.gameData.lastOnlineAt = Date.now();
        saveGame(this.gameData);
      }
    }
    
    // 更新植物状态（每 60 秒）
    this.updateTimer += dt;
    if (this.updateTimer >= 60 && this.gameData && this.weather) {
      this.updateTimer = 0;
      this.updatePlots();
    }
  }
  
  /**
   * 更新地块
   */
  updatePlots() {
    let needsUpdate = false;
    
    for (let i = 0; i < this.gameData.plots.length; i++) {
      const plot = this.gameData.plots[i];
      if (plot.plant) {
        const updated = updatePlot(plot, this.weather);
        if (updated !== plot) {
          this.gameData.plots[i] = updated;
          needsUpdate = true;
        }
      }
    }
    
    if (needsUpdate) {
      saveGame(this.gameData);
    }
  }
  
  /**
   * 渲染
   */
  render() {
    const ctx = this.ctx;
    
    // 清屏（天气渲染器会画背景，这里可以跳过）
    // ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    
    // 天气已经在 update 里渲染了
    
    // 渲染土壤
    if (this.soilRenderer && this.gameData) {
      const plot = this.gameData.plots[this.selectedPlot];
      if (plot) {
        this.soilRenderer.updateMoisture(plot.soilMoisture);
      }
      this.soilRenderer.render(ctx, this.screenWidth / 2, this.groundY, 0);
    }
    
    // 渲染植物
    if (this.plantRenderer && this.gameData) {
      const plot = this.gameData.plots[this.selectedPlot];
      if (plot?.plant) {
        this.plantRenderer.render(ctx, plot.plant, this.screenWidth / 2, this.groundTop, 0);
      }
    }
    
    // 渲染设施（遮雨棚、除湿器）
    if (this.facilityRenderer && this.gameData) {
      const plot = this.gameData.plots[this.selectedPlot];
      if (plot) {
        // 获取植物实际高度
        const plantHeight = plot.plant && this.plantRenderer 
          ? this.plantRenderer.getPlantHeight(plot.plant)
          : 50;
        
        this.facilityRenderer.render(
          ctx,
          plot.hasShelter,
          plot.hasDehumidifier,
          this.screenWidth / 2,
          this.groundTop,
          plantHeight
        );
      }
    }
    
    // 渲染粒子
    if (this.particleEffects) {
      this.particleEffects.render(ctx);
    }
    
    // 渲染 UI
    this.renderUI(ctx);
    
    // 渲染弹窗
    if (this.popupManager) {
      this.popupManager.render(ctx);
    }
  }
  
  /**
   * 渲染 UI
   */
  renderUI(ctx) {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    if (!plot) return;
    
    // 缩放后的行距
    const lineHeight = this.scaled(28);
    
    // 设置字体
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 标题（用图标 + 文字）
    ctx.fillStyle = 'white';
    this.setFont(ctx, 32, true);
    const titleX = this.screenWidth / 2;
    const titleY = this.topSafeArea + this.scaled(18);
    this.drawIcon(ctx, 'seedling', titleX - this.scaled(85), titleY, this.scaled(28));
    this.drawTextWithShadow(ctx, '我的小菜园', titleX + this.scaled(10), titleY);
    
    // 展开按钮
    this.setFont(ctx, 20);
    ctx.fillText(this.statusBarExpanded ? '▲' : '▼', this.screenWidth / 2 + this.scaled(120), this.topSafeArea + this.scaled(18));
    
    // 地块切换按钮
    const hasMultiplePlots = this.gameData.plots.length > 1;
    this.plotSwitchBtn.visible = hasMultiplePlots;
    if (hasMultiplePlots) {
      this.setFont(ctx, 20);
      ctx.textAlign = 'left';
      ctx.fillText(`◀ ${this.selectedPlot + 1}/${this.gameData.plots.length} ▶`, this.scaled(15), this.topSafeArea + this.scaled(18));
      ctx.textAlign = 'center';
    }
    
    // 状态栏（展开时显示）
    if (this.statusBarExpanded) {
      let y = this.topSafeArea + this.scaled(48);
      this.setFont(ctx, 18);
      
      // 天气
      if (this.weather) {
        this.renderWeatherLine(ctx, this.screenWidth / 2, y);
        y += lineHeight;
      }
      
      // 土壤
      const isHardMode = plot.plant?.hardMode;
      this.renderMoistureLine(ctx, this.screenWidth / 2, y, plot.soilMoisture, isHardMode);
      y += lineHeight;
      
      // 阶段
      if (plot.plant) {
        const config = PLANT_CONFIGS[plot.plant.type];
        const stage = getCurrentStage(plot.plant);
        if (isHardMode) {
          this.drawTextWithShadow(ctx, config.name, this.screenWidth / 2, y);
        } else {
          this.drawTextWithShadow(ctx, `${config.name} · ${stage.name}`, this.screenWidth / 2, y);
        }
      } else {
        // 空地 - 用图标
        this.drawIcon(ctx, 'seedling', this.screenWidth / 2 - this.scaled(30), y, this.scaled(18));
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText('空地', this.screenWidth / 2 - this.scaled(15), y);
        ctx.textAlign = 'center';
      }
      y += lineHeight;
      
      // 状态
      if (plot.plant) {
        this.renderHealthLine(ctx, this.screenWidth / 2, y, plot.plant, isHardMode);
      } else {
        this.drawTextWithShadow(ctx, '等待播种', this.screenWidth / 2, y);
      }
    }
    
    // 智能提示（始终显示，但硬核模式不显示）
    const isHardMode = plot.plant?.hardMode;
    if (!isHardMode) {
      const tipY = this.statusBarExpanded 
        ? this.topSafeArea + this.scaled(48) + lineHeight * 4 + this.scaled(4)
        : this.topSafeArea + this.scaled(48);
      this.setFont(ctx, 20);
      ctx.fillStyle = 'rgb(255, 220, 150)';
      const tipData = this.generateTip(plot);
      this.renderTipLine(ctx, this.screenWidth / 2, tipY, tipData);
    }
    
    // 更新按钮状态
    this.updateButtonStates(plot);
    
    // 渲染按钮
    this.renderButtons(ctx);
  }
  
  /**
   * 绘制带阴影的文字
   */
  drawTextWithShadow(ctx, text, x, y, color = 'white') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  
  /**
   * 获取缩放后的尺寸
   */
  scaled(size) {
    return Math.round(size * this.scale);
  }
  
  /**
   * 设置缩放字体
   */
  setFont(ctx, size, bold = false) {
    const scaledSize = this.scaled(size);
    ctx.font = bold ? `bold ${scaledSize}px sans-serif` : `${scaledSize}px sans-serif`;
  }
  
  /**
   * 获取天气文本
   */
  getWeatherText() {
    if (!this.weather) return null;
    
    const temp = this.weather.temperature.toFixed(1);
    const sunPercent = Math.round(this.weather.sunlight * 100);
    const rain = this.weather.precipitation.toFixed(1);
    const wind = this.weather.windSpeed.toFixed(0);
    
    // 返回结构化数据
    let mainIcon = 'sun';
    if (this.weather.precipitation > 5) mainIcon = 'raindrop';
    else if (this.weather.precipitation > 0) mainIcon = 'cloud';
    else if (this.weather.sunlight > 0.8) mainIcon = 'sun';
    else if (this.weather.sunlight > 0.5) mainIcon = 'cloud';
    else mainIcon = 'cloud';
    
    return {
      mainIcon,
      temp: `${temp}°C`,
      sunPercent: `${sunPercent}%`,
      rain: `${rain}mm`,
      wind: `${wind}km/h`,
    };
  }
  
  /**
   * 绘制天气状态行
   */
  renderWeatherLine(ctx, x, y) {
    const data = this.getWeatherData();
    if (!data) {
      this.drawTextWithShadow(ctx, '加载中...', x, y);
      return;
    }
    
    const iconSize = this.scaled(18);
    const spacing = this.scaled(8);
    let currentX = x - this.scaled(120);  // 从左侧开始
    
    // 主天气图标 + 温度
    this.drawIcon(ctx, data.mainIcon, currentX, y, iconSize);
    currentX += iconSize / 2 + spacing;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(data.temp, currentX, y);
    currentX += ctx.measureText(data.temp).width + spacing * 2;
    
    // 光照
    this.drawIcon(ctx, 'sun', currentX, y, iconSize * 0.8);
    currentX += iconSize / 2 + spacing / 2;
    ctx.fillText(data.sunPercent, currentX, y);
    currentX += ctx.measureText(data.sunPercent).width + spacing * 2;
    
    // 降雨
    this.drawIcon(ctx, 'raindrop', currentX, y, iconSize * 0.8);
    currentX += iconSize / 2 + spacing / 2;
    ctx.fillText(data.rain, currentX, y);
    currentX += ctx.measureText(data.rain).width + spacing * 2;
    
    // 风速
    this.drawIcon(ctx, 'wind', currentX, y, iconSize * 0.8);
    currentX += iconSize / 2 + spacing / 2;
    ctx.fillText(data.wind, currentX, y);
    
    ctx.textAlign = 'center';
  }
  
  /**
   * 获取天气数据
   */
  getWeatherData() {
    if (!this.weather) return null;
    
    const temp = this.weather.temperature.toFixed(1);
    const sunPercent = Math.round(this.weather.sunlight * 100);
    const rain = this.weather.precipitation.toFixed(1);
    const wind = this.weather.windSpeed.toFixed(0);
    
    let mainIcon = 'sun';
    if (this.weather.precipitation > 5) mainIcon = 'raindrop';
    else if (this.weather.precipitation > 0) mainIcon = 'cloud';
    else if (this.weather.sunlight > 0.8) mainIcon = 'sun';
    else mainIcon = 'cloud';
    
    return {
      mainIcon,
      temp: `${temp}°C`,
      sunPercent: `${sunPercent}%`,
      rain: `${rain}mm`,
      wind: `${wind}km/h`,
    };
  }
  
  /**
   * 湿度条（用圆点代替 emoji）
   */
  getMoistureBar(moisture) {
    const filled = Math.round(moisture / 20);
    return '●'.repeat(Math.min(5, filled)) + '○'.repeat(Math.max(0, 5 - filled));
  }
  
  /**
   * 绘制土壤湿度行
   */
  renderMoistureLine(ctx, x, y, moisture, isHidden) {
    const iconSize = this.scaled(18);
    const spacing = this.scaled(6);
    
    // 水滴图标
    this.drawIcon(ctx, 'raindrop', x - this.scaled(60), y, iconSize);
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    if (isHidden) {
      ctx.fillText('土壤: ???', x - this.scaled(45), y);
    } else {
      const bar = this.getMoistureBar(moisture);
      ctx.fillText(`土壤: ${bar} ${moisture.toFixed(0)}%`, x - this.scaled(45), y);
    }
    ctx.textAlign = 'center';
  }
  
  /**
   * 绘制健康状态行
   */
  renderHealthLine(ctx, x, y, plant, isHidden) {
    const iconSize = this.scaled(18);
    
    if (isHidden) {
      // 硬核模式 - 火焰图标
      this.drawIcon(ctx, 'fire', x - this.scaled(50), y, iconSize);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.fillText('硬核模式', x - this.scaled(35), y);
      ctx.textAlign = 'center';
      return;
    }
    
    // 健康表情
    let faceIcon = 'happy';
    if (plant.healthState === HealthState.DEAD) faceIcon = 'skull';
    else if (plant.healthState === HealthState.WILTING) faceIcon = 'sad';
    else if (plant.healthState === HealthState.STRESSED) faceIcon = 'neutral';
    
    const progress = (plant.growthProgress * 100).toFixed(0);
    
    this.drawIcon(ctx, faceIcon, x - this.scaled(70), y, iconSize);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`${plant.healthValue.toFixed(0)}%`, x - this.scaled(55), y);
    
    // 进度图标（用叶子）
    this.drawIcon(ctx, 'leaf', x + this.scaled(5), y, iconSize * 0.8);
    ctx.fillText(`${progress}%`, x + this.scaled(20), y);
    ctx.textAlign = 'center';
  }
  
  /**
   * 生成智能提示（返回 { icon, text } 结构）
   */
  generateTip(plot) {
    if (!plot.plant) {
      return { icon: 'seedling', text: '点击「种植」开始吧~' };
    }
    
    const plant = plot.plant;
    const config = PLANT_CONFIGS[plant.type];
    const moisture = plot.soilMoisture;
    
    if (plant.healthState === HealthState.DEAD) {
      return { icon: 'skull', text: '植物已枯死' };
    }
    
    if (plant.growthProgress >= 1.0) {
      return { icon: 'wheat', text: '可以收获了！' };
    }
    
    const problems = [];
    
    // 水分问题
    if (moisture < config.moistureMin) {
      problems.push({ icon: 'desert', text: config.moistureMin - moisture > 20 ? '严重干旱！' : '土壤干燥' });
    } else if (moisture > config.moistureMax) {
      problems.push({ icon: 'raindrop', text: moisture - config.moistureMax > 20 ? '水涝严重！' : '土壤过湿' });
    }
    
    // 温度问题
    if (this.weather) {
      const temp = this.weather.temperature;
      if (temp < config.tempMin) {
        problems.push({ icon: 'snowflake', text: config.tempMin - temp > 10 ? '严重低温！' : '温度偏低' });
      } else if (temp > config.tempMax) {
        problems.push({ icon: 'fire', text: temp - config.tempMax > 10 ? '严重高温！' : '温度偏高' });
      }
      
      // 光照问题
      if (this.weather.sunlight < config.sunlightMin) {
        problems.push({ icon: 'cloud', text: '光照不足' });
      } else if (this.weather.sunlight > config.sunlightMax) {
        problems.push({ icon: 'sun', text: '光照过强' });
      }
    }
    
    // 健康状态
    if (plant.healthState === HealthState.WILTING) {
      problems.push({ icon: 'sad', text: '正在枯萎' });
    } else if (plant.healthState === HealthState.STRESSED) {
      problems.push({ icon: 'neutral', text: '生长受阻' });
    }
    
    if (problems.length > 0) {
      // 返回第一个问题（最重要的）
      return problems[0];
    }
    
    // 正常状态
    const progress = Math.round(plant.growthProgress * 100);
    if (progress < 5) return { icon: 'seedling', text: '种子刚刚播下~' };
    if (progress < 15) return { icon: 'seedling', text: '正在发芽，耐心等待~' };
    if (progress < 30) return { icon: 'leaf', text: '小苗在努力生长中~' };
    if (progress < 50) return { icon: 'leaf', text: '长势不错，继续保持~' };
    if (progress < 70) return { icon: 'leaf', text: '茁壮成长中~' };
    if (progress < 90) return { icon: 'wheat', text: '快要成熟了，再等等~' };
    return { icon: 'wheat', text: '即将成熟，准备收获吧！' };
  }
  
  /**
   * 绘制智能提示行
   */
  renderTipLine(ctx, x, y, tipData) {
    if (!tipData) return;
    
    const iconSize = this.scaled(18);
    const textWidth = ctx.measureText(tipData.text).width;
    const totalWidth = iconSize + this.scaled(6) + textWidth;
    const startX = x - totalWidth / 2;
    
    // 绘制图标
    this.drawIcon(ctx, tipData.icon, startX + iconSize / 2, y, iconSize);
    
    // 绘制文字
    ctx.fillStyle = 'rgb(255, 220, 150)';
    ctx.textAlign = 'left';
    this.drawTextWithShadow(ctx, tipData.text, startX + iconSize + this.scaled(6), y, 'rgb(255, 220, 150)');
    ctx.textAlign = 'center';
  }
  
  /**
   * 更新按钮状态
   */
  updateButtonStates(plot) {
    const actionBtn = this.buttons.find(b => b.id === 'action');
    const harvestBtn = this.buttons.find(b => b.id === 'harvest');
    const facilityBtn = this.buttons.find(b => b.id === 'facility');
    
    if (plot.plant) {
      if (plot.plant.healthState === HealthState.DEAD) {
        actionBtn.text = '清除';
        actionBtn.icon = 'skull';
      } else {
        actionBtn.text = '挖除';
        actionBtn.icon = 'leaf';
      }
      
      // 收获按钮
      if (plot.plant.growthProgress >= 1.0 && plot.plant.healthState !== HealthState.DEAD) {
        harvestBtn.visible = true;
      } else {
        harvestBtn.visible = false;
      }
    } else {
      actionBtn.text = '种植';
      actionBtn.icon = 'seedling';
      harvestBtn.visible = false;
    }
    
    // 设施按钮（不再显示状态文字，有动画了）
    facilityBtn.text = '设施';
    facilityBtn.icon = 'house';
  }
  
  /**
   * 渲染按钮
   */
  renderButtons(ctx) {
    this.setFont(ctx, 18);
    ctx.textAlign = 'left';
    
    for (const btn of this.buttons) {
      if (btn.visible === false) continue;
      
      const iconSize = this.scaled(22);
      const iconX = btn.x + btn.width - this.scaled(85);
      const iconY = btn.y + btn.height / 2;
      
      // 绘制图标
      if (btn.icon) {
        this.drawIcon(ctx, btn.icon, iconX, iconY, iconSize);
      }
      
      // 绘制文字
      ctx.fillStyle = 'white';
      ctx.fillText(btn.text, iconX + iconSize / 2 + this.scaled(5), btn.y + btn.height / 2 + 6);
    }
  }
  
  /**
   * 绘制图标
   */
  drawIcon(ctx, icon, x, y, size) {
    switch (icon) {
      case 'seedling':
        IconRenderer.seedling(ctx, x, y, size);
        break;
      case 'raindrop':
        IconRenderer.raindrop(ctx, x, y, size);
        break;
      case 'house':
        IconRenderer.house(ctx, x, y, size);
        break;
      case 'wheat':
        IconRenderer.wheat(ctx, x, y, size);
        break;
      case 'leaf':
        IconRenderer.leaf(ctx, x, y, size);
        break;
      case 'sun':
        IconRenderer.sun(ctx, x, y, size);
        break;
      case 'cloud':
        IconRenderer.cloud(ctx, x, y, size);
        break;
      case 'snowflake':
        IconRenderer.snowflake(ctx, x, y, size);
        break;
      case 'wind':
        IconRenderer.wind(ctx, x, y, size);
        break;
      case 'thermometer':
        IconRenderer.thermometer(ctx, x, y, size);
        break;
      case 'skull':
        IconRenderer.skull(ctx, x, y, size);
        break;
      case 'fire':
        IconRenderer.fire(ctx, x, y, size);
        break;
      case 'desert':
        IconRenderer.desert(ctx, x, y, size);
        break;
      case 'happy':
        IconRenderer.face(ctx, x, y, size, 'happy');
        break;
      case 'neutral':
        IconRenderer.face(ctx, x, y, size, 'neutral');
        break;
      case 'sad':
        IconRenderer.face(ctx, x, y, size, 'sad');
        break;
    }
  }
  
  // ========== 操作 ==========
  
  /**
   * 切换状态栏
   */
  toggleStatusBar() {
    this.statusBarExpanded = !this.statusBarExpanded;
    console.log(`📊 状态栏: ${this.statusBarExpanded ? '展开' : '收起'}`);
  }
  
  /**
   * 切换地块
   */
  cyclePlot() {
    if (!this.gameData) return;
    this.selectedPlot = (this.selectedPlot + 1) % this.gameData.plots.length;
    console.log(`🌾 切换到地块 ${this.selectedPlot + 1}`);
  }
  
  /**
   * 点击种植按钮
   */
  onPlantTap() {
    if (!this.gameData) return;
    const plot = this.gameData.plots[this.selectedPlot];
    
    if (plot.plant) {
      if (plot.plant.healthState === HealthState.DEAD) {
        // 清除死亡植物
        this.gameData.plots[this.selectedPlot] = {
          ...plot,
          plant: null,
          lastUpdatedAt: Date.now(),
        };
        saveGame(this.gameData);
      } else {
        // 显示挖除确认
        this.showRemoveConfirm();
      }
    } else {
      // 显示种植选择
      this.showPlantSelect();
    }
  }
  
  /**
   * 点击浇水按钮
   */
  onWaterTap() {
    this.doWater();
  }
  
  /**
   * 点击收获按钮
   */
  onHarvestTap() {
    if (!this.gameData) return;
    const plot = this.gameData.plots[this.selectedPlot];
    if (plot?.plant && plot.plant.growthProgress >= 1.0 && plot.plant.healthState !== HealthState.DEAD) {
      this.doHarvest();
    }
  }
  
  /**
   * 浇水
   */
  doWater() {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    this.gameData.plots[this.selectedPlot] = waterPlot(plot);
    
    // 播放浇水粒子
    if (this.particleEffects) {
      this.particleEffects.playWaterSplash(this.screenWidth / 2, this.groundTop - 10);
    }
    
    console.log('💧 浇水了！');
    saveGame(this.gameData);
  }
  
  /**
   * 种植
   */
  doPlant(type, hardMode = false) {
    const plantType = type ?? this.pendingPlantType;
    const isHardMode = type !== undefined ? hardMode : this.pendingHardMode;
    
    if (!this.gameData || plantType === null) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    if (plot.plant) return;
    
    this.gameData.plots[this.selectedPlot] = plantSeed(plot, plantType, isHardMode);
    
    const config = PLANT_CONFIGS[plantType];
    console.log(`🌱 种下了 ${config.name}${isHardMode ? '（硬核模式）' : ''}！`);
    saveGame(this.gameData);
    
    this.pendingPlantType = null;
    this.pendingHardMode = false;
  }
  
  /**
   * 收获
   */
  doHarvest() {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    const result = harvestPlot(plot);
    
    if (result.harvested) {
      this.gameData.plots[this.selectedPlot] = result.plot;
      this.gameData.totalHarvests++;
      
      // 解锁新地块
      const newPlotId = this.gameData.plots.length;
      this.gameData.plots.push({
        id: newPlotId,
        plant: null,
        soilMoisture: 40,
        hasShelter: false,
        hasDehumidifier: false,
        lastUpdatedAt: Date.now(),
      });
      console.log(`🌾 收获了！解锁新地块 ${newPlotId + 1}`);
      saveGame(this.gameData);
    }
  }
  
  /**
   * 挖除植物
   */
  doRemovePlant() {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    if (!plot.plant) return;
    
    console.log('🗑️ 挖除了植物');
    this.gameData.plots[this.selectedPlot] = {
      ...plot,
      plant: null,
      lastUpdatedAt: Date.now(),
    };
    saveGame(this.gameData);
  }
  
  // ========== 弹窗 ==========
  
  /**
   * 显示种植选择
   */
  showPlantSelect() {
    const popup = this.popupManager.show('PlantSelect', {
      title: '选择要种植的植物',
      height: 0.6,
    });
    
    const plants = [
      { type: PlantType.CLOVER, name: '幸运草' },
      { type: PlantType.SUNFLOWER, name: '向日葵' },
      { type: PlantType.STRAWBERRY, name: '草莓' },
      { type: PlantType.SAKURA, name: '樱花' },
    ];
    
    let y = 80;
    for (const p of plants) {
      const config = PLANT_CONFIGS[p.type];
      const stars = '★'.repeat(config.difficulty) + '☆'.repeat(5 - config.difficulty);
      this.popupManager.addButton(
        `${p.name}  ${stars}  ${config.growthDays}天`,
        0, y, () => this.showPlantConfirm(p.type)
      );
      y -= 80;
    }
  }
  
  /**
   * 显示种植确认
   */
  showPlantConfirm(type) {
    const config = PLANT_CONFIGS[type];
    this.pendingPlantType = type;
    
    const popup = this.popupManager.show('PlantConfirm', {
      title: config.name,
      height: 0.75,
    });
    
    let y = 110;
    
    const stars = '★'.repeat(config.difficulty) + '☆'.repeat(5 - config.difficulty);
    this.popupManager.addLabel(`难度: ${stars}`, 0, y, 28);
    y -= 42;
    this.popupManager.addLabel(`成熟周期: ${config.growthDays} 天`, 0, y, 28);
    y -= 42;
    this.popupManager.addLabel(`适宜温度: ${config.tempMin}°C ~ ${config.tempMax}°C`, 0, y, 26);
    y -= 38;
    this.popupManager.addLabel(`适宜湿度: ${config.moistureMin}% ~ ${config.moistureMax}%`, 0, y, 26);
    y -= 50;
    
    this.popupManager.addLabel('— 选择游戏难度 —', 0, y, 22);
    y -= 50;
    
    this.popupManager.addButton('佛系种植', 0, y, () => {
      this.pendingHardMode = false;
      this.doPlant();
      this.popupManager.close();
    });
    this.popupManager.addLabel('显示数值提示', 0, y - 35, 20);
    y -= 80;
    
    this.popupManager.addButton('硬核种植', 0, y, () => {
      this.pendingHardMode = true;
      this.doPlant();
      this.popupManager.close();
    });
    this.popupManager.addLabel('隐藏详细信息', 0, y - 35, 20);
  }
  
  /**
   * 显示挖除确认
   */
  showRemoveConfirm() {
    const popup = this.popupManager.show('RemoveConfirm', {
      title: '确认挖除',
      height: 0.32,
    });
    
    this.popupManager.addLabel('挖除后无法恢复！', 0, 15, 24);
    
    this.popupManager.addButton('确认挖除', 0, -40, () => {
      this.doRemovePlant();
      this.popupManager.close();
    }, 'danger');
    
    this.popupManager.addButton('取消', 0, -100, () => {
      this.popupManager.close();
    }, 'secondary');
  }
  
  /**
   * 显示设施菜单
   */
  showFacilityMenu() {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    
    const popup = this.popupManager.show('FacilityMenu', {
      title: '设施管理',
      height: 0.55,
    });
    
    const shelterText = plot.hasShelter ? '遮雨棚 [已安装]' : '遮雨棚 [点击安装]';
    this.popupManager.addButton(shelterText, 0, 60, () => {
      this.toggleShelter();
      this.popupManager.close();
    });
    this.popupManager.addLabel('阻挡风雨阳光，减少蒸发但影响生长', 0, 10, 20);
    
    const dehumText = plot.hasDehumidifier ? '除湿器 [已安装]' : '除湿器 [点击安装]';
    this.popupManager.addButton(dehumText, 0, -60, () => {
      this.toggleDehumidifier();
      this.popupManager.close();
    });
    this.popupManager.addLabel('每小时降低 2% 土壤湿度', 0, -110, 22);
    
    this.popupManager.addButton('关闭', 0, -190, () => {
      this.popupManager.close();
    }, 'secondary');
  }
  
  /**
   * 切换遮雨棚
   */
  toggleShelter() {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    if (plot.hasShelter) {
      this.gameData.plots[this.selectedPlot] = removeShelter(plot);
      console.log('🏠 移除遮雨棚');
    } else {
      this.gameData.plots[this.selectedPlot] = installShelter(plot);
      console.log('🏠 安装遮雨棚');
    }
    saveGame(this.gameData);
  }
  
  /**
   * 切换除湿器
   */
  toggleDehumidifier() {
    if (!this.gameData) return;
    
    const plot = this.gameData.plots[this.selectedPlot];
    if (plot.hasDehumidifier) {
      this.gameData.plots[this.selectedPlot] = removeDehumidifier(plot);
      console.log('💨 移除除湿器');
    } else {
      this.gameData.plots[this.selectedPlot] = installDehumidifier(plot);
      console.log('💨 安装除湿器');
    }
    saveGame(this.gameData);
  }
  
  /**
   * 立即保存
   */
  saveNow() {
    if (this.gameData) {
      saveGame(this.gameData);
    }
  }
  
  /**
   * 销毁
   */
  destroy() {
    if (this.gameData) {
      this.gameData.lastOnlineAt = Date.now();
      saveGame(this.gameData);
    }
  }
}
