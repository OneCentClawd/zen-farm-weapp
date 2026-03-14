/**
 * 🌤️ 天气渲染器（Canvas 2D 版）
 * 
 * 功能：
 * - 太阳/月亮根据时间移动
 * - 云层根据风速移动
 * - 雨滴粒子效果
 * - 天空渐变背景
 */

/**
 * 天气渲染器类
 */
export class WeatherRenderer {
  
  /**
   * @param {number} screenWidth
   * @param {number} screenHeight
   */
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.skyHeight = screenHeight * 2 / 3;  // 天空区域高度
    
    // 云朵数据
    this.clouds = [];
    
    // 雨滴数据
    this.raindrops = [];
    
    // 当前天气和时间
    this.currentWeather = null;
    this.currentHour = 12;
    this.lastWindSpeed = 0;
  }
  
  /**
   * 更新天气
   * @param {import('../core/Environment.js').WeatherData} weather
   * @param {number} [hour] - 当前小时（支持小数）
   */
  updateWeather(weather, hour) {
    this.currentWeather = weather;
    
    if (hour !== undefined) {
      this.currentHour = hour;
    } else {
      const now = new Date();
      this.currentHour = now.getHours() + now.getMinutes() / 60;
    }
    
    this.updateClouds();
    this.updateRain();
  }
  
  /**
   * 渲染天气
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} dt - 帧间隔
   */
  render(ctx, dt) {
    // 更新当前时间
    const now = new Date();
    this.currentHour = now.getHours() + now.getMinutes() / 60;
    
    this.drawSkyGradient(ctx);
    this.drawCelestialBodies(ctx);
    this.updateCloudsMovement(dt);
    this.drawClouds(ctx);
    this.updateRainMovement(dt);
    this.drawRain(ctx);
  }
  
  /**
   * 绘制天空渐变
   */
  drawSkyGradient(ctx) {
    const hour = this.currentHour;
    // 天空渐变从顶部开始，覆盖整个屏幕（UI 会画在上面）
    const skyY = 0;
    
    let topColor, bottomColor;
    
    if (hour >= 5 && hour < 6) {
      // 黎明
      const t = hour - 5;
      topColor = this.rgbString(30 + 70 * t, 40 + 80 * t, 80 + 100 * t);
      bottomColor = this.rgbString(60 + 120 * t, 80 + 80 * t, 100 + 50 * t);
    } else if (hour >= 6 && hour < 8) {
      // 日出
      topColor = 'rgb(135, 180, 230)';
      bottomColor = 'rgb(255, 180, 120)';
    } else if (hour >= 8 && hour < 12) {
      // 上午
      topColor = 'rgb(90, 140, 220)';
      bottomColor = 'rgb(150, 195, 240)';
    } else if (hour >= 12 && hour < 16) {
      // 下午
      topColor = 'rgb(100, 150, 220)';
      bottomColor = 'rgb(160, 200, 240)';
    } else if (hour >= 16 && hour < 18) {
      // 傍晚
      const t = (hour - 16) / 2;
      topColor = this.rgbString(100 + 30 * t, 150 - 30 * t, 220 - 60 * t);
      bottomColor = this.rgbString(200 + 55 * t, 180 - 20 * t, 150 - 30 * t);
    } else if (hour >= 18 && hour < 19) {
      // 日落
      topColor = 'rgb(130, 120, 160)';
      bottomColor = 'rgb(255, 160, 120)';
    } else if (hour >= 19 && hour < 20) {
      // 黄昏
      const t = hour - 19;
      topColor = this.rgbString(80 - 40 * t, 80 - 30 * t, 140 - 40 * t);
      bottomColor = this.rgbString(130 - 50 * t, 100 - 20 * t, 140 - 30 * t);
    } else {
      // 夜晚
      topColor = 'rgb(15, 20, 40)';
      bottomColor = 'rgb(30, 40, 70)';
    }
    
    // 阴天/雨天变灰
    if (this.currentWeather && this.currentWeather.sunlight < 0.5) {
      const grayFactor = (1 - this.currentWeather.sunlight) * 0.5;
      topColor = this.blendToGray(topColor, grayFactor);
      bottomColor = this.blendToGray(bottomColor, grayFactor);
    }
    
    // 绘制渐变（从顶部到天空区域底部）
    const gradient = ctx.createLinearGradient(0, 0, 0, this.skyHeight);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.screenWidth, this.skyHeight);
  }
  
  /**
   * 绘制太阳/月亮
   */
  drawCelestialBodies(ctx) {
    const hour = this.currentHour;
    const halfW = this.screenWidth / 2;
    // 太阳/月亮在天空区域内活动
    const topY = 80;  // 最高点
    const bottomY = this.skyHeight - 40;  // 最低点（地平线上方）
    
    // 太阳：6:00 升起，18:00 落下
    if (hour >= 6 && hour < 18) {
      const sunProgress = (hour - 6) / 12;
      const sunX = halfW * 0.2 + sunProgress * halfW * 1.6;
      const sunY = bottomY - Math.sin(sunProgress * Math.PI) * (bottomY - topY);
      
      this.drawSun(ctx, sunX, sunY, 40);
    }
    
    // 月亮：18:00 升起，6:00 落下
    if (hour >= 18 || hour < 6) {
      let moonProgress;
      if (hour >= 18) {
        moonProgress = (hour - 18) / 12;
      } else {
        moonProgress = (hour + 6) / 12;
      }
      
      const moonX = halfW * 0.2 + moonProgress * halfW * 1.6;
      const moonY = bottomY - Math.sin(moonProgress * Math.PI) * (bottomY - topY);
      
      this.drawMoon(ctx, moonX, moonY, 25);
    }
  }
  
  /**
   * 绘制太阳
   */
  drawSun(ctx, x, y, radius) {
    // 光晕
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    gradient.addColorStop(0, 'rgba(255, 220, 50, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 太阳本体
    ctx.fillStyle = 'rgb(255, 220, 50)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 光芒
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const innerR = radius + 5;
      const outerR = radius + 20;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
      ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
      ctx.stroke();
    }
  }
  
  /**
   * 绘制月亮
   */
  drawMoon(ctx, x, y, radius) {
    // 月亮本体
    ctx.fillStyle = 'rgb(255, 250, 220)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 陨石坑
    ctx.fillStyle = 'rgba(200, 200, 190, 0.4)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y + radius * 0.2, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.1, y + radius * 0.35, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 更新云层
   */
  updateClouds() {
    if (!this.currentWeather) return;
    
    const code = this.currentWeather.weatherCode;
    let cloudCount = 0;
    let rainCloudRatio = 0;
    
    if (code === 0) {
      cloudCount = 2;
    } else if (code === 1) {
      cloudCount = 5;
    } else if (code === 2) {
      cloudCount = 8;
    } else if (code === 3) {
      cloudCount = 12;
    } else if (code >= 51 && code <= 99) {
      cloudCount = 10;
      rainCloudRatio = 0.8;
    } else {
      cloudCount = 6;
    }
    
    // 调整云数量
    while (this.clouds.length > cloudCount) {
      this.clouds.pop();
    }
    
    while (this.clouds.length < cloudCount) {
      const isRain = this.seededRandom(this.clouds.length * 31 + 13) < rainCloudRatio;
      this.clouds.push(this.createCloud(isRain, this.clouds.length));
    }
    
    // 更新云速度
    const windSpeed = this.currentWeather.windSpeed;
    if (Math.abs(windSpeed - this.lastWindSpeed) > 0.5) {
      const baseSpeed = 10 + windSpeed * 1.5;
      for (let i = 0; i < this.clouds.length; i++) {
        this.clouds[i].speed = baseSpeed * (0.8 + this.seededRandom(i * 17 + 5) * 0.4);
      }
      this.lastWindSpeed = windSpeed;
    }
  }
  
  /**
   * 创建云
   */
  createCloud(isRainCloud, index) {
    const size = 100 + this.seededRandom(index * 23 + 7) * 80;
    const x = this.seededRandom(index * 41 + 3) * this.screenWidth;
    // 云在天空区域上半部分
    const y = 60 + this.seededRandom(index * 53 + 11) * (this.skyHeight * 0.4);
    const scale = 0.8 + this.seededRandom(index * 67 + 19) * 0.5;
    
    return {
      x,
      y,
      size,
      scale,
      speed: 20,
      isRainCloud
    };
  }
  
  /**
   * 更新云移动
   */
  updateCloudsMovement(dt) {
    const cloudBuffer = 200;
    
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      cloud.x += cloud.speed * dt;
      
      if (cloud.x > this.screenWidth + cloudBuffer) {
        cloud.x = -cloudBuffer;
        const timeSeed = Math.floor(Date.now() / 1000) % 10000;
        cloud.y = 60 + this.seededRandom(timeSeed + i * 37) * (this.skyHeight * 0.4);
      }
    }
  }
  
  /**
   * 绘制云层
   */
  drawClouds(ctx) {
    for (const cloud of this.clouds) {
      ctx.save();
      ctx.translate(cloud.x, cloud.y);
      ctx.scale(cloud.scale, cloud.scale);
      
      const color = cloud.isRainCloud 
        ? 'rgba(120, 120, 130, 0.85)'
        : 'rgba(255, 255, 255, 0.85)';
      
      ctx.fillStyle = color;
      
      const r = cloud.size * 0.3;
      
      // 多个圆组成蓬松的云
      ctx.beginPath();
      ctx.arc(-r * 0.5, 0, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.3, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, r * 0.3, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 雨云底部更暗
      if (cloud.isRainCloud) {
        ctx.fillStyle = 'rgba(80, 80, 90, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.4, r * 1.2, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
  
  /**
   * 更新雨
   */
  updateRain() {
    if (!this.currentWeather) return;
    
    const precipitation = this.currentWeather.precipitation;
    
    if (precipitation <= 0) {
      this.raindrops = [];
      return;
    }
    
    const dropCount = Math.min(200, Math.round(precipitation * 20));
    
    while (this.raindrops.length < dropCount) {
      this.raindrops.push(this.createRaindrop());
    }
    while (this.raindrops.length > dropCount) {
      this.raindrops.pop();
    }
  }
  
  /**
   * 创建雨滴
   */
  createRaindrop() {
    return {
      x: Math.random() * this.screenWidth,
      y: Math.random() * 100,
      speed: 150 + Math.random() * 150,
      length: 15 + Math.random() * 20
    };
  }
  
  /**
   * 更新雨滴移动
   */
  updateRainMovement(dt) {
    if (this.raindrops.length === 0) return;
    
    const wind = this.currentWeather?.windSpeed || 0;
    const windOffset = wind * 0.3;
    
    for (const drop of this.raindrops) {
      drop.y += drop.speed * dt;
      drop.x += windOffset * dt;
      
      if (drop.y > this.screenHeight) {
        drop.y = -Math.random() * 50;
        drop.x = Math.random() * this.screenWidth;
      }
    }
  }
  
  /**
   * 绘制雨
   */
  drawRain(ctx) {
    if (this.raindrops.length === 0) return;
    
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.6)';
    ctx.lineWidth = 1.5;
    
    const wind = this.currentWeather?.windSpeed || 0;
    const windOffset = wind * 0.05;
    
    ctx.beginPath();
    for (const drop of this.raindrops) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + windOffset, drop.y - drop.length);
    }
    ctx.stroke();
  }
  
  /**
   * 是否为夜晚
   */
  isNight() {
    return this.currentHour < 5 || this.currentHour >= 20;
  }
  
  /**
   * 是否在下雨
   */
  isRaining() {
    return (this.currentWeather?.precipitation || 0) > 0;
  }
  
  // ========== 工具函数 ==========
  
  rgbString(r, g, b) {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  
  parseRgb(colorStr) {
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 128, g: 128, b: 128 };
  }
  
  blendToGray(colorStr, factor) {
    const c = this.parseRgb(colorStr);
    const gray = Math.round((c.r + c.g + c.b) / 3);
    return this.rgbString(
      c.r + (gray - c.r) * factor,
      c.g + (gray - c.g) * factor,
      c.b + (gray - c.b) * factor
    );
  }
  
  seededRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}
