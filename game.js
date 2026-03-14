/**
 * 🌱 佛系种地 - 微信小程序入口
 * 
 * 微信小游戏使用 Canvas 2D API
 */

import { Game } from './js/Game.js';

// 创建 Canvas
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 获取屏幕尺寸
const { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync();

// 设置 Canvas 尺寸（考虑设备像素比）
canvas.width = windowWidth * pixelRatio;
canvas.height = windowHeight * pixelRatio;

// 缩放上下文以匹配设备像素比
ctx.scale(pixelRatio, pixelRatio);

console.log(`📱 屏幕: ${windowWidth}x${windowHeight}, 像素比: ${pixelRatio}`);

// 创建游戏实例（传入逻辑尺寸和已缩放的 ctx）
const game = new Game(canvas, ctx, windowWidth, windowHeight);

// 初始化游戏
game.init().then(() => {
  console.log('🎮 游戏启动成功');
}).catch(err => {
  console.error('❌ 游戏初始化失败:', err);
});

// 游戏主循环
let lastTime = Date.now();

function gameLoop() {
  const now = Date.now();
  const dt = (now - lastTime) / 1000;  // 转换为秒
  lastTime = now;
  
  // 更新
  game.update(dt);
  
  // 渲染
  game.render();
  
  // 下一帧
  requestAnimationFrame(gameLoop);
}

// 启动主循环
requestAnimationFrame(gameLoop);

// 监听小游戏生命周期
wx.onShow(() => {
  console.log('🌱 游戏恢复');
  lastTime = Date.now();
  // 恢复时模拟离线进度
  if (game.gameData) {
    game.simulateOfflineProgress();
  }
});

wx.onHide(() => {
  console.log('💤 游戏暂停，保存存档');
  game.saveNow();
});
