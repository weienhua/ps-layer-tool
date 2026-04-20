// PS 通信桥接层 - Promise 化封装

// 调试开关 - 可以通过 window.DEBUG 全局控制
const DEBUG = (window as any).DEBUG || false;

// 通信日志回调
export type LogCallback = (type: 'send' | 'receive' | 'error', data: any) => void;
let logCallback: LogCallback | null = null;

export function setLogCallback(callback: LogCallback | null) {
  logCallback = callback;
}

export interface PSResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  noDocument?: boolean;
}

export interface DocumentInfo {
  name: string;
  width: number;
  height: number;
}

export class PSBridge {
  private csInterface: CSInterface;

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
  async getDocumentInfo(): Promise<PSResult<DocumentInfo>> {
    return this.evalScript<DocumentInfo>("$.HostScript.getDocumentInfo()");
  }

  /**
   * 获取当前选中图层的名称
   */
  async getSelectedLayerName(): Promise<PSResult<{ name: string | null }>> {
    return this.evalScript<{ name: string | null }>("$.HostScript.getSelectedLayerName()");
  }
}

// 导出单例
export const psBridge = new PSBridge();
