/**
 * 🎨 图标渲染器（Canvas 简笔画风格）
 * 
 * 用 Canvas 绘制所有图标，保证跨设备显示一致
 */

export class IconRenderer {
  
  /**
   * 绘制太阳
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static sun(ctx, x, y, size = 20) {
    const r = size * 0.4;
    
    ctx.save();
    ctx.translate(x, y);
    
    // 光芒
    ctx.strokeStyle = '#FFB830';
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const innerR = r * 1.3;
      const outerR = r * 1.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }
    
    // 圆形主体
    ctx.fillStyle = '#FFD93D';
    ctx.strokeStyle = '#FFB830';
    ctx.lineWidth = size * 0.06;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 笑脸（可选）
    ctx.strokeStyle = '#E89B00';
    ctx.lineWidth = size * 0.05;
    // 眼睛
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.15, size * 0.04, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.15, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // 微笑
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 绘制云朵
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static cloud(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#F0F0F0';
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = size * 0.05;
    
    ctx.beginPath();
    // 主体由几个圆组成
    ctx.arc(-size * 0.25, 0, size * 0.3, 0, Math.PI * 2);
    ctx.arc(size * 0.15, -size * 0.05, size * 0.35, 0, Math.PI * 2);
    ctx.arc(size * 0.35, size * 0.1, size * 0.2, 0, Math.PI * 2);
    ctx.arc(-size * 0.1, size * 0.15, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 绘制雨滴
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static raindrop(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = '#5CB8E4';
    ctx.strokeStyle = '#3A9BD9';
    ctx.lineWidth = size * 0.06;
    
    ctx.beginPath();
    // 水滴形状
    ctx.moveTo(0, -size * 0.5);
    ctx.bezierCurveTo(
      size * 0.35, -size * 0.1,
      size * 0.35, size * 0.35,
      0, size * 0.5
    );
    ctx.bezierCurveTo(
      -size * 0.35, size * 0.35,
      -size * 0.35, -size * 0.1,
      0, -size * 0.5
    );
    ctx.fill();
    ctx.stroke();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.1, -size * 0.1, size * 0.08, size * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * 绘制雪花
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static snowflake(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.strokeStyle = '#A0D8EF';
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    
    const armLen = size * 0.45;
    const branchLen = armLen * 0.35;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);
      
      // 主分支
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -armLen);
      ctx.stroke();
      
      // 小分支
      ctx.beginPath();
      ctx.moveTo(0, -armLen * 0.5);
      ctx.lineTo(-branchLen, -armLen * 0.7);
      ctx.moveTo(0, -armLen * 0.5);
      ctx.lineTo(branchLen, -armLen * 0.7);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // 中心点
    ctx.fillStyle = '#A0D8EF';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * 绘制风
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static wind(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.strokeStyle = '#8EC8E8';
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    
    // 三条弧线
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.25);
    ctx.quadraticCurveTo(size * 0.2, -size * 0.35, size * 0.4, -size * 0.15);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, 0);
    ctx.quadraticCurveTo(size * 0.3, -size * 0.1, size * 0.5, size * 0.1);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, size * 0.25);
    ctx.quadraticCurveTo(size * 0.1, size * 0.15, size * 0.3, size * 0.35);
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 绘制种子/发芽
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static seedling(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 茎
    ctx.strokeStyle = '#6B8E4E';
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.quadraticCurveTo(size * 0.05, 0, 0, -size * 0.1);
    ctx.stroke();
    
    // 左叶子
    ctx.fillStyle = '#8FBC5A';
    ctx.strokeStyle = '#6B8E4E';
    ctx.lineWidth = size * 0.05;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.05);
    ctx.quadraticCurveTo(-size * 0.4, -size * 0.3, -size * 0.15, -size * 0.5);
    ctx.quadraticCurveTo(0, -size * 0.35, 0, -size * 0.05);
    ctx.fill();
    ctx.stroke();
    
    // 右叶子
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.1);
    ctx.quadraticCurveTo(size * 0.35, -size * 0.35, size * 0.12, -size * 0.5);
    ctx.quadraticCurveTo(-size * 0.05, -size * 0.35, 0, -size * 0.1);
    ctx.fill();
    ctx.stroke();
    
    // 土壤
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.45, size * 0.35, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * 绘制叶子/幼苗
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static leaf(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 茎
    ctx.strokeStyle = '#5D7E3E';
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.5);
    ctx.quadraticCurveTo(size * 0.05, 0, 0, -size * 0.2);
    ctx.stroke();
    
    // 叶子
    ctx.fillStyle = '#7CB342';
    ctx.strokeStyle = '#5D7E3E';
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.15);
    ctx.bezierCurveTo(
      -size * 0.5, -size * 0.3,
      -size * 0.4, -size * 0.7,
      0, -size * 0.5
    );
    ctx.bezierCurveTo(
      size * 0.4, -size * 0.7,
      size * 0.5, -size * 0.3,
      0, -size * 0.15
    );
    ctx.fill();
    ctx.stroke();
    
    // 叶脉
    ctx.strokeStyle = '#5D7E3E';
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.15);
    ctx.lineTo(0, -size * 0.45);
    ctx.moveTo(0, -size * 0.25);
    ctx.lineTo(-size * 0.15, -size * 0.35);
    ctx.moveTo(0, -size * 0.25);
    ctx.lineTo(size * 0.15, -size * 0.35);
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 绘制麦穗/收获
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static wheat(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 茎
    ctx.strokeStyle = '#C4A052';
    ctx.lineWidth = size * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.5);
    ctx.quadraticCurveTo(size * 0.02, 0, 0, -size * 0.3);
    ctx.stroke();
    
    // 麦粒
    ctx.fillStyle = '#E8C547';
    ctx.strokeStyle = '#C4A052';
    ctx.lineWidth = size * 0.03;
    
    const grains = [
      { x: 0, y: -size * 0.35, angle: 0 },
      { x: -size * 0.08, y: -size * 0.28, angle: -0.4 },
      { x: size * 0.08, y: -size * 0.28, angle: 0.4 },
      { x: -size * 0.12, y: -size * 0.18, angle: -0.6 },
      { x: size * 0.12, y: -size * 0.18, angle: 0.6 },
      { x: -size * 0.08, y: -size * 0.08, angle: -0.3 },
      { x: size * 0.08, y: -size * 0.08, angle: 0.3 },
    ];
    
    for (const g of grains) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.05, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    
    // 麦芒
    ctx.strokeStyle = '#C4A052';
    ctx.lineWidth = size * 0.025;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.35);
    ctx.lineTo(0, -size * 0.5);
    ctx.moveTo(-size * 0.08, -size * 0.28);
    ctx.lineTo(-size * 0.18, -size * 0.42);
    ctx.moveTo(size * 0.08, -size * 0.28);
    ctx.lineTo(size * 0.18, -size * 0.42);
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 绘制房子/设施
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static house(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 墙
    ctx.fillStyle = '#F5E6D3';
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = size * 0.05;
    ctx.beginPath();
    ctx.rect(-size * 0.35, -size * 0.1, size * 0.7, size * 0.55);
    ctx.fill();
    ctx.stroke();
    
    // 屋顶
    ctx.fillStyle = '#C84C3C';
    ctx.strokeStyle = '#8B3328';
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, -size * 0.1);
    ctx.lineTo(0, -size * 0.5);
    ctx.lineTo(size * 0.45, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 门
    ctx.fillStyle = '#6B4226';
    ctx.beginPath();
    ctx.rect(-size * 0.1, size * 0.1, size * 0.2, size * 0.35);
    ctx.fill();
    
    // 门把手
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(size * 0.05, size * 0.28, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // 窗户
    ctx.fillStyle = '#87CEEB';
    ctx.strokeStyle = '#F5E6D3';
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.rect(-size * 0.28, 0, size * 0.12, size * 0.12);
    ctx.rect(size * 0.16, 0, size * 0.12, size * 0.12);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * 绘制温度计
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static thermometer(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 外壳
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = size * 0.05;
    
    // 管身
    ctx.beginPath();
    ctx.roundRect(-size * 0.1, -size * 0.45, size * 0.2, size * 0.7, size * 0.1);
    ctx.fill();
    ctx.stroke();
    
    // 底部球
    ctx.beginPath();
    ctx.arc(0, size * 0.35, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 水银
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(0, size * 0.35, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-size * 0.04, -size * 0.2, size * 0.08, size * 0.5);
    ctx.fill();
    
    // 刻度
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = size * 0.02;
    for (let i = 0; i < 4; i++) {
      const ty = -size * 0.35 + i * size * 0.15;
      ctx.beginPath();
      ctx.moveTo(size * 0.1, ty);
      ctx.lineTo(size * 0.18, ty);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制骷髅/枯死
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static skull(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 头骨
    ctx.fillStyle = '#F5F5F0';
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = size * 0.04;
    
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.1, size * 0.38, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 下巴
    ctx.beginPath();
    ctx.ellipse(0, size * 0.25, size * 0.25, size * 0.15, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 眼眶
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(-size * 0.15, -size * 0.15, size * 0.12, size * 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.15, -size * 0.15, size * 0.12, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 鼻子
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.02);
    ctx.lineTo(-size * 0.06, size * 0.1);
    ctx.lineTo(size * 0.06, size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // 牙齿
    ctx.fillStyle = '#F5F5F0';
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = size * 0.02;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.rect(i * size * 0.08 - size * 0.03, size * 0.18, size * 0.06, size * 0.1);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制笑脸/健康
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   * @param {string} mood - 'happy' | 'neutral' | 'sad'
   */
  static face(ctx, x, y, size = 20, mood = 'happy') {
    ctx.save();
    ctx.translate(x, y);
    
    // 脸
    const faceColor = mood === 'happy' ? '#90EE90' : (mood === 'neutral' ? '#FFE4B5' : '#FFB6C1');
    ctx.fillStyle = faceColor;
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 眼睛
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(-size * 0.15, -size * 0.1, size * 0.07, 0, Math.PI * 2);
    ctx.arc(size * 0.15, -size * 0.1, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    // 嘴巴
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 'happy') {
      ctx.arc(0, size * 0.05, size * 0.2, 0.2, Math.PI - 0.2);
    } else if (mood === 'neutral') {
      ctx.moveTo(-size * 0.15, size * 0.15);
      ctx.lineTo(size * 0.15, size * 0.15);
    } else {
      ctx.arc(0, size * 0.3, size * 0.18, Math.PI + 0.3, -0.3);
    }
    ctx.stroke();
    
    // 汗滴（sad 时）
    if (mood === 'sad') {
      ctx.fillStyle = '#5CB8E4';
      ctx.beginPath();
      ctx.ellipse(size * 0.35, size * 0.05, size * 0.06, size * 0.1, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制硬核模式火焰
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static fire(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 外焰
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.bezierCurveTo(
      size * 0.3, -size * 0.3,
      size * 0.35, size * 0.2,
      size * 0.2, size * 0.45
    );
    ctx.quadraticCurveTo(0, size * 0.3, -size * 0.2, size * 0.45);
    ctx.bezierCurveTo(
      -size * 0.35, size * 0.2,
      -size * 0.3, -size * 0.3,
      0, -size * 0.5
    );
    ctx.fill();
    
    // 内焰
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.25);
    ctx.bezierCurveTo(
      size * 0.15, -size * 0.1,
      size * 0.18, size * 0.2,
      size * 0.08, size * 0.35
    );
    ctx.quadraticCurveTo(0, size * 0.25, -size * 0.08, size * 0.35);
    ctx.bezierCurveTo(
      -size * 0.18, size * 0.2,
      -size * 0.15, -size * 0.1,
      0, -size * 0.25
    );
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * 绘制沙漠/干旱
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 X
   * @param {number} y - 中心 Y
   * @param {number} size - 尺寸
   */
  static desert(ctx, x, y, size = 20) {
    ctx.save();
    ctx.translate(x, y);
    
    // 沙丘
    ctx.fillStyle = '#E8C88A';
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, size * 0.3);
    ctx.quadraticCurveTo(-size * 0.2, -size * 0.1, 0, size * 0.1);
    ctx.quadraticCurveTo(size * 0.25, size * 0.3, size * 0.5, size * 0.2);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.lineTo(-size * 0.5, size * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // 仙人掌
    ctx.fillStyle = '#5D8C4C';
    ctx.strokeStyle = '#3D6E34';
    ctx.lineWidth = size * 0.04;
    
    // 主干
    ctx.beginPath();
    ctx.roundRect(-size * 0.08, -size * 0.3, size * 0.16, size * 0.5, size * 0.08);
    ctx.fill();
    ctx.stroke();
    
    // 左臂
    ctx.beginPath();
    ctx.roundRect(-size * 0.25, -size * 0.15, size * 0.12, size * 0.25, size * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-size * 0.18, -size * 0.05, size * 0.1, size * 0.08);
    ctx.fill();
    
    // 右臂
    ctx.beginPath();
    ctx.roundRect(size * 0.13, -size * 0.05, size * 0.12, size * 0.2, size * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(size * 0.08, size * 0.02, size * 0.1, size * 0.06);
    ctx.fill();
    
    ctx.restore();
  }
}
