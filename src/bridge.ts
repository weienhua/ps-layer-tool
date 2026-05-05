/**
 * PSBridge - PS 通信桥接层
 * 提供面板与 Photoshop 宿主脚本通信的 Promise 化封装
 */

// 调试开关 - 可以通过 window.DEBUG 全局控制
const DEBUG = (window as any).DEBUG || false;

/**
 * 通信日志回调类型
 */
export type LogCallback = (type: 'send' | 'receive' | 'error', data: any) => void;
let logCallback: LogCallback | null = null;

/**
 * 设置日志回调
 * @param callback 日志回调函数
 */
export function setLogCallback(callback: LogCallback | null) {
  logCallback = callback;
}

/**
 * PS 操作结果接口
 * @template T 数据类型
 */
export interface PSResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  noDocument?: boolean;
}

/**
 * 文档信息接口
 */
export interface DocumentInfo {
  name: string;
  width: number;
  height: number;
}

/**
 * 图层类型
 */
export type LayerType = "normal" | "smartObject" | "text";

/**
 * 文字图层信息接口
 */
export interface TextLayerInfo {
  content: string;
  fontSize: number | null;
  fontColor: string;
}

/**
 * 选中图层信息接口
 */
export interface SelectedLayerInfo {
  id: number;
  name: string;
  layerType: LayerType;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  rotation: number;
  text: TextLayerInfo | null;
  path: string;
}

/**
 * 选中图层信息响应接口
 */
export interface SelectedLayersInfoResponse {
  document: { name: string };
  layers: SelectedLayerInfo[];
  skipped: Array<{ id: number; name: string; reason: string }>;
}

/**
 * 文档路径响应接口
 */
export interface DocumentPathResponse {
  path: string;
}

/**
 * 待导出图层信息接口
 */
export interface LayerForExport {
  id: number;
  name: string;
  groupPath: string;
  isGroup: boolean;
}

/**
 * 收集图层结果接口
 */
export interface CollectLayersResult {
  layers: LayerForExport[];
}

/**
 * 单个图层导出结果接口
 */
export interface ExportSingleResult {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  filePath: string;
}

/**
 * 导出格式类型
 */
export type ExportFormat = "PNGFormat" | "JPEG" | "bMPFormat";

/**
 * 历史状态响应接口
 */
export interface HistoryStateResponse {
  name: string;
  index: number;
}

/**
 * PSBridge - PS 通信类
 * 封装与 Photoshop 宿主脚本的通信逻辑
 */
export class PSBridge {
  private csInterface: CSInterface;

  /**
   * 构造函数
   */
  constructor() {
    this.csInterface = new (window as any).CSInterface();
  }

  /**
   * 执行 ExtendScript 代码
   * @param script 要执行的脚本
   * @returns Promise 包装的结果
   */
  private evalScript<T>(script: string): Promise<PSResult<T>> {
    const startTime = Date.now();
    console.log("evalScript start");
    if (DEBUG) {
      console.log('[Bridge] Sending:', script);
    }
    logCallback?.('send', { script, timestamp: startTime });

    return new Promise((resolve) => {
      let resolved = false;

      // 超时保护：10 秒内没有回调则返回超时错误
      const timeoutId = window.setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const error = 'Host script timeout (no response within 10s)';
          logCallback?.('error', { script, error, duration: 10000, timestamp: Date.now() });
          resolve({ success: false, error });
        }
      }, 10000);

      this.csInterface.evalScript(script, (result: any) => {
        console.log("result1:");
        console.log(result);
        if (resolved) return;
        resolved = true;
        window.clearTimeout(timeoutId);

        const duration = Date.now() - startTime;

        if (DEBUG) {
          console.log(`[Bridge] Received (${duration}ms):`, result);
        }

        // 防御 result 为 undefined/null 的情况
        const safeResult = result === undefined || result === null
          ? '__UNDEFINED__'
          : String(result);
        console.log("result2:");
        console.log(safeResult);
        logCallback?.('receive', { script, result: safeResult, duration, timestamp: Date.now() });
        resolve(this.parseResult<T>(safeResult));
      });
      console.log("evalScript end");
    });
  }

  /**
   * 转义单引号字符串
   * @param value 原始字符串
   * @returns 转义后的字符串
   */
  private escapeForSingleQuotedString(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }

  /**
   * 解析 ExtendScript 返回的结果
   */
  private parseResult<T>(result: string): PSResult<T> {
    // 检查错误前缀
    if (result.startsWith("__ERROR__:")) {
      return {
        success: false,
        error: result.substring(10)
      };
    }

    // 检查无文档状态
    if (result === "__NO_DOCUMENT__") {
      return {
        success: false,
        noDocument: true,
        error: "No document is currently open"
      };
    }

    // 检查成功前缀
    if (result === "__OK__") {
      return { success: true };
    }

    // 尝试解析 JSON
    try {
      const data = JSON.parse(result) as T;
      return { success: true, data };
    } catch {
      // 非 JSON 结果，作为字符串返回
      return { success: true, data: result as unknown as T };
    }
  }

  /**
   * 获取当前文档信息
   */
  /**
   * 获取当前文档信息
   * @returns Promise 封装的结果
   */
  async getDocumentInfo(): Promise<PSResult<DocumentInfo>> {
    return this.evalScript<DocumentInfo>("$.HostScript.getDocumentInfo()");
  }

  /**
   * 获取当前选中图层的名称
   */
  /**
   * 获取当前选中图层的名称
   * @returns Promise 封装的结果
   */
  async getSelectedLayerName(): Promise<PSResult<{ name: string | null }>> {
    return this.evalScript<{ name: string | null }>("$.HostScript.getSelectedLayerName()");
  }

  /**
   * 获取当前选中图层的详细信息
   */
  /**
   * 获取当前选中图层的详细信息
   * @returns Promise 封装的结果
   */
  async getSelectedLayersInfo(): Promise<PSResult<SelectedLayersInfoResponse>> {
    return this.evalScript<SelectedLayersInfoResponse>("$.HostScript.getSelectedLayersInfo()");
  }

  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   * @returns Promise 封装的结果
   */
  async copyText(text: string): Promise<PSResult<string>> {
    const safe = this.escapeForSingleQuotedString(text);
    return this.evalScript<string>(`$.HostScript.copyTextToClipboard('${safe}')`);
  }

  /**
   * 获取当前文档路径
   */
  async getDocumentPath(): Promise<PSResult<DocumentPathResponse>> {
    return this.evalScript<DocumentPathResponse>("$.HostScript.getDocumentPath()");
  }

  /**
   * 确保目录存在
   * @param dirPath 目录路径
   */
  async ensureDirectory(dirPath: string): Promise<PSResult<void>> {
    const safe = this.escapeForSingleQuotedString(dirPath);
    return this.evalScript<void>(`$.HostScript.ensureDirectory('${safe}')`);
  }

  /**
   * 打开原生文件夹选择对话框
   */
  async selectFolderDialog(): Promise<PSResult<DocumentPathResponse>> {
    return this.evalScript<DocumentPathResponse>("$.HostScript.selectFolderDialog()");
  }

  /**
   * 收集选中图层的导出信息
   * @param includeHidden 是否包含不可见图层
   */
  async collectLayersForExport(includeHidden: boolean): Promise<PSResult<CollectLayersResult>> {
    return this.evalScript<CollectLayersResult>(`$.HostScript.collectLayersForExport(${includeHidden})`);
  }

  /**
   * 收集文档全部图层的导出信息
   * @param includeHidden 是否包含不可见图层
   */
  async collectAllLayersForExport(includeHidden: boolean): Promise<PSResult<CollectLayersResult>> {
    return this.evalScript<CollectLayersResult>(`$.HostScript.collectAllLayersForExport(${includeHidden})`);
  }

  /**
   * 收集选中图层组内的所有子图层
   * @param includeHidden 是否包含不可见图层
   */
  async collectGroupLayersForExport(includeHidden: boolean): Promise<PSResult<CollectLayersResult>> {
    return this.evalScript<CollectLayersResult>(`$.HostScript.collectGroupLayersForExport(${includeHidden})`);
  }

  /**
   * 导出单个图层
   * @param layerId 图层 ID
   * @param exportPath 导出路径
   * @param format 导出格式
   * @param groupPath 图层组路径
   * @param includeHidden 是否包含不可见图层
   */
  async exportSingleLayer(layerId: number, exportPath: string, format: ExportFormat, groupPath: string, includeHidden: boolean): Promise<PSResult<ExportSingleResult>> {
    const safePath = this.escapeForSingleQuotedString(exportPath);
    const safeGroup = this.escapeForSingleQuotedString(groupPath);
    return this.evalScript<ExportSingleResult>(`$.HostScript.exportSingleLayer(${layerId}, '${safePath}', '${format}', '${safeGroup}', ${includeHidden})`);
  }

  /**
   * 导出图层信息 XML
   * @param exportPath 导出路径
   * @param layersJson 图层数据 JSON 字符串
   */
  async exportLayerInfoXML(exportPath: string, layersJson: string): Promise<PSResult<void>> {
    const safePath = this.escapeForSingleQuotedString(exportPath);
    const safeJson = this.escapeForSingleQuotedString(layersJson);
    return this.evalScript<void>(`$.HostScript.exportLayerInfoXML('${safePath}', '${safeJson}')`);
  }

  /**
   * 保存当前历史状态
   */
  async saveHistoryState(): Promise<PSResult<HistoryStateResponse>> {
    return this.evalScript<HistoryStateResponse>("$.HostScript.saveHistoryState()");
  }

  /**
   * 恢复历史状态
   */
  async restoreHistoryState(): Promise<PSResult<void>> {
    return this.evalScript<void>("$.HostScript.restoreHistoryState()");
  }
}

/**
 * 导出 PSBridge 单例
 */
export const psBridge = new PSBridge();
