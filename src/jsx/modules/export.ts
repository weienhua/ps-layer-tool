/**
 * 图层导出
 * @description 图层收集、导出为图片文件
 */

import { Document, Layer } from "../ps-api/src/index";
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
 * 导出单个图层
 * @param layerId 图层 ID
 * @param exportPath 导出路径
 * @param format 导出格式
 * @param groupPath 图层组路径
 * @param includeHidden 是否包含不可见图层
 * @param trimTransparent 是否裁剪透明像素
 * @returns JSON 字符串包含裁剪后的位置和尺寸
 */
export function exportSingleLayer(layerId: number, exportPath: string, format: string, groupPath: string, includeHidden: boolean, trimTransparent: boolean): string {
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
    if (trimTransparent) {
      newDoc.trim();
    }

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
    // @ts-ignore - ExtendScript Folder 构造函数
    var folder = new Folder(subDir);
    // @ts-ignore - ExtendScript Folder 属性和方法
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
