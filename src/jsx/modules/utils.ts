/**
 * 通用工具函数
 * @description 不依赖 PS DOM 的基础工具，被其他所有模块引用
 */

/** 调试开关（开发模式 true，打包 false） */
const DEBUG = __DEV__;

/**
 * 日志函数 - 输出到 ExtendScript 控制台
 * @param msg 日志消息
 * @param data 附加数据
 */
export function log(msg: string, data?: any): void {
  if (DEBUG) {
    var now = new Date();
    var timestamp = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    var dataStr = "";
    if (data) {
      dataStr = ": " + JSON.stringify(data);
    }
    var logMsg = "[" + timestamp + "] [HostScript] " + msg + dataStr;
    $.writeln(logMsg);
  }
}

/**
 * RGB 转十六进制颜色
 * @param r 红色分量 (0-255)
 * @param g 绿色分量 (0-255)
 * @param b 蓝色分量 (0-255)
 * @returns 十六进制颜色字符串
 */
export function rgbToHex(r: number, g: number, b: number): string {
  var n = (1 << 24) + (r << 16) + (g << 8) + b;
  return "#" + n.toString(16).slice(1);
}

/**
 * 四舍五入取整
 * @param num 数值
 * @returns 取整后的数值
 */
export function roundValue(num: number): number {
  return Math.round(num);
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 状态码
 */
export function copyTextToClipboard(text: string): string {
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
