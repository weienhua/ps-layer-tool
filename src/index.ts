import { psBridge, SelectedLayerInfo, setLogCallback } from "./bridge";

type AnchorType =
  | "topLeft" | "topCenter" | "topRight"
  | "middleLeft" | "center" | "middleRight"
  | "bottomLeft" | "bottomCenter" | "bottomRight";
type SortType = "xAsc" | "yAsc" | "psOrderBottomToTop";

interface PresetConfig {
  id: string;
  name: string;
  anchor: AnchorType;
  sortBy: SortType;
  scaleAnim: string;
  rotateAnim: string;
  template: string;
}

class LayerToolUI {
  private static readonly PRESET_STORAGE_KEY = "layerTool.presets.v1";
  private debugMode = false;
  private logs: Array<{type: string; data: any; time: Date}> = [];
  private docRefreshTimer: number | null = null;
  private presets: PresetConfig[] = [];

  // DOM 元素引用
  private docInfo = document.getElementById("docInfo") as HTMLDivElement;
  private statusBar = document.getElementById("statusBar") as HTMLDivElement;
  private btnFetchLayers = document.getElementById("btnFetchLayers") as HTMLButtonElement;
  private presetName = document.getElementById("presetName") as HTMLInputElement;
  private anchorSelect = document.getElementById("anchorSelect") as HTMLSelectElement;
  private anchorGridSelector = document.getElementById("anchorGridSelector") as HTMLDivElement;
  private sortSelect = document.getElementById("sortSelect") as HTMLSelectElement;
  private scaleAnimInput = document.getElementById("scaleAnimInput") as HTMLInputElement;
  private rotateAnimInput = document.getElementById("rotateAnimInput") as HTMLInputElement;
  private templateInput = document.getElementById("templateInput") as HTMLTextAreaElement;
  private btnSavePreset = document.getElementById("btnSavePreset") as HTMLButtonElement;
  private presetList = document.getElementById("presetList") as HTMLDivElement;
  private outputText = document.getElementById("outputText") as HTMLTextAreaElement;
  private btnCopyOutput = document.getElementById("btnCopyOutput") as HTMLButtonElement;
  private templateHint = document.getElementById("templateHint") as HTMLDivElement;

  // 调试面板元素
  private debugModeCheckbox = document.getElementById("debugMode") as HTMLInputElement;
  private debugPanel = document.getElementById("debugPanel") as HTMLDivElement;
  private debugLogs = document.getElementById("debugLogs") as HTMLDivElement;
  private btnClearLogs = document.getElementById("btnClearLogs") as HTMLButtonElement;

  constructor() {
    this.initDefaultForm();
    this.loadPresets();
    this.bindEvents();
    this.initDebugPanel();
    this.startDocRefresh();
    this.renderPresetList();
    this.renderTemplateHint();
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

    this.btnFetchLayers.addEventListener("click", () => {
      void this.fetchLayersWithCurrentForm();
    });

    this.btnSavePreset.addEventListener("click", () => {
      this.savePreset();
    });

    this.anchorSelect.addEventListener("change", () => {
      this.setAnchor(this.anchorSelect.value as AnchorType);
    });

    this.anchorGridSelector.querySelectorAll(".anchor-grid-cell").forEach((el) => {
      el.addEventListener("click", () => {
        const anchor = (el as HTMLButtonElement).dataset.anchor as AnchorType;
        if (!anchor) return;
        this.setAnchor(anchor);
      });
      el.addEventListener("keydown", (e) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
          e.preventDefault();
          const anchor = (el as HTMLButtonElement).dataset.anchor as AnchorType;
          if (!anchor) return;
          this.setAnchor(anchor);
        }
      });
    });

    this.btnCopyOutput.addEventListener("click", () => {
      void this.copyCurrentOutput();
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

  private initDefaultForm(): void {
    this.setAnchor("topLeft");
    this.sortSelect.value = "xAsc";
    this.scaleAnimInput.value = "";
    this.rotateAnimInput.value = "";
    this.templateInput.value = 'x="{x}" y="{y}" ';
  }

  private startDocRefresh(): void {
    void this.refreshDocumentInfo();
    this.docRefreshTimer = window.setInterval(() => {
      void this.refreshDocumentInfo();
    }, 60000);
  }

  private async refreshDocumentInfo(): Promise<void> {
    const result = await psBridge.getDocumentInfo();

    if (!result.success) {
      if (result.noDocument) {
        this.docInfo.textContent = "未检测到打开的文档";
        this.setStatus("就绪 - 无打开文档");
      } else {
        this.setStatus(`获取文档信息失败: ${result.error}`, true);
      }
      return;
    }

    const info = result.data!;
    this.docInfo.textContent = `${info.name} (${info.width}x${info.height}px)`;
    this.setStatus("就绪");
  }

  private getCurrentFormConfig(): Omit<PresetConfig, "id"> {
    return {
      name: this.presetName.value.trim(),
      anchor: this.anchorSelect.value as AnchorType,
      sortBy: this.sortSelect.value as SortType,
      scaleAnim: this.scaleAnimInput.value.trim(),
      rotateAnim: this.rotateAnimInput.value.trim(),
      template: this.templateInput.value || 'x="{x}" y="{y}" '
    };
  }

  private renderTemplateHint(): void {
    const vars = [
      { key: "name", desc: "图层名称" },
      { key: "type", desc: "图层类型" },
      { key: "x", desc: "锚点X坐标" },
      { key: "y", desc: "锚点Y坐标" },
      { key: "width", desc: "宽度" },
      { key: "height", desc: "高度" },
      { key: "rotation", desc: "旋转角度" },
      { key: "centerX", desc: "中心X坐标" },
      { key: "centerY", desc: "中心Y坐标" },
      { key: "path", desc: "图层路径" },
      { key: "scaleAnim", desc: "缩放动画" },
      { key: "rotateAnim", desc: "旋转动画" },
      { key: "fontSize", desc: "字体大小" },
      { key: "fontColor", desc: "字体颜色" },
      { key: "text", desc: "文字内容" }
    ];
    this.templateHint.innerHTML = vars.map(v => `<span class="hint-var">{${v.key}}</span><span class="hint-desc">${v.desc}</span>`).join("");
  }

  private savePreset(): void {
    const config = this.getCurrentFormConfig();
    if (!config.name) {
      this.setStatus("请先输入预设名称", true);
      return;
    }
    const idx = this.presets.findIndex((p) => p.name === config.name);
    const preset: PresetConfig = {
      ...config,
      id: idx >= 0 ? this.presets[idx].id : String(Date.now())
    };
    if (idx >= 0) {
      this.presets[idx] = preset;
    } else {
      this.presets.push(preset);
    }
    this.persistPresets();
    this.renderPresetList();
    this.setStatus(`预设已保存：${config.name}`);
  }

  private applyPresetToForm(preset: PresetConfig): void {
    this.presetName.value = preset.name;
    this.setAnchor(preset.anchor);
    this.sortSelect.value = preset.sortBy;
    this.scaleAnimInput.value = preset.scaleAnim;
    this.rotateAnimInput.value = preset.rotateAnim;
    this.templateInput.value = preset.template;
  }

  private deletePreset(presetId: string): void {
    this.presets = this.presets.filter((p) => p.id !== presetId);
    this.persistPresets();
    this.renderPresetList();
    this.setStatus("预设已删除");
  }

  private loadPresets(): void {
    try {
      const raw = localStorage.getItem(LayerToolUI.PRESET_STORAGE_KEY);
      if (!raw) {
        this.presets = [{
          id: "default",
          name: "默认",
          anchor: "topLeft",
          sortBy: "xAsc",
          scaleAnim: "",
          rotateAnim: "",
          template: 'x="{x}" y="{y}" '
        }];
        this.persistPresets();
        return;
      }
      const parsed = JSON.parse(raw) as PresetConfig[];
      if (Array.isArray(parsed)) {
        this.presets = parsed;
      }
    } catch {
      this.presets = [];
    }
  }

  private persistPresets(): void {
    localStorage.setItem(LayerToolUI.PRESET_STORAGE_KEY, JSON.stringify(this.presets));
  }

  private getSortLabel(sortBy: SortType): string {
    if (sortBy === "xAsc") return "按 X 升序";
    if (sortBy === "yAsc") return "按 Y 升序";
    return "按PS图层顺序";
  }

  private getAnchorGridHtml(anchor: AnchorType): string {
    const anchors: AnchorType[] = [
      "topLeft", "topCenter", "topRight",
      "middleLeft", "center", "middleRight",
      "bottomLeft", "bottomCenter", "bottomRight"
    ];
    return anchors.map((cellAnchor) => {
      const activeClass = cellAnchor === anchor ? " is-active" : "";
      return `<span class="preset-anchor-cell${activeClass}" aria-hidden="true"></span>`;
    }).join("");
  }

  private renderPresetList(): void {
    if (this.presets.length === 0) {
      this.presetList.innerHTML = '<div class="empty-state">暂无预设</div>';
      return;
    }
    this.presetList.innerHTML = this.presets.map((preset) => {
      return `
        <div class="preset-item" data-id="${preset.id}" draggable="true">
          <button class="preset-delete" data-action="delete" data-id="${preset.id}" aria-label="删除预设">×</button>
          <div class="preset-main">
            <span class="preset-name">${this.escapeHtml(preset.name)}</span>
          </div>
          <div class="preset-meta">
            <div class="preset-anchor-grid">${this.getAnchorGridHtml(preset.anchor)}</div>
            <span class="sort-badge">${this.getSortLabel(preset.sortBy)}</span>
          </div>
          <div class="preset-template-preview">${this.escapeHtml(preset.template || "")}</div>
        </div>
      `;
    }).join("");

    let draggedId: string | null = null;

    this.presetList.querySelectorAll(".preset-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.matches(".preset-delete")) return;
        const id = (el as HTMLElement).dataset.id!;
        const preset = this.presets.find((p) => p.id === id);
        if (!preset) return;
        this.applyPresetToForm(preset);
        void this.fetchLayersWithConfig(preset);
      });

      el.addEventListener("dragstart", (e) => {
        draggedId = (el as HTMLElement).dataset.id!;
        el.classList.add("dragging");
        e.stopPropagation();
      });

      el.addEventListener("dragend", () => {
        el.classList.remove("dragging");
        draggedId = null;
      });

      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!draggedId) return;
        const targetId = (el as HTMLElement).dataset.id!;
        if (targetId !== draggedId) {
          el.classList.add("drag-over");
        }
      });

      el.addEventListener("dragleave", () => {
        el.classList.remove("drag-over");
      });

      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("drag-over");
        if (!draggedId) return;
        const targetId = (el as HTMLElement).dataset.id!;
        if (targetId === draggedId) return;
        this.reorderPresets(draggedId, targetId);
      });
    });

    this.presetList.querySelectorAll("button[data-action='delete']").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = (el as HTMLButtonElement).dataset.id!;
        this.deletePreset(id);
      });
    });
  }

  private reorderPresets(draggedId: string, targetId: string): void {
    const draggedIdx = this.presets.findIndex((p) => p.id === draggedId);
    const targetIdx = this.presets.findIndex((p) => p.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const [draggedPreset] = this.presets.splice(draggedIdx, 1);
    this.presets.splice(targetIdx, 0, draggedPreset);
    this.persistPresets();
    this.renderPresetList();
    this.setStatus("预设顺序已更新");
  }

  private async fetchLayersWithCurrentForm(): Promise<void> {
    const current = this.getCurrentFormConfig();
    await this.fetchLayersWithConfig({ ...current, id: "current" });
  }

  private getAnchorXY(layer: SelectedLayerInfo, anchor: AnchorType): { x: number; y: number } {
    const left = layer.x;
    const top = layer.y;
    const centerX = layer.centerX;
    const centerY = layer.centerY;
    const right = layer.x + layer.width;
    const bottom = layer.y + layer.height;
    const map: Record<AnchorType, { x: number; y: number }> = {
      topLeft: { x: left, y: top },
      topCenter: { x: centerX, y: top },
      topRight: { x: right, y: top },
      middleLeft: { x: left, y: centerY },
      center: { x: centerX, y: centerY },
      middleRight: { x: right, y: centerY },
      bottomLeft: { x: left, y: bottom },
      bottomCenter: { x: centerX, y: bottom },
      bottomRight: { x: right, y: bottom }
    };
    return map[anchor];
  }

  private setAnchor(anchor: AnchorType): void {
    this.anchorSelect.value = anchor;
    this.anchorGridSelector.querySelectorAll(".anchor-grid-cell").forEach((el) => {
      const cellAnchor = (el as HTMLButtonElement).dataset.anchor;
      if (cellAnchor === anchor) {
        el.classList.add("is-active");
        (el as HTMLButtonElement).setAttribute("aria-pressed", "true");
      } else {
        el.classList.remove("is-active");
        (el as HTMLButtonElement).setAttribute("aria-pressed", "false");
      }
    });
  }

  private sortLayers(layers: SelectedLayerInfo[], sortBy: SortType): SelectedLayerInfo[] {
    const list = layers.slice();
    if (sortBy === "xAsc") {
      list.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    } else if (sortBy === "yAsc") {
      list.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
    } else {
      list.sort((a, b) => a.order - b.order);
    }
    return list;
  }

  private formatLayerLine(layer: SelectedLayerInfo, preset: PresetConfig): string {
    const anchor = this.getAnchorXY(layer, preset.anchor);
    const scope: Record<string, string> = {
      name: layer.name,
      type: layer.layerType,
      x: String(anchor.x),
      y: String(anchor.y),
      width: String(layer.width),
      height: String(layer.height),
      rotation: String(layer.rotation),
      scaleAnim: preset.scaleAnim,
      rotateAnim: preset.rotateAnim,
      centerX: String(layer.centerX),
      centerY: String(layer.centerY),
      path: layer.path || "",
      fontSize: layer.text?.fontSize != null ? String(layer.text.fontSize) : "",
      fontColor: layer.text?.fontColor || "",
      text: layer.text?.content || ""
    };
    return preset.template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_all, key) => {
      return scope[key] ?? "";
    });
  }

  private async copyOutputText(text: string): Promise<boolean> {
    if (!text) return false;
    const copyResult = await psBridge.copyText(text);
    return !!copyResult.success;
  }

  private async copyCurrentOutput(): Promise<void> {
    const text = this.outputText.value;
    if (!text) {
      this.setStatus("暂无可复制内容", true);
      return;
    }
    const ok = await this.copyOutputText(text);
    if (ok) {
      this.setStatus("复制成功");
    } else {
      this.setStatus("复制失败，请检查 Photoshop 状态", true);
    }
  }

  private async fetchLayersWithConfig(preset: PresetConfig): Promise<void> {
    const result = await psBridge.getSelectedLayersInfo();
    if (!result.success || !result.data) {
      this.setStatus(`获取图层失败: ${result.error || "未知错误"}`, true);
      return;
    }
    const sorted = this.sortLayers(result.data.layers, preset.sortBy);
    const lines = sorted.map((layer) => this.formatLayerLine(layer, preset));
    const output = lines.join("\n");
    this.outputText.value = output;
    const copied = await this.copyOutputText(output);
    const skippedCount = result.data.skipped.length;
    if (copied) {
      this.setStatus(`获取成功：${sorted.length} 个图层${skippedCount ? `，跳过 ${skippedCount} 个图层组` : ""}，已复制`);
    } else {
      this.setStatus("已生成输出，但复制到剪贴板失败，请点击“复制输出”重试", true);
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
