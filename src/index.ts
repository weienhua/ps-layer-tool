// 面板 UI 控制器 - 简化版
import { psBridge, PSResult, DocumentInfo, setLogCallback } from "./bridge";

class LayerToolUI {
  private debugMode = false;
  private logs: Array<{type: string; data: any; time: Date}> = [];
  private refreshTimer: number | null = null;

  // DOM 元素引用
  private docInfo = document.getElementById("docInfo") as HTMLDivElement;
  private layerInfo = document.getElementById("layerInfo") as HTMLDivElement;
  private statusBar = document.getElementById("statusBar") as HTMLDivElement;

  // 调试面板元素
  private debugModeCheckbox = document.getElementById("debugMode") as HTMLInputElement;
  private debugPanel = document.getElementById("debugPanel") as HTMLDivElement;
  private debugLogs = document.getElementById("debugLogs") as HTMLDivElement;
  private btnClearLogs = document.getElementById("btnClearLogs") as HTMLButtonElement;

  constructor() {
    this.bindEvents();
    this.initDebugPanel();
    this.startAutoRefresh();
  }

  private bindEvents(): void {
    // 调试面板事件
    this.debugModeCheckbox.addEventListener("change", (e) => {
      this.debugMode = (e.target as HTMLInputElement).checked;
      this.debugPanel.style.display = this.debugMode ? "flex" : "none";
      (window as any).DEBUG = this.debugMode;
    });

    this.btnClearLogs.addEventListener("click", () => {
      this.logs = [];
      this.renderDebugLogs();
    });
  }

  /**
   * 初始化调试面板
   */
  private initDebugPanel(): void {
    setLogCallback((type, data) => {
      this.addLog(type, data);
    });
  }

  /**
   * 添加日志
   */
  private addLog(type: 'send' | 'receive' | 'error', data: any): void {
    this.logs.push({ type, data, time: new Date() });
    if (this.logs.length > 50) {
      this.logs.shift();
    }
    this.renderDebugLogs();
  }

  /**
   * 渲染调试日志
   */
  private renderDebugLogs(): void {
    if (!this.debugMode) return;

    const html = this.logs.slice().reverse().map(log => {
      const time = log.time.toLocaleTimeString();
      const typeLabel = log.type === 'send' ? '发送' : log.type === 'receive' ? '接收' : '错误';
      const className = log.type;
      let content = '';

      if (log.type === 'send') {
        content = log.data.script;
      } else if (log.type === 'receive') {
        const result = log.data.result ?? 'undefined';
        content = `结果: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`;
      } else {
        content = String(log.data);
      }

      const duration = log.data.duration ? `<span class="debug-log-duration">${log.data.duration}ms</span>` : '';

      return `
        <div class="debug-log-entry ${className}">
          <div>
            <span class="debug-log-time">${time}</span>
            <span class="debug-log-type">${typeLabel}</span>
            ${duration}
          </div>
          <div class="debug-log-content">${this.escapeHtml(content)}</div>
        </div>
      `;
    }).join('');

    this.debugLogs.innerHTML = html || '<div class="empty-state">暂无日志</div>';
  }

  /**
   * 开始自动刷新
   */
  private startAutoRefresh(): void {
    this.refreshData();
    // 每 500ms 刷新一次选中图层信息
    this.refreshTimer = window.setInterval(() => {
      this.refreshSelectedLayer();
    }, 200);
  }

  /**
   * 刷新文档信息
   */
  private async refreshData(): Promise<void> {
    const result = await psBridge.getDocumentInfo();

    if (!result.success) {
      if (result.noDocument) {
        this.docInfo.textContent = "未检测到打开的文档";
        this.layerInfo.textContent = "未选中图层";
        this.setStatus("就绪 - 无打开文档");
      } else {
        this.setStatus(`获取文档信息失败: ${result.error}`, true);
      }
      return;
    }

    const info = result.data!;
    this.docInfo.textContent = `${info.name} (${info.width}x${info.height}px)`;
    this.setStatus("就绪");

    // 同时刷新选中图层
    await this.refreshSelectedLayer();
  }

  /**
   * 刷新选中图层信息
   */
  private async refreshSelectedLayer(): Promise<void> {
    const result = await psBridge.getSelectedLayerName();

    if (result.success && result.data) {
      const name = result.data.name;
      this.layerInfo.textContent = name ? `选中: ${name}` : "未选中图层";
    }
  }

  /**
   * 设置状态栏消息
   */
  private setStatus(message: string, isError = false): void {
    this.statusBar.textContent = message;
    this.statusBar.className = "status-bar" + (isError ? " error" : " success");
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  new LayerToolUI();
});
