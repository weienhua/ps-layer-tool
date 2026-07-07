/**
 * 图层导出
 * @description 图层收集、导出为图片文件
 */

import { Document, Layer, History } from "../ps-api/src/index";
import { log } from "./utils";
import { selectLayerByID, getLayerPathByLayer } from "./document";

/**
 * 获取导出文件扩展名
 * @param format PS 导出格式标识
 * @returns 文件扩展名
 */
export function getLayerExtension(format: string): string {
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
export function collectLayersForExport(includeHidden: boolean): string {
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
export function collectAllLayersForExport(includeHidden: boolean): string {
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
export function collectGroupChildrenRecursive(groupId: number, includeHidden: boolean, result: any[], selectedGroupName: string): void {
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
export function collectGroupLayersForExport(includeHidden: boolean): string {
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
 * 检测图层是否为智能对象
 * @param layerId 图层 ID
 * @returns 是否为智能对象
 */
function isSmartObjectLayer(layerId: number): boolean {
  var ref = new ActionReference();
  ref.putProperty(stringIDToTypeID("property"), stringIDToTypeID("layerKind"));
  ref.putEnumerated(stringIDToTypeID("layer"), stringIDToTypeID("ordinal"), stringIDToTypeID("targetEnum"));
  var desc = executeActionGet(ref);
  return desc.getInteger(stringIDToTypeID("layerKind")) === 5;
}

/**
 * 构建导出选项（PNG/JPG 通用，BMP 不适用）
 * @param format 导出格式
 * @returns ExportOptionsSaveForWeb 实例
 */
function buildExportOptions(format: string): ExportOptionsSaveForWeb {
  var options = new ExportOptionsSaveForWeb();
  if (format === "JPEG") {
    options.format = SaveDocumentType.JPEG;
    options.quality = 100;
    options.transparency = false;
  } else {
    options.format = SaveDocumentType.PNG;
    options.PNG8 = false;
    options.quality = 100;
    options.transparency = true;
  }
  return options;
}

/**
 * 导出单个图层
 * - 智能对象：打开源文档 → trimTransparent ? trim() : 按原始尺寸导出
 * - 普通图层：创建新文档 → 复制粘贴图层内容 → 始终裁剪到内容边界
 * @param layerId 图层 ID
 * @param exportPath 导出路径
 * @param format 导出格式
 * @param groupPath 图层组路径
 * @param includeHidden 是否包含不可见图层
 * @param trimTransparent 是否裁剪透明像素（仅对智能对象生效）
 * @returns JSON 字符串包含位置和尺寸
 */
export function exportSingleLayer(layerId: number, exportPath: string, format: string, groupPath: string, includeHidden: boolean, trimTransparent: boolean): string {
  var originalDoc = Document.activeDocument();
  if (!originalDoc) return "__NO_DOCUMENT__";
  // @ts-ignore - ExtendScript document id
  var originalDocId = app.activeDocument.id;
  var wasHidden = false;

  try {
    // 选中目标图层
    selectLayerByID(layerId);
    var targetLayer = app.activeDocument.activeLayer;

    // 跳过图层组
    if (targetLayer.typename === "LayerSet") {
      return JSON.stringify({ skipped: true, reason: "group" });
    }

    // 检查可见性
    if (!targetLayer.visible) {
      if (!includeHidden) return JSON.stringify({ skipped: true });
      wasHidden = true;
      targetLayer.visible = true;
    }

    // 记录图层信息
    var layerName = targetLayer.name;
    var ext = getLayerExtension(format);
    var cleanName = layerName.replace(/\.[^.]+$/, "");
    var subDir = exportPath + "/" + groupPath;
    // @ts-ignore - ExtendScript Folder
    var folder = new Folder(subDir);
    // @ts-ignore - ExtendScript Folder
    if (!folder.exists) folder.create();

    // 检测是否智能对象
    var smartObj = isSmartObjectLayer(layerId);
    var w: number;
    var h: number;
    var origX: number;
    var origY: number;

    if (smartObj) {
      // === 智能对象：尝试打开源文档导出 ===
      var bounds = targetLayer.bounds;
      origX = Math.round(bounds[0].as("px"));
      origY = Math.round(bounds[1].as("px"));

      var openedSource = false;
      var smartDoc: any = null;

      try {
        var convertDesc = new ActionDescriptor();
        executeAction(stringIDToTypeID("placedLayerEditContents"), convertDesc, DialogModes.NO);
        smartDoc = Document.activeDocument();
        openedSource = (smartDoc !== originalDoc);
      } catch (openErr) {
        // 打开源文档失败，回退到 fromSelectedLayers
        openedSource = false;
      }

      if (openedSource && smartDoc) {
        // 源文档打开成功
        var history = new History();

        if (trimTransparent) {
          // 保存历史状态 → 裁剪 → 导出 → 恢复历史状态
          history.saveState();
          smartDoc.trim();
        }

        w = Math.round(smartDoc.size().width);
        h = Math.round(smartDoc.size().height);

        if (format === "bMPFormat") {
          smartDoc.exportToBMP(subDir, cleanName + ext);
        } else {
          var options = buildExportOptions(format);
          smartDoc.exportToWeb(subDir, cleanName + ext, options);
        }

        if (trimTransparent) {
          history.restoreState();
        }

        // @ts-ignore - SaveOptions.DONOTSAVECHANGES
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        originalDoc.active();

      } else {
        // 源文档打开失败，按普通图层方式处理
        var bw = Math.round(bounds[2].as("px")) - origX;
        var bh = Math.round(bounds[3].as("px")) - origY;

        // 创建新文档（图层 bounds + 100px 边距）
        // @ts-ignore - ExtendScript
        app.documents.add(bw + 100, bh + 100, 72, cleanName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        var fallbackDocName = app.activeDocument.name;

        // 回到原文档，选中目标图层
        originalDoc.active();
        selectLayerByID(layerId);

        // 跨文档复制图层
        var fallbackLayer = new Layer(layerId);
        fallbackLayer.duplicateToDocument(fallbackDocName);

        // 切到新文档
        var switchDesc = new ActionDescriptor();
        var switchRef = new ActionReference();
        switchRef.putName(charIDToTypeID("Dcmn"), fallbackDocName);
        switchDesc.putReference(charIDToTypeID("null"), switchRef);
        executeAction(charIDToTypeID("slct"), switchDesc, DialogModes.NO);

        // 裁剪到内容边界
        // @ts-ignore - ExtendScript trim
        app.activeDocument.trim(TrimType.TRANSPARENT);

        var docSize = Document.activeDocument().size();
        w = Math.round(docSize.width);
        h = Math.round(docSize.height);

        // JPG 填充白色背景
        if (format === "JPEG") {
          var flatDesc = new ActionDescriptor();
          executeAction(stringIDToTypeID("flattenImage"), flatDesc, DialogModes.NO);
        }

        // 导出
        if (format === "bMPFormat") {
          Document.activeDocument().exportToBMP(subDir, cleanName + ext);
        } else {
          var options = buildExportOptions(format);
          Document.activeDocument().exportToWeb(subDir, cleanName + ext, options);
        }

        // @ts-ignore - SaveOptions.DONOTSAVECHANGES
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        originalDoc.active();
      }

    } else {
      // === 普通图层：duplicateToDocument 跨文档复制 ===
      var bounds = targetLayer.bounds;
      origX = Math.round(bounds[0].as("px"));
      origY = Math.round(bounds[1].as("px"));
      var bw = Math.round(bounds[2].as("px")) - origX;
      var bh = Math.round(bounds[3].as("px")) - origY;

      // 创建新文档（图层 bounds + 100px 边距）
      // @ts-ignore - ExtendScript
      app.documents.add(bw + 100, bh + 100, 72, cleanName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
      var newDocName = app.activeDocument.name;

      // 回到原文档，选中目标图层
      originalDoc.active();
      selectLayerByID(layerId);

      // 跨文档复制图层
      var layerObj = new Layer(layerId);
      layerObj.duplicateToDocument(newDocName);

      // 切到新文档
      var switchDesc = new ActionDescriptor();
      var switchRef = new ActionReference();
      switchRef.putName(charIDToTypeID("Dcmn"), newDocName);
      switchDesc.putReference(charIDToTypeID("null"), switchRef);
      executeAction(charIDToTypeID("slct"), switchDesc, DialogModes.NO);

      var newDoc = Document.activeDocument();

      // 裁剪到内容边界（自动去掉多余透明区域）
      // @ts-ignore - ExtendScript trim
      newDoc.trim(TrimType.TRANSPARENT);

      var docSize = newDoc.size();
      w = Math.round(docSize.width);
      h = Math.round(docSize.height);
      // JPG 填充白色背景
      if (format === "JPEG") {
        var flatDesc = new ActionDescriptor();
        executeAction(stringIDToTypeID("flattenImage"), flatDesc, DialogModes.NO);
      }

      // 导出
      if (format === "bMPFormat") {
        newDoc.exportToBMP(subDir, cleanName + ext);
      } else {
        var options = buildExportOptions(format);
        newDoc.exportToWeb(subDir, cleanName + ext, options);
      }

      // @ts-ignore - SaveOptions.DONOTSAVECHANGES
      app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
      originalDoc.active();
    }

    return JSON.stringify({
      name: cleanName + ext,
      x: origX, y: origY, w: w, h: h,
      filePath: groupPath + cleanName + ext
    });

  } catch (e) {
    log("exportSingleLayer error", String(e));
    return "__ERROR__:" + e;
  } finally {
    // 如果当前不在原文档，关闭活动文档后切回
    try {
      // @ts-ignore - ExtendScript document id
      if (app.documents.length > 0 && app.activeDocument.id !== originalDocId) {
        // @ts-ignore - SaveOptions.DONOTSAVECHANGES
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
      }
    } catch (closeErr) {
      log("exportSingleLayer cleanup close error", String(closeErr));
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
