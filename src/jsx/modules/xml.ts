/**
 * XML 模板生成
 * @description 图层信息 XML 导出和 XML 模板代码生成
 */

/// <reference types="ps-extendscript-types"/>

import { Utils } from "../ps-api/src/index";
import { log } from "./utils";

/**
 * 导出图层信息 XML
 * @param exportPath 导出路径
 * @param layersJson 图层数据 JSON 字符串
 * @returns 状态码
 */
export function exportLayerInfoXML(exportPath: string, layersJson: string): string {
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
 * @param outputSize 是否输出图片宽高属性 ("true"/"false")
 * @returns XML 字符串
 */
export function generateXMLTemplate(variableName: string, dataType: string, alignH: number, alignV: number, layersJson: string, outputSize?: string): string {
  try {
    var data = JSON.parse(layersJson);
    var layers = data.layers;
    if (!layers || layers.length === 0) return "__ERROR__:no layers";

    var count = layers.length;
    var vn = variableName;
    if (vn.charAt(0) !== "#") vn = "#" + vn;

    /** 清理数字图层名：去掉 _数字 后缀 */
    var cleanDigitName = function(name: string): string {
      return name.replace(/(_\d+(\s*拷贝\s*\d*)?|\s*拷贝\s*\d*)$/, "");
    };

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

    /** 是否输出图片宽高属性 */
    var shouldOutputSize = (outputSize === "true");

    /** 生成宽高属性字符串 */
    var sizeAttrs = function(layer: any): string {
      if (!shouldOutputSize) return "";
      var w = Math.round(layer.width || 0);
      var h = Math.round(layer.height || 0);
      if (w > 0 && h > 0) return ' w="' + w + '" h="' + h + '"';
      return "";
    };

    if (dataType === "temperature") {
      // 温度类型：至少需要 2 个图层（符号位 + 至少 1 个数字位）
      if (count < 2) return "__ERROR__:温度类型至少需要2个图层（符号位+数字位）";
      // 第1个图层为符号位，后续为数值位
      var signLayer = layers[0];
      var signSrc = (signLayer.path || "") + cleanDigitName(signLayer.name || "") + ".png";

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
        offsetLtH = Math.round(numLayers[1].x - numLayers[0].x);
        offsetLtV = Math.round(numLayers[1].y - numLayers[0].y);
      } else if (numCount >= 1) {
        offsetLtH = Math.round(numLayers[0].x - signLayer.x);
        offsetLtV = Math.round(numLayers[0].y - signLayer.y);
      }
      // offsetGe: x 用符号层到第一个数字层的间距，y 与 offsetLt 保持一致
      var offsetGeH = Math.round(numLayers[0].x - signLayer.x);
      var offsetGeV = offsetLtV;

      var absVn = "abs(" + vn + ")";

      // 辅助函数：根据 offset 符号生成正确的偏移项
      // offset > 0: "-offset*factor*cond"
      // offset <= 0: "+|offset|*factor*cond"
      var offsetTerm = function(offset: number, factor: string, cond: string): string {
        if (offset > 0) return "-" + offset + "*" + factor + "*" + cond;
        return "+" + Math.abs(offset) + "*" + factor + "*" + cond;
      };

      // 符号位：lt 条件对齐系数取反且偏移量符号与数值位相反，ge 条件使用固定负号
      var signAhInv = String(1 - ahNum);
      var signAvInv = String(1 - avNum);
      var signXExpr = String(signLayer.x) + offsetTerm(-offsetLtH, signAhInv, "lt(" + absVn + ",10)") + "-" + Math.abs(offsetGeH) + "*" + ah + "*ge(" + vn + ",0)";
      var signYExpr = String(signLayer.y) + offsetTerm(-offsetLtV, signAvInv, "lt(" + absVn + ",10)") + "-" + Math.abs(offsetGeV) + "*" + av + "*ge(" + vn + ",0)";
      xml += '<Image x="' + signXExpr + '" y="' + signYExpr + '"';
      xml += sizeAttrs(signLayer);
      xml += ' src="' + signSrc + '"';
      if (signLayer.rotation !== undefined && signLayer.rotation !== 0) {
        xml += ' rotation="' + signLayer.rotation + '"';
      }
      xml += ' visibility="lt(' + vn + ',0)"/>\n';

      // 数值位：所有层都有 lt(abs) 和 ge 偏移项
      for (var ni = 0; ni < numCount; ni++) {
        var nLayer = numLayers[ni];
        var nBaseX = nLayer.x;
        var nBaseY = nLayer.y;
        var nSrc = (nLayer.path || "") + cleanDigitName(nLayer.name || "") + ".png";

        var nxExpr = String(nBaseX) + offsetTerm(offsetLtH, ah, "lt(" + absVn + ",10)") + offsetTerm(offsetGeH, ah, "ge(" + vn + ",0)");
        var nyExpr = String(nBaseY) + offsetTerm(offsetLtV, av, "lt(" + absVn + ",10)") + offsetTerm(offsetGeV, av, "ge(" + vn + ",0)");

        xml += '<Image x="' + nxExpr + '" y="' + nyExpr + '"';
        xml += sizeAttrs(nLayer);
        xml += ' src="' + nSrc + '"';
        if (nLayer.rotation !== undefined && nLayer.rotation !== 0) {
          xml += ' rotation="' + nLayer.rotation + '"';
        }
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
          pctOffsetsH.push(Math.round(layers[oi + 1].x - layers[oi].x));
          pctOffsetsV.push(Math.round(layers[oi + 1].y - layers[oi].y));
        }
      }

      // 辅助函数：根据 offset 符号生成正确的偏移项
      var pctOffsetTerm = function(offset: number, factor: string, cond: string): string {
        if (offset > 0) return "-" + offset + "*" + factor + "*" + cond;
        return "+" + Math.abs(offset) + "*" + factor + "*" + cond;
      };

      for (var pi = 0; pi < count; pi++) {
        var pLayer = layers[pi];
        var pxExpr = String(pLayer.x);
        var pyExpr = String(pLayer.y);
        for (var pj = 0; pj < pctOffsetsH.length; pj++) {
          pxExpr = pxExpr + pctOffsetTerm(pctOffsetsH[pj], ah, "lt(" + vn + "," + pctOffset[pj] + ")");
          pyExpr = pyExpr + pctOffsetTerm(pctOffsetsV[pj], av, "lt(" + vn + "," + pctOffset[pj] + ")");
        }
        var pCleanName = cleanDigitName(pLayer.name || "");
        var pSrcPath = (pLayer.path || "") + pCleanName + ".png";
        xml += '<Image x="' + pxExpr + '" y="' + pyExpr + '"';
        xml += sizeAttrs(pLayer);
        xml += ' src="' + pSrcPath + '"';
        if (pLayer.rotation !== undefined && pLayer.rotation !== 0) {
          xml += ' rotation="' + pLayer.rotation + '"';
        }
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
          stepsOffsetsH.push(Math.round(layers[soi + 1].x - layers[soi].x));
          stepsOffsetsV.push(Math.round(layers[soi + 1].y - layers[soi].y));
        }
      }

      // 辅助函数：根据 offset 符号生成正确的偏移项
      var stepsOffsetTerm = function(offset: number, factor: string, cond: string): string {
        if (offset > 0) return "-" + offset + "*" + factor + "*" + cond;
        return "+" + Math.abs(offset) + "*" + factor + "*" + cond;
      };

      for (var sti = 0; sti < count; sti++) {
        var stLayer = layers[sti];
        var stxExpr = String(stLayer.x);
        var styExpr = String(stLayer.y);
        for (var stj = 0; stj < stepsOffsetsH.length; stj++) {
          stxExpr = stxExpr + stepsOffsetTerm(stepsOffsetsH[stj], ah, "lt(" + vn + "," + stepsOffset[stj] + ")");
          styExpr = styExpr + stepsOffsetTerm(stepsOffsetsV[stj], av, "lt(" + vn + "," + stepsOffset[stj] + ")");
        }
        var stSrcPath = (stLayer.path || "") + cleanDigitName(stLayer.name || "") + ".png";
        var stSrcid = vn + "/" + stepsSrcid[sti] + "%10";
        var stVis = stepsSrcid[sti];
        if (sti === count - 1) { stVis = 0; }
        xml += '<Image x="' + stxExpr + '" y="' + styExpr + '"';
        xml += sizeAttrs(stLayer);
        xml += ' src="' + stSrcPath + '"';
        if (stLayer.rotation !== undefined && stLayer.rotation !== 0) {
          xml += ' rotation="' + stLayer.rotation + '"';
        }
        xml += ' srcid="' + stSrcid + '" visibility="ge(' + vn + ',' + stVis + ')"/>\n';
      }
    }

    return xml;
  } catch (e) {
    log("generateXMLTemplate error", String(e));
    return "__ERROR__:" + e;
  }
}
