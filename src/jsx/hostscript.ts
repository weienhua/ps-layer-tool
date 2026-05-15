/// <reference types="ps-extendscript-types"/>
// @ts-ignore
if (typeof Symbol === "undefined") var Symbol = { toStringTag: "Symbol.toStringTag" };
import "extendscript-es5-shim";

// 导入库的 API
import { Document, Layer, History, Utils } from "./ps-api/src/index";

declare function executeActionGet(ref: any): any;
declare function executeAction(typeID: number, desc: any, mode: any): any;
declare function typeIDToStringID(typeID: number): string;
declare function stringIDToTypeID(name: string): number;
declare function charIDToTypeID(name: string): number;

// 调试开关
const DEBUG = true;

/**
 * 日志函数 - 输出到 ExtendScript 控制台
*/
function log(msg: string, data?: any): void {
  if (DEBUG) {
    var now = new Date();
    var timestamp = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    var dataStr = "";
    if (data) {
      dataStr = ": " + JSON.stringify(data);
    }
    var logMsg = "[" + timestamp + "] [HostScript] " + msg + dataStr;
    alert(logMsg);
    // $.writeln(logMsg);
  }
}

/**
 * 获取当前文档信息
 * @returns JSON 字符串或状态码
*/
function getDocumentInfo(): string {
  // log('getDocumentInfo called');
  try {
    var doc = Document.activeDocument();
    if (!doc) {
      // log('getDocumentInfo: no document open');
      return "__NO_DOCUMENT__";
    }
    
    var name = doc.name();
    var size = doc.size();
    
    return JSON.stringify({
      name: name,
      width: size.width,
      height: size.height
    });
  } catch (e) {
    log('getDocumentInfo error', String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 获取当前选中图层的名称
 * @returns JSON 字符串或状态码
*/
function getSelectedLayerName(): string {
  // log('getSelectedLayerName called');
  try {
    var selected = Layer.getSelectedLayer();
    if (selected) {
      return JSON.stringify({ name: selected.name() });
    }
    return JSON.stringify({ name: null });
  } catch (e) {
    log('getSelectedLayerName error', String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * RGB 转十六进制颜色
 * @param r 红色分量 (0-255)
 * @param g 绿色分量 (0-255)
 * @param b 蓝色分量 (0-255)
 * @returns 十六进制颜色字符串
 */
function rgbToHex(r: number, g: number, b: number): string {
  var n = (1 << 24) + (r << 16) + (g << 8) + b;
  return "#" + n.toString(16).slice(1);
}

/**
 * 四舍五入取整
 * @param num 数值
 * @returns 取整后的数值
 */
function roundValue(num: number): number {
  return Math.round(num);
}

/**
 * 获取选中图层的引用列表
 * @returns 图层引用数组
 */
function getSelectedLayerRefs(): any[] {
  var refs: any[] = [];
  var s2t = stringIDToTypeID;
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Prpr"), s2t("targetLayersIDs"));
  ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var docDesc = executeActionGet(ref);
  if (!docDesc.hasKey(s2t("targetLayersIDs"))) return refs;
  var list = docDesc.getList(s2t("targetLayersIDs"));
  for (var i = 0; i < list.count; i++) {
    refs.push(list.getReference(i));
  }
  return refs;
}

/**
 * 获取普通图层的详细信息
 * @param layerDesc 图层描述符
 * @param s2t 字符串转类型 ID 函数
 * @returns 图层信息对象
 */
function getNormalLayerInfo(layerDesc: any, s2t: (s: string) => number): any {
  var bounds = layerDesc.getObjectValue(s2t("bounds"));
  var left = bounds.getUnitDoubleValue(s2t("left"));
  var top = bounds.getUnitDoubleValue(s2t("top"));
  var width = bounds.getUnitDoubleValue(s2t("width"));
  var height = bounds.getUnitDoubleValue(s2t("height"));
  var hasText = layerDesc.hasKey(s2t("textKey"));
  var textInfo: any = undefined;
  if (hasText) {
    var textKey = layerDesc.getObjectValue(s2t("textKey"));
    var textContent = "";
    if (textKey.hasKey(s2t("textKey"))) {
      textContent = textKey.getString(s2t("textKey"));
    }
    var fontSize: number | null = null;
    var fontColor = "";
    if (textKey.hasKey(s2t("textStyleRange"))) {
      var textStyleRange = textKey.getList(s2t("textStyleRange"));
      if (textStyleRange.count > 0) {
        var textStyle = textStyleRange.getObjectValue(0).getObjectValue(s2t("textStyle"));
        if (textStyle.hasKey(s2t("size"))) {
          fontSize = roundValue(textStyle.getUnitDoubleValue(s2t("size")));
        }
        if (textStyle.hasKey(s2t("color"))) {
          var color = textStyle.getObjectValue(s2t("color"));
          var r: number, g: number, b: number;
          // 优先尝试整数格式 (red, grain, blue)
          if (color.hasKey(s2t("red"))) {
            r = roundValue(color.getDouble(s2t("red")));
            g = roundValue(color.getDouble(s2t("grain")));
            b = roundValue(color.getDouble(s2t("blue")));
            fontColor = rgbToHex(r, g, b);
          }
          // 回退到浮点格式 (redFloat, greenFloat, blueFloat)
          else if (color.hasKey(s2t("redFloat"))) {
            r = roundValue(color.getDouble(s2t("redFloat")) * 255);
            g = roundValue(color.getDouble(s2t("greenFloat")) * 255);
            b = roundValue(color.getDouble(s2t("blueFloat")) * 255);
            fontColor = rgbToHex(r, g, b);
          }
          // 无法识别的颜色格式，返回空
          else {
            fontColor = "";
          }
        }
      }
    }
    textInfo = {
      content: textContent,
      fontSize: fontSize,
      fontColor: fontColor
    };
  }
  return {
    x: roundValue(left),
    y: roundValue(top),
    width: roundValue(width),
    height: roundValue(height),
    centerX: roundValue(left + width * 0.5),
    centerY: roundValue(top + height * 0.5),
    rotation: 0,
    text: textInfo
  };
}

/**
 * 获取智能对象图层的详细信息
 * @param layerDesc 图层描述符
 * @param s2t 字符串转类型 ID 函数
 * @returns 图层信息对象
 */
function getSmartObjectLayerInfo(layerDesc: any, s2t: (s: string) => number): any {
    if (!layerDesc.hasKey(s2t("smartObjectMore"))) {
    return getNormalLayerInfo(layerDesc, s2t);
  }
  var soMore = layerDesc.getObjectValue(s2t("smartObjectMore"));
  if (!soMore.hasKey(s2t("size")) || !soMore.hasKey(s2t("transform"))) {
    return getNormalLayerInfo(layerDesc, s2t);
  }
  var size = soMore.getObjectValue(s2t("size"));
  var tf = soMore.getList(s2t("transform"));
  if (tf.count < 8) {
    return getNormalLayerInfo(layerDesc, s2t);
  }
  var x1 = tf.getDouble(0);
  var y1 = tf.getDouble(1);
  var x2 = tf.getDouble(2);
  var y2 = tf.getDouble(3);
  var x3 = tf.getDouble(4);
  var y3 = tf.getDouble(5);
  var x4 = tf.getDouble(6);
  var y4 = tf.getDouble(7);
  var renderW = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  var renderH = Math.sqrt(Math.pow(x4 - x1, 2) + Math.pow(y4 - y1, 2));
  var rotation = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return {
    x: roundValue(x1),
    y: roundValue(y1),
    width: roundValue(renderW),
    height: roundValue(renderH),
    centerX: roundValue((x1 + x2 + x3 + x4) * 0.25),
    centerY: roundValue((y1 + y2 + y3 + y4) * 0.25),
    rotation: roundValue(rotation),
    originalWidth: roundValue(size.getUnitDoubleValue(s2t("width"))),
    originalHeight: roundValue(size.getUnitDoubleValue(s2t("height")))
  };
}

/**
 * 根据图层 ID 选中图层
 * @param id 图层 ID
 */
function selectLayerByID(id: number): void {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(stringIDToTypeID("layer"), id);
  desc.putReference(charIDToTypeID("null"), ref);
  desc.putBoolean(stringIDToTypeID("makeVisible"), false);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
}

/**
 * 通过 ActionDescriptor 获取父图层 ID
 * @param layerId 图层 ID
 * @returns 父图层 ID，根图层返回 -1
 */
function getParentLayerId(layerId: number): number {
  var ref = new ActionReference();
  ref.putIdentifier(app.charIDToTypeID("Lyr "), layerId);
  var desc = app.executeActionGet(ref);
  if (desc.hasKey(app.stringIDToTypeID("parentLayerID"))) {
    return desc.getInteger(app.stringIDToTypeID("parentLayerID"));
  }
  return -1;
}

/**
 * 根据图层对象获取图层路径
 * @param layer 图层对象（ps-api Layer，仅需 id 属性）
 * @returns 图层路径字符串
 */
function getLayerPathByLayer(layer: any): string {
  var names: string[] = [];
  var curId: number = layer.id;
  var originalId: number = curId;
  var cur: any = new Layer(curId);
  cur.select();
  while (cur) {
    names.unshift(cur.name());
    var pid = getParentLayerId(curId);
    if (pid < 0) break;
    curId = pid;
    cur = new Layer(curId);
    cur.select();
  }
  new Layer(originalId).select();
  var groups = names.slice(0, -1);
  if (groups.length === 0) return "";
  return groups.join("/") + "/";
}

/**
 * 根据图层 ID 获取图层路径
 * @param layerId 图层 ID
 * @returns 图层路径字符串
 */
function getLayerPath(layerId: number): string {
  try {
    var doc = app.activeDocument;
    if (!doc) return "";
    selectLayerByID(layerId);
    var layer = doc.activeLayer;
    if (!layer) return "";
    return getLayerPathByLayer(layer);
  } catch (e) {
    return "";
  }
}

function getSelectedLayersInfo(): string {
  // log("getSelectedLayersInfo called");
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var s2t = stringIDToTypeID;
    var refs = getSelectedLayerRefs();
    var layers: any[] = [];
    var skipped: any[] = [];
    for (var i = 0; i < refs.length; i++) {
      var layerRef = refs[i];
      var layerDesc = executeActionGet(layerRef);
      var layerName = "";
      if (layerDesc.hasKey(s2t("name"))) {
        layerName = layerDesc.getString(s2t("name"));
      }
      var layerId = -1;
      if (layerDesc.hasKey(s2t("layerID"))) {
        layerId = layerDesc.getInteger(s2t("layerID"));
      }
      var layerSection = typeIDToStringID(layerDesc.getEnumerationValue(s2t("layerSection")));
      if (layerSection === "layerSectionStart") {
        skipped.push({ id: layerId, name: layerName, reason: "layerGroup" });
        continue;
      }
      var isText = layerDesc.hasKey(s2t("textKey"));
      var isSmartObject = layerDesc.hasKey(s2t("smartObject"));
      var baseInfo = getNormalLayerInfo(layerDesc, s2t);
      if (isSmartObject) {
        baseInfo = getSmartObjectLayerInfo(layerDesc, s2t);
      }
      var layerType = "normal";
      if (isSmartObject) {
        layerType = "smartObject";
      }
      if (isText) {
        layerType = "text";
      }
      var layerPath = getLayerPath(layerId);
      var textInfo = null;
      if (baseInfo.text) {
        textInfo = baseInfo.text;
      }
      layers.push({
        id: layerId,
        name: layerName,
        layerType: layerType,
        order: i,
        x: baseInfo.x,
        y: baseInfo.y,
        width: baseInfo.width,
        height: baseInfo.height,
        centerX: baseInfo.centerX,
        centerY: baseInfo.centerY,
        rotation: baseInfo.rotation,
        text: textInfo,
        path: layerPath
      });
    }
    var doc = Document.activeDocument();
    var docName = "";
    if (doc) {
      docName = doc.name();
    }
    return JSON.stringify({
      document: { name: docName },
      layers: layers,
      skipped: skipped
    });
  } catch (e) {
    log("getSelectedLayersInfo error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 状态码
 */
function copyTextToClipboard(text: string): string {
  // log("copyTextToClipboard called");
  try {
    var desc = new ActionDescriptor();
    desc.putString(stringIDToTypeID("textData"), text);
    executeAction(stringIDToTypeID("textToClipboard"), desc, DialogModes.NO);
    return "__OK__";
  } catch (e) {
    log("copyTextToClipboard error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 获取当前文档的文件路径
 * @returns JSON 字符串或状态码
 */
function getDocumentPath(): string {
  // log("getDocumentPath called");
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var doc = Document.activeDocument();
    if (!doc) return "__NO_DOCUMENT__";
    var path = doc.path();
    if (!path) return JSON.stringify({ path: "" });
    return JSON.stringify({ path: (path as any).path });
  } catch (e) {
    log("getDocumentPath error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 确保目录存在，不存在则创建
 * @param dirPath 目录路径
 * @returns 状态码
 */
function ensureDirectory(dirPath: string): string {
  // log("ensureDirectory called", dirPath);
  try {
    var folder = new Folder(dirPath);
    if (!folder.exists) {
      folder.create();
    }
    return "__OK__";
  } catch (e) {
    log("ensureDirectory error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 打开原生文件夹选择对话框
 * @returns JSON 字符串或取消状态
 */
function selectFolderDialog(): string {
  // log("selectFolderDialog called");
  try {
    var folder = Folder.selectDialog("选择导出文件夹");
    if (!folder) return "__CANCEL__";
    return JSON.stringify({ path: folder.fsName });
  } catch (e) {
    log("selectFolderDialog error", String(e));
    return "__CANCEL__";
  }
}

/**
 * 保存当前历史状态快照
 * @returns JSON 字符串包含快照索引
 */
function saveHistoryState(): string {
  // log("saveHistoryState called");
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var history = new History();
    history.saveState();
    var current = history.current();
    return JSON.stringify({ name: current.name, index: app.activeDocument.historyStates.length - 1 });
  } catch (e) {
    log("saveHistoryState error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 恢复到之前保存的历史状态
 * @returns 状态码
 */
function restoreHistoryState(): string {
  // log("restoreHistoryState called");
  try {
    var history = new History();
    history.restoreState();
    return "__OK__";
  } catch (e) {
    log("restoreHistoryState error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 获取图层文件扩展名
 * @param format 导出格式
 * @returns 文件扩展名
 */
/**
 * 获取导出文件扩展名
 * @param format PS 导出格式标识
 * @returns 文件扩展名
 */
function getLayerExtension(format: string): string {
  // log('getLayerExtension:format 值', String(format));
  var fmt = String(format);
  // log('getLayerExtension:fmt 值', String(fmt));
  var ext = ".png";
  if (fmt === "JPEG") {
    ext = ".jpg";
  } else if (fmt === "bMPFormat") {
    ext = ".bmp";
  }
  // log('getLayerExtension:ext', ext);
  var result = ext;
  return result;
}

/**
 * 收集选中图层的导出信息（不含组）
 * @param includeHidden 是否包含不可见图层
 * @returns JSON 字符串
 */
function collectLayersForExport(includeHidden: boolean): string {
  // log("collectLayersForExport called", { includeHidden: includeHidden });
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var selectedLayers = Layer.getSelectedLayers();
    var result: any[] = [];
    var selectedGroupPaths: string[] = [];
    for (var i = 0; i < selectedLayers.length; i++) {
      var layer = selectedLayers[i];
      if (!includeHidden && !layer.visible()) continue;
      if (layer.isGroupLayer()) {
        selectedGroupPaths.push(getLayerPathByLayer(layer) + layer.name() + "/");
      } else {
        result.push({
          id: layer.id,
          name: layer.name(),
          groupPath: getLayerPathByLayer(layer),
          isGroup: false
        });
      }
    }
    return JSON.stringify({ layers: result, selectedGroupPaths: selectedGroupPaths });
  } catch (e) {
    log("collectLayersForExport error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 收集文档全部图层的导出信息
 * @param includeHidden 是否包含不可见图层
 * @returns JSON 字符串
 */
function collectAllLayersForExport(includeHidden: boolean): string {
  // log("collectAllLayersForExport called", { includeHidden: includeHidden });
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var result: any[] = [];
    Layer.loopLayers(function(layer: any) {
      if (!includeHidden && !layer.visible()) return;
      if (layer.isGroupLayer()) return;
      result.push({
        id: layer.id,
        name: layer.name(),
        groupPath: getLayerPathByLayer(layer),
        isGroup: false
      });
    });
    return JSON.stringify({ layers: result });
  } catch (e) {
    log("collectAllLayersForExport error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 递归收集组内子图层
 * @param groupId 组图层 ID
 * @param includeHidden 是否包含不可见图层
 * @param result 收集结果数组（累加）
 * @param selectedGroupName 选中的顶层组名
 */
function collectGroupChildrenRecursive(groupId: number, includeHidden: boolean, result: any[], selectedGroupName: string): void {
  var group = new Layer(groupId);
  if (!group.isGroupLayer()) return;
  var subIds = group.getSubLayerIds();
  for (var i = 0; i < subIds.length; i++) {
    var child = new Layer(subIds[i]);
    if (!includeHidden && !child.visible()) continue;
    if (child.isGroupLayer()) {
      collectGroupChildrenRecursive(child.id, includeHidden, result, selectedGroupName);
    } else {
      result.push({
        id: child.id,
        name: child.name(),
        groupPath: getLayerPathByLayer(child),
        selectedGroup: selectedGroupName,
        isGroup: false
      });
    }
  }
}

/**
 * 收集选中图层组内的所有子图层
 * @param includeHidden 是否包含不可见图层
 * @returns JSON 字符串
 */
function collectGroupLayersForExport(includeHidden: boolean): string {
  // log("collectGroupLayersForExport called", { includeHidden: includeHidden });
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var selectedLayers = Layer.getSelectedLayers();
    var result: any[] = [];
    var selectedGroupPaths: string[] = [];
    for (var i = 0; i < selectedLayers.length; i++) {
      var layer = selectedLayers[i];
      if (layer.isGroupLayer()) {
        selectedGroupPaths.push(getLayerPathByLayer(layer) + layer.name() + "/");
        collectGroupChildrenRecursive(layer.id, includeHidden, result, layer.name());
      }
    }
    return JSON.stringify({ layers: result, selectedGroupPaths: selectedGroupPaths });
  } catch (e) {
    log("collectGroupLayersForExport error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 导出单个图层
 * @param layerId 图层 ID
 * @param exportPath 导出路径
 * @param format 导出格式
 * @param groupPath 图层组路径
 * @param includeHidden 是否包含不可见图层
 * @returns JSON 字符串包含裁剪后的位置和尺寸
 */
function exportSingleLayer(layerId: number, exportPath: string, format: string, groupPath: string, includeHidden: boolean): string {
  var originalDoc = Document.activeDocument();
  if (!originalDoc) return "__NO_DOCUMENT__";
  var newDoc: any = null;
  var wasHidden = false;

  try {
    // 选中目标图层
    selectLayerByID(layerId);
    var targetLayer = app.activeDocument.activeLayer;

    // 跳过图层组（无法直接导出）
    if (targetLayer.typename === "LayerSet") {
      return JSON.stringify({ skipped: true, reason: "group" });
    }

    // 检查可见性
    if (!targetLayer.visible) {
      if (!includeHidden) return JSON.stringify({ skipped: true });
      wasHidden = true;
      targetLayer.visible = true;
    }

    // 在切换文档前，记录原始位置和图层名（避免 stale reference）
    var originalBounds = app.activeDocument.activeLayer.bounds;
    var origX = Math.round(originalBounds[0].as("px"));
    var origY = Math.round(originalBounds[1].as("px"));
    var layerName = targetLayer.name;

    // 创建新文档（非破坏性）
    newDoc = Document.fromSelectedLayers();
    
    // 裁剪透明像素
    newDoc.trim();

    // JPG 格式：填充白色背景（使用 Action Manager 确保兼容性）
    if (format === "JPEG") {
      var flatDesc = new ActionDescriptor();
      executeAction(stringIDToTypeID("flattenImage"), flatDesc, DialogModes.NO);
      // log('exportSingleLayer called:填充白色成功');
    }
    
    // 获取裁剪后尺寸
    var w = Math.round(newDoc.size().width);
    var h = Math.round(newDoc.size().height);
    
    // trim 后内容从 (0,0) 开始，加上原文档中的原始偏移
    var x = origX;
    var y = origY;
    
    // 构建文件名和路径
    var ext = getLayerExtension(format);
    var cleanName = layerName.replace(/\.[^.]+$/, "");
    var subDir = exportPath + "/" + groupPath;
    var folder = new Folder(subDir);
    if (!folder.exists) folder.create();
    var fullPath = subDir + cleanName + ext;
    
    // 保存图片
    if (format === "bMPFormat") {
      // BMP 不支持 exportToWeb，使用 saveAs
      newDoc.saveAs(fullPath, format as any, true);
    } else {
      var options = new ExportOptionsSaveForWeb();
      if (format === "PNGFormat") {
        options.format = SaveDocumentType.PNG;
        options.PNG8 = false;
        options.quality = 100;
        options.transparency = true;
      } else {
        options.format = SaveDocumentType.JPEG;
        options.quality = 100;
        options.transparency = false;
      }
      // log('exportSingleLayer called:', String(cleanName + ext));
      // log('exportSingleLayer called:', String(options.format));
      newDoc.exportToWeb(subDir, cleanName + ext, options);
    }
    // log('exportSingleLayer called:保存成功');

    return JSON.stringify({
      name: cleanName + ext,
      x: x, y: y, w: w, h: h,
      filePath: groupPath + cleanName + ext
    });
  } catch (e) {
    log("exportSingleLayer error", String(e));
    return "__ERROR__:" + e;
  } finally {
    // 确保关闭新文档并切回原始文档
    try {
      if (newDoc) newDoc.close(false);
    } catch (closeErr) {
      log("exportSingleLayer close error", String(closeErr));
    }
    try {
      originalDoc.active();
    } catch (activeErr) {
      log("exportSingleLayer active error", String(activeErr));
    }
    // 恢复可见性
    if (wasHidden) {
      try {
        selectLayerByID(layerId);
        app.activeDocument.activeLayer.visible = false;
      } catch (visErr) {
        log("exportSingleLayer restore visibility error", String(visErr));
      }
    }
  }
}

/**
 * 导出图层信息 XML
 * @param exportPath 导出路径
 * @param layersJson 图层数据 JSON 字符串
 * @returns 状态码
 */
function exportLayerInfoXML(exportPath: string, layersJson: string): string {
  // log("exportLayerInfoXML called");
  try {
    var layers = JSON.parse(layersJson);
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Layers>\n';
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      xml += '  <Image x="' + l.x + '" y="' + l.y + '" w="' + l.w + '" h="' + l.h + '" name="' + l.filePath + '" />\n';
    }
    xml += '</Layers>';
    Utils.saveFile(xml, exportPath + "/manifest.xml");
    return "__OK__";
  } catch (e) {
    log("exportLayerInfoXML error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 生成 XML 模板代码
 * @param variableName 变量名（如 "#battery_level"）
 * @param dataType 数据类型："percentage" | "steps"
 * @param alignH 水平对齐系数：1（左）| 0.5（中）| 0（右）
 * @param alignV 垂直对齐系数：1（上）| 0.5（中）| 0（下）
 * @param layersJson 图层数据 JSON 字符串
 * @returns XML 字符串
 */
function generateXMLTemplate(variableName: string, dataType: string, alignH: number, alignV: number, layersJson: string): string {
  try {
    var data = JSON.parse(layersJson);
    var layers = data.layers;
    if (!layers || layers.length === 0) return "__ERROR__:no layers";

    var count = layers.length;
    var vn = variableName;
    if (vn.charAt(0) !== "#") vn = "#" + vn;

    var ahNum = Number(alignH);
    var avNum = Number(alignV);

    var hLabel = "右";
    if (ahNum === 1) { hLabel = "左"; }
    else if (ahNum === 0.5) { hLabel = "中"; }

    var vLabel = "下";
    if (avNum === 1) { vLabel = "上"; }
    else if (avNum === 0.5) { vLabel = "中"; }

    var xml = "<!-- 变量: " + vn + ", 对齐: 水平" + hLabel + " 垂直" + vLabel + " -->\n";

    var ah = String(ahNum);
    var av = String(avNum);

    if (dataType === "temperature") {
      // 温度类型：至少需要 2 个图层（符号位 + 至少 1 个数字位）
      if (count < 2) return "__ERROR__:温度类型至少需要2个图层（符号位+数字位）";
      // 第1个图层为符号位，后续为数值位
      var signLayer = layers[0];
      var signSrc = (signLayer.path || "") + (signLayer.name || "") + ".png";

      var numLayers: any[] = [];
      for (var si = 1; si < count; si++) {
        numLayers.push(layers[si]);
      }
      var numCount = numLayers.length;

      var tempThresholds: number[] = [];
      if (numCount >= 2) { tempThresholds = [10, 1]; }
      else { tempThresholds = [1]; }

      // offsetLt: 数字层之间的间距（用于 lt(abs) 条件）
      var offsetLtH = 10;
      var offsetLtV = 10;
      if (numCount >= 2) {
        offsetLtH = Math.round(Math.abs(numLayers[1].x - numLayers[0].x));
        offsetLtV = Math.round(Math.abs(numLayers[1].y - numLayers[0].y));
      } else if (numCount >= 1) {
        offsetLtH = Math.round(Math.abs(numLayers[0].x - signLayer.x));
        offsetLtV = Math.round(Math.abs(numLayers[0].y - signLayer.y));
      }
      // offsetGe: 符号层到第一个数字层的间距（用于 ge 条件）
      var offsetGeH = Math.round(Math.abs(numLayers[0].x - signLayer.x));
      var offsetGeV = Math.round(Math.abs(numLayers[0].y - signLayer.y));

      var absVn = "abs(" + vn + ")";

      // 符号位：lt 条件对齐系数取反，ge 条件正常
      var signAhInv = String(1 - ahNum);
      var signAvInv = String(1 - avNum);
      var signXExpr = signLayer.x + "+" + offsetLtH + "*" + signAhInv + "*lt(" + absVn + ",10)" + "-" + offsetGeH + "*" + ah + "*ge(" + vn + ",0)";
      var signYExpr = signLayer.y + "+" + offsetLtV + "*" + signAvInv + "*lt(" + absVn + ",10)" + "-" + offsetGeV + "*" + av + "*ge(" + vn + ",0)";
      xml += '<Image x="' + signXExpr + '" y="' + signYExpr + '" src="' + signSrc + '" visibility="lt(' + vn + ',0)"/>\n';

      // 数值位：所有层都有 lt(abs) 和 ge 偏移项
      for (var ni = 0; ni < numCount; ni++) {
        var nLayer = numLayers[ni];
        var nBaseX = nLayer.x;
        var nBaseY = nLayer.y;
        var nSrc = (nLayer.path || "") + (nLayer.name || "") + ".png";

        var nxExpr = String(nBaseX) + "-" + offsetLtH + "*" + ah + "*lt(" + absVn + ",10)" + "-" + offsetGeH + "*" + ah + "*ge(" + vn + ",0)";
        var nyExpr = String(nBaseY) + "-" + offsetLtV + "*" + av + "*lt(" + absVn + ",10)" + "-" + offsetGeV + "*" + av + "*ge(" + vn + ",0)";

        xml += '<Image x="' + nxExpr + '" y="' + nyExpr + '" src="' + nSrc + '"';
        if (ni < tempThresholds.length) {
          var nSrcid = absVn + "/" + tempThresholds[ni] + "%10";
          xml += ' srcid="' + nSrcid + '"';
          if (tempThresholds[ni] > 1) {
            xml += ' visibility="ge(' + absVn + ',' + tempThresholds[ni] + ')"';
          }
        }
        xml += '/>\n';
      }

      return xml;
    }

    if (dataType === "percentage") {
      // 百分比：srcid 固定 [100, 10, 1]，offset 固定 [100, 10]，最多 3 层有 srcid
      var pctSrcid = [100, 10, 1];
      var pctOffset = [100, 10];
      // 每个 offset 对应一对相邻图层的间距
      var pctOffsetsH: number[] = [];
      var pctOffsetsV: number[] = [];
      for (var oi = 0; oi < pctOffset.length; oi++) {
        if (oi + 1 < count) {
          pctOffsetsH.push(Math.round(Math.abs(layers[oi + 1].x - layers[oi].x)));
          pctOffsetsV.push(Math.round(Math.abs(layers[oi + 1].y - layers[oi].y)));
        }
      }

      for (var pi = 0; pi < count; pi++) {
        var pLayer = layers[pi];
        var pxExpr = String(pLayer.x);
        var pyExpr = String(pLayer.y);
        for (var pj = 0; pj < pctOffsetsH.length; pj++) {
          pxExpr = pxExpr + "-" + pctOffsetsH[pj] + "*" + ah + "*lt(" + vn + "," + pctOffset[pj] + ")";
          pyExpr = pyExpr + "-" + pctOffsetsV[pj] + "*" + av + "*lt(" + vn + "," + pctOffset[pj] + ")";
        }
        var pSrcPath = (pLayer.path || "") + (pLayer.name || "") + ".png";
        xml += '<Image x="' + pxExpr + '" y="' + pyExpr + '" src="' + pSrcPath + '"';
        if (pi < pctSrcid.length) {
          xml += ' srcid="' + vn + '/' + pctSrcid[pi] + '%10"';
          if (pi < pctSrcid.length - 1) {
            xml += ' visibility="ge(' + vn + ',' + pctSrcid[pi] + ')"';
          } else {
            xml += ' visibility="ge(' + vn + ',0)"';
          }
        }
        xml += '/>\n';
      }
    } else {
      // 步数：srcid 从 10^(count-1) 到 1，offset 从 10^(count-1) 到 10（不含 1）
      var stepsSrcid: number[] = [];
      var stepsOffset: number[] = [];
      for (var si = count - 1; si >= 0; si--) {
        var sVal = 1;
        for (var sp = 0; sp < si; sp++) { sVal = sVal * 10; }
        stepsSrcid.push(sVal);
      }
      for (var si2 = count - 1; si2 >= 1; si2--) {
        var sVal2 = 1;
        for (var sp2 = 0; sp2 < si2; sp2++) { sVal2 = sVal2 * 10; }
        stepsOffset.push(sVal2);
      }
      // 每个 offset 对应一对相邻图层的间距
      var stepsOffsetsH: number[] = [];
      var stepsOffsetsV: number[] = [];
      for (var soi = 0; soi < stepsOffset.length; soi++) {
        if (soi + 1 < count) {
          stepsOffsetsH.push(Math.round(Math.abs(layers[soi + 1].x - layers[soi].x)));
          stepsOffsetsV.push(Math.round(Math.abs(layers[soi + 1].y - layers[soi].y)));
        }
      }

      for (var sti = 0; sti < count; sti++) {
        var stLayer = layers[sti];
        var stxExpr = String(stLayer.x);
        var styExpr = String(stLayer.y);
        for (var stj = 0; stj < stepsOffsetsH.length; stj++) {
          stxExpr = stxExpr + "-" + stepsOffsetsH[stj] + "*" + ah + "*lt(" + vn + "," + stepsOffset[stj] + ")";
          styExpr = styExpr + "-" + stepsOffsetsV[stj] + "*" + av + "*lt(" + vn + "," + stepsOffset[stj] + ")";
        }
        var stSrcPath = (stLayer.path || "") + (stLayer.name || "") + ".png";
        var stSrcid = vn + "/" + stepsSrcid[sti] + "%10";
        var stVis = stepsSrcid[sti];
        if (sti === count - 1) { stVis = 0; }
        xml += '<Image x="' + stxExpr + '" y="' + styExpr + '" src="' + stSrcPath + '" srcid="' + stSrcid + '" visibility="ge(' + vn + ',' + stVis + ')"/>\n';
      }
    }

    return xml;
  } catch (e) {
    log("generateXMLTemplate error", String(e));
    return "__ERROR__:" + e;
  }
}

/**
 * 暴露到全局（ExtendScript 方式）
 */
// @ts-ignore
$ = $ || {};
// @ts-ignore
$.HostScript = {
  getDocumentInfo: getDocumentInfo,
  getSelectedLayerName: getSelectedLayerName,
  getSelectedLayersInfo: getSelectedLayersInfo,
  copyTextToClipboard: copyTextToClipboard,
  getDocumentPath: getDocumentPath,
  ensureDirectory: ensureDirectory,
  selectFolderDialog: selectFolderDialog,
  saveHistoryState: saveHistoryState,
  restoreHistoryState: restoreHistoryState,
  collectLayersForExport: collectLayersForExport,
  collectAllLayersForExport: collectAllLayersForExport,
  collectGroupLayersForExport: collectGroupLayersForExport,
  exportSingleLayer: exportSingleLayer,
  exportLayerInfoXML: exportLayerInfoXML,
  generateXMLTemplate: generateXMLTemplate
};

// log('HostScript initialized');
