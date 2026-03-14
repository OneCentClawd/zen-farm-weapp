/**
 * 🎆 粒子效果管理器（Canvas 2D 版）
 * 
 * 功能：
 * - 雨滴粒子 + 落地飞溅
 * - 雪花粒子（六角形）
 * - 浇水溅射
 * - 风速影响水平偏移
 */

/**
 * 单个粒子
 */
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;    // 速度 x
    this.vy = 0;    // 速度 y
    this.life = 0;  // 剩余生命（秒）
    this.maxLife = 1;
    this.size = 5;
    this.sizeEnd = 2;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.alpha = 1;
    this.color = { r: 255, g: 255, b: 255 };
    this.colorEnd = { r: 255, g: 255, b: 255 };
  }
  
  /**
   * 更新粒子
   * @param {number} dt - 帧间隔
   * @param {number} gravityX - 重力 X
   * @param {number} gravityY - 重力 Y
   * @returns {boolean} - 是否还活着
   */
  update(dt, gravityX, gravityY) {
    this.life -= dt;
    if (this.life <= 0) return false;
    
    // 速度受重力影响
    this.vx += gravityX * dt;
    this.vy += gravityY * dt;
    
    // 位置更新
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // 旋转
    this.rotation += this.rotationSpeed * dt;
    
    return true;
  }
  
  /**
   * 获取当前进度 (0=刚出生, 1=将死)
   */
  getProgress() {
    return 1 - this.life / this.maxLife;
  }
  
  /**
   * 获取插值后的大小
   */
  getCurrentSize() {
    const t = this.getProgress();
    return this.size + (this.sizeEnd - this.size) * t;
  }
  
  /**
   * 获取插值后的颜色
   */
  getCurrentColor() {
    const t = this.getProgress();
    return {
      r: Math.round(this.color.r + (this.colorEnd.r - this.color.r) * t),
      g: Math.round(this.color.g + (this.colorEnd.g - this.color.g) * t),
      b: Math.round(this.color.b + (this.colorEnd.b - this.color.b) * t)
    };
  }
  
  /**
   * 获取插值后的透明度
   */
  getCurrentAlpha() {
    const t = this.getProgress();
    // 后半段逐渐消失
    if (t > 0.5) {
      return this.alpha * (1 - (t - 0.5) * 2);
    }
    return this.alpha;
  }
}

/**
 * 粒子发射器
 */
class ParticleEmitter {
  constructor() {
    this.particles = [];
    this.active = false;
    
    // 发射位置
    this.x = 0;
    this.y = 0;
    this.posVarX = 0;
    this.posVarY = 0;
    
    // 发射配置
    this.emissionRate = 50;  // 每秒发射数量
    this.totalParticles = 200;
    this.duration = -1;  // -1 = 持续发射
    
    // 粒子属性
    this.life = 1;
    this.lifeVar = 0.2;
    this.speed = 100;
    this.speedVar = 20;
    this.angle = 270;  // 向下
    this.angleVar = 10;
    
    // 重力
    this.gravityX = 0;
    this.gravityY = -200;
    
    // 大小
    this.startSize = 10;
    this.startSizeVar = 3;
    this.endSize = 5;
    
    // 颜色
    this.startColor = { r: 255, g: 255, b: 255 };
    this.endColor = { r: 255, g: 255, b: 255 };
    this.startAlpha = 1;
    this.endAlpha = 0;
    
    // 旋转
    this.startSpin = 0;
    this.startSpinVar = 0;
    this.endSpin = 0;
    
    // 内部计时
    this.emitTimer = 0;
    this.elapsed = 0;
  }
  
  /**
   * 启动发射
   */
  start() {
    this.active = true;
    this.emitTimer = 0;
    this.elapsed = 0;
  }
  
  /**
   * 停止发射
   */
  stop() {
    this.active = false;
  }
  
  /**
   * 重置（清空粒子并重新开始）
   */
  reset() {
    this.particles = [];
    this.start();
  }
  
  /**
   * 更新发射器
   * @param {number} dt - 帧间隔
   */
  update(dt) {
    this.elapsed += dt;
    
    // 发射新粒子
    if (this.active) {
      if (this.duration < 0 || this.elapsed < this.duration) {
        this.emitTimer += dt;
        const interval = 1 / this.emissionRate;
        
        while (this.emitTimer >= interval && this.particles.length < this.totalParticles) {
          this.emitTimer -= interval;
          this.emitParticle();
        }
      }
    }
    
    // 更新所有粒子
    this.particles = this.particles.filter(p => p.update(dt, this.gravityX, this.gravityY));
  }
  
  /**
   * 发射一个粒子
   */
  emitParticle() {
    const p = new Particle();
    
    // 位置（发射区域内随机）
    p.x = this.x + (Math.random() - 0.5) * 2 * this.posVarX;
    p.y = this.y + (Math.random() - 0.5) * 2 * this.posVarY;
    
    // 生命
    p.life = this.life + (Math.random() - 0.5) * 2 * this.lifeVar;
    p.maxLife = p.life;
    
    // 速度（角度 + 速度）
    const speed = this.speed + (Math.random() - 0.5) * 2 * this.speedVar;
    const angle = (this.angle + (Math.random() - 0.5) * 2 * this.angleVar) * Math.PI / 180;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    
    // 大小
    p.size = this.startSize + (Math.random() - 0.5) * 2 * this.startSizeVar;
    p.sizeEnd = this.endSize;
    
    // 颜色
    p.color = { ...this.startColor };
    p.colorEnd = { ...this.endColor };
    p.alpha = this.startAlpha;
    
    // 旋转
    p.rotation = (this.startSpin + (Math.random() - 0.5) * 2 * this.startSpinVar) * Math.PI / 180;
    p.rotationSpeed = ((this.endSpin - this.startSpin) / p.life) * Math.PI / 180;
    
    this.particles.push(p);
  }
  
  /**
   * 是否有活跃粒子
   */
  hasParticles() {
    return this.particles.length > 0;
  }
}

/**
 * 粒子效果管理器
 */
export class ParticleEffects {
  
  /**
   * @param {number} screenWidth
   * @param {number} screenHeight
   */
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    
    // 地面 Y 坐标（Canvas 坐标系，Y 向下）
    this.groundY = screenHeight * 2 / 3;
    
    // 当前风速 km/h
    this.currentWindSpeed = 0;
    
    // 发射器
    this.rainEmitter = this.createRainEmitter();
    this.snowEmitter = this.createSnowEmitter();
    this.groundSplashEmitter = this.createGroundSplashEmitter();
    
    // 一次性溅射粒子
    this.splashEmitters = [];
    
    // 上次天气代码
    this.lastWeatherCode = -1;
  }
  
  /**
   * 创建雨滴发射器
   */
  createRainEmitter() {
    const emitter = new ParticleEmitter();
    
    emitter.x = this.screenWidth / 2;
    emitter.y = 0;  // 屏幕顶部
    emitter.posVarX = this.screenWidth / 2;
    emitter.posVarY = 0;
    
    emitter.totalParticles = 300;
    emitter.emissionRate = 150;
    emitter.life = 1.5;
    emitter.lifeVar = 0.3;
    
    emitter.gravityX = 0;
    emitter.gravityY = 1200;  // 更快下落
    
    emitter.speed = 600;
    emitter.speedVar = 150;
    emitter.angle = 90;  // 向下
    emitter.angleVar = 3;
    
    emitter.startColor = { r: 150, g: 200, b: 255 };
    emitter.endColor = { r: 100, g: 180, b: 255 };
    emitter.startAlpha = 0.8;
    
    emitter.startSize = 8;   // 小一点
    emitter.startSizeVar = 3;
    emitter.endSize = 4;
    
    return emitter;
  }
  
  /**
   * 创建雪花发射器
   */
  createSnowEmitter() {
    const emitter = new ParticleEmitter();
    
    emitter.x = this.screenWidth / 2;
    emitter.y = 0;
    emitter.posVarX = this.screenWidth / 2;
    emitter.posVarY = 0;
    
    emitter.totalParticles = 200;
    emitter.emissionRate = 30;
    emitter.life = 10;
    emitter.lifeVar = 2;
    
    emitter.gravityX = 0;
    emitter.gravityY = 30;  // 轻微重力，慢慢飘
    
    emitter.speed = 40;
    emitter.speedVar = 15;
    emitter.angle = 90;
    emitter.angleVar = 20;
    
    emitter.startColor = { r: 255, g: 255, b: 255 };
    emitter.endColor = { r: 240, g: 250, b: 255 };
    emitter.startAlpha = 0.9;
    
    emitter.startSize = 8;
    emitter.startSizeVar = 4;
    emitter.endSize = 6;
    
    emitter.startSpin = 0;
    emitter.startSpinVar = 180;
    emitter.endSpin = 360;
    
    return emitter;
  }
  
  /**
   * 创建地面飞溅发射器
   */
  createGroundSplashEmitter() {
    const emitter = new ParticleEmitter();
    
    emitter.x = this.screenWidth / 2;
    emitter.y = this.groundY;
    emitter.posVarX = this.screenWidth / 2;
    emitter.posVarY = 0;
    
    emitter.totalParticles = 100;
    emitter.emissionRate = 0;
    emitter.life = 0.3;
    emitter.lifeVar = 0.1;
    
    emitter.gravityX = 0;
    emitter.gravityY = 200;  // 向下
    
    emitter.speed = 80;
    emitter.speedVar = 40;
    emitter.angle = -90;  // 向上
    emitter.angleVar = 60;
    
    emitter.startColor = { r: 150, g: 200, b: 255 };
    emitter.endColor = { r: 180, g: 220, b: 255 };
    emitter.startAlpha = 0.8;
    
    emitter.startSize = 8;
    emitter.startSizeVar = 4;
    emitter.endSize = 2;
    
    return emitter;
  }
  
  /**
   * 开始下雨
   * @param {number} intensity - 强度 0~1
   */
  startRain(intensity = 1) {
    console.log(`🌧️ 开始下雨，强度: ${intensity}`);
    this.rainEmitter.emissionRate = 40 + intensity * 110;
    
    // 根据强度调整速度和大小
    if (intensity >= 0.8) {
      // 暴雨：快速、密集
      this.rainEmitter.speed = 600;
      this.rainEmitter.gravityY = 1200;
      this.rainEmitter.startSize = 10;
    } else {
      // 普通雨：慢一点、柔和
      this.rainEmitter.speed = 300;
      this.rainEmitter.gravityY = 600;
      this.rainEmitter.startSize = 6;
    }
    
    this.rainEmitter.start();
    
    // 启动地面飞溅
    this.groundSplashEmitter.emissionRate = 30 + intensity * 50;
    this.groundSplashEmitter.start();
  }
  
  /**
   * 停止下雨
   */
  stopRain() {
    this.rainEmitter.stop();
    this.groundSplashEmitter.stop();
  }
  
  /**
   * 开始下雪
   * @param {number} intensity - 强度 0~1
   */
  startSnow(intensity = 1) {
    console.log(`❄️ 开始下雪，强度: ${intensity}`);
    this.snowEmitter.emissionRate = 20 + intensity * 40;
    
    // 根据强度调整，但雪花始终要慢、飘逸
    if (intensity >= 0.8) {
      // 暴雪：更密集，雪花更大
      this.snowEmitter.speed = 60;
      this.snowEmitter.gravityY = 50;
      this.snowEmitter.startSize = 14;
      this.snowEmitter.startSizeVar = 6;
    } else {
      // 普通雪：慢慢飘
      this.snowEmitter.speed = 40;
      this.snowEmitter.gravityY = 30;
      this.snowEmitter.startSize = 8;
      this.snowEmitter.startSizeVar = 4;
    }
    
    this.snowEmitter.start();
  }
  
  /**
   * 停止下雪
   */
  stopSnow() {
    this.snowEmitter.stop();
  }
  
  /**
   * 播放浇水溅落效果
   * @param {number} x
   * @param {number} y
   */
  playWaterSplash(x, y) {
    console.log(`💧 播放浇水特效 at (${x}, ${y})`);
    
    const emitter = new ParticleEmitter();
    emitter.x = x;
    emitter.y = y;
    emitter.posVarX = 30;
    emitter.posVarY = 15;
    
    emitter.totalParticles = 80;
    emitter.duration = 0.2;
    emitter.emissionRate = 500;
    emitter.life = 0.8;
    emitter.lifeVar = 0.3;
    
    emitter.gravityX = 0;
    emitter.gravityY = 400;
    
    emitter.speed = 250;
    emitter.speedVar = 100;
    emitter.angle = -90;  // 向上
    emitter.angleVar = 70;
    
    emitter.startColor = { r: 120, g: 200, b: 255 };
    emitter.endColor = { r: 180, g: 220, b: 255 };
    emitter.startAlpha = 0.7;
    
    emitter.startSize = 36;
    emitter.startSizeVar = 12;
    emitter.endSize = 12;
    
    emitter.startSpin = -90;
    emitter.startSpinVar = 180;
    emitter.endSpin = 180;
    
    emitter.start();
    this.splashEmitters.push(emitter);
  }
  
  /**
   * 更新风速（影响雨雪飘动方向）
   * @param {number} windSpeed - 风速 km/h
   */
  updateWindSpeed(windSpeed) {
    this.currentWindSpeed = windSpeed;
    
    // 风速转换为水平重力分量
    const windForce = windSpeed * 6;
    
    // 风吹偏移补偿
    const windOffset = -windForce * 2;
    
    // 雨滴受风影响
    this.rainEmitter.gravityX = windForce;
    this.rainEmitter.x = this.screenWidth / 2 + windOffset;
    this.rainEmitter.posVarX = this.screenWidth / 2 + Math.abs(windForce) * 1.5;
    
    // 雪花受风影响更大
    this.snowEmitter.gravityX = windForce * 1.3;
    this.snowEmitter.x = this.screenWidth / 2 + windOffset * 1.3;
    this.snowEmitter.posVarX = this.screenWidth / 2 + Math.abs(windForce) * 2;
  }
  
  /**
   * 根据天气代码更新粒子效果
   * @param {number} weatherCode
   */
  updateWeatherEffect(weatherCode) {
    // 天气没变就不重置
    if (weatherCode === this.lastWeatherCode) return;
    this.lastWeatherCode = weatherCode;
    
    // 停止所有效果
    this.stopRain();
    this.stopSnow();
    
    // 71-77: 雪
    if (weatherCode >= 71 && weatherCode <= 77) {
      const intensity = weatherCode >= 75 ? 1 : 0.5;
      this.startSnow(intensity);
      return;
    }
    
    // 51-67, 80-99: 雨
    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99)) {
      let intensity = 0.5;
      if ((weatherCode >= 63 && weatherCode <= 64) || (weatherCode >= 82 && weatherCode <= 84)) intensity = 0.8;
      if ((weatherCode >= 65 && weatherCode <= 67) || weatherCode >= 85) intensity = 1;
      this.startRain(intensity);
    }
  }
  
  /**
   * 更新所有粒子
   * @param {number} dt - 帧间隔
   */
  update(dt) {
    this.rainEmitter.update(dt);
    this.snowEmitter.update(dt);
    this.groundSplashEmitter.update(dt);
    
    // 雨滴落到地面时移除
    this.rainEmitter.particles = this.rainEmitter.particles.filter(p => p.y < this.groundY);
    
    // 雪花落到地面时移除
    this.snowEmitter.particles = this.snowEmitter.particles.filter(p => p.y < this.groundY);
    
    // 更新一次性溅射
    for (let i = this.splashEmitters.length - 1; i >= 0; i--) {
      const emitter = this.splashEmitters[i];
      emitter.update(dt);
      
      // 发射完毕且无粒子，移除
      if (!emitter.active && !emitter.hasParticles()) {
        this.splashEmitters.splice(i, 1);
      }
    }
  }
  
  /**
   * 渲染所有粒子
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // 渲染雨滴
    this.renderRainParticles(ctx, this.rainEmitter.particles);
    
    // 渲染雪花
    this.renderSnowParticles(ctx, this.snowEmitter.particles);
    
    // 渲染地面飞溅
    this.renderSplashParticles(ctx, this.groundSplashEmitter.particles);
    
    // 渲染浇水溅射
    for (const emitter of this.splashEmitters) {
      this.renderSplashParticles(ctx, emitter.particles);
    }
  }
  
  /**
   * 渲染雨滴粒子
   */
  renderRainParticles(ctx, particles) {
    if (particles.length === 0) return;
    
    for (const p of particles) {
      const size = p.getCurrentSize();
      const color = p.getCurrentColor();
      const alpha = p.getCurrentAlpha();
      
      ctx.save();
      ctx.translate(p.x, p.y);
      
      // 根据速度方向旋转，但限制最大倾斜角度（避免变白线）
      let angle = Math.atan2(p.vy, p.vx);
      // 限制在 ±30° 以内
      const maxTilt = Math.PI / 6;
      const tilt = angle - Math.PI / 2;
      const clampedTilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
      ctx.rotate(clampedTilt);
      
      // 绘制雨滴（椭圆形，不要太长）
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.4, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }
  
  /**
   * 渲染雪花粒子（六角形）
   */
  renderSnowParticles(ctx, particles) {
    if (particles.length === 0) return;
    
    for (const p of particles) {
      const size = p.getCurrentSize();
      const color = p.getCurrentColor();
      const alpha = p.getCurrentAlpha();
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      
      // 六角形雪花
      this.drawSnowflake(ctx, size);
      
      ctx.restore();
    }
  }
  
  /**
   * 绘制六角形雪花
   */
  drawSnowflake(ctx, size) {
    const armLength = size * 0.4;
    const branchLength = armLength * 0.4;
    
    ctx.beginPath();
    
    // 6 个分支
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // 主分支
      ctx.moveTo(0, 0);
      ctx.lineTo(cos * armLength, sin * armLength);
      
      // 小分支
      const midX = cos * armLength * 0.6;
      const midY = sin * armLength * 0.6;
      const perpCos = Math.cos(angle + Math.PI / 4);
      const perpSin = Math.sin(angle + Math.PI / 4);
      
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + perpCos * branchLength, midY + perpSin * branchLength);
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX - perpCos * branchLength, midY - perpSin * branchLength);
    }
    
    ctx.stroke();
    
    // 中心点
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 渲染溅射粒子（小水滴）
   */
  renderSplashParticles(ctx, particles) {
    if (particles.length === 0) return;
    
    for (const p of particles) {
      const size = p.getCurrentSize();
      const color = p.getCurrentColor();
      const alpha = p.getCurrentAlpha();
      
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 检查是否有活跃效果
   */
  hasActiveEffects() {
    return this.rainEmitter.active || 
           this.snowEmitter.active || 
           this.rainEmitter.hasParticles() ||
           this.snowEmitter.hasParticles() ||
           this.splashEmitters.length > 0;
  }
}
