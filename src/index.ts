import { psBridge, SelectedLayerInfo, setLogCallback } from "./bridge";

/**
 * 锚点类型 - 九宫格位置
 */
type AnchorType =
  | "topLeft" | "topCenter" | "topRight"
  | "middleLeft" | "center" | "middleRight"
  | "bottomLeft" | "bottomCenter" | "bottomRight";

/**
 * 排序类型
 * - xAsc: 按 X 升序
 * - yAsc: 按 Y 升序
 * - psOrderBottomToTop: 按 PS 图层顺序
 */
type SortType = "xAsc" | "yAsc" | "psOrderBottomToTop";

/**
 * 预设配置接口
 */
interface PresetConfig {
  id: string;
  name: string;
  anchor: AnchorType;
  sortBy: SortType;
  scaleAnim: string;
  rotateAnim: string;
  template: string;
}

/**
 * 模板输出预设配置接口
 */
interface TemplateOutputPresetConfig {
  id: string;
  name: string;
  anchor: AnchorType;
  sortBy: SortType;
  template: string;
}

/**
 * LayerToolUI - 图层工具面板主类
 * 管理面板 UI 交互、预设配置、图层信息获取等功能
 */
class LayerToolUI {
  private static readonly PRESET_STORAGE_KEY = "layerTool.presets.v1";
  
  /**
   * 模板预设列表 - 从 presets.txt 动态加载
   */
  private templatePresets: string[] = [];
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
  private templateSelect = document.getElementById("templateSelectWrapper") as HTMLDivElement;
  private templateSelectTrigger = document.getElementById("templateSelectTrigger") as HTMLDivElement;
  private templateSelectDropdown = document.getElementById("templateSelectDropdown") as HTMLDivElement;
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
  private toastContainer = document.getElementById("toastContainer") as HTMLDivElement;

  // 导出 Tab 元素
  private exportPath = document.getElementById("exportPath") as HTMLInputElement;
  private btnBrowsePath = document.getElementById("btnBrowsePath") as HTMLButtonElement;
  private exportFormat = document.getElementById("exportFormat") as HTMLSelectElement;
  private cbExportHidden = document.getElementById("cbExportHidden") as HTMLInputElement;
  private cbExportXML = document.getElementById("cbExportXML") as HTMLInputElement;
  private cbFolderHierarchy = document.getElementById("cbFolderHierarchy") as HTMLInputElement;
  private btnExportSelected = document.getElementById("btnExportSelected") as HTMLButtonElement;
  private btnExportGroup = document.getElementById("btnExportGroup") as HTMLButtonElement;
  private btnExportAll = document.getElementById("btnExportAll") as HTMLButtonElement;
  private exportProgress = document.getElementById("exportProgress") as HTMLDivElement;
  private progressText = document.getElementById("progressText") as HTMLSpanElement;
  private exportResultList = document.getElementById("exportResultList") as HTMLDivElement;

  // XML 模板 Tab 元素
  private xmlVarName = document.getElementById("xmlVarName") as HTMLInputElement;
  private xmlDatatypeGroup = document.getElementById("xmlDatatypeGroup") as HTMLDivElement;
  private xmlAnchorGridSelector = document.getElementById("xmlAnchorGridSelector") as HTMLDivElement;
  private xmlAnchorSelect = document.getElementById("xmlAnchorSelect") as HTMLSelectElement;
  private xmlPositionAnchorGrid = document.getElementById("xmlPositionAnchorGrid") as HTMLDivElement;
  private xmlPositionAnchorSelect = document.getElementById("xmlPositionAnchorSelect") as HTMLSelectElement;
  private xmlSortSelect = document.getElementById("xmlSortSelect") as HTMLSelectElement;
  private btnGenerateXML = document.getElementById("btnGenerateXML") as HTMLButtonElement;
  private btnCopyXML = document.getElementById("btnCopyXML") as HTMLButtonElement;
  private xmlOutput = document.getElementById("xmlOutput") as HTMLTextAreaElement;
  private xmlDatatype: string = "percentage";
  private xmlAnchor: AnchorType = "topLeft";
  private xmlPositionAnchor: AnchorType = "topLeft";
  private xmlSortBy: SortType = "xAsc";

  // 模板输出 Tab 元素
  private tplOutPresetName = document.getElementById("tplOutPresetName") as HTMLInputElement;
  private tplOutAnchorSelect = document.getElementById("tplOutAnchorSelect") as HTMLSelectElement;
  private tplOutAnchorGridSelector = document.getElementById("tplOutAnchorGridSelector") as HTMLDivElement;
  private tplOutSortSelect = document.getElementById("tplOutSortSelect") as HTMLSelectElement;
  private tplOutTemplateInput = document.getElementById("tplOutTemplateInput") as HTMLTextAreaElement;
  private tplOutTemplateHint = document.getElementById("tplOutTemplateHint") as HTMLDivElement;
  private tplOutTemplateSelect = document.getElementById("tplOutTemplateSelectWrapper") as HTMLDivElement;
  private tplOutTemplateSelectTrigger = document.getElementById("tplOutTemplateSelectTrigger") as HTMLDivElement;
  private tplOutTemplateSelectDropdown = document.getElementById("tplOutTemplateSelectDropdown") as HTMLDivElement;
  private tplOutBtnFetchLayers = document.getElementById("tplOutBtnFetchLayers") as HTMLButtonElement;
  private tplOutBtnSavePreset = document.getElementById("tplOutBtnSavePreset") as HTMLButtonElement;
  private tplOutPresetList = document.getElementById("tplOutPresetList") as HTMLDivElement;
  private tplOutBtnCopyOutput = document.getElementById("tplOutBtnCopyOutput") as HTMLButtonElement;
  private tplOutOutputText = document.getElementById("tplOutOutputText") as HTMLTextAreaElement;

  private tplOutPresets: TemplateOutputPresetConfig[] = [];
  private tplOutTemplateOptions: Array<{name: string, template: string}> = [];
  private static readonly TPL_OUT_PRESET_STORAGE_KEY = "layerTool.templateOutputPresets.v1";

  /**
   * 构造函数 - 初始化面板
   */
  constructor() {
    Promise.all([
      this.loadTemplatePresets(),
      this.loadTemplateOutputOptions()
    ]).then(() => {
      this.initDefaultForm();
      this.loadPresets();
      this.bindEvents();
      this.bindPresetListDelegation();
      this.initDebugPanel();
      this.startDocRefresh();
      this.initExportPath();
      this.renderPresetList();
      this.renderTemplateHint();
      this.bindHintCopy(this.templateHint);
      this.loadTemplateOutputPresets();
      this.renderTemplateOutputPresetList();
      this.renderTemplateOutputHint();
      this.bindHintCopy(this.tplOutTemplateHint);
      this.setTplOutAnchor("topLeft");
    });
  }

  /**
   * 从 presets.md 加载模板预设列表（带 localStorage 缓存）
   */
  private async loadTemplatePresets(): Promise<void> {
    try {
      var cs = new (window as any).CSInterface();
      var extPath = cs.getSystemPath("extension");
      var filePath = extPath + "/dist/lib/presets.md";
      var result = (window as any).cep.fs.readFile(filePath);
      if (result.err !== 0) {
        console.error("读取 presets.md 失败，错误码：" + result.err);
        this.templatePresets = [];
        this.renderTemplatePresets();
        return;
      }
      var raw = result.data as string;
      var hash = this.simpleHash(raw);
      var cacheKey = "layerTool.presets.cache.v1";
      var cached = this.readCache(cacheKey);
      if (cached && cached.hash === hash) {
        this.templatePresets = cached.data as string[];
      } else {
        var presets = this.parsePresetsMd(raw);
        this.templatePresets = presets;
        this.writeCache(cacheKey, hash, presets);
      }
    } catch (e) {
      console.error("加载模板预设失败:", e);
      this.templatePresets = [];
    }
    this.renderTemplatePresets();
  }

  /**
   * 解析 presets.md 内容，提取模板列表
   */
  private parsePresetsMd(raw: string): string[] {
    var blocks = raw.split("```");
    var presets: string[] = [];
    for (var bi = 1; bi < blocks.length; bi += 2) {
      var blockContent = blocks[bi].replace(/^\r?\n/, "").replace(/\r?\n$/, "");
      if (blockContent.split("\n")[0].trim().startsWith("example")) continue;
      var lines = blocks[bi].split("\n")
        .map(function(line: string) { return line.replace(/\r$/, ""); })
        .filter(function(line: string) { return line.trim() !== ""; });
      presets = presets.concat(lines);
    }
    return presets;
  }

  /**
   * 简单字符串 hash
   */
  private simpleHash(str: string): number {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h;
  }

  /**
   * 读取 localStorage 缓存
   */
  private readCache(key: string): { hash: number; data: any } | null {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * 写入 localStorage 缓存
   */
  private writeCache(key: string, hash: number, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify({ hash: hash, data: data }));
    } catch {
      // 缓存写入失败不影响功能
    }
  }

  /**
   * 渲染模板预设下拉列表
   */
  private renderTemplatePresets(): void {
    this.templateSelectDropdown.innerHTML = "";
    let selectedIndex = 0;

    this.templatePresets.forEach((template, index) => {
      const option = document.createElement("div");
      option.className = "custom-select-option";
      option.textContent = template;
      option.dataset.value = String(index);
      this.templateSelectDropdown.appendChild(option);
    });

    const customOption = document.createElement("div");
    customOption.className = "custom-select-option";
    customOption.textContent = "自定义";
    customOption.dataset.value = "custom";
    this.templateSelectDropdown.appendChild(customOption);

    this.updateTemplateSelectDisplay(String(selectedIndex));
  }

  /**
   * 更新自定义下拉显示
   */
  private updateTemplateSelectDisplay(value: string): void {
    const options = this.templateSelectDropdown.querySelectorAll(".custom-select-option");
    let displayText = "请选择模板";

    options.forEach((opt) => {
      const el = opt as HTMLDivElement;
      el.classList.remove("selected");
      if (el.dataset.value === value) {
        el.classList.add("selected");
        displayText = el.textContent || "自定义";
        if (value === "custom") {
          displayText = "自定义";
        }
      }
    });

    const valueSpan = this.templateSelectTrigger.querySelector(".select-value") as HTMLSpanElement;
    if (valueSpan) {
      valueSpan.textContent = displayText;
    }

    (this as any)._templateSelectValue = value;
  }

  /**
   * 获取当前选择的值
   */
  private getTemplateSelectValue(): string {
    return (this as any)._templateSelectValue || "0";
  }

  /**
   * 设置模板选择值
   */
  private setTemplateSelectValue(value: string): void {
    (this as any)._templateSelectValue = value;
    this.updateTemplateSelectDisplay(value);
  }

  /**
   * 绑定 DOM 事件
   */
  private bindEvents(): void {
    // Tab 切换事件
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = (btn as HTMLElement).dataset.tab;
        if (!tabId) return;
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        const tabMap: Record<string, string> = {
          layerInfo: "tabLayerInfo",
          templateOutput: "tabTemplateOutput",
          layerExport: "tabLayerExport",
          xmlTemplate: "tabXmlTemplate"
        };
        document.getElementById(tabMap[tabId])?.classList.add("active");
      });
    });

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

    this.templateSelectTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleTemplateSelect();
    });

    this.templateSelectTrigger.addEventListener("keydown", (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        e.preventDefault();
        this.toggleTemplateSelect();
      } else if (keyEvent.key === "ArrowDown") {
        e.preventDefault();
        this.openTemplateSelect();
      } else if (keyEvent.key === "ArrowUp") {
        e.preventDefault();
        this.openTemplateSelect();
      }
    });

    this.templateSelectDropdown.addEventListener("click", (e) => {
      const target = e.target as HTMLDivElement;
      if (target.classList.contains("custom-select-option")) {
        const value = target.dataset.value || "custom";
        this.onTemplateSelectChange(value);
        this.closeTemplateSelect();
      }
    });

    document.addEventListener("click", () => {
      this.closeTemplateSelect();
    });

    // 导出 Tab 事件
    this.btnBrowsePath.addEventListener("click", () => {
      void this.handleBrowsePath();
    });

    this.btnExportSelected.addEventListener("click", () => {
      void this.handleExportSelected();
    });

    this.btnExportGroup.addEventListener("click", () => {
      void this.handleExportGroup();
    });

    this.btnExportAll.addEventListener("click", () => {
      void this.handleExportAll();
    });

    // XML 模板 Tab 事件
    this.xmlDatatypeGroup.querySelectorAll(".xml-datatype-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.xmlDatatypeGroup.querySelectorAll(".xml-datatype-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.xmlDatatype = (btn as HTMLElement).dataset.type || "percentage";
        var defaults: Record<string, string> = { percentage: "#battery_level", temperature: "#weatherTemp", steps: "#steps_value" };
        this.xmlVarName.value = defaults[this.xmlDatatype] || "";
      });
    });

    this.xmlAnchorSelect.addEventListener("change", () => {
      this.setXmlAnchor(this.xmlAnchorSelect.value as AnchorType);
    });

    this.xmlAnchorGridSelector.querySelectorAll(".anchor-grid-cell").forEach((el) => {
      el.addEventListener("click", () => {
        const anchor = (el as HTMLButtonElement).dataset.anchor as AnchorType;
        if (!anchor) return;
        this.setXmlAnchor(anchor);
      });
    });

    // 位置锚点事件
    this.xmlPositionAnchorSelect.addEventListener("change", () => {
      this.setPositionAnchor(this.xmlPositionAnchorSelect.value as AnchorType);
    });

    this.xmlPositionAnchorGrid.querySelectorAll(".anchor-grid-cell").forEach((el) => {
      el.addEventListener("click", () => {
        const anchor = (el as HTMLButtonElement).dataset.anchor as AnchorType;
        if (!anchor) return;
        this.setPositionAnchor(anchor);
      });
    });

    this.btnGenerateXML.addEventListener("click", () => {
      void this.handleGenerateXML();
    });

    this.btnCopyXML.addEventListener("click", () => {
      void this.handleCopyXML();
    });

    // 模板输出 Tab 事件
    this.tplOutBtnFetchLayers.addEventListener("click", () => {
      void this.processTemplateOutput();
    });

    this.tplOutBtnSavePreset.addEventListener("click", () => {
      this.saveTemplateOutputPreset();
    });

    this.tplOutBtnCopyOutput.addEventListener("click", () => {
      void this.copyTemplateOutput();
    });

    this.tplOutAnchorSelect.addEventListener("change", () => {
      this.setTplOutAnchor(this.tplOutAnchorSelect.value as AnchorType);
    });

    this.tplOutAnchorGridSelector.querySelectorAll(".anchor-grid-cell").forEach((el) => {
      el.addEventListener("click", () => {
        const anchor = (el as HTMLButtonElement).dataset.anchor as AnchorType;
        if (!anchor) return;
        this.setTplOutAnchor(anchor);
      });
      el.addEventListener("keydown", (e) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
          e.preventDefault();
          const anchor = (el as HTMLButtonElement).dataset.anchor as AnchorType;
          if (!anchor) return;
          this.setTplOutAnchor(anchor);
        }
      });
    });

    // 模板输出下拉列表事件
    this.tplOutTemplateSelectTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleTplOutTemplateSelect();
    });

    this.tplOutTemplateSelectTrigger.addEventListener("keydown", (e) => {
      var keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        e.preventDefault();
        this.toggleTplOutTemplateSelect();
      }
    });

    this.tplOutTemplateSelectDropdown.addEventListener("click", (e) => {
      var target = e.target as HTMLDivElement;
      if (target.classList.contains("custom-select-option")) {
        var value = target.dataset.value;
        if (value === "custom") {
          this.tplOutTemplateInput.value = '<Image src="{path[0]}{name[0]}.png" x="{x[0]}" y="{y[0]}" />';
        } else if (value && value !== "-1") {
          var index = parseInt(value, 10);
          if (index >= 0 && index < this.tplOutTemplateOptions.length) {
            this.tplOutTemplateInput.value = this.tplOutTemplateOptions[index].template;
          }
        }
        this.updateTplOutTemplateSelectDisplay(value || "-1");
        this.tplOutTemplateSelect.classList.remove("open");
      }
    });

    document.addEventListener("click", () => {
      this.tplOutTemplateSelect.classList.remove("open");
    });
  }

  /**
   * 绑定预设列表的容器级事件委托（只调用一次）
   */
  private bindPresetListDelegation(): void {
    this.bindPresetDelegation(this.presetList, {
      onClick: (id) => {
        var preset = this.presets.find(function(p) { return p.id === id; });
        if (!preset) return;
        this.applyPresetToForm(preset);
        void this.fetchLayersWithConfig(preset);
      },
      onDelete: (id) => { this.deletePreset(id); },
      onReorder: (fromId, toId) => { this.reorderPresets(fromId, toId); }
    });

    this.bindPresetDelegation(this.tplOutPresetList, {
      onClick: (id) => {
        var preset = this.tplOutPresets.find(function(p) { return p.id === id; });
        if (!preset) return;
        this.applyTemplateOutputPresetToForm(preset);
        void this.processTemplateOutput();
      },
      onDelete: (id) => { this.deleteTemplateOutputPreset(id); },
      onReorder: (fromId, toId) => { this.reorderTemplateOutputPresets(fromId, toId); }
    });
  }

  /**
   * 为预设列表容器绑定通用事件委托
   */
  private bindPresetDelegation(container: HTMLDivElement, handlers: {
    onClick: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (fromId: string, toId: string) => void;
  }): void {
    var draggedId: string | null = null;

    container.addEventListener("click", (e) => {
      var target = e.target as HTMLElement;
      var deleteBtn = target.closest("button[data-action='delete']") as HTMLButtonElement;
      if (deleteBtn) {
        e.stopPropagation();
        var id = deleteBtn.dataset.id;
        if (id) handlers.onDelete(id);
        return;
      }
      var item = target.closest(".preset-item") as HTMLElement;
      if (item) {
        var itemId = item.dataset.id;
        if (itemId) handlers.onClick(itemId);
      }
    });

    container.addEventListener("dragstart", (e) => {
      var item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
      if (!item) return;
      draggedId = item.dataset.id || null;
      item.classList.add("dragging");
    });

    container.addEventListener("dragend", (e) => {
      var item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
      if (item) item.classList.remove("dragging");
      draggedId = null;
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!draggedId) return;
      var item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
      if (item && item.dataset.id !== draggedId) {
        item.classList.add("drag-over");
      }
    });

    container.addEventListener("dragleave", (e) => {
      var item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
      if (item) item.classList.remove("drag-over");
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      var item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
      if (!item) return;
      item.classList.remove("drag-over");
      if (!draggedId) return;
      var targetId = item.dataset.id;
      if (targetId && targetId !== draggedId) {
        handlers.onReorder(draggedId, targetId);
      }
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
   * 初始化默认表单值
   */
  private initDefaultForm(): void {
    this.setAnchor("topLeft");
    this.sortSelect.value = "xAsc";
    this.scaleAnimInput.value = "";
    this.rotateAnimInput.value = "";
    this.setTemplateSelectValue("0");
    this.templateInput.value = this.templatePresets[0] || "";
    this.setXmlAnchor("topLeft");
    this.setPositionAnchor("topLeft");
    this.xmlSortSelect.value = "xAsc";
    this.xmlVarName.value = "#battery_level";
  }

  /**
   * 处理模板选择变化
   */
  private onTemplateSelectChange(value?: string): void {
    const selectedValue = value || this.getTemplateSelectValue();
    if (selectedValue === "custom") {
      this.templateInput.value = 'x="{x}" y="{y}" ';
      this.updateTemplateSelectDisplay("custom");
    } else {
      if (this.templatePresets.length === 0) {
        this.templateInput.value = "";
        return;
      }
      const index = parseInt(selectedValue, 10);
      this.templateInput.value = this.templatePresets[index] || "";
      this.updateTemplateSelectDisplay(selectedValue);
    }
  }

  /**
   * 切换自定义下拉显示
   */
  private toggleTemplateSelect(): void {
    if (this.templateSelect.classList.contains("open")) {
      this.closeTemplateSelect();
    } else {
      this.openTemplateSelect();
    }
  }

  /**
   * 打开自定义下拉
   */
  private openTemplateSelect(): void {
    this.templateSelect.classList.add("open");
    const firstOption = this.templateSelectDropdown.querySelector(".custom-select-option") as HTMLDivElement;
    if (firstOption) {
      firstOption.focus();
    }
  }

  /**
   * 关闭自定义下拉
   */
  private closeTemplateSelect(): void {
    this.templateSelect.classList.remove("open");
  }

  /**
   * 启动文档信息定时刷新
   */
  private startDocRefresh(): void {
    void this.refreshDocumentInfo();
    this.docRefreshTimer = window.setInterval(() => {
      void this.refreshDocumentInfo();
    }, 60000);
  }

  /**
   * 刷新文档信息显示
   */
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

  /**
   * 初始化默认导出路径为 PSD 所在目录/export
   */
  private async initExportPath(): Promise<void> {
    const result = await psBridge.getDocumentPath();
    if (result.success && result.data && result.data.path) {
      this.exportPath.value = result.data.path + "/export";
    }
  }

/**
   * 获取当前表单配置
   * @returns 预设配置（不含 ID）
   */
  private getCurrentFormConfig(): Omit<PresetConfig, "id"> {
    return {
      name: this.presetName.value.trim(),
      anchor: this.anchorSelect.value as AnchorType,
      sortBy: this.sortSelect.value as SortType,
      scaleAnim: this.scaleAnimInput.value.trim(),
      rotateAnim: this.rotateAnimInput.value.trim(),
      template: this.templateInput.value
    };
  }

  /**
   * 渲染模板变量提示
   */
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
      { key: "path", desc: "图层路径 (例:组A/组B/)" },
      { key: "scaleAnim", desc: "缩放动画" },
      { key: "rotateAnim", desc: "旋转动画" },
      { key: "fontSize", desc: "字体大小" },
      { key: "fontColor", desc: "字体颜色" },
      { key: "text", desc: "文字内容" }
    ];
    this.templateHint.innerHTML = vars.map(v => 
      `<span class="hint-item"><span class="hint-var">{${v.key}}</span><span class="hint-desc">${v.desc}</span></span>`
    ).join("");
  }

  /**
   * 保存预设配置
   */
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

/**
   * 将预设应用到表单
   * @param preset 预设配置
   */
  private applyPresetToForm(preset: PresetConfig): void {
    this.presetName.value = preset.name;
    this.setAnchor(preset.anchor);
    this.sortSelect.value = preset.sortBy;
    this.scaleAnimInput.value = preset.scaleAnim;
    this.rotateAnimInput.value = preset.rotateAnim;
    
    // 检查模板值是否匹配预设
    let matched = false;
    for (let i = 0; i < this.templatePresets.length; i++) {
      if (this.templatePresets[i] === preset.template) {
        this.setTemplateSelectValue(String(i));
        this.templateInput.value = this.templatePresets[i];
        matched = true;
        break;
      }
    }
    if (!matched) {
      this.setTemplateSelectValue("custom");
      this.templateInput.value = preset.template;
    }
  }

  /**
   * 删除预设配置
   * @param presetId 预设 ID
   */
  private deletePreset(presetId: string): void {
    this.presets = this.presets.filter((p) => p.id !== presetId);
    this.persistPresets();
    this.renderPresetList();
    this.setStatus("预设已删除");
  }

  /**
   * 从 localStorage 加载预设配置
   */
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

  /**
   * 保存到 localStorage
   */
  private persistPresets(): void {
    localStorage.setItem(LayerToolUI.PRESET_STORAGE_KEY, JSON.stringify(this.presets));
  }

  /**
   * 获取排序类型的显示标签
   * @param sortBy 排序类型
   * @returns 显示标签
   */
  private getSortLabel(sortBy: SortType): string {
    if (sortBy === "xAsc") return "按 X 升序";
    if (sortBy === "yAsc") return "按 Y 升序";
    return "按PS图层顺序";
  }

  /**
   * 生成锚点九宫格的 HTML
   * @param anchor 当前选中的锚点
   * @returns HTML 字符串
   */
  private getAnchorGridHtml(anchor: AnchorType): string {
    const anchors: AnchorType[] = [
      "topLeft", "topCenter", "topRight",
      "middleLeft", "center", "middleRight",
      "bottomLeft", "bottomCenter", "bottomRight"
    ];
    return anchors.map((a) => {
      const active = a === anchor ? " is-active" : "";
      return `<button class="anchor-grid-cell${active}" data-anchor="${a}" aria-pressed="${a === anchor}"></button>`;
    }).join("");
  }

  /**
   * 渲染预设列表（仅生成 HTML，事件由 bindPresetListDelegation 委托）
   */
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
  }

  /**
   * 重新排序预设配置
   * @param draggedId 被拖拽的预设 ID
   * @param targetId 目标位置的预设 ID
   */
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

  /**
   * 使用当前表单配置获取图层信息
   */
  private async fetchLayersWithCurrentForm(): Promise<void> {
    const current = this.getCurrentFormConfig();
    await this.fetchLayersWithConfig({ ...current, id: "current" });
  }

  /**
   * 根据锚点类型计算图层锚点坐标
   * @param layer 图层信息
   * @param anchor 锚点类型
   * @returns 锚点坐标
   */
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

  /**
   * 设置锚点
   * @param anchor 锚点类型
   */
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

  /**
   * 设置 XML 模板锚点
   */
  private setXmlAnchor(anchor: AnchorType): void {
    this.xmlAnchor = anchor;
    this.xmlAnchorSelect.value = anchor;
    this.xmlAnchorGridSelector.querySelectorAll(".anchor-grid-cell").forEach((el) => {
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

  /**
   * 设置位置锚点
   */
  private setPositionAnchor(anchor: AnchorType): void {
    this.xmlPositionAnchor = anchor;
    this.xmlPositionAnchorSelect.value = anchor;
    this.xmlPositionAnchorGrid.querySelectorAll(".anchor-grid-cell").forEach((el) => {
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

  /**
   * 获取锚点对应的对齐系数
   */
  private getAnchorCoefficients(anchor: AnchorType): { alignH: number; alignV: number } {
    const map: Record<AnchorType, { alignH: number; alignV: number }> = {
      topLeft: { alignH: 1, alignV: 1 },
      topCenter: { alignH: 0.5, alignV: 1 },
      topRight: { alignH: 0, alignV: 1 },
      middleLeft: { alignH: 1, alignV: 0.5 },
      center: { alignH: 0.5, alignV: 0.5 },
      middleRight: { alignH: 0, alignV: 0.5 },
      bottomLeft: { alignH: 1, alignV: 0 },
      bottomCenter: { alignH: 0.5, alignV: 0 },
      bottomRight: { alignH: 0, alignV: 0 }
    };
    return map[anchor];
  }

  /**
   * 生成 XML 模板
   */
  private async handleGenerateXML(): Promise<void> {
    const varName = this.xmlVarName.value.trim();
    if (!varName) {
      this.showToast("请输入变量名", true);
      return;
    }

    const result = await psBridge.getSelectedLayersInfo();
    if (!result.success || !result.data) {
      this.showToast("获取图层失败: " + (result.error || "未知错误"), true);
      return;
    }
    if (result.data.layers.length === 0) {
      this.showToast("请先选中图层", true);
      return;
    }

    // 按选择的排序方式排序
    const sortBy: SortType = this.xmlSortSelect.value as SortType || "xAsc";
    const sorted = this.sortLayers(result.data.layers, sortBy);

    // 按位置锚点计算 x/y 坐标
    const posAnchor = this.xmlPositionAnchor;
    const positioned = sorted.map((layer) => {
      const anchorXY = this.getAnchorXY(layer, posAnchor);
      return {
        x: anchorXY.x,
        y: anchorXY.y,
        width: layer.width,
        height: layer.height,
        name: layer.name,
        path: layer.path || "",
        id: layer.id
      };
    });

    const coeffs = this.getAnchorCoefficients(this.xmlAnchor);
    const layersJson = JSON.stringify({ layers: positioned });
    const xmlResult = await psBridge.generateXMLTemplate(
      varName, this.xmlDatatype, coeffs.alignH, coeffs.alignV, layersJson
    );

    if (!xmlResult.success || !xmlResult.data) {
      this.showToast("生成失败: " + (xmlResult.error || "未知错误"), true);
      return;
    }

    this.xmlOutput.value = xmlResult.data;
    const copied = await psBridge.copyText(xmlResult.data);
    if (copied.success) {
      this.showToast("已生成 XML 并复制到剪贴板");
      this.setStatus("XML 生成成功，已复制");
    } else {
      this.showToast("已生成 XML，复制失败");
      this.setStatus("XML 生成成功，复制失败");
    }
  }

  /**
   * 复制 XML 输出
   */
  private async handleCopyXML(): Promise<void> {
    const text = this.xmlOutput.value;
    if (!text) {
      this.showToast("暂无可复制内容", true);
      return;
    }
    const result = await psBridge.copyText(text);
    if (result.success) {
      this.showToast("复制成功");
    } else {
      this.showToast("复制失败", true);
    }
  }

  /**
   * 排序图层
   * @param layers 图层数组
   * @param sortBy 排序类型
   * @returns 排序后的图层数组
   */
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

  /**
   * 格式化图层输出行
   * @param layer 图层信息
   * @param preset 预设配置
   * @returns 格式化后的字符串
   */
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

  /**
   * 复制输出文本到剪贴板
   * @param text 要复制的文本
   * @returns 是否复制成功
   */
  private async copyOutputText(text: string): Promise<boolean> {
    if (!text) return false;
    const copyResult = await psBridge.copyText(text);
    return !!copyResult.success;
  }

  /**
   * 复制当前输出文本
   */
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

  /**
   * 使用预设配置获取图层信息
   * @param preset 预设配置
   */
  private async fetchLayersWithConfig(preset: PresetConfig): Promise<void> {
    const result = await psBridge.getSelectedLayersInfo();
    if (!result.success || !result.data) {
      this.setStatus(`获取图层失败: ${result.error || "未知错误"}`, true);
      this.showToast("获取图层失败", true);
      return;
    }
    if (result.data.layers.length === 0) {
      this.outputText.value = "";
      this.setStatus("未选中图层", true);
      this.showToast("未选中图层", true);
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
      this.showToast(`获取成功：${sorted.length} 个图层${skippedCount ? `，跳过 ${skippedCount} 个图层组` : ""}`);
    } else {
      this.setStatus('已生成输出，但复制到剪贴板失败，请点击"复制输出"重试', true);
      this.showToast("复制到剪贴板失败", true);
    }
  }

  /**
   * 浏览按钮 - 选择导出文件夹
   */
  private async handleBrowsePath(): Promise<void> {
    const result = await psBridge.selectFolderDialog();
    if (result.success && result.data) {
      this.exportPath.value = result.data.path;
    }
  }

  /**
   * 获取导出公共参数
   */
  private getExportParams() {
    return {
      exportPath: this.exportPath.value.trim(),
      format: this.exportFormat.value as "PNGFormat" | "JPEG" | "bMPFormat",
      includeHidden: this.cbExportHidden.checked,
      exportXML: this.cbExportXML.checked,
      folderHierarchy: this.cbFolderHierarchy.checked
    };
  }

  /**
   * 从完整组路径中提取顶层组名（含尾部斜杠）
   * @param groupPath 如 "GroupA/SubGroup/"
   * @returns 如 "GroupA/"
   */
  private getRelativeGroupPath(groupPath: string, selectedGroupName: string): string {
    if (!groupPath || !selectedGroupName) return "";
    var parts = groupPath.replace(/\/$/, "").split("/");
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === selectedGroupName) {
        return parts.slice(i).join("/") + "/";
      }
    }
    return selectedGroupName + "/";
  }

  /** 从选中组路径列表中提取根组（不被其他选中组包含的组） */
  private getRootGroupPaths(selectedGroupPaths: string[]): string[] {
    if (selectedGroupPaths.length === 0) return [];
    var sorted = selectedGroupPaths.slice().sort(function(a, b) {
      return a.length - b.length;
    });
    var roots: string[] = [];
    for (var i = 0; i < sorted.length; i++) {
      var dominated = false;
      for (var j = 0; j < roots.length; j++) {
        if (sorted[i].indexOf(roots[j]) === 0) {
          dominated = true;
          break;
        }
      }
      if (!dominated) roots.push(sorted[i]);
    }
    return roots;
  }

  /** 根据根组路径计算相对路径 */
  private computeRelativePath(groupPath: string, rootGroupPaths: string[]): string {
    if (rootGroupPaths.length === 0) return "";
    for (var i = 0; i < rootGroupPaths.length; i++) {
      if (groupPath.indexOf(rootGroupPaths[i]) === 0) {
        var rootPath = rootGroupPaths[i];
        var lastSlash = rootPath.lastIndexOf("/", rootPath.length - 2);
        var parentLen = lastSlash >= 0 ? lastSlash + 1 : 0;
        return groupPath.substring(parentLen);
      }
    }
    return "";
  }

  /**
   * 导出选中图层（非组）
   */
  private async handleExportSelected(): Promise<void> {
    const params = this.getExportParams();
    if (!params.exportPath) {
      this.showToast("请先选择导出路径", true);
      return;
    }

    // 确保目录存在
    const dirResult = await psBridge.ensureDirectory(params.exportPath);
    if (!dirResult.success) {
      this.showToast("创建导出目录失败: " + dirResult.error, true);
      return;
    }

    // 保存历史快照
    const snapshot = await psBridge.saveHistoryState();
    if (!snapshot.success) {
      this.showToast("保存历史状态失败: " + snapshot.error, true);
      return;
    }

    // 收集图层
    const collectResult = await psBridge.collectLayersForExport(params.includeHidden);
    if (!collectResult.success || !collectResult.data) {
      this.showToast("收集图层失败: " + collectResult.error, true);
      await psBridge.restoreHistoryState();
      return;
    }

    const layers = collectResult.data.layers;
    if (layers.length === 0) {
      this.showToast("未选中图层（或选中的都是图层组）", true);
      await psBridge.restoreHistoryState();
      return;
    }

    // 计算根组路径（未勾选文件夹层级时使用）
    const selectedGroupPaths = collectResult.data.selectedGroupPaths || [];
    const rootGroupPaths = this.getRootGroupPaths(selectedGroupPaths);

    // 逐层导出
    this.showExportProgress(0, layers.length);
    const results: any[] = [];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const groupPath = params.folderHierarchy
        ? layer.groupPath
        : this.computeRelativePath(layer.groupPath, rootGroupPaths);
      const exportResult = await psBridge.exportSingleLayer(
        layer.id, params.exportPath, params.format, groupPath, params.includeHidden
      );
      if (exportResult.success && exportResult.data) {
        results.push(exportResult.data);
      }
      this.showExportProgress(i + 1, layers.length);
    }
    this.hideExportProgress();

    // 导出 XML
    if (params.exportXML && results.length > 0) {
      await psBridge.exportLayerInfoXML(params.exportPath, JSON.stringify(results));
    }

    // 恢复历史快照
    await psBridge.restoreHistoryState();

    this.renderExportResult(results);
    this.showToast(`已导出 ${results.length} 个文件`);
  }

  /**
   * 导出选中图层组
   */
  private async handleExportGroup(): Promise<void> {
    const params = this.getExportParams();
    if (!params.exportPath) {
      this.showToast("请先选择导出路径", true);
      return;
    }

    const dirResult = await psBridge.ensureDirectory(params.exportPath);
    if (!dirResult.success) {
      this.showToast("创建导出目录失败: " + dirResult.error, true);
      return;
    }

    const snapshot = await psBridge.saveHistoryState();
    if (!snapshot.success) {
      this.showToast("保存历史状态失败: " + snapshot.error, true);
      return;
    }

    // 收集选中图层组内的子图层
    const collectResult = await psBridge.collectGroupLayersForExport(params.includeHidden);
    if (!collectResult.success || !collectResult.data) {
      this.showToast("收集图层失败: " + collectResult.error, true);
      await psBridge.restoreHistoryState();
      return;
    }

    const layers = collectResult.data.layers;
    if (layers.length === 0) {
      this.showToast("选中的图层组内没有可导出的图层", true);
      await psBridge.restoreHistoryState();
      return;
    }

    // 计算根组路径（未勾选文件夹层级时使用）
    const selectedGroupPaths = collectResult.data.selectedGroupPaths || [];
    const rootGroupPaths = this.getRootGroupPaths(selectedGroupPaths);

    // 逐层导出
    this.showExportProgress(0, layers.length);
    const results: any[] = [];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const groupPath = params.folderHierarchy
        ? layer.groupPath
        : this.computeRelativePath(layer.groupPath, rootGroupPaths);
      const exportResult = await psBridge.exportSingleLayer(
        layer.id, params.exportPath, params.format, groupPath, params.includeHidden
      );
      if (exportResult.success && exportResult.data) {
        results.push(exportResult.data);
      }
      this.showExportProgress(i + 1, layers.length);
    }
    this.hideExportProgress();

    if (params.exportXML && results.length > 0) {
      await psBridge.exportLayerInfoXML(params.exportPath, JSON.stringify(results));
    }

    await psBridge.restoreHistoryState();

    this.renderExportResult(results);
    this.showToast(`已导出 ${results.length} 个文件`);
  }

  /**
   * 导出全部图层
   */
  private async handleExportAll(): Promise<void> {
    const params = this.getExportParams();
    if (!params.exportPath) {
      this.showToast("请先选择导出路径", true);
      return;
    }

    const dirResult = await psBridge.ensureDirectory(params.exportPath);
    if (!dirResult.success) {
      this.showToast("创建导出目录失败: " + dirResult.error, true);
      return;
    }

    const snapshot = await psBridge.saveHistoryState();
    if (!snapshot.success) {
      this.showToast("保存历史状态失败: " + snapshot.error, true);
      return;
    }

    const collectResult = await psBridge.collectAllLayersForExport(params.includeHidden);
    if (!collectResult.success || !collectResult.data) {
      this.showToast("收集图层失败: " + collectResult.error, true);
      await psBridge.restoreHistoryState();
      return;
    }

    const layers = collectResult.data.layers;
    if (layers.length === 0) {
      this.showToast("文档中没有可导出的图层", true);
      await psBridge.restoreHistoryState();
      return;
    }

    this.showExportProgress(0, layers.length);
    const results: any[] = [];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const exportResult = await psBridge.exportSingleLayer(
        layer.id, params.exportPath, params.format, layer.groupPath, params.includeHidden
      );
      if (exportResult.success && exportResult.data) {
        results.push(exportResult.data);
      }
      this.showExportProgress(i + 1, layers.length);
    }
    this.hideExportProgress();

    if (params.exportXML && results.length > 0) {
      await psBridge.exportLayerInfoXML(params.exportPath, JSON.stringify(results));
    }

    await psBridge.restoreHistoryState();

    this.renderExportResult(results);
    this.showToast(`已导出 ${results.length} 个文件`);
  }

  /**
   * 显示导出进度
   */
  private showExportProgress(current: number, total: number): void {
    this.exportProgress.style.display = "block";
    this.progressText.textContent = `导出中... ${current}/${total}`;
  }

  /**
   * 隐藏导出进度
   */
  private hideExportProgress(): void {
    this.exportProgress.style.display = "none";
  }

  /**
   * 渲染导出结果列表
   */
  private renderExportResult(results: any[]): void {
    const exported = results.filter(r => !r.skipped);
    if (exported.length === 0) {
      this.exportResultList.innerHTML = '<div class="empty-state">导出失败</div>';
      return;
    }
    this.exportResultList.innerHTML = exported.map(r =>
      `<div class="export-result-item">${this.escapeHtml(r.filePath)} (${r.w}×${r.h})</div>`
    ).join("");
  }

  /**
   * 设置状态栏消息
   * @param message 消息文本
   * @param isError 是否为错误消息
   */
  private setStatus(message: string, isError = false): void {
    this.statusBar.textContent = message;
    this.statusBar.className = "status-bar" + (isError ? " error" : " success");
  }

  /**
   * 显示 Toast 提示
   * @param message 提示消息
   * @param isError 是否为错误提示
   */
  private showToast(message: string, isError = false): void {
    const toast = document.createElement("div");
    toast.className = "toast" + (isError ? " error" : " success");
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    // 2 秒后开始淡出
    setTimeout(() => {
      toast.classList.add("fade-out");
      // 淡出动画结束后移除元素
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  }

  // ========== 模板输出 Tab 方法 ==========

  /**
   * 设置模板输出锚点
   * @param anchor 锚点类型
   */
  private setTplOutAnchor(anchor: AnchorType): void {
    this.tplOutAnchorSelect.value = anchor;
    this.tplOutAnchorGridSelector.querySelectorAll(".anchor-grid-cell").forEach((el) => {
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

  /**
   * 获取模板输出当前表单配置
   */
  private getTplOutFormConfig(): Omit<TemplateOutputPresetConfig, "id"> {
    return {
      name: this.tplOutPresetName.value.trim(),
      anchor: this.tplOutAnchorSelect.value as AnchorType,
      sortBy: this.tplOutSortSelect.value as SortType,
      template: this.tplOutTemplateInput.value
    };
  }

  /**
   * 从 localStorage 加载模板输出预设
   */
  private loadTemplateOutputPresets(): void {
    try {
      const raw = localStorage.getItem(LayerToolUI.TPL_OUT_PRESET_STORAGE_KEY);
      if (!raw) {
        this.tplOutPresets = [{
          id: "default",
          name: "默认",
          anchor: "topLeft",
          sortBy: "xAsc",
          template: '<Image src="{path[0]}{name[0]}.png" x="{x[0]}" y="{y[0]}" />\n<Image src="{path[1]}{name[1]}.png" x="{x[1]}" y="{y[1]}" />'
        }];
        this.persistTemplateOutputPresets();
        return;
      }
      const parsed = JSON.parse(raw) as TemplateOutputPresetConfig[];
      if (Array.isArray(parsed)) {
        this.tplOutPresets = parsed;
      }
    } catch {
      this.tplOutPresets = [];
    }
  }

  /**
   * 保存模板输出预设到 localStorage
   */
  private persistTemplateOutputPresets(): void {
    localStorage.setItem(LayerToolUI.TPL_OUT_PRESET_STORAGE_KEY, JSON.stringify(this.tplOutPresets));
  }

  /**
   * 保存模板输出预设
   */
  private saveTemplateOutputPreset(): void {
    const config = this.getTplOutFormConfig();
    if (!config.name) {
      this.setStatus("请先输入预设名称", true);
      return;
    }
    const idx = this.tplOutPresets.findIndex((p) => p.name === config.name);
    const preset: TemplateOutputPresetConfig = {
      ...config,
      id: idx >= 0 ? this.tplOutPresets[idx].id : String(Date.now())
    };
    if (idx >= 0) {
      this.tplOutPresets[idx] = preset;
    } else {
      this.tplOutPresets.push(preset);
    }
    this.persistTemplateOutputPresets();
    this.renderTemplateOutputPresetList();
    this.setStatus(`预设已保存：${config.name}`);
  }

  /**
   * 删除模板输出预设
   * @param presetId 预设 ID
   */
  private deleteTemplateOutputPreset(presetId: string): void {
    this.tplOutPresets = this.tplOutPresets.filter((p) => p.id !== presetId);
    this.persistTemplateOutputPresets();
    this.renderTemplateOutputPresetList();
    this.setStatus("预设已删除");
  }

  /**
   * 将模板输出预设应用到表单
   * @param preset 预设配置
   */
  private applyTemplateOutputPresetToForm(preset: TemplateOutputPresetConfig): void {
    this.tplOutPresetName.value = preset.name;
    this.setTplOutAnchor(preset.anchor);
    this.tplOutSortSelect.value = preset.sortBy;
    this.tplOutTemplateInput.value = preset.template;
  }

  /**
   * 渲染模板输出预设列表（仅生成 HTML，事件由 bindPresetListDelegation 委托）
   */
  private renderTemplateOutputPresetList(): void {
    if (this.tplOutPresets.length === 0) {
      this.tplOutPresetList.innerHTML = '<div class="empty-state">暂无预设</div>';
      return;
    }
    this.tplOutPresetList.innerHTML = this.tplOutPresets.map((preset) => {
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
  }

  /**
   * 重新排序模板输出预设
   * @param draggedId 被拖拽的预设 ID
   * @param targetId 目标位置的预设 ID
   */
  private reorderTemplateOutputPresets(draggedId: string, targetId: string): void {
    const draggedIdx = this.tplOutPresets.findIndex((p) => p.id === draggedId);
    const targetIdx = this.tplOutPresets.findIndex((p) => p.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const [draggedPreset] = this.tplOutPresets.splice(draggedIdx, 1);
    this.tplOutPresets.splice(targetIdx, 0, draggedPreset);
    this.persistTemplateOutputPresets();
    this.renderTemplateOutputPresetList();
    this.setStatus("预设顺序已更新");
  }

  /**
   * 渲染模板输出变量提示
   */
  private renderTemplateOutputHint(): void {
    const vars = [
      { key: "name[i]", desc: "图层名称" },
      { key: "type[i]", desc: "图层类型" },
      { key: "x[i]", desc: "锚点X坐标" },
      { key: "y[i]", desc: "锚点Y坐标" },
      { key: "width[i]", desc: "宽度" },
      { key: "height[i]", desc: "高度" },
      { key: "rotation[i]", desc: "旋转角度" },
      { key: "centerX[i]", desc: "中心X坐标" },
      { key: "centerY[i]", desc: "中心Y坐标" },
      { key: "path[i]", desc: "图层路径" },
      { key: "gapX[i]", desc: "与前一图层X间距" },
      { key: "gapY[i]", desc: "与前一图层Y间距" },
      { key: "fontSize[i]", desc: "字体大小" },
      { key: "fontColor[i]", desc: "字体颜色" },
      { key: "text[i]", desc: "文字内容" }
    ];
    this.tplOutTemplateHint.innerHTML = vars.map(v =>
      `<span class="hint-item"><span class="hint-var">{${v.key}}</span><span class="hint-desc">${v.desc}</span></span>`
    ).join("");
  }

  /**
   * 从 template.md 加载模板选项列表
   */
  private async loadTemplateOutputOptions(): Promise<void> {
    try {
      var cs = new (window as any).CSInterface();
      var extPath = cs.getSystemPath("extension");
      var filePath = extPath + "/dist/lib/template.md";
      var result = (window as any).cep.fs.readFile(filePath);
      if (result.err !== 0) {
        console.error("读取 template.md 失败，错误码：" + result.err);
        this.tplOutTemplateOptions = [];
        this.renderTemplateOutputOptions();
        return;
      }
      var raw = result.data as string;
      var hash = this.simpleHash(raw);
      var cacheKey = "layerTool.templateOptions.cache.v1";
      var cached = this.readCache(cacheKey);
      if (cached && cached.hash === hash) {
        this.tplOutTemplateOptions = cached.data as Array<{name: string, template: string}>;
      } else {
        var options = this.parseTemplateMd(raw);
        this.tplOutTemplateOptions = options;
        this.writeCache(cacheKey, hash, options);
      }
    } catch (e) {
      console.error("加载模板选项失败:", e);
      this.tplOutTemplateOptions = [];
    }
    this.renderTemplateOutputOptions();
  }

  /**
   * 解析 template.md 内容，提取模板选项列表
   */
  private parseTemplateMd(raw: string): Array<{name: string, template: string}> {
    var options: Array<{name: string, template: string}> = [];
    var nameRegex = /^name:`([^`]*)`$/;
    var lines = raw.split("\n");
    var i = 0;
    while (i < lines.length) {
      var line = lines[i].replace(/\r$/, "");
      var nameMatch = nameRegex.exec(line);
      if (nameMatch) {
        var name = nameMatch[1];
        var templateParts: string[] = [];
        i++;
        while (i < lines.length && lines[i].replace(/\r$/, "").trim() === "") { i++; }
        if (i < lines.length && lines[i].replace(/\r$/, "").trim() === "```") {
          i++;
          while (i < lines.length && lines[i].replace(/\r$/, "").trim() !== "```") {
            templateParts.push(lines[i].replace(/\r$/, ""));
            i++;
          }
          i++;
          var template = templateParts.join("\n").trim();
          if (template) {
            options.push({ name: name, template: template });
          }
        }
      } else {
        i++;
      }
    }
    return options;
  }

  /**
   * 渲染模板输出下拉列表选项
   */
  private renderTemplateOutputOptions(): void {
    this.tplOutTemplateSelectDropdown.innerHTML = "";
    this.tplOutTemplateOptions.forEach((opt, index) => {
      var option = document.createElement("div");
      option.className = "custom-select-option";
      option.textContent = opt.name;
      option.dataset.value = String(index);
      this.tplOutTemplateSelectDropdown.appendChild(option);
    });
    var customOption = document.createElement("div");
    customOption.className = "custom-select-option";
    customOption.textContent = "自定义";
    customOption.dataset.value = "custom";
    this.tplOutTemplateSelectDropdown.appendChild(customOption);
    if (this.tplOutTemplateOptions.length > 0) {
      this.updateTplOutTemplateSelectDisplay("0");
      this.tplOutTemplateInput.value = this.tplOutTemplateOptions[0].template;
    } else {
      this.updateTplOutTemplateSelectDisplay("-1");
    }
  }

  /**
   * 更新模板输出下拉显示
   */
  private updateTplOutTemplateSelectDisplay(value: string): void {
    var options = this.tplOutTemplateSelectDropdown.querySelectorAll(".custom-select-option");
    var displayText = "选择模板";
    options.forEach(function(opt) {
      var el = opt as HTMLDivElement;
      el.classList.remove("selected");
      if (el.dataset.value === value) {
        el.classList.add("selected");
        displayText = el.textContent || "选择模板";
      }
    });
    var valueSpan = this.tplOutTemplateSelectTrigger.querySelector(".select-value") as HTMLSpanElement;
    if (valueSpan) {
      valueSpan.textContent = displayText;
    }
    (this as any)._tplOutTemplateSelectValue = value;
  }

  /**
   * 获取模板输出下拉当前值
   */
  private getTplOutTemplateSelectValue(): string {
    return (this as any)._tplOutTemplateSelectValue || "-1";
  }

  /**
   * 切换模板输出下拉显示
   */
  private toggleTplOutTemplateSelect(): void {
    if (this.tplOutTemplateSelect.classList.contains("open")) {
      this.tplOutTemplateSelect.classList.remove("open");
    } else {
      this.tplOutTemplateSelect.classList.add("open");
    }
  }

  /**
   * 为模板变量提示容器绑定点击复制事件
   * @param container 提示容器元素
   */
  private bindHintCopy(container: HTMLDivElement): void {
    container.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement).closest(".hint-item");
      if (!item) return;
      const varEl = item.querySelector(".hint-var");
      if (!varEl) return;
      const varText = varEl.textContent || "";
      void psBridge.copyText(varText).then((result) => {
        if (result.success) {
          this.showToast("复制成功 " + varText);
        } else {
          this.showToast("复制失败", true);
        }
      });
    });
  }

  /**
   * 处理模板输出：获取图层信息并按模板生成输出
   */
  private async processTemplateOutput(): Promise<void> {
    const template = this.tplOutTemplateInput.value;
    if (!template) {
      this.setStatus("请先输入输出模板", true);
      this.showToast("请先输入输出模板", true);
      return;
    }

    const result = await psBridge.getSelectedLayersInfo();
    if (!result.success || !result.data) {
      this.setStatus(`获取图层失败: ${result.error || "未知错误"}`, true);
      this.showToast("获取图层失败", true);
      return;
    }
    if (result.data.layers.length === 0) {
      this.tplOutOutputText.value = "";
      this.setStatus("未选中图层", true);
      this.showToast("未选中图层", true);
      return;
    }

    const sortBy: SortType = this.tplOutSortSelect.value as SortType || "xAsc";
    const anchor: AnchorType = this.tplOutAnchorSelect.value as AnchorType || "topLeft";
    const sorted = this.sortLayers(result.data.layers, sortBy);

    // 计算每层的锚点坐标和间距
    const layerScopes: Record<string, string>[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const layer = sorted[i];
      const anchorXY = this.getAnchorXY(layer, anchor);
      const gapX = i === 0 ? 0 : anchorXY.x - this.getAnchorXY(sorted[i - 1], anchor).x;
      const gapY = i === 0 ? 0 : anchorXY.y - this.getAnchorXY(sorted[i - 1], anchor).y;
      layerScopes.push({
        name: layer.name,
        type: layer.layerType,
        x: String(anchorXY.x),
        y: String(anchorXY.y),
        width: String(layer.width),
        height: String(layer.height),
        rotation: String(layer.rotation),
        centerX: String(layer.centerX),
        centerY: String(layer.centerY),
        path: layer.path || "",
        text: layer.text?.content || "",
        fontSize: layer.text?.fontSize != null ? String(layer.text.fontSize) : "",
        fontColor: layer.text?.fontColor || "",
        gapX: String(gapX),
        gapY: String(gapY)
      });
    }

    const output = this.applyArrayTemplate(template, layerScopes);
    this.tplOutOutputText.value = output;

    const copied = await this.copyOutputText(output);
    const skippedCount = result.data.skipped.length;
    if (copied) {
      this.setStatus(`获取成功：${sorted.length} 个图层${skippedCount ? `，跳过 ${skippedCount} 个图层组` : ""}，已复制`);
      this.showToast(`获取成功：${sorted.length} 个图层${skippedCount ? `，跳过 ${skippedCount} 个图层组` : ""}`);
    } else {
      this.setStatus('已生成输出，但复制到剪贴板失败，请点击"复制输出"重试', true);
      this.showToast("复制到剪贴板失败", true);
    }
  }

  /**
   * 数组索引模板替换引擎
   * 将 {key[index]} 格式的占位符替换为对应图层的值
   * @param template 模板字符串
   * @param layers 图层数据数组
   * @returns 替换后的字符串
   */
  private applyArrayTemplate(template: string, layers: Record<string, string>[]): string {
    return template.replace(/\{(\w+)\[(\d+)\]\}/g, (_match, key, idx) => {
      const i = parseInt(idx, 10);
      if (i >= 0 && i < layers.length) {
        return layers[i][key] ?? "";
      }
      return "";
    });
  }

  /**
   * 复制模板输出文本
   */
  private async copyTemplateOutput(): Promise<void> {
    const text = this.tplOutOutputText.value;
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

  /**
   * HTML 转义
   * @param text 原始文本
   * @returns 转义后的 HTML 安全文本
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * 初始化面板
 */
document.addEventListener("DOMContentLoaded", () => {
  new LayerToolUI();
});
