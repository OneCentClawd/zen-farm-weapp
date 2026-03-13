/**
 * 佛系农场 - 微信小游戏版
 * 纯 wx API，不做跨平台
 */

// 创建画布
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync();

// 画布尺寸
const W = windowWidth * pixelRatio;
const H = windowHeight * pixelRatio;
canvas.width = W;
canvas.height = H;

// 游戏状态
const state = {
  // 植物数据
  plant: null,  // { type, stage, health, plantedAt }
  
  // 土壤
  soilMoisture: 50,
  
  // 天气
  weather: {
    temperature: 20,
    humidity: 60,
    weatherCode: 0,
    windSpeed: 5
  },
  
  // UI
  showModal: null,  // 'plant' | 'difficulty' | null
  selectedPlant: null,
  
  // 按钮
  buttons: []
};

// 植物类型
const PLANTS = {
  'greenery': { name: '绿萝', icon: '🌿', stages: ['种子', '发芽', '生长', '成熟'] },
  'mint': { name: '薄荷', icon: '🌱', stages: ['种子', '发芽', '生长', '成熟'] },
  'cactus': { name: '仙人掌', icon: '🌵', stages: ['种子', '发芽', '生长', '成熟'] },
  'bamboo': { name: '竹子', icon: '🎋', stages: ['种子', '发芽', '生长', '成熟'] }
};

// 初始化按钮
function initButtons() {
  const btnSize = 60 * pixelRatio;
  const btnGap = 20 * pixelRatio;
  const btnY = H - btnSize - 30 * pixelRatio;
  const startX = (W - (btnSize * 4 + btnGap * 3)) / 2;
  
  state.buttons = [
    { id: 'plant', icon: '🌱', label: '种植', x: startX, y: btnY, w: btnSize, h: btnSize },
    { id: 'water', icon: '💧', label: '浇水', x: startX + btnSize + btnGap, y: btnY, w: btnSize, h: btnSize },
    { id: 'facility', icon: '🏠', label: '设施', x: startX + (btnSize + btnGap) * 2, y: btnY, w: btnSize, h: btnSize },
    { id: 'harvest', icon: '🌾', label: '收获', x: startX + (btnSize + btnGap) * 3, y: btnY, w: btnSize, h: btnSize }
  ];
}

// ============ 渲染 ============

function render() {
  // 清屏
  ctx.clearRect(0, 0, W, H);
  
  // 天空
  drawSky();
  
  // 土壤
  drawSoil();
  
  // 植物
  if (state.plant) {
    drawPlant();
  } else {
    drawEmptyPlot();
  }
  
  // 状态栏
  drawStatusBar();
  
  // 按钮
  drawButtons();
  
  // 弹窗
  if (state.showModal) {
    drawModal();
  }
}

function drawSky() {
  const hour = new Date().getHours();
  let topColor, bottomColor;
  
  if (hour >= 6 && hour < 8) {
    topColor = '#ff9966';
    bottomColor = '#ffcc99';
  } else if (hour >= 8 && hour < 17) {
    topColor = '#87ceeb';
    bottomColor = '#e0f0ff';
  } else if (hour >= 17 && hour < 19) {
    topColor = '#ff6b6b';
    bottomColor = '#ffd93d';
  } else {
    topColor = '#1a1a2e';
    bottomColor = '#16213e';
  }
  
  const skyHeight = H * 0.65;
  const gradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, skyHeight);
  
  // 太阳/月亮
  if (hour >= 6 && hour < 18) {
    // 太阳
    const sunX = W / 2;
    const sunY = 100 * pixelRatio;
    ctx.fillStyle = '#ffdc32';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40 * pixelRatio, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 月亮
    const moonX = W / 2;
    const moonY = 100 * pixelRatio;
    ctx.fillStyle = '#fffadc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 30 * pixelRatio, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSoil() {
  const soilY = H * 0.65;
  const soilH = H * 0.35;
  
  // 根据湿度调整颜色
  let topColor = '#8B6914';
  if (state.soilMoisture < 30) {
    topColor = '#a07820';  // 干燥
  } else if (state.soilMoisture > 70) {
    topColor = '#5a5030';  // 湿润
  }
  
  const gradient = ctx.createLinearGradient(0, soilY, 0, H);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.3, '#6B4914');
  gradient.addColorStop(1, '#4a3010');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, soilY, W, soilH);
}

function drawPlant() {
  const x = W / 2;
  const y = H * 0.65;
  const plant = state.plant;
  const info = PLANTS[plant.type];
  
  // 简单画个 emoji 代表植物
  ctx.font = `${80 * pixelRatio}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(info.icon, x, y);
  
  // 阶段文字
  ctx.font = `${14 * pixelRatio}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(`${info.name} - ${info.stages[plant.stage]}`, x, y + 30 * pixelRatio);
}

function drawEmptyPlot() {
  const x = W / 2;
  const y = H * 0.65 + 50 * pixelRatio;
  
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2 * pixelRatio;
  ctx.setLineDash([5 * pixelRatio, 5 * pixelRatio]);
  
  ctx.beginPath();
  ctx.arc(x, y, 40 * pixelRatio, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#fff';
  ctx.font = `${14 * pixelRatio}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('点击种植', x, y + 70 * pixelRatio);
}

function drawStatusBar() {
  const barH = 50 * pixelRatio;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, barH);
  
  ctx.fillStyle = '#fff';
  ctx.font = `${14 * pixelRatio}px sans-serif`;
  ctx.textAlign = 'left';
  
  const weather = state.weather;
  const text = `🌡️ ${weather.temperature}°C  💧 ${state.soilMoisture}%  🌤️ 晴`;
  ctx.fillText(text, 15 * pixelRatio, 32 * pixelRatio);
}

function drawButtons() {
  for (const btn of state.buttons) {
    // 背景
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10 * pixelRatio);
    ctx.fill();
    
    // 图标
    ctx.font = `${24 * pixelRatio}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.icon, btn.x + btn.w / 2, btn.y + btn.h / 2 - 8 * pixelRatio);
    
    // 文字
    ctx.fillStyle = '#333';
    ctx.font = `${10 * pixelRatio}px sans-serif`;
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h - 10 * pixelRatio);
  }
}

function drawModal() {
  // 遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  
  const modalW = W * 0.85;
  const modalH = 300 * pixelRatio;
  const modalX = (W - modalW) / 2;
  const modalY = (H - modalH) / 2;
  
  // 弹窗背景
  ctx.fillStyle = 'rgba(40,40,50,0.95)';
  ctx.beginPath();
  ctx.roundRect(modalX, modalY, modalW, modalH, 15 * pixelRatio);
  ctx.fill();
  
  if (state.showModal === 'plant') {
    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${18 * pixelRatio}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择植物', W / 2, modalY + 40 * pixelRatio);
    
    // 植物选项
    const plants = Object.keys(PLANTS);
    const btnW = 70 * pixelRatio;
    const btnH = 80 * pixelRatio;
    const gap = 15 * pixelRatio;
    const startX = (W - (btnW * 4 + gap * 3)) / 2;
    const btnY = modalY + 80 * pixelRatio;
    
    state.modalButtons = [];
    
    plants.forEach((type, i) => {
      const info = PLANTS[type];
      const bx = startX + i * (btnW + gap);
      
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(bx, btnY, btnW, btnH, 8 * pixelRatio);
      ctx.fill();
      
      ctx.font = `${32 * pixelRatio}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(info.icon, bx + btnW / 2, btnY + 40 * pixelRatio);
      
      ctx.fillStyle = '#fff';
      ctx.font = `${12 * pixelRatio}px sans-serif`;
      ctx.fillText(info.name, bx + btnW / 2, btnY + btnH - 10 * pixelRatio);
      
      state.modalButtons.push({ type, x: bx, y: btnY, w: btnW, h: btnH });
    });
    
    // 取消按钮
    const cancelY = modalY + modalH - 60 * pixelRatio;
    const cancelW = 100 * pixelRatio;
    const cancelX = (W - cancelW) / 2;
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(cancelX, cancelY, cancelW, 40 * pixelRatio, 8 * pixelRatio);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = `${14 * pixelRatio}px sans-serif`;
    ctx.fillText('取消', W / 2, cancelY + 25 * pixelRatio);
    
    state.cancelButton = { x: cancelX, y: cancelY, w: cancelW, h: 40 * pixelRatio };
    
  } else if (state.showModal === 'difficulty') {
    // 难度选择
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${18 * pixelRatio}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', W / 2, modalY + 40 * pixelRatio);
    
    const btnW = 120 * pixelRatio;
    const btnH = 50 * pixelRatio;
    const gap = 20 * pixelRatio;
    const startY = modalY + 80 * pixelRatio;
    
    const difficulties = [
      { id: 'easy', label: '🌸 佛系模式', desc: '轻松种植' },
      { id: 'normal', label: '🌿 普通模式', desc: '正常难度' },
      { id: 'hard', label: '🔥 硬核模式', desc: '真实挑战' }
    ];
    
    state.modalButtons = [];
    
    difficulties.forEach((d, i) => {
      const by = startY + i * (btnH + gap);
      const bx = (W - btnW) / 2;
      
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 8 * pixelRatio);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = `${14 * pixelRatio}px sans-serif`;
      ctx.fillText(d.label, W / 2, by + 30 * pixelRatio);
      
      state.modalButtons.push({ difficulty: d.id, x: bx, y: by, w: btnW, h: btnH });
    });
  }
}

// ============ 事件 ============

function handleTouch(x, y) {
  // 转换坐标
  x = x * pixelRatio;
  y = y * pixelRatio;
  
  console.log(`触摸: (${x.toFixed(0)}, ${y.toFixed(0)})`);
  
  // 弹窗优先
  if (state.showModal) {
    handleModalTouch(x, y);
    return;
  }
  
  // 检查按钮
  for (const btn of state.buttons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      console.log(`点击按钮: ${btn.id}`);
      handleButtonClick(btn.id);
      return;
    }
  }
}

function handleModalTouch(x, y) {
  // 检查植物/难度选择
  if (state.modalButtons) {
    for (const btn of state.modalButtons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (btn.type) {
          // 选择了植物
          console.log(`选择植物: ${btn.type}`);
          state.selectedPlant = btn.type;
          state.showModal = 'difficulty';
        } else if (btn.difficulty) {
          // 选择了难度
          console.log(`选择难度: ${btn.difficulty}`);
          doPlant(state.selectedPlant, btn.difficulty === 'hard');
          state.showModal = null;
          state.selectedPlant = null;
        }
        return;
      }
    }
  }
  
  // 取消按钮
  if (state.cancelButton) {
    const btn = state.cancelButton;
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      console.log('取消');
      state.showModal = null;
      state.selectedPlant = null;
      return;
    }
  }
  
  // 点击遮罩关闭
  state.showModal = null;
  state.selectedPlant = null;
}

function handleButtonClick(id) {
  switch (id) {
    case 'plant':
      if (!state.plant) {
        state.showModal = 'plant';
      } else {
        console.log('已有植物');
      }
      break;
    case 'water':
      doWater();
      break;
    case 'harvest':
      doHarvest();
      break;
    case 'facility':
      console.log('设施功能待实现');
      break;
  }
}

// ============ 游戏逻辑 ============

function doPlant(type, hardMode) {
  console.log(`种植: ${type}, 硬核: ${hardMode}`);
  state.plant = {
    type: type,
    stage: 0,
    health: 100,
    plantedAt: Date.now(),
    hardMode: hardMode
  };
  save();
}

function doWater() {
  state.soilMoisture = Math.min(100, state.soilMoisture + 20);
  console.log(`浇水，湿度: ${state.soilMoisture}`);
  save();
}

function doHarvest() {
  if (state.plant && state.plant.stage >= 3) {
    console.log(`收获: ${state.plant.type}`);
    state.plant = null;
    save();
  } else {
    console.log('没有可收获的植物');
  }
}

// ============ 存储 ============

function save() {
  try {
    wx.setStorageSync('zen_farm_save', {
      plant: state.plant,
      soilMoisture: state.soilMoisture
    });
    console.log('保存成功');
  } catch (e) {
    console.error('保存失败', e);
  }
}

function load() {
  try {
    const data = wx.getStorageSync('zen_farm_save');
    if (data) {
      state.plant = data.plant;
      state.soilMoisture = data.soilMoisture || 50;
      console.log('加载成功');
    }
  } catch (e) {
    console.error('加载失败', e);
  }
}

// ============ 主循环 ============

function gameLoop() {
  render();
  requestAnimationFrame(gameLoop);
}

// ============ 初始化 ============

function init() {
  console.log('佛系农场启动！');
  console.log(`屏幕: ${windowWidth}x${windowHeight}, DPR: ${pixelRatio}`);
  
  initButtons();
  load();
  
  // 触摸事件
  wx.onTouchStart((e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleTouch(touch.clientX, touch.clientY);
    }
  });
  
  // 开始游戏循环
  gameLoop();
}

init();
