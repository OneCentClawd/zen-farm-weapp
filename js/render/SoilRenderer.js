/**
 * 🟫 土壤渲染器（Canvas 2D 版）
 * 
 * 状态：
 * - 干燥（浅棕色，裂纹纹理）
 * - 湿润（深棕色）
 * - 积水（有水洼反光）
 */

/**
 * 土壤渲染器类
 */
export class SoilRenderer {
  
  /**
   * @param {number} width - 土壤宽度
   * @param {number} height - 土壤高度
   */
  constructor(width, height) {
    this.soilWidth = width;
    this.soilHeight = height;
    this.currentMoisture = 50;
    
    // 裂纹数据
    this.cracks = [];
    this.generateCracks();
    
    // 水波纹动画
    this.rippleTime = 0;
  }
  
  /**
   * 生成随机裂纹（干燥时显示）
   */
  generateCracks() {
    this.cracks = [];
    const numCracks = 8 + Math.floor(Math.random() * 5);
    const halfW = this.soilWidth / 2;
    const halfH = this.soilHeight / 2;
    
    for (let i = 0; i < numCracks; i++) {
      const x1 = -halfW * 0.8 + Math.random() * halfW * 1.6;
      const y1 = -halfH * 0.6 + Math.random() * halfH * 1.2;
      
      const angle = Math.random() * Math.PI;
      const length = 20 + Math.random() * 40;
      
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;
      
      this.cracks.push({ x1, y1, x2, y2 });
      
      // 分支裂纹
      if (Math.random() > 0.5) {
        const branchAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
        const branchLen = length * 0.5;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        this.cracks.push({
          x1: midX,
          y1: midY,
          x2: midX + Math.cos(branchAngle) * branchLen,
          y2: midY + Math.sin(branchAngle) * branchLen
        });
      }
    }
  }
  
  /**
   * 更新土壤湿度
   * @param {number} moisture - 湿度值 0~100
   */
  updateMoisture(moisture) {
    this.currentMoisture = Math.max(0, Math.min(100, moisture));
  }
  
  /**
   * 渲染土壤
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} dt - 帧间隔
   */
  render(ctx, x, y, dt) {
    ctx.save();
    ctx.translate(x, y);
    
    const moisture = this.currentMoisture;
    const halfW = this.soilWidth / 2;
    const halfH = this.soilHeight / 2;
    
    // 根据湿度计算土壤颜色
    let baseColor;
    
    if (moisture < 20) {
      baseColor = { r: 180, g: 140, b: 100 };
    } else if (moisture < 40) {
      const t = (moisture - 20) / 20;
      baseColor = this.lerpColor(
        { r: 180, g: 140, b: 100 },
        { r: 140, g: 100, b: 70 },
        t
      );
    } else if (moisture < 70) {
      const t = (moisture - 40) / 30;
      baseColor = this.lerpColor(
        { r: 140, g: 100, b: 70 },
        { r: 100, g: 70, b: 50 },
        t
      );
    } else if (moisture < 90) {
      baseColor = { r: 80, g: 55, b: 40 };
    } else {
      baseColor = { r: 70, g: 50, b: 45 };
    }
    
    // 绘制土壤背景
    ctx.fillStyle = this.colorToString(baseColor);
    ctx.fillRect(-halfW, -halfH, this.soilWidth, this.soilHeight);
    
    // 绘制土壤纹理
    this.drawSoilTexture(ctx, baseColor, halfW, halfH);
    
    // 干燥时显示裂纹
    if (moisture < 25) {
      this.drawCracks(ctx, moisture);
    }
    
    // 积水效果
    if (moisture >= 90) {
      this.rippleTime += dt;
      this.drawWaterPuddle(ctx, halfW, halfH);
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制土壤纹理
   */
  drawSoilTexture(ctx, baseColor, halfW, halfH) {
    const seed = 12345;
    
    // 深色斑点
    ctx.fillStyle = this.colorToString(this.darkenColor(baseColor, 20));
    for (let i = 0; i < 30; i++) {
      const px = this.seededRandom(seed + i * 3) * this.soilWidth - halfW;
      const py = this.seededRandom(seed + i * 3 + 1) * this.soilHeight - halfH;
      const pr = 3 + this.seededRandom(seed + i * 3 + 2) * 6;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 浅色斑点
    ctx.fillStyle = this.colorToString(this.lightenColor(baseColor, 15));
    for (let i = 0; i < 20; i++) {
      const px = this.seededRandom(seed + 100 + i * 3) * this.soilWidth - halfW;
      const py = this.seededRandom(seed + 100 + i * 3 + 1) * this.soilHeight - halfH;
      const pr = 2 + this.seededRandom(seed + 100 + i * 3 + 2) * 4;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 绘制裂纹
   */
  drawCracks(ctx, moisture) {
    const alpha = Math.round((25 - moisture) / 25 * 180) / 255;
    ctx.strokeStyle = `rgba(60, 40, 30, ${alpha})`;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (const crack of this.cracks) {
      ctx.moveTo(crack.x1, crack.y1);
      ctx.lineTo(crack.x2, crack.y2);
    }
    ctx.stroke();
  }
  
  /**
   * 绘制水洼（积水浮在土壤顶部）
   */
  drawWaterPuddle(ctx, halfW, halfH) {
    // 侧视角：积水在土壤最上面
    const waterY = -halfH;  // 土壤顶部
    const waterW = this.soilWidth * 0.9;  // 接近土壤宽度
    const waterH = 15;  // 水层厚度
    
    // 水层主体（半透明蓝色）
    ctx.fillStyle = 'rgba(80, 130, 180, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, waterY + waterH / 2, waterW / 2, waterH, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 水面高光（顶部反光）
    ctx.fillStyle = 'rgba(180, 210, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, waterY + 3, waterW / 2 * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 边缘高光
    ctx.fillStyle = 'rgba(220, 240, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-waterW * 0.25, waterY + 5, waterW * 0.15, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 波纹效果
    const rippleAlpha = 0.2 + Math.sin(this.rippleTime * 3) * 0.1;
    ctx.strokeStyle = `rgba(200, 230, 255, ${rippleAlpha})`;
    ctx.lineWidth = 1;
    
    const rippleScale = 0.5 + Math.sin(this.rippleTime * 2) * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, waterY + waterH / 2, waterW / 2 * rippleScale, waterH * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // 第二圈波纹（错开相位）
    const rippleScale2 = 0.7 + Math.sin(this.rippleTime * 2 + 1) * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, waterY + waterH / 2, waterW / 2 * rippleScale2, waterH * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  /**
   * 获取当前湿度
   */
  getMoisture() {
    return this.currentMoisture;
  }
  
  /**
   * 获取土壤状态描述
   */
  getStateDescription() {
    const m = this.currentMoisture;
    if (m < 20) return '干燥';
    if (m < 40) return '偏干';
    if (m < 70) return '湿润';
    if (m < 90) return '很湿';
    return '积水';
  }
  
  // ========== 工具函数 ==========
  
  colorToString(c) {
    return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  }
  
  lerpColor(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t
    };
  }
  
  darkenColor(color, amount) {
    return {
      r: Math.max(0, color.r - amount),
      g: Math.max(0, color.g - amount),
      b: Math.max(0, color.b - amount)
    };
  }
  
  lightenColor(color, amount) {
    return {
      r: Math.min(255, color.r + amount),
      g: Math.min(255, color.g + amount),
      b: Math.min(255, color.b + amount)
    };
  }
  
  seededRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}
