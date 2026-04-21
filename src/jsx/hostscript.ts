/// <reference types="ps-extendscript-types"/>
// @ts-ignore
if (typeof Symbol === "undefined") var Symbol = { toStringTag: "Symbol.toStringTag" };
import "extendscript-es5-shim";

// 导入库的 API
import { Document, Layer } from "./ps-api/src/index";

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
    var logMsg = "[" + timestamp + "] [HostScript] " + msg + (data ? ": " + JSON.stringify(data) : "");
    $.writeln(logMsg);
  }
}

/**
 * 获取当前文档信息
 * @returns JSON 字符串或状态码
*/
function getDocumentInfo(): string {
  log('getDocumentInfo called');
  try {
    var doc = Document.activeDocument();
    if (!doc) {
      log('getDocumentInfo: no document open');
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
  log('getSelectedLayerName called');
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

function rgbToHex(r: number, g: number, b: number): string {
  var n = (1 << 24) + (r << 16) + (g << 8) + b;
  return "#" + n.toString(16).slice(1);
}

function roundValue(num: number): number {
  return Math.round(num);
}

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
          var r = roundValue(color.getDouble(s2t("red")));
          var g = roundValue(color.getDouble(s2t("green")));
          var b = roundValue(color.getDouble(s2t("blue")));
          fontColor = rgbToHex(r, g, b);
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

function selectLayerByID(id: number): void {
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putIdentifier(stringIDToTypeID("layer"), id);
  desc.putReference(charIDToTypeID("null"), ref);
  desc.putBoolean(stringIDToTypeID("makeVisible"), false);
  executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
}

function getLayerPathByLayer(layer: any): string {
  var names: string[] = [];
  var cur: any = layer;
  while (cur && cur.typename !== "Document") {
    names.unshift(cur.name);
    cur = cur.parent;
  }
  return names.join("/");
}

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
  log("getSelectedLayersInfo called");
  try {
    if (app.documents.length === 0) return "__NO_DOCUMENT__";
    var s2t = stringIDToTypeID;
    var refs = getSelectedLayerRefs();
    var layers: any[] = [];
    var skipped: any[] = [];
    for (var i = 0; i < refs.length; i++) {
      var layerRef = refs[i];
      var layerDesc = executeActionGet(layerRef);
      var layerName = layerDesc.hasKey(s2t("name")) ? layerDesc.getString(s2t("name")) : "";
      var layerId = layerDesc.hasKey(s2t("layerID")) ? layerDesc.getInteger(s2t("layerID")) : -1;
      var layerSection = typeIDToStringID(layerDesc.getEnumerationValue(s2t("layerSection")));
      if (layerSection === "layerSectionStart") {
        skipped.push({ id: layerId, name: layerName, reason: "layerGroup" });
        continue;
      }
      var isText = layerDesc.hasKey(s2t("textKey"));
      var isSmartObject = layerDesc.hasKey(s2t("smartObject"));
      var baseInfo = isSmartObject ? getSmartObjectLayerInfo(layerDesc, s2t) : getNormalLayerInfo(layerDesc, s2t);
      var layerPath = getLayerPath(layerId);
      layers.push({
        id: layerId,
        name: layerName,
        layerType: isText ? "text" : (isSmartObject ? "smartObject" : "normal"),
        order: i,
        x: baseInfo.x,
        y: baseInfo.y,
        width: baseInfo.width,
        height: baseInfo.height,
        centerX: baseInfo.centerX,
        centerY: baseInfo.centerY,
        rotation: baseInfo.rotation,
        text: baseInfo.text ? baseInfo.text : null,
        path: layerPath
      });
    }
    var doc = Document.activeDocument();
    var docName = doc ? doc.name() : "";
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

function copyTextToClipboard(text: string): string {
  log("copyTextToClipboard called");
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

// 暴露到全局（ExtendScript 方式）
// @ts-ignore
$ = $ || {};
// @ts-ignore
$.HostScript = {
  getDocumentInfo: getDocumentInfo,
  getSelectedLayerName: getSelectedLayerName,
  getSelectedLayersInfo: getSelectedLayersInfo,
  copyTextToClipboard: copyTextToClipboard
};

log('HostScript initialized');
