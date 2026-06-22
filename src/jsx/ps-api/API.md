# Photoshop Script API - 完整 API 文档

> 此文档由 `photoshop-script-api` 项目源码自动生成，覆盖项目中所有公开类、枚举、类型及其全部公开方法/属性。

---

## 使用方法

### TypeScript 项目

直接导入 `src/index.ts`：

```typescript
import { Document, Layer, SolidColor } from "./photoshop-script-api/src/index";

const doc = Document.activeDocument();
if (doc) {
    $.writeln(doc.name());
}
```

### JavaScript 项目

通过 npm 安装编译后的包：

```shell
npm install photoshop-script-api
```

在代码中引入编译后的文件：

```javascript
#include "./node_modules/photoshop-script-api/dist/main.js"

var app = new $.Application();
alert(app.version());
```

### ES6 Module 方式（webpack 构建）

```javascript
import { Application, Document, Layer } from "photoshop-script-api";

const app = new Application();
app.open("/path/to/file.psd");
```

### 命名空间

所有类在全局 `$.` 命名空间下注册，避免命名冲突：

```javascript
var doc = $.Document.activeDocument();
var layer = $.Layer.getLayerByIndex(1);
var color = $.SolidColor.fromHexString("#ff5c5c");
```

---

## 目录

1. [基础类型](#1-基础类型)
   - [SolidColor](#solidcolor)
   - [GradientColor](#gradientcolor)
2. [文档操作](#2-文档操作)
   - [Application](#application)
   - [Document](#document)
3. [图层操作](#3-图层操作)
   - [Layer](#layer)
   - [Artboard](#artboard)
4. [形状与绘制](#4-形状与绘制)
   - [Shape / Point / Line / Circle / Ellipse / Rectangle / Triangle](#shape-点类与形状类)
   - [Canvas](#canvas)
5. [选区操作](#5-选区操作)
   - [Selection](#selection)
   - [Rect](#rect)
   - [Size](#size)
6. [文本操作](#6-文本操作)
   - [Text](#text)
7. [描边](#7-描边)
   - [Stroke](#stroke)
8. [历史记录](#8-历史记录)
   - [History](#history)
9. [参考线](#9-参考线)
   - [Guide](#guide)
10. [元数据](#10-元数据)
    - [MetaData](#metadata)
11. [颜色采样器](#11-颜色采样器)
    - [ColorSampler](#colorsampler)
12. [图层效果 (FX)](#12-图层效果-fx)
    - [FXColorOverlay](#fxcoloroverlay)
    - [FXDropShadow](#fxdropshadow)
    - [FXStroke](#fxstroke-图层效果)
    - [FXGradientFill](#fxgradientfill)
13. [工具](#13-工具)
    - [Tool](#tool)
    - [MoveTool](#movetool)
    - [RulerTool](#rulertool)
14. [描述符工具](#14-描述符工具)
    - [DescriptorInfo](#descriptorinfo)
15. [通用工具](#15-通用工具)
    - [Utils](#utils)
16. [枚举类型汇总](#16-枚举类型汇总)

---

## 1. 基础类型

### SolidColor

**文件**: `src/lib/base/SolidColor.ts`

表示纯色对象，用于在 Photoshop 中处理颜色信息。

#### 构造函数

```typescript
constructor(red: number, green: number, blue: number, alpha: number = 255.0)
```

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `blackColor()` | 创建黑色对象 | `SolidColor` |
| `whiteColor()` | 创建白色对象 | `SolidColor` |
| `fromRGB(red, green, blue)` | 从 RGB 值创建 | `SolidColor` |
| `fromHexString(hexColor)` | 从十六进制颜色字符串创建（如 `#ff5c5c`），无效返回 `null` | `SolidColor \| null` |
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `SolidColor` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `toHex(alpha?)` | 转为十六进制字符串，默认不包含 alpha | `string` |
| `toRGB()` | 转为 RGB 对象 `{red, green, blue}` | `ColorRGB` |
| `toCMYK()` | 转为 CMYK 对象 `{cyan, magenta, yellowColor, black}` | `ColorCMYK` |
| `toHSB()` | 转为 HSB 对象 `{hue, saturation, brightness}` | `ColorHSB` |
| `toDescriptor()` | 转为 ActionDescriptor | `ActionDescriptor` |

#### 示例

```javascript
var color = $.SolidColor.fromHexString("#ff5c5c");
$.writeln(color.toHex());        // #FF5C5C
$.writeln(color.toRGB());        // {red: 255, green: 92, blue: 92}
var cmyk = color.toCMYK();
```

---

### GradientColor

**文件**: `src/lib/base/GradientColor.ts`

表示渐变色对象（目前仅支持线性渐变）。

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `GradientColor` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `addColorStop(color, position?, point?)` | 添加颜色停止点 | `void` |
| `addOpacityStop(opacity?, location?, point?)` | 添加不透明度停止点 | `void` |
| `toDescriptor()` | 转为 ActionDescriptor | `ActionDescriptor` |
| `toString()` | 转为可读字符串 | `string` |

#### 示例

```javascript
var gradient = new $.GradientColor();
gradient.addColorStop($.SolidColor.blackColor(), 0, 50);
gradient.addColorStop($.SolidColor.whiteColor(), 100, 50);
```

---

## 2. 文档操作

### Application

**文件**: `src/lib/Application.ts`

表示 Photoshop 应用程序本身，提供获取应用信息的 API。

#### 枚举 HostVersion

| 值 | 说明 |
|----|------|
| `Unknown` | 未知版本 |
| `CC2015` (16) | Photoshop CC 2015 |
| `CC2016` (17) | Photoshop CC 2016 |
| `CC2017` (18) | Photoshop CC 2017 |
| `CC2018` (19) | Photoshop CC 2018 |
| `CC2019` (20) | Photoshop CC 2019 |
| `CC2020` (21) | Photoshop CC 2020 |
| `CC2021` (22) | Photoshop CC 2021 |
| `CC2022` (23) | Photoshop CC 2022 |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `version()` | 获取当前 Photoshop 版本号 | `string` |
| `getApplicationPath()` | 获取 Photoshop 安装路径 | `string` |
| `getHostVersion()` | 获取宿主版本枚举值（CC2015-CC2022） | `HostVersion` |
| `open(path)` | 打开指定路径的文件 | `void` |
| `saveUnits()` | 保存当前度量单位到内部状态 | `void` |
| `restoreUnits()` | 从内部状态恢复度量单位 | `void` |
| `setUnits(rulerUnits, typeUnits)` | 同时设置标尺和文字单位 | `void` |
| `getRulerUnits()` | 获取当前标尺单位 | `Units` |
| `setRulerUnits(rulerUnits)` | 设置标尺单位 | `void` |
| `getTypeUnits()` | 获取当前文字单位 | `TypeUnits` |
| `setTypeUnits(typeUnits)` | 设置文字单位 | `void` |

#### 示例

```javascript
var theApp = new $.Application();
theApp.open("/path/to/file.psd");
$.writeln(theApp.version());
$.writeln(theApp.getApplicationPath());
var version = theApp.getHostVersion();
```

---

### Document

**文件**: `src/lib/Document.ts`

表示 Photoshop 中打开的文档。

#### 枚举 DocumentFormat

| 值 | 说明 |
|----|------|
| `JPG` | JPEG 格式 |
| `PNG` | PNG 格式 |
| `PSD` | Photoshop 格式 |
| `BMP` | BMP 格式 |

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 文档 ID |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `activeDocument()` | 获取当前活动文档，无文档时返回 `null` | `Document \| null` |
| `select(docId)` | 通过文档 ID 切换活动文档 | `Document` |
| `fromSelectedLayers()` | 从当前选中的图层创建新文档 | `Document` |
| `create(name, width, height, density?, artboard?, background?)` | 创建新文档，参数：名称、宽高、分辨率(默认72)、是否画板、是否背景层 | `Document` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `name()` | 获取文档名称 | `string` |
| `path()` | 获取文档文件路径，未保存返回 `null` | `File \| null` |
| `size()` | 获取文档尺寸（像素） | `Size` |
| `format()` | 获取文档格式 | `string` |
| `resolution()` | 获取文档分辨率 | `number` |
| `length()` | 获取文件大小（字节） | `number` |
| `saved()` | 检查文档是否已保存 | `boolean` |
| `duplicate()` | 复制当前文档 | `Document` |
| `resizeImage(size)` | 调整图像大小 | `Document` |
| `resizeCanvas(size)` | 调整画布大小 | `Document` |
| `trim()` | 裁剪文档透明区域 | `Document` |
| `crop(rect)` | 按指定矩形裁剪 | `Document` |
| `active()` | 将此文档设为活动文档 | `Document` |
| `close(save)` | 关闭文档，参数控制是否保存 | `Document` |
| `forceSave()` | 强制保存当前文档 | `Document` |
| `saveAs(filePath, format, saveAsCopy?)` | 另存为指定格式文件 | `void` |
| `selection(unit?)` | 获取当前选区矩形，无选区返回 `null` | `Rect \| null` |
| `setSelection(rect)` | 创建矩形选区 | `void` |
| `colorSamplerList()` | 获取颜色采样器列表 | `ColorSampler[]` |
| `convertColorMode(mode)` | 转换文档颜色模式 | `Document` |
| `jsonString()` | 获取文档 JSON 格式信息 | `string` |
| `toDescriptor()` | 获取文档 ActionDescriptor | `ActionDescriptor` |
| `exportToWeb(path, filename, options)` | 导出为 Web 格式（PNG/JPG/GIF） | `Document` |
| `exportToPdf(path, filename)` | 导出为 PDF | `Document` |
| `exportToBMP(path, filename)` | 导出为 BMP 格式 | `Document` |

#### 示例

```javascript
var doc = $.Document.activeDocument();
if (doc == null) {
    alert("没有打开的文档");
    return;
}
alert(doc.name());
$.writeln(doc.size().toString());  // 1920,1080
$.writeln(doc.length());
doc.trim();
doc.resizeImage(new $.Size(1024, 768));
```

---

## 3. 图层操作

### Layer

**文件**: `src/lib/Layer.ts`

表示 Photoshop 中的图层，提供丰富的图层操作 API。

#### 枚举 LayerMoveDirection

| 值 | 说明 |
|----|------|
| `UP` | 向上移动一层 |
| `DOWN` | 向下移动一层 |
| `FRONT` | 移至顶层 |
| `BACK` | 移至底层 |

#### 构造函数

```typescript
constructor(id: number)
```

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getSelectedLayers()` | 获取当前选中的所有图层 | `Layer[]` |
| `getSelectedLayerIds()` | 获取当前选中图层的 ID 列表 | `number[]` |
| `getSelectedLayer()` | 快速获取第一个选中图层，无选中返回 `null` | `Layer \| null` |
| `setSelectedLayers(layers)` | 设置选中的图层 | `void` |
| `selectLayersById(idList)` | 通过 ID 列表选中图层 | `void` |
| `toggleLayersById(idList, show)` | 按 ID 列表显示/隐藏图层 | `void` |
| `getLayerByName(name)` | 通过名称获取图层（仅返回第一个匹配） | `Layer \| null` |
| `getLayerByIndex(index)` | 通过索引获取图层 | `Layer` |
| `create()` | 创建空白新图层 | `Layer` |
| `createGroup()` | 创建空图层组 | `void` |
| `groupSelected()` | 将选中图层编组 | `void` |
| `groupSelectedLayers()` | 将选中图层编组并返回新组图层 | `Layer` |
| `linkLayers(layers)` | 链接指定图层 | `void` |
| `loopLayers(callback, direction?)` | 快速遍历所有图层，direction: 0=从下到上, 1=从上到下 | `void` |
| `hasArtboard()` | 检查文档是否包含画板 | `boolean` |
| `getArtboardList()` | 获取所有画板图层 | `Layer[]` |
| `hasBackgroundLayer()` | 检查是否有背景图层 | `boolean` |
| `hideLayersByIDs(idList)` | 按 ID 列表隐藏图层 | `void` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `name()` | 获取图层名称 | `string` |
| `index()` | 获取图层索引 | `number` |
| `id` | 图层 ID 属性 | `number` |
| `kind()` | 获取图层类型 | `number` |
| `visible()` | 检查图层是否可见 | `boolean` |
| `show()` | 显示图层 | `Layer` |
| `hide()` | 隐藏图层 | `Layer` |
| `select()` | 选中此图层 | `Layer` |
| `bounds()` | 获取图层边界矩形 | `Rect` |
| `boundsNoEffects()` | 获取不含效果的图层边界 | `Rect` |
| `boundsActive()` | 获取当前活动图层边界（适用于图层组） | `Rect` |
| `size()` | 获取图层尺寸 | `Size` |
| `opacity()` | 获取图层不透明度 | `number` |
| `setFillOpacity(opacity)` | 设置图层填充不透明度 | `Layer` |
| `radius()` | 获取圆角半径数组 `[topLeft, topRight, bottomRight, bottomLeft]` | `number[]` |
| `isTextLayer()` | 是否为文字图层 | `boolean` |
| `isShapeLayer()` | 是否为形状图层 | `boolean` |
| `isGroupLayer()` | 是否为图层组 | `boolean` |
| `isArtboardLayer()` | 是否为画板图层 | `boolean` |
| `isLocked()` | 是否已锁定 | `boolean` |
| `lock()` | 锁定图层 | `Layer` |
| `unlock()` | 解锁图层 | `Layer` |
| `parentLayer()` | 获取父图层（需 CC2018+） | `Layer \| null` |
| `maskEnabled()` | 蒙版是否启用 | `boolean` |
| `maskLinked()` | 蒙版是否链接 | `boolean` |
| `hasLayerEffects()` | 是否有图层效果 | `boolean` |
| `layerFXVisible()` | 图层效果是否可见 | `boolean` |
| `setName(name)` | 设置图层名称 | `Layer` |
| `setLayerColor(color)` | 设置图层标签颜色 | `Layer` |
| `move(direction)` | 移动图层 | `void` |
| `moveBelowTo(target)` | 移动到目标图层下方 | `void` |
| `moveInsideTo(target)` | 移入目标图层组 | `void` |
| `rotate(angle, state?, centerPoint?)` | 旋转图层 | `Layer` |
| `toSelection()` | 将图层转为选区 | `Layer` |
| `rasterize()` | 栅格化图层 | `Layer` |
| `rasterizeStyle()` | 栅格化图层样式 | `Layer` |
| `mergeGroup()` | 合并图层组 | `Layer` |
| `remove()` | 删除此图层 | `Layer` |
| `duplicate()` | 复制图层 | `void` |
| `duplicateToDocument(name)` | 复制图层到指定文档 | `void` |
| `ungroup()` | 取消图层组 | `Layer` |
| `getSubLayerIds()` | 获取子图层 ID 列表 | `number[]` |
| `text()` | 获取文字信息（文字图层有效） | `Text \| null` |
| `toDescriptor()` | 获取图层 ActionDescriptor | `ActionDescriptor` |
| `getFillColor()` | 获取形状图层填充色 | `SolidColor \| null` |
| `getGradientColor()` | 获取形状图层渐变色 | `GradientColor \| null` |
| `getFxColorOverlay()` | 获取颜色叠加效果 | `FXColorOverlay \| null` |
| `getFXStroke()` | 获取描边效果 | `FXStroke \| null` |
| `getFXStrokes()` | 获取所有描边效果（多重描边） | `FXStroke[]` |
| `getFXDropShadow()` | 获取投影效果 | `FXDropShadow \| null` |
| `getFXGradientFill()` | 获取渐变叠加效果 | `FXGradientFill \| null` |
| `getFXEffect(name)` | 通过名称获取指定效果描述符 | `ActionDescriptor \| null` |
| `getFXEffectMulti(name)` | 获取多重效果描述符列表 | `ActionList \| null` |
| `toString()` | 转为可读字符串 | `string` |

#### 示例

```javascript
// 获取选中图层
var layers = $.Layer.getSelectedLayers();
for (var i = 0; i < layers.length; i++) {
    $.writeln(layers[i].name());
}

// 通过索引获取
var layer = $.Layer.getLayerByIndex(10);
layer.setName("新名称").hide();

// 链式调用
layer.select().toSelection().hide();

// 遍历所有图层
$.Layer.loopLayers(function(layer) {
    $.writeln(layer.name());
});
```

---

### Artboard

**文件**: `src/lib/Artboard.ts`

画板图层，继承自 `Layer`。

#### 重写方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `bounds()` | 获取画板边界矩形 | `Rect` |
| `isShapeLayer()` | 固定返回 `false` | `boolean` |
| `isTextLayer()` | 固定返回 `false` | `boolean` |
| `isGroupLayer()` | 固定返回 `false` | `boolean` |

继承 `Layer` 的所有其他方法。

---

## 4. 形状与绘制

### Shape / 点类与形状类

**文件**: `src/lib/Shape.ts`

#### 枚举 UnitType

| 值 | 说明 |
|----|------|
| `Pixel` | 像素 |
| `Percent` | 百分比 |
| `Point` | 点 |
| `Distance` | 距离 |

#### Shape 基类

| 属性/方法 | 说明 |
|-----------|------|
| `descriptorType: number` | ActionDescriptor 类型标识 |
| `draw(fillColor, stroke?, opacity?, toLayer?)` | 绘制形状到画布，返回新图层 `Layer` |
| `toDescriptor()` | 转为 ActionDescriptor |

#### Point 类

表示一个坐标点，继承自 `Shape`。

```typescript
constructor(x: number, y: number)
```

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `static fromDescriptor(desc)` | 从描述符创建 | `Point` |
| `toDescriptor(unitType?)` | 转为描述符 | `ActionDescriptor` |
| `toString()` | 转为字符串 | `string` |

#### Line 类

表示线段，继承自 `Shape`。

```typescript
constructor(start: Point, end: Point, width: number = 2)
```

| 方法 | 说明 |
|------|------|
| `enableArrow(start, end, width?, length?, concavity?)` | 启用箭头 |

#### Rectangle 类

表示矩形，继承自 `Shape`。

```typescript
constructor(rect: Rect, radius: number = 0)
```

#### Ellipse 类

表示椭圆，继承自 `Shape`。

```typescript
constructor(rect: Rect)
```

#### Circle 类

表示圆形，继承自 `Shape`。

```typescript
constructor(center: Point, radius: number)
```

#### Triangle 类

表示三角形，继承自 `Shape`。

```typescript
constructor(bounds: Rect, radius: number = 0)
```

#### 示例

```javascript
var circle = new $.Circle(new $.Point(100, 100), 50);
var rect = new $.Rectangle(new $.Rect(100, 100, 200, 150), 10);
var line = new $.Line(new $.Point(0, 0), new $.Point(200, 200), 3);
var tri = new $.Triangle(new $.Rect(50, 50, 100, 100));

// 直接绘制
circle.draw($.SolidColor.blackColor());
rect.draw($.SolidColor.redColor(), new $.Stroke(2));
```

---

### Canvas

**文件**: `src/lib/Canvas.ts`

画布类，用于批量绘制多个形状到同一图层。

#### 构造函数

```typescript
constructor()
```

#### 方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `setFillColor(color)` | 设置填充颜色（纯色或渐变） | `void` |
| `setStroke(stroke)` | 设置描边 | `void` |
| `setOpacity(opacity)` | 设置不透明度 (0-100) | `void` |
| `addShape(shape)` | 添加一个形状 | `void` |
| `addShapes(shapes)` | 批量添加形状 | `void` |
| `clear()` | 清空所有形状 | `void` |
| `paint()` | 执行绘制，将所有形状画到画布 | `void` |

#### 示例

```javascript
var canvas = new $.Canvas();
var circle = new $.Circle(new $.Point(100, 100), 50);
var rect = new $.Rectangle(new $.Rect(200, 100, 100, 100));
var line = new $.Line(new $.Point(100, 100), new $.Point(300, 200));

canvas.addShape(circle);
canvas.addShape(rect);
canvas.addShape(line);
canvas.setFillColor($.SolidColor.fromHexString("#ff5c5c"));
canvas.setOpacity(80);
canvas.paint();
```

---

## 5. 选区操作

### Selection

**文件**: `src/lib/Selection.ts`

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `bounds` | `Rect` | 选区边界 |

#### 构造函数

```typescript
constructor(rect: Rect)
```

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `get()` | 获取当前选区，无选区返回 `null` | `Selection \| null` |
| `load(selectionName, documentName?)` | 从已保存的通道加载选区 | `Selection` |
| `fromLayer()` | 从当前图层创建选区 | `Selection` |
| `deleteSavedSelection(name)` | 删除已保存的选区 | `void` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `create()` | 在 Photoshop 中创建选区 | `Selection` |
| `deselect()` | 取消选区 | `void` |
| `invert()` | 反选 | `void` |
| `toPath(tolerance?)` | 将选区转为路径，默认容差 2 | `void` |
| `save(name)` | 保存选区 | `void` |

#### 示例

```javascript
// 创建选区
var bounds = new $.Rect(100, 100, 200, 200);
var selection = new $.Selection(bounds);
selection.create();

// 获取当前选区
var sel = $.Selection.get();
if (sel) {
    $.writeln(sel.bounds.toString());
}
```

---

### Rect

**文件**: `src/lib/Rect.ts`

矩形类。

#### 枚举 ExpandBasePoint

| 值 | 说明 |
|----|------|
| `LeftTop` | 左上角 |
| `RightTop` | 右上角 |
| `RightBottom` | 右下角 |
| `LeftBottom` | 左下角 |
| `Center` | 中心 |

#### 构造函数

```typescript
constructor(x: number, y: number, width: number, height: number)
```

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `x` | `number` | X 坐标 |
| `y` | `number` | Y 坐标 |
| `width` | `number` | 宽度 |
| `height` | `number` | 高度 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromLTRBBounds(bounds)` | 从 left/top/right/bottom 对象创建 | `Rect` |
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `Rect` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `right()` | 返回 `x + width` | `number` |
| `bottom()` | 返回 `y + height` | `number` |
| `center()` | 返回中心点 | `Point` |
| `isEmpty()` | 是否为空矩形 | `boolean` |
| `size()` | 返回尺寸对象 | `Size` |
| `expand(size, point)` | 按指定基点扩展矩形 | `void` |
| `intersectsWith(rect)` | 是否与另一矩形相交 | `boolean` |
| `contains(rect)` | 是否包含另一矩形 | `boolean` |
| `toDescriptor(unitType?)` | 转为 ActionDescriptor | `ActionDescriptor` |
| `toJSON()` | 转为 JSON 对象 | `RectItem` |
| `toString()` | 转为字符串 | `string` |

---

### Size

**文件**: `src/lib/Size.ts`

尺寸类。

```typescript
constructor(width: number, height: number)
```

| 属性/方法 | 说明 |
|-----------|------|
| `width: number` | 宽度 |
| `height: number` | 高度 |
| `isEmpty()` | 是否为零尺寸 |
| `toString()` | 转为字符串 `"width,height"` |

---

## 6. 文本操作

### Text

**文件**: `src/lib/Text.ts`

#### 枚举 TextAntiAliasType

| 值 | 说明 |
|----|------|
| `None` | 无 |
| `Sharp` | 锐利 |
| `Crisp` | 犀利 |
| `Strong` | 浑厚 |
| `Smooth` | 平滑 |
| `LCD` | Windows LCD |
| `Gray` | Windows 灰度 |

#### 枚举 TextAlignment

| 值 | 说明 |
|----|------|
| `Left` | 左对齐 |
| `Center` | 居中对齐 |
| `Right` | 右对齐 |

#### 枚举 TextOrientation

| 值 | 说明 |
|----|------|
| `Horizontal` | 水平方向 |
| `Vertical` | 垂直方向 |

#### 构造函数

```typescript
constructor(content: string, desc?: ActionDescriptor)
```

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `Text` |

#### 只读属性/获取方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `content` | 文字内容 | `string` |
| `textClickPoint()` | 获取文字点击位置 | `Point` |
| `orientation()` | 获取文字方向 | `TextOrientation` |
| `bounds()` | 获取文字边界 | `Rect` |
| `boundingBox()` | 获取文字外框 | `Rect` |
| `fontPostScriptName()` | 获取 PostScript 字体名 | `string` |
| `fontName()` | 获取字体名 | `string` |
| `fontStyleName()` | 获取字体样式名 | `string` |
| `size()` | 获取字号大小 | `number` |
| `horizontalScale()` | 获取水平缩放 | `number` |
| `verticalScale()` | 获取垂直缩放 | `number` |
| `bold()` | 是否为粗体 | `boolean` |
| `italic()` | 是否为斜体 | `boolean` |
| `lineHeight()` | 获取行高，-1 为自动行高 | `number` |
| `strikethrough()` | 获取删除线类型 | `TextStrikeThroughType` |
| `underline()` | 获取下划线状态 | `string` |
| `color()` | 获取文字颜色 | `SolidColor` |
| `colorList()` | 获取所有样式范围的颜色列表 | `SolidColor[]` |
| `paragraphCount()` | 获取段落数量 | `number` |

#### 设置方法（链式调用）

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `setTextClickPoint(point)` | 设置文字位置 | `Text` |
| `setAntiAlias(type)` | 设置抗锯齿类型 | `Text` |
| `setTextGridding(type)` | 设置文字网格 | `Text` |
| `setOrientation(type)` | 设置文字方向 | `Text` |
| `setBounds(bounds)` | 设置文字边界 | `Text` |
| `setBoundingBox(bounds)` | 设置文字外框 | `Text` |
| `setSize(size)` | 设置字号 | `Text` |
| `setFont(font)` | 设置字体，参数为 `FontFormat` 类型 | `Text` |
| `setScale(horizontal?, vertical?)` | 设置缩放百分比 | `Text` |
| `setBold(bold)` | 设置粗体 | `Text` |
| `setItalic(italic)` | 设置斜体 | `Text` |
| `setAutoLeading(auto)` | 设置自动行高 | `Text` |
| `setLineHeight(lineHeight)` | 设置行高 | `Text` |
| `setStrikeThrough(type)` | 设置删除线 | `Text` |
| `setUnderLine()` | 设置下划线 | `Text` |
| `setColor(color)` | 设置颜色 | `Text` |
| `setAlignment(alignment)` | 设置对齐方式 | `Text` |
| `paint()` | 在画布上创建文字图层 | `void` |

#### 示例

```javascript
var text = new $.Text("Hello World");
text.setTextClickPoint(new $.Point(100, 100));
text.setSize(30);
text.setColor($.SolidColor.fromHexString("#ff0000"));
text.setAlignment($.TextAlignment.Left);
text.paint();
```

---

## 7. 描边

### Stroke

**文件**: `src/lib/Stroke.ts`

#### 枚举 StrokeLineType

| 值 | 说明 |
|----|------|
| `Solid` (0) | 实线 |
| `Dash` (1) | 虚线 |
| `Dot` (2) | 点线 |

#### 枚举 StrokeStyleLineCapType

| 值 | 说明 |
|----|------|
| `ButtCap` | 平头 |
| `RoundCap` | 圆头 |
| `SquareCap` | 方头 |

#### 枚举 StrokeStyleLineJoinType

| 值 | 说明 |
|----|------|
| `MiterJoin` | 尖角 |
| `RoundJoin` | 圆角 |
| `BevelJoin` | 斜角 |

#### 枚举 StrokeStyleLineAlignment

| 值 | 说明 |
|----|------|
| `AlignInside` | 内描边 |
| `AlignCenter` | 居中描边 |
| `AlignOutside` | 外描边 |

#### 构造函数

```typescript
constructor(width: number, lineType: StrokeLineType = StrokeLineType.Solid, color: SolidColor = SolidColor.blackColor())
```

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `width` | `number` | 描边宽度 |
| `lineType` | `StrokeLineType` | 线条类型 |
| `color` | `SolidColor` | 描边颜色 |
| `opacity` | `number` | 不透明度 |
| `strokeEnabled` | `boolean` | 描边是否启用 |
| `fillEnabled` | `boolean` | 填充是否启用 |
| `lineCapType` | `StrokeStyleLineCapType` | 线端类型 |
| `lineJoinType` | `StrokeStyleLineJoinType` | 连接类型 |
| `lineAlignment` | `StrokeStyleLineAlignment` | 对齐方式 |
| `resolution` | `number` | 分辨率 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `Stroke` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `toDescriptor()` | 转为 ActionDescriptor | `ActionDescriptor` |
| `toString()` | 转为字符串 | `string` |

#### 示例

```javascript
var stroke = new $.Stroke(2, $.StrokeLineType.Solid, $.SolidColor.fromHexString("#000000"));
stroke.opacity = 80;
```

---

## 8. 历史记录

### History

**文件**: `src/lib/History.ts`

#### 方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `previous()` | 回退一步 | `History` |
| `last()` | 跳转到最后一步 | `History` |
| `go(index)` | 跳转到指定历史步骤（索引从 0 开始） | `History` |
| `goByName(name)` | 按名称跳转到历史步骤 | `History` |
| `saveState()` | 保存当前历史状态 | `History` |
| `restoreState()` | 恢复之前保存的状态 | `History` |
| `clearState()` | 清除保存的状态 | `History` |
| `current()` | 获取当前历史状态 | `HistoryState` |
| `setState(state)` | 设置当前历史状态 | `void` |
| `list()` | 列出所有历史状态 | `string` |
| `suspend(name, script)` | 挂起历史记录以执行脚本 | `History` |
| `undo()` | 撤销操作 | `History` |

#### 示例

```javascript
var history = new $.History();
history.previous();          // 回退一步
history.go(3);               // 跳到第3步
history.saveState();         // 保存当前状态
// ... 执行操作 ...
history.restoreState();      // 恢复状态
history.undo();              // 撤销
```

---

## 9. 参考线

### Guide

**文件**: `src/lib/Guide.ts`

#### 类型 GuideLine

```typescript
type GuideLine = {
    position: number;
    direction: GuideLineDirection;
}
```

#### 枚举 GuideLineDirection

| 值 | 说明 |
|----|------|
| `Horizontal` | 水平参考线 |
| `Vertical` | 垂直参考线 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `all()` | 获取所有参考线 | `GuideLine[]` |
| `count()` | 获取参考线数量 | `number` |
| `add(line)` | 添加参考线 | `void` |
| `toggleVisibility()` | 切换参考线显示/隐藏 | `void` |
| `clear()` | 删除所有参考线 | `void` |

#### 示例

```javascript
$.Guide.add({position: 100, direction: 'horizontal'});
$.Guide.add({position: 200, direction: 'vertical'});

var guides = $.Guide.all();
for (var i = 0; i < guides.length; i++) {
    $.writeln(guides[i].position + " - " + guides[i].direction);
}

$.Guide.clear();
```

---

## 10. 元数据

### MetaData

**文件**: `src/lib/MetaData.ts`

操作 Photoshop 文档的 XMP 元数据。

#### 构造函数

```typescript
constructor(namespace: string, prefix: string)
```

#### 方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `available()` | 检查 XMP 是否可用 | `boolean` |
| `set(key, value)` | 设置元数据键值对 | `void` |
| `get(key)` | 获取元数据值，不存在返回 `null` | `string \| null` |
| `remove(key)` | 删除指定键的元数据 | `void` |
| `clear()` | 清除所有元数据 | `void` |

#### 示例

```javascript
var meta = new $.MetaData("http://my.namespace.com/", "my:");
meta.set("author", "张三");
var author = meta.get("author");
$.writeln(author);  // 张三
```

---

## 11. 颜色采样器

### ColorSampler

**文件**: `src/lib/ColorSampler.ts`

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `position` | `Point` | 采样器位置 |
| `color` | `SolidColor` | 采样颜色 |

#### 构造函数

```typescript
constructor(position: Point, color?: SolidColor)
```

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `ColorSampler` |
| `clearAll()` | 清除所有颜色采样器 | `void` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `apply()` | 应用颜色采样器到画布 | `void` |

---

## 12. 图层效果 (FX)

### FXColorOverlay

**文件**: `src/lib/fx/FXColorOverlay.ts`

颜色叠加效果。

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `enabled` | `boolean` | 是否启用 |
| `present` | `boolean` | 是否存在 |
| `mode` | `string` | 混合模式 |
| `color` | `SolidColor` | 叠加颜色 |
| `opacity` | `number` | 不透明度 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `FXColorOverlay` |

---

### FXDropShadow

**文件**: `src/lib/fx/FXDropShadow.ts`

投影效果。

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `enabled` | `boolean` | 是否启用 |
| `present` | `boolean` | 是否存在 |
| `mode` | `string` | 混合模式 |
| `color` | `SolidColor` | 投影颜色 |
| `opacity` | `number` | 不透明度 |
| `useGlobalAngle` | `boolean` | 使用全局角度 |
| `localLightingAngle` | `number` | 本地光照角度 |
| `distance` | `number` | 投影距离 |
| `chokeMatte` | `number` | 扩展 |
| `blur` | `number` | 模糊半径 |
| `noise` | `number` | 杂色 |
| `antiAlias` | `boolean` | 抗锯齿 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `FXDropShadow` |

---

### FXStroke (图层效果)

**文件**: `src/lib/fx/FXStroke.ts`

图层描边效果。

#### 枚举 StrokeFrameStyle

| 值 | 说明 |
|----|------|
| `Outside` | 外描边 |
| `Inside` | 内描边 |
| `Center` | 居中描边 |

#### 枚举 StrokeFillType

| 值 | 说明 |
|----|------|
| `SolidColor` | 纯色 |
| `Gradient` | 渐变 |
| `Pattern` | 图案 |

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `enabled` | `boolean` | 是否启用 |
| `present` | `boolean` | 是否存在 |
| `position` | `StrokeFrameStyle` | 描边位置 |
| `fillType` | `StrokeFillType` | 填充类型 |
| `mode` | `string` | 混合模式 |
| `size` | `number` | 描边大小 |
| `opacity` | `number` | 不透明度 |
| `color` | `SolidColor` | 描边颜色 |
| `scale` | `number` | 缩放比例 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `FXStroke` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `apply()` | 将描边效果应用到当前图层 | `void` |

---

### FXGradientFill

**文件**: `src/lib/fx/FXGradientFill.ts`

渐变叠加效果。

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `enabled` | `boolean` | 是否启用 |
| `present` | `boolean` | 是否存在 |
| `opacity` | `number` | 不透明度 |
| `mode` | `string` | 混合模式 |
| `angle` | `number` | 渐变角度 |
| `type` | `string` | 渐变类型 |
| `reverse` | `boolean` | 是否反向 |
| `dither` | `boolean` | 是否仿色 |
| `align` | `boolean` | 是否对齐 |
| `scale` | `number` | 缩放比例 |
| `colors` | `ColorStop[]` | 颜色停止点数组 |
| `transparency` | `TransferSpec[]` | 不透明度停止点数组 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `fromDescriptor(desc)` | 从 ActionDescriptor 创建 | `FXGradientFill` |

---

## 13. 工具

### Tool

**文件**: `src/lib/tool/Tool.ts`

Photoshop 工具基类。

#### 构造函数

```typescript
constructor(name: string)
```

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getActive()` | 获取当前活动工具 | `Tool` |

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getName()` | 获取工具名称（stringID 格式） | `string` |
| `select()` | 选中此工具 | `void` |

---

### MoveTool

**文件**: `src/lib/tool/MoveTool.ts`

移动工具，继承自 `Tool`。

#### 枚举 LayerAlignType

| 值 | 说明 |
|----|------|
| `Left` | 左对齐 |
| `CenterH` | 水平居中 |
| `Right` | 右对齐 |
| `Top` | 顶部对齐 |
| `CenterV` | 垂直居中 |
| `Bottom` | 底部对齐 |

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `alignLayers(layers, align)` | 对齐指定图层 | `void` |

#### 示例

```javascript
var layers = $.Layer.getSelectedLayers();
$.MoveTool.alignLayers(layers, $.LayerAlignType.CenterH);
```

---

### RulerTool

**文件**: `src/lib/tool/RulerTool.ts`

标尺工具，继承自 `Tool`。

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `get()` | 获取当前标尺信息（起点和终点） | `Point[]` |

---

## 14. 描述符工具

### DescriptorInfo

**文件**: `src/lib/DescriptorInfo.ts`

递归获取 ActionDescriptor 所有属性的调试工具。

> 原作者: Javier Aroche ([descriptor-info](https://github.com/JavierAroche/descriptor-info))

#### 构造函数

```typescript
constructor()
```

#### 方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getProperties(theDesc, params?)` | 递归获取描述符所有属性 | `any` |

**params 参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `reference` | `boolean` | `false` | 是否返回引用描述符 |
| `extended` | `boolean` | `false` | 是否返回扩展信息 |
| `maxRawLimit` | `number` | `10000` | RAW 类型最大字符数 |
| `maxXMPLimit` | `number` | `10000` | XMP 最大字符数 |

---

## 15. 通用工具

### Utils

**文件**: `src/lib/Utils.ts`

通用文件与系统工具。

#### 静态方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `saveFile(text, file)` | 保存文本到本地文件 | `void` |
| `readFile(filepath)` | 从文件读取内容 | `string` |
| `fileExists(filepath)` | 检查文件是否存在 | `boolean` |
| `isMac()` | 当前系统是否为 macOS | `boolean` |
| `isWin()` | 当前系统是否为 Windows | `boolean` |

#### 示例

```javascript
$.Utils.saveFile("hello", "~/Desktop/test.txt");
var content = $.Utils.readFile("~/Desktop/test.txt");
if ($.Utils.isMac()) {
    $.writeln("Running on macOS");
}
```

---

## 16. 枚举类型汇总

| 枚举 | 所在文件 | 说明 |
|------|----------|------|
| `HostVersion` | Application.ts | Photoshop 版本 |
| `DocumentFormat` | Document.ts | 文档保存格式 |
| `LayerMoveDirection` | Layer.ts | 图层移动方向 |
| `UnitType` | Shape.ts | 单位类型 |
| `FillType` | Shape.ts | 填充类型 |
| `ColorSpace` | SolidColor.ts | 色彩空间 |
| `GradientType` | GradientColor.ts | 渐变类型 |
| `StrokeLineType` | Stroke.ts | 线条类型 |
| `StrokeStyleLineCapType` | Stroke.ts | 线端类型 |
| `StrokeStyleLineJoinType` | Stroke.ts | 连接类型 |
| `StrokeStyleLineAlignment` | Stroke.ts | 对齐方式 |
| `TextAntiAliasType` | Text.ts | 文字抗锯齿 |
| `TextGriddingType` | Text.ts | 文字网格 |
| `TextOrientation` | Text.ts | 文字方向 |
| `TextStrikeThroughType` | Text.ts | 删除线 |
| `TextAlignment` | Text.ts | 文字对齐 |
| `GuideLineDirection` | Guide.ts | 参考线方向 |
| `ExpandBasePoint` | Rect.ts | 扩展基点 |
| `PSLayerColor` | Includes.ts | 图层标签颜色 |
| `PSColorMode` | Includes.ts | 文档颜色模式 |
| `StrokeFrameStyle` | FXStroke.ts | 描边位置 |
| `StrokeFillType` | FXStroke.ts | 描边填充类型 |
| `LayerAlignType` | MoveTool.ts | 图层对齐方式 |

---

## 类型定义汇总

| 类型 | 所在文件 | 定义 |
|------|----------|------|
| `ColorRGB` | SolidColor.ts | `{red, green, blue}` |
| `ColorCMYK` | SolidColor.ts | `{cyan, magenta, yellowColor, black}` |
| `ColorHSB` | SolidColor.ts | `{hue, saturation, brightness}` |
| `ColorStop` | GradientColor.ts / FXGradientFill.ts | `{color, position, point}` |
| `OpacityStop` | GradientColor.ts | `{opacity, location, point}` |
| `GuideLine` | Guide.ts | `{position, direction}` |
| `RectItem` | Rect.ts | `{x, y, width, height}` |
| `FontFormat` | Includes.ts | `{name, style, scriptName}` |

---

*文档版本: 1.0.4 | 生成日期: 2026-06-22*
