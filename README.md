# Canvous-map

Canvous-map is a canvas lib which provides ability to draw massive data.
It split data into pieces, to render it asynchronously to prevent delay.
Core provide base method to draw elements, in the mean time,
map binding lib also provided, rendering laglat points on canvas.   

## Core
* **MassMarks:** 
* **Grids:** 
* **Arcs:** 
* **Paths:** 

| 类名 | 说明 |
|------|-----|
| MultiLayer | 多图层控制 |
| Layer | 在多图层中的每个单图层 |
| MassMarks | 海量点（圆） |
| Grid | 海量矩形 |
| Arcs | 海量弧线 |
| Paths | 海量线段 |

## 0. MultiLayer
```js
import { MultiLayer } from 'canvous-map/core';
const { Layer } = MultiLayer;
const container = document.getElementById('app');
const layer = new Layer({
  fitSize: true,
});
const multiLayer = new MultiLayer(container, {
  height: 700,
  width: 700,
});
multiLayer.addLayer(layer);
```
### MultiLayer 类
#### 构造一个多图层，负责管理多个图层，将他们叠加在一起。

| 方法 | 说明 |
| ---- | ---- |
| constructor(container, {height: 700,width: 700,}) | container: 容器元素，height: 高, width: 宽 |
| addLayer(layer) | 添加一个图层实例 |
| removeLayer(layer) | 删除一个图层实例 |
| getSize() | 获取多图层容器的尺寸 |
| on(eventName, handler, targetLayer) | 对其中的某个图层添加事件，需要传入图层 |
| off(eventName, handler) | 删除事件 |

### Layer 类
#### 在多图层中的每个单图层
| 方法 | 说明 |
| ---- | ---- |
| constructor({ zIndex, opacity, fitSize, zoom }) | zIndex: 层index, opacity: 透明度, fitSize: 是否自动适应, zoom: 缩放 |
| getCtx() | 获取上下文 |
| getSize() | 获取该层尺寸 |
| setSize({ width, height }) | 设置该层尺寸 |
| clear() | 清楚图形 |

1. MassMarks
```js
    
```
