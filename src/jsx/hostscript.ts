/// <reference types="ps-extendscript-types"/>
// @ts-ignore
if (typeof Symbol === "undefined") var Symbol = { toStringTag: "Symbol.toStringTag" };
import "extendscript-es5-shim";

// 导入库的 API
import { Document, Layer } from "./ps-api/src/index";

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

// 暴露到全局（ExtendScript 方式）
// @ts-ignore
$ = $ || {};
// @ts-ignore
$.HostScript = {
  getDocumentInfo: getDocumentInfo,
  getSelectedLayerName: getSelectedLayerName
};

log('HostScript initialized');
