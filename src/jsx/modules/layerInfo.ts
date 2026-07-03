/**
 * 图层详细信息提取
 * @description 普通图层、智能对象图层的信息提取和组装
 */

import { Document } from "../ps-api/src/index";
import { log, rgbToHex, roundValue } from "./utils";
import { getSelectedLayerRefs, getLayerPath } from "./document";

/**
 * 获取普通图层的详细信息
 * @param layerDesc 图层描述符
 * @param s2t 字符串转类型 ID 函数
 * @returns 图层信息对象
 */
export function getNormalLayerInfo(layerDesc: any, s2t: (s: string) => number): any {
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
          var colorRed=color.hasKey(s2t("red"));
          var colorRedFloat=color.hasKey(s2t("redFloat"));
          if (colorRed && !colorRedFloat ) {
            r = roundValue(color.getDouble(s2t("red")));
            g = roundValue(color.getDouble(s2t("grain")));
            b = roundValue(color.getDouble(s2t("blue")));
            fontColor = rgbToHex(r, g, b);
          }
          // 回退到浮点格式 (redFloat, greenFloat, blueFloat)
          if (!colorRed && colorRedFloat ) {
            r = roundValue(color.getDouble(s2t("redFloat")) * 255);
            g = roundValue(color.getDouble(s2t("greenFloat")) * 255);
            b = roundValue(color.getDouble(s2t("blueFloat")) * 255);
            fontColor = rgbToHex(r, g, b);
          }
          // 无法识别的颜色格式，返回空
          if (!colorRed && !colorRedFloat ) {
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
export function getSmartObjectLayerInfo(layerDesc: any, s2t: (s: string) => number): any {
    if (!layerDesc.hasKey(s2t("smartObjectMore"))) {
    return getNormalLayerInfo(layerDesc, s2t);
  }
  var soMore = layerDesc.getObjectValue(s2t("smartObjectMore"));
  var hasSize = soMore.hasKey(s2t("size"));
  var hasTransform = soMore.hasKey(s2t("transform"));
  if (!hasSize || !hasTransform) {
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
 * 获取所有选中图层的详细信息
 * @returns JSON 字符串或状态码
 */
export function getSelectedLayersInfo(): string {
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
      var acname = layerName.replace(/(_\d+(\s*拷贝\s*\d*)?|\s*拷贝\s*\d*)$/, "");
      layers.push({
        id: layerId,
        name: layerName,
        acname: acname,
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
