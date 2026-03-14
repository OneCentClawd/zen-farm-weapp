/**
 * 🏠 设施渲染器（Canvas 2D 版）
 * 
 * 渲染遮雨棚和除湿器的动画效果
 */

export class FacilityRenderer {
  
  constructor() {
    this.animTime = 0;
    this.fanAngle = 0;  // 风扇旋转角度
    
    // 气流粒子
    this.airParticles = [];
  }
  
  /**
   * 更新动画
   * @param {number} dt - 帧间隔（秒）
   */
  update(dt) {
    this.animTime += dt;
    this.fanAngle += dt * 8;  // 风扇转速
    
    // 更新气流粒子
    this.updateAirParticles(dt);
  }
  
  /**
   * 渲染设施
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} hasShelter - 是否有遮雨棚
   * @param {boolean} hasDehumidifier - 是否有除湿器
   * @param {number} x - 中心 X
   * @param {number} groundY - 地面 Y
   * @param {number} plantHeight - 植物高度（用于确定棚子高度）
   */
  render(ctx, hasShelter, hasDehumidifier, x, groundY, plantHeight = 150) {
    if (hasShelter) {
      this.renderShelter(ctx, x, groundY, plantHeight);
    }
    
    if (hasDehumidifier) {
      this.renderDehumidifier(ctx, x, groundY);
      this.renderAirParticles(ctx);
    }
  }
  
  /**
   * 渲染遮雨棚
   */
  renderShelter(ctx, x, groundY, plantHeight) {
    ctx.save();
    
    // 轻微摇晃
    const sway = Math.sin(this.animTime * 1.5) * 2;
    
    const shelterWidth = 180;
    const shelterHeight = 25;
    
    // 棚顶高度 = 确保比植物高至少 40px
    const minShelterTop = groundY - plantHeight - 50;
    const shelterTopY = Math.min(minShelterTop, groundY - 120);  // 至少离地 120px
    
    // 支架从地面插入土里
    const poleBottomY = groundY + 15;  // 支架底部插入土壤
    const poleTopY = shelterTopY + shelterHeight;  // 支架顶部连接棚顶
    
    // 支架
    ctx.strokeStyle = 'rgb(139, 90, 43)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    // 左支架
    const leftPoleX = x - shelterWidth / 2 + 25;
    ctx.beginPath();
    ctx.moveTo(leftPoleX, poleBottomY);
    ctx.lineTo(leftPoleX + sway * 0.3, poleTopY);
    ctx.stroke();
    
    // 右支架
    const rightPoleX = x + shelterWidth / 2 - 25;
    ctx.beginPath();
    ctx.moveTo(rightPoleX, poleBottomY);
    ctx.lineTo(rightPoleX + sway * 0.3, poleTopY);
    ctx.stroke();
    
    // 棚顶（半透明塑料布效果）
    ctx.save();
    ctx.translate(x + sway * 0.5, shelterTopY);
    
    // 主体
    ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-shelterWidth / 2, shelterHeight);
    ctx.quadraticCurveTo(0, 0, shelterWidth / 2, shelterHeight);
    ctx.lineTo(shelterWidth / 2 - 5, shelterHeight + 5);
    ctx.quadraticCurveTo(0, 8, -shelterWidth / 2 + 5, shelterHeight + 5);
    ctx.closePath();
    ctx.fill();
    
    // 高光
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-shelterWidth / 2 + 15, shelterHeight - 3);
    ctx.quadraticCurveTo(0, 5, shelterWidth / 2 - 15, shelterHeight - 3);
    ctx.stroke();
    
    // 边缘
    ctx.strokeStyle = 'rgba(100, 130, 180, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-shelterWidth / 2, shelterHeight);
    ctx.quadraticCurveTo(0, 0, shelterWidth / 2, shelterHeight);
    ctx.stroke();
    
    ctx.restore();
    ctx.restore();
  }
  
  /**
   * 渲染除湿器
   */
  renderDehumidifier(ctx, x, groundY) {
    ctx.save();
    
    const dehumX = x + 120;
    const dehumY = groundY - 50;
    const size = 40;
    
    ctx.translate(dehumX, dehumY);
    
    // 机身
    ctx.fillStyle = 'rgba(80, 90, 100, 0.9)';
    this.roundRect(ctx, -size / 2, -size * 0.8, size, size * 1.2, 8);
    ctx.fill();
    
    // 出风口
    ctx.fillStyle = 'rgba(60, 70, 80, 1)';
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // 旋转风扇
    ctx.save();
    ctx.rotate(this.fanAngle);
    
    ctx.strokeStyle = 'rgba(150, 160, 170, 0.9)';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -size * 0.28);
      ctx.stroke();
      ctx.restore();
    }
    
    // 中心点
    ctx.fillStyle = 'rgba(100, 110, 120, 1)';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // 指示灯
    const blinkAlpha = 0.5 + Math.sin(this.animTime * 3) * 0.3;
    ctx.fillStyle = `rgba(100, 200, 150, ${blinkAlpha})`;
    ctx.beginPath();
    ctx.arc(size * 0.3, size * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 底座
    ctx.fillStyle = 'rgba(60, 65, 70, 0.9)';
    ctx.fillRect(-size / 2 - 5, size * 0.4, size + 10, 8);
    
    ctx.restore();
    
    // 生成气流粒子
    if (Math.random() < 0.3) {
      this.airParticles.push({
        x: dehumX + (Math.random() - 0.5) * 30,
        y: dehumY - size * 0.3,
        vx: -2 - Math.random() * 2,
        vy: -0.5 + Math.random(),
        life: 1,
        size: 3 + Math.random() * 4,
      });
    }
  }
  
  /**
   * 更新气流粒子
   */
  updateAirParticles(dt) {
    for (let i = this.airParticles.length - 1; i >= 0; i--) {
      const p = this.airParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 1.5;
      
      if (p.life <= 0) {
        this.airParticles.splice(i, 1);
      }
    }
    
    // 限制粒子数量
    if (this.airParticles.length > 30) {
      this.airParticles.splice(0, 10);
    }
  }
  
  /**
   * 渲染气流粒子
   */
  renderAirParticles(ctx) {
    for (const p of this.airParticles) {
      ctx.fillStyle = `rgba(200, 230, 255, ${p.life * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * 绘制圆角矩形
   */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
