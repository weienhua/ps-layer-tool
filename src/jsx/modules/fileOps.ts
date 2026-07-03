/**
 * 文件系统操作
 * @description 文件读写、目录管理、历史状态等操作
 */

/// <reference types="ps-extendscript-types"/>

import { History } from "../ps-api/src/index";
import { log } from "./utils";

/**
 * 确保目录存在，不存在则创建
 * @param dirPath 目录路径
 * @returns 状态码
 */
export function ensureDirectory(dirPath: string): string {
  // log("ensureDirectory called", dirPath);
  try {
    // @ts-ignore - ExtendScript Folder 构造函数
    var folder = new Folder(dirPath);
    // @ts-ignore - ExtendScript Folder 属性
    if (!folder.exists) {
      // @ts-ignore - ExtendScript Folder 方法
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
export function selectFolderDialog(): string {
  // log("selectFolderDialog called");
  try {
    // @ts-ignore - ExtendScript Folder 静态方法
    var folder = Folder.selectDialog("选择导出文件夹");
    if (!folder) return "__CANCEL__";
    // @ts-ignore - ExtendScript Folder 属性
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
export function saveHistoryState(): string {
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
export function restoreHistoryState(): string {
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
 * 读取本地文件内容
 * @param filePath 文件路径
 * @returns 文件内容字符串，失败返回 __ERROR__:msg
 */
export function readFile(filePath: string): string {
  // @ts-ignore - ExtendScript File 构造函数
  var file = new File(filePath);
  // @ts-ignore - ExtendScript File 属性
  if (!file.exists) return "__ERROR__:file not found";
  // @ts-ignore - ExtendScript File 方法
  file.encoding = "UTF-8";
  var opened = file.open("r", "TEXT", "UTF-8");
  if (!opened) return "__ERROR__:cannot open file";
  try {
    // @ts-ignore - ExtendScript File 方法
    var content = file.read();
    // 去掉 BOM 头（如果存在）
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.substring(1);
    }
    return content;
  } catch (e) {
    return "__ERROR__:" + e;
  } finally {
    // @ts-ignore - ExtendScript File 方法
    file.close();
  }
}

/**
 * 写入本地文件
 * @param filePath 文件路径
 * @param content 文件内容
 * @returns 成功返回 __OK__，失败返回 __ERROR__:msg
 */
export function writeFile(filePath: string, content: string): string {
  // @ts-ignore - ExtendScript File 构造函数
  var file = new File(filePath);
  // @ts-ignore - ExtendScript File 方法
  file.encoding = "UTF-8";
  var opened = file.open("w", "TEXT", "UTF-8");
  if (!opened) return "__ERROR__:cannot open file for writing";
  try {
    // @ts-ignore - ExtendScript File 方法
    file.write(content);
    return "__OK__";
  } catch (e) {
    return "__ERROR__:" + e;
  } finally {
    // @ts-ignore - ExtendScript File 方法
    file.close();
  }
}

/**
 * 列出目录下的文件
 * @param dirPath 目录路径
 * @param filter 文件扩展名过滤（如 "*.json"），默认列出所有文件
 * @returns JSON 数组字符串，失败返回 __ERROR__:msg
 */
export function listFiles(dirPath: string, filter: string): string {
  try {
    // @ts-ignore - ExtendScript Folder 构造函数
    var dir = new Folder(dirPath);
    // @ts-ignore - ExtendScript Folder 属性
    if (!dir.exists) return "[]";
    // @ts-ignore - ExtendScript Folder 方法
    var files = dir.getFiles(filter || "*");
    var result: string[] = [];
    for (var i = 0; i < files.length; i++) {
      // @ts-ignore - ExtendScript File 类型检查
      if (files[i] instanceof File) {
        // @ts-ignore - ExtendScript File 属性
        result.push(files[i].name);
      }
    }
    return JSON.stringify(result);
  } catch (e) {
    return "__ERROR__:" + e;
  }
}

/**
 * 获取插件扩展目录路径
 * @returns 扩展目录路径
 */
export function getExtensionPath(): string {
  try {
    // @ts-ignore
    return $.fileName ? new File($.fileName).parent.parent.fsName : "";
  } catch (e) {
    return "";
  }
}
