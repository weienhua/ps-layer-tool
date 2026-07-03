/**
 * 文档/图层基础查询
 * @description 文档信息获取、图层选择、图层路径等基础操作
 */

import { Document, Layer } from "../ps-api/src/index";
import { log } from "./utils";

/**
 * 获取当前文档信息
 * @returns JSON 字符串或状态码
 */
export function getDocumentInfo(): string {
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
export function getSelectedLayerName(): string {
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
 * 获取选中图层的引用列表
 * @returns 图层引用数组
 */
export function getSelectedLayerRefs(): any[] {
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
 * 根据图层 ID 选中图层
 * @param id 图层 ID
 */
export function selectLayerByID(id: number): void {
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
export function getParentLayerId(layerId: number): number {
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
export function getLayerPathByLayer(layer: any): string {
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
export function getLayerPath(layerId: number): string {
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

/**
 * 获取当前文档的文件路径
 * @returns JSON 字符串或状态码
 */
export function getDocumentPath(): string {
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
