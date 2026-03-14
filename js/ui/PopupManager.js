/**
 * 🎨 弹窗管理器（Canvas 2D 版）
 * 简洁现代风格
 */

/**
 * 弹窗管理器
 */
export class PopupManager {
  
  /**
   * @param {number} screenWidth
   * @param {number} screenHeight
   */
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.activePopup = null;
    
    // 默认配置
    this.defaultConfig = {
      width: 0.85,   // 0-1 表示屏幕比例（加宽）
      height: 0.35,
      closeOnMask: true,
    };
  }
  
  /**
   * 显示弹窗
   * @param {string} name - 弹窗名称
   * @param {Object} config - 配置
   * @returns {Object} - 弹窗数据
   */
  show(name, config = {}) {
    this.close();
    
    const cfg = { ...this.defaultConfig, ...config };
    
    const panelW = cfg.width <= 1 ? this.screenWidth * cfg.width : cfg.width;
    const panelH = cfg.height <= 1 ? this.screenHeight * cfg.height : cfg.height;
    
    this.activePopup = {
      name,
      config: cfg,
      panelW,
      panelH,
      panelX: (this.screenWidth - panelW) / 2,
      panelY: (this.screenHeight - panelH) / 2,
      elements: [],  // 按钮、标签等
      animProgress: 0,  // 弹出动画进度
    };
    
    // 标题
    if (cfg.title) {
      this.activePopup.elements.push({
        type: 'label',
        text: cfg.title,
        fontSize: 28,
        x: panelW / 2,
        y: 35,
        color: 'rgb(255, 255, 255)',
      });
    }
    
    return this.activePopup;
  }
  
  /**
   * 添加按钮
   * @param {string} text - 按钮文字
   * @param {number} x - X 位置（相对面板中心）
   * @param {number} y - Y 位置（相对面板中心，向下为正）
   * @param {Function} onClick - 点击回调
   * @param {string} style - 样式：primary/secondary/danger
   */
  addButton(text, x, y, onClick, style = 'primary') {
    if (!this.activePopup) return null;
    
    const colors = {
      primary: 'rgb(100, 200, 120)',
      secondary: 'rgb(180, 180, 190)',
      danger: 'rgb(255, 100, 100)',
    };
    
    const btn = {
      type: 'button',
      text,
      x: this.activePopup.panelW / 2 + x,
      y: this.activePopup.panelH / 2 - y,  // 转换坐标
      width: 180,
      height: 40,
      fontSize: 22,
      color: colors[style] || colors.primary,
      onClick,
      pressed: false,
    };
    
    this.activePopup.elements.push(btn);
    return btn;
  }
  
  /**
   * 添加选项按钮（带背景框）
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {Function} onClick
   */
  addOption(text, x, y, onClick) {
    if (!this.activePopup) return null;
    
    const opt = {
      type: 'option',
      text,
      x: this.activePopup.panelW / 2 + x,
      y: this.activePopup.panelH / 2 - y,
      width: 200,
      height: 44,
      fontSize: 22,
      color: 'rgb(230, 230, 230)',
      bgColor: 'rgba(60, 65, 75, 0.8)',
      onClick,
      pressed: false,
    };
    
    this.activePopup.elements.push(opt);
    return opt;
  }
  
  /**
   * 添加文本标签
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} fontSize
   * @param {string} color
   */
  addLabel(text, x, y, fontSize = 18, color = 'rgb(200, 200, 205)') {
    if (!this.activePopup) return null;
    
    const label = {
      type: 'label',
      text,
      x: this.activePopup.panelW / 2 + x,
      y: this.activePopup.panelH / 2 - y,
      fontSize,
      color,
    };
    
    this.activePopup.elements.push(label);
    return label;
  }
  
  /**
   * 关闭弹窗
   */
  close() {
    this.activePopup = null;
  }
  
  /**
   * 是否显示中
   */
  isShowing() {
    return this.activePopup !== null;
  }
  
  /**
   * 更新动画
   * @param {number} dt
   */
  update(dt) {
    if (this.activePopup && this.activePopup.animProgress < 1) {
      this.activePopup.animProgress = Math.min(1, this.activePopup.animProgress + dt * 8);
    }
  }
  
  /**
   * 渲染弹窗
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.activePopup) return;
    
    const popup = this.activePopup;
    const anim = this.easeBackOut(popup.animProgress);
    
    // 遮罩
    ctx.fillStyle = `rgba(0, 0, 0, ${0.47 * popup.animProgress})`;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    // 面板
    ctx.save();
    ctx.translate(popup.panelX + popup.panelW / 2, popup.panelY + popup.panelH / 2);
    ctx.scale(0.9 + 0.1 * anim, 0.9 + 0.1 * anim);
    ctx.globalAlpha = popup.animProgress;
    
    // 面板背景
    this.drawPanel(ctx, popup.panelW, popup.panelH);
    
    // 元素
    ctx.translate(-popup.panelW / 2, -popup.panelH / 2);
    
    for (const el of popup.elements) {
      if (el.type === 'label') {
        this.drawLabel(ctx, el);
      } else if (el.type === 'button') {
        this.drawButton(ctx, el);
      } else if (el.type === 'option') {
        this.drawOption(ctx, el);
      }
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制面板 - 毛玻璃风格
   */
  drawPanel(ctx, w, h) {
    const r = 16;
    
    // 主背景
    ctx.fillStyle = 'rgba(35, 40, 50, 0.9)';
    this.roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fill();
    
    // 顶部高光线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2 + 1);
    ctx.lineTo(w / 2 - r, -h / 2 + 1);
    ctx.stroke();
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.stroke();
  }
  
  /**
   * 绘制标签
   */
  drawLabel(ctx, el) {
    ctx.fillStyle = el.color;
    ctx.font = `${el.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.text, el.x, el.y);
  }
  
  /**
   * 绘制按钮
   */
  drawButton(ctx, el) {
    const scale = el.pressed ? 0.95 : 1;
    
    ctx.save();
    ctx.translate(el.x, el.y);
    ctx.scale(scale, scale);
    
    // 按钮文字
    ctx.fillStyle = el.pressed ? this.darkenColor(el.color, 0.7) : el.color;
    ctx.font = `${el.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.text, 0, 0);
    
    ctx.restore();
  }
  
  /**
   * 绘制选项按钮（带背景）
   */
  drawOption(ctx, el) {
    const scale = el.pressed ? 0.97 : 1;
    
    ctx.save();
    ctx.translate(el.x, el.y);
    ctx.scale(scale, scale);
    
    // 背景框
    ctx.fillStyle = el.bgColor;
    this.roundRect(ctx, -el.width / 2, -el.height / 2, el.width, el.height, 10);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, -el.width / 2, -el.height / 2, el.width, el.height, 10);
    ctx.stroke();
    
    // 文字
    ctx.fillStyle = el.color;
    ctx.font = `${el.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.text, 0, 0);
    
    ctx.restore();
  }
  
  /**
   * 处理点击
   * @param {number} x - 屏幕坐标
   * @param {number} y
   * @returns {boolean} - 是否消费了事件
   */
  handleTap(x, y) {
    if (!this.activePopup) return false;
    
    const popup = this.activePopup;
    const cfg = popup.config;
    
    // 检查是否在面板内
    const inPanel = x >= popup.panelX && x <= popup.panelX + popup.panelW &&
                    y >= popup.panelY && y <= popup.panelY + popup.panelH;
    
    if (!inPanel) {
      // 点击遮罩
      if (cfg.closeOnMask) {
        this.close();
      }
      return true;  // 消费事件
    }
    
    // 转换为面板内坐标
    const px = x - popup.panelX;
    const py = y - popup.panelY;
    
    // 检查按钮
    for (const el of popup.elements) {
      if (el.type === 'button' || el.type === 'option') {
        const hw = el.width / 2;
        const hh = el.height / 2;
        if (px >= el.x - hw && px <= el.x + hw &&
            py >= el.y - hh && py <= el.y + hh) {
          if (el.onClick) {
            el.onClick();
          }
          return true;
        }
      }
    }
    
    return true;  // 面板内点击也消费
  }
  
  /**
   * 处理触摸开始
   */
  handleTouchStart(x, y) {
    if (!this.activePopup) return false;
    
    const popup = this.activePopup;
    const px = x - popup.panelX;
    const py = y - popup.panelY;
    
    for (const el of popup.elements) {
      if (el.type === 'button' || el.type === 'option') {
        const hw = el.width / 2;
        const hh = el.height / 2;
        if (px >= el.x - hw && px <= el.x + hw &&
            py >= el.y - hh && py <= el.y + hh) {
          el.pressed = true;
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 处理触摸结束
   */
  handleTouchEnd() {
    if (!this.activePopup) return;
    
    for (const el of this.activePopup.elements) {
      if (el.pressed) {
        el.pressed = false;
      }
    }
  }
  
  // ========== 工具函数 ==========
  
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
  
  easeBackOut(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  
  darkenColor(colorStr, factor) {
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = Math.round(parseInt(match[1]) * factor);
      const g = Math.round(parseInt(match[2]) * factor);
      const b = Math.round(parseInt(match[3]) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return colorStr;
  }
}
