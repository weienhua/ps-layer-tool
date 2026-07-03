/// <reference types="ps-extendscript-types"/>
// @ts-ignore
if (typeof Symbol === "undefined") var Symbol = { toStringTag: "Symbol.toStringTag" };
import "extendscript-es5-shim";

// ─── 模块导入（仅 $.HostScript 注册的函数）──────────────────
import { copyTextToClipboard } from "./modules/utils";

import {
  getDocumentInfo,
  getDocumentPath,
  getSelectedLayerName
} from "./modules/document";

import {
  getSelectedLayersInfo
} from "./modules/layerInfo";

import {
  collectLayersForExport,
  collectAllLayersForExport,
  collectGroupLayersForExport,
  exportSingleLayer
} from "./modules/export";

import {
  exportLayerInfoXML,
  generateXMLTemplate
} from "./modules/xml";

import {
  readFile,
  writeFile,
  listFiles,
  ensureDirectory,
  selectFolderDialog,
  getExtensionPath,
  saveHistoryState,
  restoreHistoryState
} from "./modules/fileOps";

// ─── 全局注册（PS 宿主调用入口）─────────────────────────────
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
  generateXMLTemplate: generateXMLTemplate,
  readFile: readFile,
  writeFile: writeFile,
  listFiles: listFiles,
  getExtensionPath: getExtensionPath
};

// log('HostScript initialized');
