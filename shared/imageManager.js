/**
 * 图片管理器
 * 用于加载和管理游戏中的图片资源
 */
class ImageManager {
  constructor() {
    this.images = {};
    this.loadedCount = 0;
    this.totalCount = 0;
    this.onLoadComplete = null;
    this.onProgress = null;
  }

  // 加载单个图片
  loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = wx.createImage();
      img.onload = () => {
        this.images[key] = img;
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount, this.totalCount);
        }
        resolve(img);
      };
      img.onerror = (err) => {
        console.error(`Failed to load image: ${key}`, err);
        reject(err);
      };
      img.src = src;
    });
  }

  // 批量加载图片
  async loadImages(imageList) {
    this.totalCount = imageList.length;
    this.loadedCount = 0;

    const promises = imageList.map(({ key, src }) =>
      this.loadImage(key, src).catch(err => {
        console.warn(`Image ${key} failed to load, using fallback`);
        return null;
      })
    );

    await Promise.all(promises);

    if (this.onLoadComplete) {
      this.onLoadComplete(this.images);
    }

    return this.images;
  }

  // 获取图片
  getImage(key) {
    return this.images[key];
  }

  // 检查图片是否已加载
  isLoaded(key) {
    return !!this.images[key];
  }

  // 绘制图片（带像素化处理）
  drawImage(ctx, key, x, y, width, height) {
    const img = this.images[key];
    if (!img) return false;

    // 保持像素风格
    ctx.imageSmoothingEnabled = false;

    if (width && height) {
      ctx.drawImage(img, x, y, width, height);
    } else {
      ctx.drawImage(img, x, y);
    }

    return true;
  }
}

// 导出图片管理器
module.exports = { ImageManager };
