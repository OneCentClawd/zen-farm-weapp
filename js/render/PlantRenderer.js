/**
 * 程序化植物渲染器（Canvas 2D 版）
 * 纯代码绘制植物，不需要素材
 * 
 * 支持植物类型：
 * - 🍀 幸运草 (clover)
 * - 🌻 向日葵 (sunflower)
 * - 🍓 草莓 (strawberry)
 * - 🌸 樱花 (sakura)
 */

import { PlantType, HealthState } from '../core/PlantTypes.js';
import { getCurrentStage } from '../core/Plant.js';

/**
 * 植物渲染器类
 */
export class PlantRenderer {
  
  constructor() {
    // 动画时间（用于落樱等动态效果）
    this.animTime = 0;
    
    // 通用颜色配置
    this.stemColor = 'rgb(76, 153, 76)';           // 茎秆绿
    this.leafColor = 'rgb(60, 179, 113)';          // 叶子绿
    this.leafDarkColor = 'rgb(34, 139, 34)';       // 深绿（阴影）
    this.flowerColor = 'rgb(255, 255, 255)';       // 白色花
    this.flowerCenterColor = 'rgb(255, 223, 186)'; // 花心
    this.rootColor = 'rgb(139, 90, 43)';           // 根系棕色
    this.rootLightColor = 'rgb(160, 120, 80)';     // 浅根色
    this.sproutColor = 'rgb(120, 180, 100)';       // 嫩芽绿
    
    // 向日葵专用颜色
    this.sunflowerPetalColor = 'rgb(255, 200, 50)';     // 花瓣金黄
    this.sunflowerCenterColor = 'rgb(90, 60, 30)';      // 花盘棕色
    this.sunflowerSeedColor = 'rgb(60, 40, 20)';        // 种子深棕
    
    // 草莓专用颜色
    this.strawberryLeafColor = 'rgb(50, 140, 50)';      // 锯齿叶绿
    this.strawberryFlowerColor = 'rgb(255, 255, 255)';  // 白色花
    this.strawberryGreenColor = 'rgb(150, 200, 100)';   // 青果绿
    this.strawberryRedColor = 'rgb(220, 40, 40)';       // 成熟红
    this.strawberrySeedColor = 'rgb(255, 220, 100)';    // 种子黄
    
    // 樱花专用颜色
    this.sakuraBarkColor = 'rgb(90, 60, 50)';           // 树皮棕
    this.sakuraBranchColor = 'rgb(70, 50, 40)';         // 枝条深棕
    this.sakuraPetalColor = 'rgb(255, 183, 197)';       // 花瓣粉
    this.sakuraPetalLightColor = 'rgb(255, 220, 230)';  // 花瓣浅粉
    this.sakuraBudColor = 'rgb(200, 100, 120)';         // 花苞红
    this.sakuraLeafColor = 'rgb(80, 150, 80)';          // 叶子绿
  }
  
  /**
   * 根据植物数据渲染
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {import('../core/PlantTypes.js').PlantData} plant - 植物数据
   * @param {number} x - 绘制中心 X
   * @param {number} y - 绘制基准 Y（地面位置）
   * @param {number} deltaTime - 帧间隔时间（秒），用于动画
   */
  render(ctx, plant, x, y, deltaTime = 0) {
    // 更新动画时间
    this.animTime += deltaTime;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Canvas Y 轴向下，植物向上长，所以要翻转
    ctx.scale(1, -1);
    
    const wiltLevel = plant.wiltLevel || 0;
    const isDead = plant.healthState === HealthState.DEAD;
    
    // 根据植物类型选择绘制方法
    switch (plant.type) {
      case PlantType.SUNFLOWER:
        this.renderSunflower(ctx, plant, wiltLevel, isDead);
        break;
      case PlantType.STRAWBERRY:
        this.renderStrawberry(ctx, plant, wiltLevel, isDead);
        break;
      case PlantType.SAKURA:
        this.renderSakura(ctx, plant, wiltLevel, isDead);
        break;
      case PlantType.CLOVER:
      default:
        this.renderClover(ctx, plant, wiltLevel, isDead);
        break;
    }
    
    ctx.restore();
  }
  
  // ==================== 幸运草 ====================
  
  /**
   * 渲染幸运草
   */
  renderClover(ctx, plant, wiltLevel, isDead) {
    const traits = plant;
    const progress = plant.growthProgress;
    const stage = getCurrentStage(plant);
    
    // 更新颜色
    this.updateCloverColors(traits, wiltLevel, isDead);
    
    if (isDead) {
      this.drawDeadPlant(ctx, traits, progress);
    } else if (progress < 0.05) {
      this.drawSeed(ctx, plant);
    } else if (progress < 0.15) {
      this.drawSprout(ctx, progress, wiltLevel, plant);
    } else {
      this.drawFullPlant(ctx, traits, progress, stage.id === 'bloom' || stage.id === 'lucky', wiltLevel);
    }
  }
  
  /**
   * 幸运草颜色更新
   */
  updateCloverColors(traits, wiltLevel = 0, isDead = false) {
    const health = Math.min(100, Math.max(0, traits.leafColor || 0)) / 100;
    
    if (isDead) {
      this.leafColor = 'rgb(120, 90, 60)';
      this.leafDarkColor = 'rgb(80, 60, 40)';
      this.stemColor = 'rgb(100, 80, 50)';
      this.flowerColor = 'rgb(180, 160, 140)';
    } else if (wiltLevel > 0.5) {
      const wiltFactor = (wiltLevel - 0.5) * 2;
      this.leafColor = `rgb(${Math.round(60 + 100 * wiltFactor)}, ${Math.round(150 - 60 * wiltFactor)}, ${Math.round(80 - 40 * wiltFactor)})`;
      this.stemColor = `rgb(${Math.round(76 + 50 * wiltFactor)}, ${Math.round(120 - 40 * wiltFactor)}, 76)`;
    } else {
      const greenBoost = Math.round(health * 50 * (1 - wiltLevel));
      this.leafColor = `rgb(${60 + Math.round(wiltLevel * 40)}, ${129 + greenBoost}, ${80 + greenBoost * 0.5})`;
      this.stemColor = `rgb(76, ${120 + greenBoost * 0.5}, 76)`;
    }
  }
  
  /**
   * 画种子萌发全过程
   */
  drawSeed(ctx, plant) {
    const progress = plant?.growthProgress || 0;
    
    const seedY = -15;
    const seedBaseWidth = 8;
    const seedBaseHeight = 5;
    const seedPeriodEnd = 0.05;
    const normalizedProgress = Math.min(1, progress / seedPeriodEnd);
    
    // 绘制萌发过程
    this.drawGerminationProcess(ctx, plant, normalizedProgress, seedY, seedBaseHeight);
    
    // 吸水膨胀效果
    const swellProgress = Math.min(1, normalizedProgress / 0.2);
    const seedWidth = seedBaseWidth * (1 + swellProgress * 0.15);
    const seedHeight = seedBaseHeight * (1 + swellProgress * 0.1);
    
    // 画种子本身
    ctx.fillStyle = 'rgb(139, 90, 43)';
    ctx.beginPath();
    ctx.ellipse(0, seedY, seedWidth, seedHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 种子裂开效果
    if (normalizedProgress > 0.15) {
      const crackProgress = Math.min(1, (normalizedProgress - 0.15) / 0.2);
      ctx.strokeStyle = 'rgb(80, 50, 30)';
      ctx.lineWidth = 1 + crackProgress;
      const crackLength = seedHeight * 0.6 * crackProgress;
      ctx.beginPath();
      ctx.moveTo(-seedWidth * 0.1, seedY - seedHeight * 0.3);
      ctx.lineTo(seedWidth * 0.1, seedY - seedHeight * 0.3 - crackLength);
      ctx.stroke();
    }
    
    // 种子纹理
    ctx.strokeStyle = 'rgb(100, 60, 30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, seedY);
    ctx.lineTo(3, seedY);
    ctx.stroke();
  }
  
  /**
   * 通用萌发过程绘制
   */
  drawGerminationProcess(ctx, plant, normalizedProgress, seedY, seedHeight) {
    const seedBottom = seedY - seedHeight;
    
    // 胚根突破 (10~40%)
    if (normalizedProgress > 0.1) {
      const rootBreakProgress = Math.min(1, (normalizedProgress - 0.1) / 0.3);
      const rootLength = 3 + rootBreakProgress * 15;
      
      ctx.strokeStyle = this.rootColor;
      ctx.lineWidth = 1.5 + rootBreakProgress * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, seedBottom);
      ctx.lineTo(0, seedBottom - rootLength);
      ctx.stroke();
      
      // 侧根扩展 (30~70%)
      if (normalizedProgress > 0.3 && plant?.rootStructure) {
        const sideRootProgress = Math.min(1, (normalizedProgress - 0.3) / 0.4);
        const visibleCount = Math.min(3, Math.ceil(sideRootProgress * plant.rootStructure.length));
        
        for (let i = 0; i < visibleCount; i++) {
          const branch = plant.rootStructure[i];
          if (!branch) continue;
          
          const branchGrowth = Math.min(1, sideRootProgress * 2 - i * 0.3);
          if (branchGrowth <= 0) continue;
          
          const y = seedBottom - rootLength * (0.3 + branch.depth * 0.4);
          const length = (5 + rootLength * 0.5) * branch.length * branchGrowth;
          
          ctx.lineWidth = 1 + branch.thickness * 0.5 * branchGrowth;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(Math.sin(branch.angle) * length, y - Math.cos(branch.angle) * length * 0.3);
          ctx.stroke();
        }
      }
    }
    
    // 胚芽萌发 (50~80%)
    if (normalizedProgress > 0.5) {
      const sproutProgress = Math.min(1, (normalizedProgress - 0.5) / 0.3);
      const sproutLength = sproutProgress * 12;
      
      ctx.strokeStyle = this.sproutColor;
      ctx.lineWidth = 2;
      
      const seedTop = seedY + seedHeight;
      ctx.beginPath();
      ctx.moveTo(0, seedTop);
      ctx.lineTo(0, seedTop + sproutLength);
      ctx.stroke();
      
      // 芽尖
      if (sproutProgress > 0.3) {
        const tipSize = 2 + sproutProgress * 3;
        ctx.fillStyle = 'rgb(100, 160, 80)';
        ctx.beginPath();
        ctx.ellipse(0, seedTop + sproutLength + tipSize * 0.5, tipSize * 0.6, tipSize, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 破土而出 (80~100%)
    if (normalizedProgress > 0.8) {
      const breakProgress = (normalizedProgress - 0.8) / 0.2;
      const aboveGround = breakProgress * 8;
      
      if (aboveGround > 0) {
        ctx.strokeStyle = 'rgb(100, 170, 90)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, aboveGround);
        ctx.stroke();
        
        const tipSize = 3 + breakProgress * 2;
        ctx.fillStyle = 'rgb(120, 190, 100)';
        ctx.beginPath();
        ctx.ellipse(0, aboveGround + tipSize * 0.5, tipSize * 0.5, tipSize, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  /**
   * 画根系
   */
  drawRoots(ctx, depth, spread, complexity = 3, rootStructure, progress = 1) {
    ctx.strokeStyle = this.rootColor;
    ctx.lineWidth = 2;
    
    // 主根
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -depth * 0.6);
    ctx.stroke();
    
    // 主根尖端
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -depth * 0.6);
    ctx.lineTo(0, -depth);
    ctx.stroke();
    
    // 使用植物数据里的根系结构
    if (rootStructure && rootStructure.length > 0) {
      for (const branch of rootStructure) {
        if (progress < branch.createdAt) continue;
        
        const growthRatio = Math.min(1, (progress - branch.createdAt) / 0.3);
        
        const y = -depth * branch.depth;
        const length = spread * branch.length * growthRatio;
        const thickness = 1 + branch.thickness * growthRatio;
        
        // 侧根
        ctx.strokeStyle = this.rootColor;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(0, y);
        const endX = Math.sin(branch.angle) * length;
        const endY = y - Math.cos(branch.angle) * length * 0.5;
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 细根
        if (growthRatio > 0.5) {
          ctx.strokeStyle = this.rootLightColor;
          ctx.lineWidth = Math.max(0.5, thickness * 0.5);
          for (let i = 0; i < branch.subBranches; i++) {
            const subAngle = branch.angle + (i - branch.subBranches / 2) * 0.3;
            const subLength = length * 0.3 * growthRatio;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX + Math.sin(subAngle) * subLength, endY - subLength * 0.3);
            ctx.stroke();
          }
        }
      }
    } else {
      // 备用：没有根系数据时用简单逻辑
      ctx.lineWidth = 1.5;
      for (let i = 0; i < complexity; i++) {
        const y = -depth * 0.2 - (i * depth * 0.3 / complexity);
        const angle = (i % 2 === 0 ? 1 : -1) * (30 + i * 10) * Math.PI / 180;
        const length = spread * 0.6;
        
        ctx.strokeStyle = this.rootColor;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(Math.sin(angle) * length, y - Math.cos(angle) * length * 0.5);
        ctx.stroke();
      }
    }
  }
  
  /**
   * 画发芽（带根系）
   */
  drawSprout(ctx, progress, wiltLevel = 0, plant) {
    // 先画根系
    const rootDepth = plant?.rootDepth || (20 + (progress - 0.05) * 200);
    const rootSpread = plant?.rootSpread || (15 + (progress - 0.05) * 100);
    this.drawRoots(ctx, rootDepth, rootSpread, 2, plant?.rootStructure, progress);
    
    // 发芽高度
    const sproutHeight = 10 + (progress - 0.05) * 300;
    const droop = wiltLevel * 0.3;
    
    // 小茎
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (wiltLevel > 0.3) {
      ctx.quadraticCurveTo(sproutHeight * droop, sproutHeight * 0.5, sproutHeight * droop * 0.5, sproutHeight * (1 - droop * 0.3));
    } else {
      ctx.lineTo(0, sproutHeight);
    }
    ctx.stroke();
    
    // 子叶
    if (progress > 0.08) {
      const leafSize = 8 + (progress - 0.08) * 100;
      const wiltedSize = leafSize * (1 - wiltLevel * 0.3);
      const leafDroop = wiltLevel * leafSize * 0.3;
      
      ctx.fillStyle = this.leafColor;
      
      // 左子叶
      ctx.beginPath();
      ctx.ellipse(-wiltedSize * 0.8, sproutHeight - leafDroop, wiltedSize, wiltedSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 右子叶
      ctx.beginPath();
      ctx.ellipse(wiltedSize * 0.8, sproutHeight - leafDroop, wiltedSize, wiltedSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 画完整植物
   */
  drawFullPlant(ctx, traits, progress, hasFlower, wiltLevel = 0) {
    // 先画根系
    const rootDepth = traits.rootDepth || (40 + traits.height * 0.5);
    const rootSpread = traits.rootSpread || (30 + traits.leafCount * 5);
    this.drawRoots(ctx, rootDepth, rootSpread, Math.min(5, traits.leafCount), traits.rootStructure, progress);
    
    // 计算实际尺寸
    const stemHeight = traits.height * 3;
    const stemWidth = Math.max(2, traits.stemWidth * 0.8);
    const leafCount = traits.leafCount;
    const wiltTilt = wiltLevel * 30;
    const tiltAngle = (traits.tiltAngle + wiltTilt) * Math.PI / 180;
    
    // 画茎秆
    this.drawStem(ctx, stemHeight, stemWidth, tiltAngle);
    
    // 画叶子
    this.drawLeaves(ctx, stemHeight, leafCount, tiltAngle, progress);
    
    // 画花
    if (hasFlower && wiltLevel < 0.8) {
      this.drawFlower(ctx, stemHeight, tiltAngle, wiltLevel);
    }
  }
  
  /**
   * 画死亡植物
   */
  drawDeadPlant(ctx, traits, progress) {
    const stemHeight = traits.height * 3 * 0.6;
    const stemWidth = Math.max(2, traits.stemWidth * 0.6);
    const tiltAngle = 50 * Math.PI / 180;
    
    // 弯曲倒下的茎
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = stemWidth;
    ctx.lineCap = 'round';
    
    const endX = Math.sin(tiltAngle) * stemHeight * 0.8;
    const endY = stemHeight * 0.5;
    const ctrlX = Math.sin(tiltAngle * 0.5) * stemHeight * 0.4;
    const ctrlY = stemHeight * 0.7;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
    
    // 枯萎的叶子
    const leafCount = Math.max(1, Math.floor(traits.leafCount * 0.5));
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const leafX = ctrlX * t + (endX - ctrlX) * t * t;
      const leafY = ctrlY * t + (endY - ctrlY) * t * t;
      const leafSize = 10 + t * 15;
      
      ctx.fillStyle = this.leafColor;
      ctx.beginPath();
      ctx.ellipse(leafX + leafSize * 0.3, leafY - leafSize * 0.5, leafSize * 0.4, leafSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 画茎秆
   */
  drawStem(ctx, height, width, tilt) {
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    const endX = Math.sin(tilt) * height * 0.3;
    const endY = height;
    const ctrlX = Math.sin(tilt) * height * 0.15;
    const ctrlY = height * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  }
  
  /**
   * 画叶子
   */
  drawLeaves(ctx, stemHeight, leafCount, tilt, progress) {
    if (leafCount <= 0) return;
    
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const leafY = stemHeight * t;
      const leafX = Math.sin(tilt) * leafY * 0.3;
      
      const leafSize = 15 + t * 25 * Math.min(1, progress * 1.5);
      
      const side = i % 2 === 0 ? -1 : 1;
      const leafAngle = side * (30 + this.seededRandom(i * 17 + 7) * 15);
      
      this.drawCloverLeaf(ctx, leafX, leafY, leafSize, leafAngle * Math.PI / 180);
    }
    
    // 顶部主叶
    const topY = stemHeight;
    const topX = Math.sin(tilt) * topY * 0.3;
    const topSize = 30 + progress * 20;
    this.drawFourLeafClover(ctx, topX, topY, topSize);
  }
  
  /**
   * 画单片三叶草叶子
   */
  drawCloverLeaf(ctx, x, y, size, angle) {
    ctx.fillStyle = this.leafColor;
    
    for (let i = 0; i < 3; i++) {
      const petalAngle = angle + (i - 1) * 0.4;
      const petalX = x + Math.cos(petalAngle) * size * 0.5;
      const petalY = y + Math.sin(petalAngle) * size * 0.3 + size * 0.3;
      
      this.drawHeartPetal(ctx, petalX, petalY, size * 0.5, petalAngle);
    }
  }
  
  /**
   * 画四叶草
   */
  drawFourLeafClover(ctx, x, y, size) {
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90 - 45) * Math.PI / 180;
      const petalX = x + Math.cos(angle) * size * 0.4;
      const petalY = y + Math.sin(angle) * size * 0.4 + size * 0.5;
      
      this.drawHeartPetal(ctx, petalX, petalY, size * 0.45, angle);
    }
    
    // 中心点
    ctx.fillStyle = this.leafDarkColor;
    ctx.beginPath();
    ctx.arc(x, y + size * 0.5, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 画心形叶瓣
   */
  drawHeartPetal(ctx, x, y, size, angle) {
    ctx.fillStyle = this.leafColor;
    
    const r = size * 0.35;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // 心形上半部分
    const leftCx = x + (-r * 0.5) * cos - (r * 0.5) * sin;
    const leftCy = y + (-r * 0.5) * sin + (r * 0.5) * cos;
    const rightCx = x + (r * 0.5) * cos - (r * 0.5) * sin;
    const rightCy = y + (r * 0.5) * sin + (r * 0.5) * cos;
    
    ctx.beginPath();
    ctx.arc(leftCx, leftCy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightCx, rightCy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // 心形下半部分
    const tipX = x + 0 * cos - (-size * 0.6) * sin;
    const tipY = y + 0 * sin + (-size * 0.6) * cos;
    
    ctx.beginPath();
    ctx.moveTo(leftCx - r * 0.3 * cos, leftCy - r * 0.3 * sin);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(rightCx + r * 0.3 * cos, rightCy + r * 0.3 * sin);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * 画花朵
   */
  drawFlower(ctx, stemHeight, tilt, wiltLevel = 0) {
    const flowerX = Math.sin(tilt) * stemHeight * 0.3;
    const droop = wiltLevel * 20;
    const flowerY = stemHeight + 25 - droop;
    
    const sizeScale = 1 - wiltLevel * 0.4;
    
    ctx.fillStyle = this.flowerColor;
    
    const petalCount = Math.max(6, Math.round(12 * (1 - wiltLevel * 0.5)));
    for (let i = 0; i < petalCount; i++) {
      const angle = i * (360 / petalCount) * Math.PI / 180;
      const px = flowerX + Math.cos(angle) * 6 * sizeScale;
      const py = flowerY + Math.sin(angle) * 4 * sizeScale;
      
      ctx.beginPath();
      ctx.arc(px, py, 4 * sizeScale, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 花心
    ctx.fillStyle = this.flowerCenterColor;
    ctx.beginPath();
    ctx.arc(flowerX, flowerY, 5 * sizeScale, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // ==================== 向日葵 ====================
  
  /**
   * 渲染向日葵
   */
  renderSunflower(ctx, plant, wiltLevel, isDead) {
    const traits = plant;
    const progress = plant.growthProgress;
    
    this.updateSunflowerColors(wiltLevel, isDead);
    
    if (isDead) {
      this.drawDeadSunflower(ctx, traits, progress);
    } else if (progress < 0.03) {
      this.drawSunflowerSeed(ctx, plant);
    } else if (progress < 0.08) {
      this.drawSunflowerSprout(ctx, progress, wiltLevel, plant);
    } else if (progress < 0.50) {
      this.drawSunflowerStem(ctx, traits, progress, wiltLevel);
    } else {
      const hasFlower = progress >= 0.50;
      const isFullBloom = progress >= 0.70;
      const hasSeed = progress >= 1.0;
      this.drawFullSunflower(ctx, traits, progress, wiltLevel, hasFlower, isFullBloom, hasSeed);
    }
  }
  
  /**
   * 向日葵颜色更新
   */
  updateSunflowerColors(wiltLevel, isDead) {
    if (isDead) {
      this.stemColor = 'rgb(100, 80, 50)';
      this.leafColor = 'rgb(120, 100, 60)';
      this.sunflowerPetalColor = 'rgb(150, 120, 60)';
      this.sunflowerCenterColor = 'rgb(60, 40, 20)';
    } else if (wiltLevel > 0.5) {
      const wf = (wiltLevel - 0.5) * 2;
      this.stemColor = `rgb(${76 + Math.round(40 * wf)}, ${130 - Math.round(40 * wf)}, 60)`;
      this.leafColor = `rgb(${80 + Math.round(60 * wf)}, ${150 - Math.round(50 * wf)}, 60)`;
      this.sunflowerPetalColor = `rgb(255, ${200 - Math.round(80 * wf)}, 50)`;
    } else {
      this.stemColor = 'rgb(76, 140, 60)';
      this.leafColor = 'rgb(70, 160, 70)';
      this.sunflowerPetalColor = 'rgb(255, 200, 50)';
      this.sunflowerCenterColor = 'rgb(90, 60, 30)';
    }
  }
  
  /**
   * 向日葵种子萌发
   */
  drawSunflowerSeed(ctx, plant) {
    const progress = plant?.growthProgress || 0;
    
    const seedY = -15;
    const seedWidth = 10;
    const seedHeight = 6;
    const seedPeriodEnd = 0.03;
    const normalizedProgress = Math.min(1, progress / seedPeriodEnd);
    
    this.drawGerminationProcess(ctx, plant, normalizedProgress, seedY, seedHeight);
    
    const swellProgress = Math.min(1, normalizedProgress / 0.2);
    const actualWidth = seedWidth * (1 + swellProgress * 0.1);
    const actualHeight = seedHeight * (1 + swellProgress * 0.08);
    
    // 葵花籽外观
    ctx.fillStyle = 'rgb(40, 30, 20)';
    ctx.beginPath();
    ctx.ellipse(0, seedY, actualWidth, actualHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 条纹
    ctx.strokeStyle = 'rgb(200, 200, 200)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, seedY);
    ctx.lineTo(4, seedY);
    ctx.stroke();
    
    // 裂开效果
    if (normalizedProgress > 0.15) {
      const crackProgress = Math.min(1, (normalizedProgress - 0.15) / 0.2);
      ctx.strokeStyle = 'rgb(60, 40, 20)';
      ctx.lineWidth = 1 + crackProgress;
      ctx.beginPath();
      ctx.moveTo(0, seedY - actualHeight * 0.5);
      ctx.lineTo(0, seedY - actualHeight * 0.5 - crackProgress * 4);
      ctx.stroke();
    }
  }
  
  /**
   * 向日葵发芽
   */
  drawSunflowerSprout(ctx, progress, wiltLevel, plant) {
    const rootDepth = plant?.rootDepth || (25 + (progress - 0.03) * 300);
    const rootSpread = plant?.rootSpread || (20 + (progress - 0.03) * 150);
    this.drawRoots(ctx, rootDepth, rootSpread, 3, plant?.rootStructure, progress);
    
    const height = 15 + (progress - 0.03) * 400;
    const droop = wiltLevel * 0.2;
    
    // 茎
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(height * droop, height);
    ctx.stroke();
    
    // 子叶
    if (progress > 0.05) {
      const leafSize = 15 + (progress - 0.05) * 200;
      const leafDroop = wiltLevel * leafSize * 0.3;
      
      ctx.fillStyle = this.leafColor;
      
      ctx.beginPath();
      ctx.ellipse(-leafSize, height - leafDroop, leafSize * 0.7, leafSize * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(leafSize, height - leafDroop, leafSize * 0.7, leafSize * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 向日葵抽茎期
   */
  drawSunflowerStem(ctx, traits, progress, wiltLevel) {
    const rootDepth = traits.rootDepth || (50 + traits.height * 0.8);
    const rootSpread = traits.rootSpread || (40 + traits.leafCount * 8);
    this.drawRoots(ctx, rootDepth, rootSpread, 4, traits.rootStructure, progress);
    
    const maxHeight = traits.height * 2;
    const stemProgress = (progress - 0.08) / 0.42;
    const stemHeight = 30 + stemProgress * maxHeight;
    const stemWidth = 4 + stemProgress * 4;
    
    const tilt = (traits.tiltAngle + wiltLevel * 20) * Math.PI / 180;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = stemWidth;
    ctx.lineCap = 'round';
    
    const endX = Math.sin(tilt) * stemHeight * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(endX * 0.5, stemHeight * 0.5, endX, stemHeight);
    ctx.stroke();
    
    // 叶子
    const leafCount = Math.floor(2 + stemProgress * traits.leafCount);
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const leafY = stemHeight * t;
      const leafX = Math.sin(tilt) * leafY * 0.2;
      
      const side = i % 2 === 0 ? -1 : 1;
      const leafSize = 20 + t * 30 * stemProgress;
      const leafAngle = side * (40 + this.seededRandom(i * 17) * 20) * Math.PI / 180;
      const leafDroop = wiltLevel * 20;
      
      this.drawSunflowerLeaf(ctx, leafX, leafY - leafDroop, leafSize, leafAngle, side);
    }
  }
  
  /**
   * 画向日葵叶子
   */
  drawSunflowerLeaf(ctx, x, y, size, angle, side) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // 叶柄
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + cos * size * 0.3, y + sin * size * 0.3);
    ctx.stroke();
    
    // 叶片
    const leafCenterX = x + cos * size * 0.6;
    const leafCenterY = y + sin * size * 0.6;
    
    ctx.fillStyle = this.leafColor;
    ctx.beginPath();
    ctx.ellipse(leafCenterX, leafCenterY, size * 0.5, size * 0.35, angle, 0, Math.PI * 2);
    ctx.fill();
    
    // 叶脉
    ctx.strokeStyle = 'rgb(50, 120, 50)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + cos * size * 0.3, y + sin * size * 0.3);
    ctx.lineTo(leafCenterX + cos * size * 0.3, leafCenterY + sin * size * 0.3);
    ctx.stroke();
  }
  
  /**
   * 完整向日葵
   */
  drawFullSunflower(ctx, traits, progress, wiltLevel, hasFlower, isFullBloom, hasSeed) {
    const stemHeight = traits.height * 2;
    const stemWidth = 8;
    const tilt = (traits.tiltAngle + wiltLevel * 25) * Math.PI / 180;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = stemWidth;
    ctx.lineCap = 'round';
    
    const endX = Math.sin(tilt) * stemHeight * 0.25;
    const endY = stemHeight;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(endX * 0.4, stemHeight * 0.5, endX, endY);
    ctx.stroke();
    
    // 叶子
    const leafCount = traits.leafCount;
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const leafY = stemHeight * t;
      const leafX = Math.sin(tilt) * leafY * 0.25;
      
      const side = i % 2 === 0 ? -1 : 1;
      const leafSize = 25 + t * 35;
      const leafAngle = side * (45 + this.seededRandom(i * 23) * 15) * Math.PI / 180;
      const leafDroop = wiltLevel * 25;
      
      this.drawSunflowerLeaf(ctx, leafX, leafY - leafDroop, leafSize * (1 - wiltLevel * 0.3), leafAngle, side);
    }
    
    // 花朵
    if (hasFlower) {
      const flowerX = endX;
      const flowerY = endY + 10;
      const flowerDroop = wiltLevel * 40;
      
      this.drawSunflowerHead(ctx, flowerX, flowerY - flowerDroop, isFullBloom, hasSeed, wiltLevel);
    }
  }
  
  /**
   * 画向日葵花盘
   */
  drawSunflowerHead(ctx, x, y, isFullBloom, hasSeed, wiltLevel) {
    const baseSize = isFullBloom ? 50 : 30;
    const size = baseSize * (1 - wiltLevel * 0.3);
    
    // 花瓣
    if (!hasSeed || wiltLevel < 0.5) {
      const petalCount = isFullBloom ? 20 : 12;
      const petalLength = size * 0.8;
      const petalWidth = size * 0.15;
      
      ctx.fillStyle = this.sunflowerPetalColor;
      
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
        
        const baseX = x + Math.cos(angle) * size * 0.45;
        const baseY = y + Math.sin(angle) * size * 0.45;
        
        const tipX = x + Math.cos(angle) * (size * 0.5 + petalLength);
        const tipY = y + Math.sin(angle) * (size * 0.5 + petalLength);
        
        const perpX = Math.cos(angle + Math.PI / 2) * petalWidth;
        const perpY = Math.sin(angle + Math.PI / 2) * petalWidth;
        
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(
          (baseX + tipX) / 2 + perpX,
          (baseY + tipY) / 2 + perpY,
          tipX, tipY
        );
        ctx.quadraticCurveTo(
          (baseX + tipX) / 2 - perpX,
          (baseY + tipY) / 2 - perpY,
          baseX, baseY
        );
        ctx.fill();
      }
    }
    
    // 花盘
    ctx.fillStyle = this.sunflowerCenterColor;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 花盘纹理/种子
    if (isFullBloom || hasSeed) {
      ctx.fillStyle = this.sunflowerSeedColor;
      const seedCount = hasSeed ? 30 : 15;
      
      for (let i = 0; i < seedCount; i++) {
        const r = this.seededRandom(i * 13) * size * 0.4;
        const a = this.seededRandom(i * 29) * Math.PI * 2;
        const sx = x + Math.cos(a) * r;
        const sy = y + Math.sin(a) * r;
        const seedSize = hasSeed ? 3 : 2;
        
        ctx.beginPath();
        ctx.arc(sx, sy, seedSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  /**
   * 死亡的向日葵
   */
  drawDeadSunflower(ctx, traits, progress) {
    const stemHeight = traits.height * 1.5;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(stemHeight * 0.3, stemHeight * 0.6, stemHeight * 0.5, stemHeight * 0.4);
    ctx.stroke();
    
    // 下垂的花盘
    if (progress >= 0.5) {
      ctx.fillStyle = 'rgb(80, 60, 40)';
      ctx.beginPath();
      ctx.arc(stemHeight * 0.5, stemHeight * 0.3, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // 枯萎的花瓣
      ctx.fillStyle = 'rgb(120, 90, 50)';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const px = stemHeight * 0.5 + Math.cos(angle) * 30;
        const py = stemHeight * 0.3 + Math.sin(angle) * 30 - 10;
        ctx.beginPath();
        ctx.ellipse(px, py, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 枯叶
    ctx.fillStyle = 'rgb(100, 80, 50)';
    for (let i = 0; i < 3; i++) {
      const t = (i + 1) / 4;
      const lx = stemHeight * 0.15 * t;
      const ly = stemHeight * 0.5 * t;
      ctx.beginPath();
      ctx.ellipse(lx + 20, ly - 15, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // ==================== 草莓 ====================
  
  /**
   * 渲染草莓
   */
  renderStrawberry(ctx, plant, wiltLevel, isDead) {
    const progress = plant.growthProgress;
    
    this.updateStrawberryColors(wiltLevel, isDead);
    
    if (isDead) {
      this.drawDeadStrawberry(ctx, plant, progress);
    } else if (progress < 0.03) {
      this.drawStrawberrySeed(ctx, plant);
    } else if (progress < 0.10) {
      this.drawStrawberrySprout(ctx, progress, wiltLevel, plant);
    } else if (progress < 0.25) {
      this.drawStrawberryLeavesCore(ctx, plant, progress, wiltLevel);
    } else if (progress < 0.45) {
      this.drawStrawberryRunner(ctx, plant, progress, wiltLevel);
    } else if (progress < 0.65) {
      this.drawStrawberryBloom(ctx, plant, progress, wiltLevel);
    } else {
      const isRipe = progress >= 1.0;
      this.drawStrawberryFruit(ctx, plant, progress, wiltLevel, isRipe);
    }
  }
  
  /**
   * 草莓颜色更新
   */
  updateStrawberryColors(wiltLevel, isDead) {
    if (isDead) {
      this.stemColor = 'rgb(100, 80, 50)';
      this.strawberryLeafColor = 'rgb(120, 100, 60)';
      this.strawberryRedColor = 'rgb(100, 60, 40)';
    } else if (wiltLevel > 0.5) {
      const wf = (wiltLevel - 0.5) * 2;
      this.stemColor = `rgb(${76 + Math.round(30 * wf)}, ${130 - Math.round(40 * wf)}, 60)`;
      this.strawberryLeafColor = `rgb(${70 + Math.round(50 * wf)}, ${140 - Math.round(40 * wf)}, 50)`;
    } else {
      this.stemColor = 'rgb(76, 130, 60)';
      this.strawberryLeafColor = 'rgb(50, 140, 50)';
      this.strawberryRedColor = 'rgb(220, 40, 40)';
    }
  }
  
  /**
   * 草莓种子萌发
   */
  drawStrawberrySeed(ctx, plant) {
    const progress = plant?.growthProgress || 0;
    
    const seedY = -12;
    const seedRadius = 3;
    const seedPeriodEnd = 0.03;
    const normalizedProgress = Math.min(1, progress / seedPeriodEnd);
    
    this.drawGerminationProcess(ctx, plant, normalizedProgress, seedY, seedRadius);
    
    const swellProgress = Math.min(1, normalizedProgress / 0.2);
    const actualRadius = seedRadius * (1 + swellProgress * 0.1);
    
    ctx.fillStyle = 'rgb(80, 60, 40)';
    ctx.beginPath();
    ctx.arc(0, seedY, actualRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 草莓发芽
   */
  drawStrawberrySprout(ctx, progress, wiltLevel, plant) {
    const rootDepth = plant?.rootDepth || (15 + (progress - 0.03) * 100);
    const rootSpread = plant?.rootSpread || (12 + (progress - 0.03) * 80);
    this.drawRoots(ctx, rootDepth, rootSpread, 2, plant?.rootStructure, progress);
    
    const height = 8 + (progress - 0.03) * 150;
    const droop = wiltLevel * height * 0.15;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(droop, height);
    ctx.stroke();
    
    if (progress > 0.05) {
      const leafSize = 6 + (progress - 0.05) * 100;
      ctx.fillStyle = this.strawberryLeafColor;
      ctx.beginPath();
      ctx.arc(-leafSize * 0.8, height, leafSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(leafSize * 0.8, height, leafSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 草莓展叶
   */
  drawStrawberryLeavesCore(ctx, plant, progress, wiltLevel) {
    const leafProgress = (progress - 0.10) / 0.15;
    const centerHeight = 15 + leafProgress * 20;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, centerHeight * 0.3);
    ctx.stroke();
    
    const leafCount = Math.floor(1 + leafProgress * 3);
    for (let i = 0; i < leafCount; i++) {
      const angle = (i - (leafCount - 1) / 2) * 40 * Math.PI / 180;
      const leafSize = 15 + leafProgress * 15;
      
      this.drawStrawberryTrifoliate(ctx, 0, centerHeight * 0.3, leafSize, angle, wiltLevel);
    }
  }
  
  /**
   * 画草莓三出复叶
   */
  drawStrawberryTrifoliate(ctx, x, y, size, baseAngle, wiltLevel) {
    const droop = wiltLevel * 15;
    
    const stalkLength = size * 0.8;
    const stalkEndX = x + Math.sin(baseAngle) * stalkLength;
    const stalkEndY = y + Math.cos(baseAngle) * stalkLength - droop * 0.5;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(stalkEndX, stalkEndY);
    ctx.stroke();
    
    ctx.fillStyle = this.strawberryLeafColor;
    
    // 中间叶
    ctx.beginPath();
    ctx.ellipse(stalkEndX, stalkEndY + size * 0.4 - droop, size * 0.35, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 左叶
    ctx.beginPath();
    ctx.ellipse(stalkEndX - size * 0.35, stalkEndY + size * 0.25 - droop, size * 0.28, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 右叶
    ctx.beginPath();
    ctx.ellipse(stalkEndX + size * 0.35, stalkEndY + size * 0.25 - droop, size * 0.28, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 叶脉
    ctx.strokeStyle = 'rgb(30, 100, 30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(stalkEndX, stalkEndY);
    ctx.lineTo(stalkEndX, stalkEndY + size * 0.35 - droop);
    ctx.stroke();
  }
  
  /**
   * 草莓匍匐茎期
   */
  drawStrawberryRunner(ctx, plant, progress, wiltLevel) {
    this.drawStrawberryLeavesCore(ctx, plant, 0.25, wiltLevel);
    this.drawStrawberryRunnerCore(ctx, progress, wiltLevel);
  }
  
  /**
   * 匍匐茎核心绘制
   */
  drawStrawberryRunnerCore(ctx, progress, wiltLevel) {
    const runnerProgress = Math.max(0, (progress - 0.25) / 0.20);
    if (runnerProgress <= 0) return;
    
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 2;
    
    const runnerLength = 30 + runnerProgress * 50;
    
    // 左侧匍匐茎
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.quadraticCurveTo(-runnerLength * 0.5, 3, -runnerLength, 5);
    ctx.stroke();
    
    if (runnerProgress > 0.5) {
      ctx.fillStyle = this.strawberryLeafColor;
      ctx.beginPath();
      ctx.arc(-runnerLength, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-runnerLength + 4, 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 右侧匍匐茎
    if (runnerProgress > 0.3) {
      const rightLength = runnerLength * 0.7;
      ctx.beginPath();
      ctx.moveTo(5, 5);
      ctx.quadraticCurveTo(rightLength * 0.5, 2, rightLength, 4);
      ctx.stroke();
      
      if (runnerProgress > 0.7) {
        ctx.fillStyle = this.strawberryLeafColor;
        ctx.beginPath();
        ctx.arc(rightLength, 9, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  /**
   * 草莓开花期
   */
  drawStrawberryBloom(ctx, plant, progress, wiltLevel) {
    this.drawStrawberryLeavesCore(ctx, plant, 0.25, wiltLevel);
    this.drawStrawberryRunnerCore(ctx, 0.45, wiltLevel);
    this.drawStrawberryFlowersCore(ctx, progress, wiltLevel);
  }
  
  /**
   * 花朵核心绘制
   */
  drawStrawberryFlowersCore(ctx, progress, wiltLevel) {
    const bloomProgress = Math.max(0, (progress - 0.45) / 0.20);
    if (bloomProgress <= 0) return;
    
    const flowerCount = Math.floor(1 + bloomProgress * 3);
    
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i - (flowerCount - 1) / 2) * 25;
      const stemLength = 25 + this.seededRandom(i * 17) * 15;
      const droop = wiltLevel * 10;
      
      const fx = Math.sin(angle * Math.PI / 180) * stemLength * 0.3;
      const fy = 20 + stemLength - droop;
      
      // 花茎
      ctx.strokeStyle = this.stemColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      
      // 白色小花
      this.drawStrawberryFlower(ctx, fx, fy + 8, 8 * (1 - wiltLevel * 0.3));
    }
  }
  
  /**
   * 画草莓小白花
   */
  drawStrawberryFlower(ctx, x, y, size) {
    // 5片白色花瓣
    ctx.fillStyle = this.strawberryFlowerColor;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * size * 0.5;
      const py = y + Math.sin(angle) * size * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 黄色花心
    ctx.fillStyle = 'rgb(255, 220, 100)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 草莓结果期
   */
  drawStrawberryFruit(ctx, plant, progress, wiltLevel, isRipe) {
    this.drawStrawberryLeavesCore(ctx, plant, 0.25, wiltLevel);
    this.drawStrawberryRunnerCore(ctx, 0.45, wiltLevel);
    this.drawStrawberryFruitsCore(ctx, progress, wiltLevel, isRipe);
  }
  
  /**
   * 果实核心绘制
   */
  drawStrawberryFruitsCore(ctx, progress, wiltLevel, isRipe) {
    const fruitProgress = Math.max(0, (progress - 0.65) / 0.35);
    if (fruitProgress <= 0) return;
    
    const fruitCount = Math.floor(1 + fruitProgress * 3);
    
    for (let i = 0; i < fruitCount; i++) {
      const angle = (i - (fruitCount - 1) / 2) * 30;
      const stemLength = 30 + this.seededRandom(i * 23) * 10;
      
      const fx = Math.sin(angle * Math.PI / 180) * stemLength * 0.35;
      const fy = 25 + stemLength;
      
      const ripeness = isRipe ? 1 : fruitProgress;
      const fruitColor = `rgb(${Math.round(150 + ripeness * 70)}, ${Math.round(200 - ripeness * 160)}, ${Math.round(100 - ripeness * 60)})`;
      
      const fruitSize = 10 + fruitProgress * 8;
      
      this.drawStrawberryBerry(ctx, fx, fy, fruitSize, fruitColor, ripeness);
    }
  }
  
  /**
   * 画草莓果实
   */
  drawStrawberryBerry(ctx, x, y, size, color, ripeness) {
    ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.2, size * 0.6, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.3, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 种子点
    if (ripeness > 0.3) {
      ctx.fillStyle = this.strawberrySeedColor;
      const seedCount = Math.floor(5 + ripeness * 5);
      for (let i = 0; i < seedCount; i++) {
        const sa = this.seededRandom(i * 13) * Math.PI * 2;
        const sr = this.seededRandom(i * 29) * size * 0.4;
        const sx = x + Math.cos(sa) * sr * 0.8;
        const sy = y - size * 0.1 + Math.sin(sa) * sr;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 萼片
    ctx.fillStyle = 'rgb(60, 140, 50)';
    for (let i = 0; i < 5; i++) {
      const la = (i / 5) * Math.PI - Math.PI / 2;
      const lx = x + Math.cos(la) * size * 0.3;
      const ly = y + size * 0.5;
      ctx.beginPath();
      ctx.ellipse(lx, ly + 3, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 死亡的草莓
   */
  drawDeadStrawberry(ctx, plant, progress) {
    ctx.fillStyle = 'rgb(100, 80, 50)';
    
    ctx.beginPath();
    ctx.ellipse(-15, 3, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 5, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgb(80, 60, 40)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 3);
    ctx.lineTo(-35, 2);
    ctx.stroke();
    
    if (progress > 0.65) {
      ctx.fillStyle = 'rgb(80, 40, 30)';
      ctx.beginPath();
      ctx.ellipse(5, 12, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // ==================== 樱花 ====================
  
  /**
   * 渲染樱花
   */
  renderSakura(ctx, plant, wiltLevel, isDead) {
    const progress = plant.growthProgress;
    
    this.updateSakuraColors(wiltLevel, isDead);
    
    if (isDead) {
      this.drawDeadSakura(ctx, plant, progress);
    } else if (progress < 0.02) {
      this.drawSakuraSeed(ctx, plant);
    } else if (progress < 0.05) {
      this.drawSakuraSprout(ctx, progress, wiltLevel, plant);
    } else if (progress < 0.15) {
      this.drawSakuraSeedling(ctx, plant, progress, wiltLevel);
    } else if (progress < 0.35) {
      this.drawSakuraWoody(ctx, plant, progress, wiltLevel);
    } else if (progress < 0.60) {
      this.drawSakuraBranching(ctx, plant, progress, wiltLevel);
    } else if (progress < 0.80) {
      const canBloom = plant.canBloom !== false;
      this.drawSakuraBuds(ctx, plant, progress, wiltLevel, canBloom);
    } else {
      const isFalling = progress >= 1.0;
      this.drawSakuraBloom(ctx, plant, progress, wiltLevel, isFalling);
    }
  }
  
  /**
   * 樱花颜色更新
   */
  updateSakuraColors(wiltLevel, isDead) {
    if (isDead) {
      this.sakuraBarkColor = 'rgb(60, 40, 30)';
      this.sakuraBranchColor = 'rgb(50, 35, 25)';
      this.sakuraPetalColor = 'rgb(150, 120, 110)';
      this.sakuraLeafColor = 'rgb(100, 80, 50)';
    } else if (wiltLevel > 0.5) {
      const wf = (wiltLevel - 0.5) * 2;
      this.sakuraLeafColor = `rgb(${80 + Math.round(40 * wf)}, ${150 - Math.round(60 * wf)}, ${80 - Math.round(30 * wf)})`;
      this.sakuraPetalColor = `rgb(${255 - Math.round(50 * wf)}, ${183 - Math.round(50 * wf)}, ${197 - Math.round(60 * wf)})`;
    } else {
      this.sakuraBarkColor = 'rgb(90, 60, 50)';
      this.sakuraBranchColor = 'rgb(70, 50, 40)';
      this.sakuraPetalColor = 'rgb(255, 183, 197)';
      this.sakuraLeafColor = 'rgb(80, 150, 80)';
    }
  }
  
  /**
   * 樱花种子萌发
   */
  drawSakuraSeed(ctx, plant) {
    const progress = plant?.growthProgress || 0;
    
    const seedY = -15;
    const seedWidth = 8;
    const seedHeight = 6;
    const seedPeriodEnd = 0.02;
    const normalizedProgress = Math.min(1, progress / seedPeriodEnd);
    
    this.drawGerminationProcess(ctx, plant, normalizedProgress, seedY, seedHeight);
    
    const swellProgress = Math.min(1, normalizedProgress / 0.2);
    const actualWidth = seedWidth * (1 + swellProgress * 0.1);
    const actualHeight = seedHeight * (1 + swellProgress * 0.08);
    
    ctx.fillStyle = 'rgb(120, 80, 60)';
    ctx.beginPath();
    ctx.ellipse(0, seedY, actualWidth, actualHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 纹理线
    ctx.strokeStyle = 'rgb(80, 50, 35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, seedY - 2);
    ctx.lineTo(3, seedY + 2);
    ctx.stroke();
    
    // 裂开效果
    if (normalizedProgress > 0.2) {
      const crackProgress = Math.min(1, (normalizedProgress - 0.2) / 0.3);
      ctx.strokeStyle = 'rgb(60, 40, 25)';
      ctx.lineWidth = 1 + crackProgress;
      ctx.beginPath();
      ctx.moveTo(0, seedY - actualHeight * 0.6);
      ctx.lineTo(0, seedY - actualHeight * 0.6 - crackProgress * 3);
      ctx.stroke();
    }
  }
  
  /**
   * 樱花发芽
   */
  drawSakuraSprout(ctx, progress, wiltLevel, plant) {
    const rootDepth = plant?.rootDepth || (20 + (progress - 0.02) * 200);
    const rootSpread = plant?.rootSpread || (15 + (progress - 0.02) * 120);
    this.drawRoots(ctx, rootDepth, rootSpread, 2, plant?.rootStructure, progress);
    
    const height = 5 + (progress - 0.02) * 300;
    const droop = wiltLevel * height * 0.1;
    
    ctx.strokeStyle = 'rgb(100, 160, 100)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(droop, height);
    ctx.stroke();
    
    if (progress > 0.03) {
      const leafSize = 5 + (progress - 0.03) * 200;
      ctx.fillStyle = 'rgb(120, 180, 120)';
      ctx.beginPath();
      ctx.ellipse(-leafSize * 0.7, height, leafSize * 0.5, leafSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(leafSize * 0.7, height, leafSize * 0.5, leafSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 樱花幼苗
   */
  drawSakuraSeedling(ctx, plant, progress, wiltLevel) {
    const rootDepth = plant.rootDepth || (30 + (progress - 0.05) * 300);
    const rootSpread = plant.rootSpread || (25 + (progress - 0.05) * 200);
    this.drawRoots(ctx, rootDepth, rootSpread, 3, plant.rootStructure, progress);
    
    const seedlingProgress = (progress - 0.05) / 0.10;
    const height = 15 + seedlingProgress * 40;
    const droop = wiltLevel * 8;
    
    const r = 100 - seedlingProgress * 20;
    const g = 140 - seedlingProgress * 60;
    const b = 90 - seedlingProgress * 30;
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 3 + seedlingProgress * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(droop * 0.3, height);
    ctx.stroke();
    
    const leafCount = Math.floor(2 + seedlingProgress * 4);
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const ly = height * t;
      const lx = droop * 0.3 * t;
      const side = i % 2 === 0 ? -1 : 1;
      const leafSize = 8 + seedlingProgress * 10;
      const leafDroop = wiltLevel * 5;
      
      ctx.fillStyle = this.sakuraLeafColor;
      ctx.beginPath();
      ctx.ellipse(lx + side * leafSize * 0.8, ly - leafDroop, leafSize * 0.5, leafSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 樱花木质化期
   */
  drawSakuraWoody(ctx, plant, progress, wiltLevel) {
    const woodyProgress = (progress - 0.15) / 0.20;
    const trunkHeight = 60 + woodyProgress * 60;
    const trunkWidth = 6 + woodyProgress * 4;
    
    ctx.strokeStyle = this.sakuraBarkColor;
    ctx.lineWidth = trunkWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, trunkHeight);
    ctx.stroke();
    
    const branchCount = Math.floor(woodyProgress * 4);
    for (let i = 0; i < branchCount; i++) {
      const t = 0.5 + (i / branchCount) * 0.4;
      const by = trunkHeight * t;
      const side = i % 2 === 0 ? -1 : 1;
      const branchLen = 15 + this.seededRandom(i * 17) * 20;
      const angle = side * (30 + this.seededRandom(i * 23) * 20) * Math.PI / 180;
      
      ctx.strokeStyle = this.sakuraBranchColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(Math.sin(angle) * branchLen, by + Math.cos(angle) * branchLen * 0.5);
      ctx.stroke();
      
      const leafX = Math.sin(angle) * branchLen * 0.8;
      const leafY = by + Math.cos(angle) * branchLen * 0.4;
      ctx.fillStyle = this.sakuraLeafColor;
      ctx.beginPath();
      ctx.ellipse(leafX, leafY, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = this.sakuraLeafColor;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI - Math.PI / 2;
      const lx = Math.cos(angle) * 12;
      const ly = trunkHeight + 5 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 樱花枝繁期
   */
  drawSakuraBranching(ctx, plant, progress, wiltLevel) {
    const branchProgress = (progress - 0.35) / 0.25;
    const trunkHeight = 120 + branchProgress * 40;
    const trunkWidth = 10 + branchProgress * 4;
    
    ctx.strokeStyle = this.sakuraBarkColor;
    ctx.lineWidth = trunkWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2, trunkHeight * 0.5, 0, trunkHeight);
    ctx.stroke();
    
    this.drawSakuraBranches(ctx, 0, trunkHeight, branchProgress, wiltLevel, false, false);
  }
  
  /**
   * 画樱花成熟树干
   */
  drawSakuraMatureTrunk(ctx) {
    const trunkHeight = 160;
    const trunkWidth = 14;
    
    ctx.strokeStyle = this.sakuraBarkColor;
    ctx.lineWidth = trunkWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3, trunkHeight * 0.5, 0, trunkHeight);
    ctx.stroke();
    
    return trunkHeight;
  }
  
  /**
   * 樱花花苞期
   */
  drawSakuraBuds(ctx, plant, progress, wiltLevel, canBloom) {
    const budProgress = (progress - 0.60) / 0.20;
    
    const trunkHeight = this.drawSakuraMatureTrunk(ctx);
    
    this.drawSakuraBranches(ctx, 0, trunkHeight, 1, wiltLevel, canBloom, false);
    
    if (canBloom) {
      this.drawSakuraFlowerBuds(ctx, 0, trunkHeight, budProgress);
    }
  }
  
  /**
   * 樱花盛开/落樱期
   */
  drawSakuraBloom(ctx, plant, progress, wiltLevel, isFalling) {
    const trunkHeight = this.drawSakuraMatureTrunk(ctx);
    
    this.drawSakuraBranches(ctx, 0, trunkHeight, 1, wiltLevel, true, true);
    
    this.drawSakuraFlowers(ctx, 0, trunkHeight, isFalling ? 0.5 : 1, wiltLevel);
    
    if (isFalling) {
      this.drawFallingPetals(ctx);
    }
  }
  
  /**
   * 画樱花分枝
   */
  drawSakuraBranches(ctx, x, y, progress, wiltLevel, hasBuds, hasFlowers) {
    const branchCount = Math.floor(4 + progress * 4);
    
    for (let i = 0; i < branchCount; i++) {
      const t = 0.4 + (i / branchCount) * 0.5;
      const by = y * t;
      const side = i % 2 === 0 ? -1 : 1;
      const branchLen = 30 + this.seededRandom(i * 19) * 40 * progress;
      const angle = side * (35 + this.seededRandom(i * 31) * 25) * Math.PI / 180;
      
      const endX = x + Math.sin(angle) * branchLen;
      const endY = by + Math.cos(angle) * branchLen * 0.3;
      
      ctx.strokeStyle = this.sakuraBranchColor;
      ctx.lineWidth = 4 - i * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.quadraticCurveTo(
        x + Math.sin(angle) * branchLen * 0.5,
        by + Math.cos(angle) * branchLen * 0.15,
        endX, endY
      );
      ctx.stroke();
      
      if (progress > 0.5) {
        const subLen = branchLen * 0.4;
        const subAngle = angle + side * 0.3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(endX * 0.7, by + (endY - by) * 0.7);
        ctx.lineTo(
          endX * 0.7 + Math.sin(subAngle) * subLen,
          by + (endY - by) * 0.7 + Math.cos(subAngle) * subLen * 0.2
        );
        ctx.stroke();
      }
    }
    
    if (!hasFlowers) {
      ctx.fillStyle = this.sakuraLeafColor;
      const crownSize = 40 + progress * 30;
      ctx.beginPath();
      ctx.ellipse(x, y + crownSize * 0.3, crownSize, crownSize * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 画花苞
   */
  drawSakuraFlowerBuds(ctx, x, y, progress) {
    const budCount = Math.floor(10 + progress * 20);
    
    ctx.fillStyle = this.sakuraBudColor;
    
    for (let i = 0; i < budCount; i++) {
      const angle = this.seededRandom(i * 13) * Math.PI * 2;
      const r = 20 + this.seededRandom(i * 29) * 50;
      const bx = x + Math.cos(angle) * r * 0.8;
      const by = y + 20 + Math.sin(angle) * r * 0.4;
      const budSize = 3 + progress * 3;
      
      ctx.beginPath();
      ctx.ellipse(bx, by, budSize, budSize * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 画满树樱花
   */
  drawSakuraFlowers(ctx, x, y, density, wiltLevel) {
    const flowerCount = Math.floor(30 * density);
    
    for (let i = 0; i < flowerCount; i++) {
      const angle = this.seededRandom(i * 17) * Math.PI * 2;
      const r = 15 + this.seededRandom(i * 31) * 60;
      const fx = x + Math.cos(angle) * r * 0.9;
      const fy = y + 25 + Math.sin(angle) * r * 0.5;
      const size = 6 + this.seededRandom(i * 41) * 4;
      
      this.drawSakuraFlower(ctx, fx, fy, size * (1 - wiltLevel * 0.3));
    }
  }
  
  /**
   * 画单朵樱花
   */
  drawSakuraFlower(ctx, x, y, size) {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * size * 0.5;
      const py = y + Math.sin(angle) * size * 0.5;
      
      ctx.fillStyle = i % 2 === 0 ? this.sakuraPetalColor : this.sakuraPetalLightColor;
      ctx.beginPath();
      ctx.ellipse(px, py, size * 0.4, size * 0.55, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = 'rgb(255, 230, 150)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 画飘落的花瓣
   */
  drawFallingPetals(ctx) {
    const petalCount = 15;
    const fallSpeed = 30;
    const swaySpeed = 2;
    const swayAmount = 20;
    
    for (let i = 0; i < petalCount; i++) {
      const initX = -80 + this.seededRandom(i * 23) * 160;
      const initY = 180 + this.seededRandom(i * 37) * 60;
      const phase = this.seededRandom(i * 43) * Math.PI * 2;
      const fallOffset = this.seededRandom(i * 51) * 100;
      
      const cycleTime = (this.animTime + fallOffset / fallSpeed) % 6;
      const py = initY - cycleTime * fallSpeed;
      
      const sway = Math.sin(this.animTime * swaySpeed + phase) * swayAmount;
      const px = initX + sway;
      
      const rotation = this.animTime * 1.5 + phase;
      
      if (py > -20 && py < 200) {
        const rotFactor = Math.abs(Math.cos(rotation));
        const petalW = 3 + rotFactor * 3;
        const petalH = 6 - rotFactor * 2;
        
        ctx.fillStyle = i % 2 === 0 ? this.sakuraPetalColor : this.sakuraPetalLightColor;
        ctx.beginPath();
        ctx.ellipse(px, py, petalW, petalH, rotation, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  /**
   * 死亡的樱花
   */
  drawDeadSakura(ctx, plant, progress) {
    const trunkHeight = Math.min(progress * 500, 140);
    
    ctx.strokeStyle = 'rgb(60, 40, 30)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5, trunkHeight * 0.5, 3, trunkHeight);
    ctx.stroke();
    
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const t = 0.5 + i * 0.12;
      const by = trunkHeight * t;
      const side = i % 2 === 0 ? -1 : 1;
      const branchLen = 20 + this.seededRandom(i * 19) * 25;
      const angle = side * (40 + i * 5) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.moveTo(3 * t, by);
      ctx.lineTo(
        3 * t + Math.sin(angle) * branchLen,
        by + Math.cos(angle) * branchLen * 0.2 - 5
      );
      ctx.stroke();
    }
    
    ctx.fillStyle = 'rgb(120, 90, 70)';
    for (let i = 0; i < 6; i++) {
      const lx = -30 + this.seededRandom(i * 11) * 60;
      const ly = -5 + this.seededRandom(i * 17) * 10;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // ==================== 工具函数 ====================
  
  /**
   * 确定性伪随机数生成器
   */
  seededRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  
  /**
   * 获取植物渲染高度（用于遮雨棚等设施定位）
   * @param {Object} plant - 植物数据
   * @returns {number} - 植物高度（像素）
   */
  getPlantHeight(plant) {
    if (!plant) return 0;
    
    // 根据生长阶段估算高度
    const baseHeight = 80;  // 基础高度
    const progress = plant.growthProgress || 0;
    
    // 进度越高植物越高
    const stemHeight = baseHeight + progress * 100;
    
    // 开花/结果阶段额外高度
    const hasFlower = ['flowering', 'fruiting', 'ripe', 'withering'].includes(plant.stage);
    const flowerHeight = hasFlower ? 30 : 0;
    
    return stemHeight + flowerHeight + 20;  // 额外余量
  }
}
