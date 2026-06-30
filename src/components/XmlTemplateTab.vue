<template>
  <div>
    <SectionCollapsible sectionKey="tab4-var-config" title="变量配置">
      <div class="row">
        <label>变量名</label>
        <input type="text" v-model="varName" placeholder="例如：#battery_level" />
      </div>
      <div class="row">
        <label>数据类型</label>
        <div class="xml-datatype-group">
          <button
            v-for="dt in datatypes"
            :key="dt.value"
            :class="['btn', 'xml-datatype-btn', { active: datatype === dt.value }]"
            @click="datatype = dt.value; varName = defaults[dt.value] || ''"
          >{{ dt.label }}</button>
        </div>
      </div>
      <div class="row">
        <label>位置锚点</label>
        <AnchorGrid v-model="positionAnchor" />
      </div>
      <div class="row">
        <label>排序方式</label>
        <select v-model="sortBy">
          <option value="xAsc">按 X 升序</option>
          <option value="yAsc">按 Y 升序</option>
          <option value="psOrderBottomToTop">按PS图层顺序</option>
        </select>
      </div>
      <div class="row">
        <label>对齐方式</label>
        <AnchorGrid v-model="alignAnchor" />
      </div>
      <div class="row">
        <label>输出选项</label>
        <div class="output-options-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="includeRotation" @change="saveConfig" />
            <span>输出 rotation 属性</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="outputSize" @change="saveConfig" />
            <span>输出图片宽高</span>
          </label>
        </div>
      </div>
      <div class="row actions action-group">
        <button class="btn btn-primary" @click="handleGenerate">生成 XML 并复制</button>
      </div>
      <HintCollapsible hintKey="tab4-vars" title="常用变量">
        <div class="xml-vars-panel">
          <div class="xml-vars-list">
            <div v-for="v in xmlVars" :key="v.name" class="xml-var-item" @click="varName = v.name; showToast('已选择变量 ' + v.name)">
              <span class="var-name">{{ v.name }}</span>
              <span v-if="v.desc" class="var-desc">{{ v.desc }}</span>
              <span class="var-delete" title="删除" @click.stop="deleteVar(v.name)">×</span>
            </div>
          </div>
          <div class="xml-vars-actions">
            <button class="btn btn-sm" @click="showAddVarModal">+ 添加变量</button>
            <button class="btn btn-sm" @click="showResetConfirm">恢复默认</button>
          </div>
        </div>
      </HintCollapsible>
    </SectionCollapsible>

    <SectionCollapsible sectionKey="tab4-output" title="输出结果">
      <div class="row actions">
        <button class="btn" @click="handleCopyXML">复制输出</button>
      </div>
      <textarea v-model="xmlOutput" rows="10" readonly></textarea>
    </SectionCollapsible>

    <!-- 添加变量弹窗 -->
    <div v-if="addVarVisible" class="modal-overlay" @click.self="addVarVisible = false">
      <div class="modal-card">
        <div class="modal-title">添加自定义变量</div>
        <div class="modal-body">
          <div :class="['modal-field', { error: newVarError }]">
            <label class="modal-label">变量名 <span class="required">*</span></label>
            <input type="text" class="modal-input" v-model="newVarName" placeholder="例如：#myVar" autocomplete="off" />
            <div class="modal-error">变量名不能为空</div>
          </div>
          <div class="modal-field">
            <label class="modal-label">描述说明</label>
            <input type="text" class="modal-input" v-model="newVarDesc" placeholder="可选，用于说明变量用途" autocomplete="off" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="addVarVisible = false">取消</button>
          <button class="btn btn-primary" @click="addVar">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="confirmVisible" class="modal-overlay" @click.self="handleConfirmCancel">
      <div class="modal-card modal-card-sm">
        <div class="modal-title">{{ confirmTitle }}</div>
        <div class="modal-body">
          <div class="modal-message">{{ confirmMessage }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="handleConfirmCancel">取消</button>
          <button class="btn btn-primary" @click="handleConfirmOk">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { psBridge } from "../bridge";
import AnchorGrid from "./AnchorGrid.vue";
import SectionCollapsible from "./SectionCollapsible.vue";
import HintCollapsible from "./HintCollapsible.vue";
import { getAnchorXY, sortLayers, getAnchorCoefficients, getExtensionPathSync } from "../utils";
import type { AnchorType, SortType } from "../types";

const emit = defineEmits(["status"]);
const showToast = inject<(msg: string, isError?: boolean) => void>("showToast")!;

interface XmlVariable { name: string; desc: string; builtin: boolean; }
interface XmlTemplateConfig { vars: XmlVariable[]; includeRotation: boolean; outputSize: boolean; }

const CONFIG_KEY = "layerTool.xmlConfig.v1";

const DEFAULT_VARS: XmlVariable[] = [
  { name: "#battery_level", desc: "电量", builtin: true },
  { name: "#weatherTemp", desc: "当前温度", builtin: true },
  { name: "#dayTempgao2", desc: "最高温度", builtin: true },
  { name: "#nightTempdi2", desc: "最低温度", builtin: true },
  { name: "#dayTempgao2Yes", desc: "昨天最高温度", builtin: true },
  { name: "#nightTempdi2Yes", desc: "昨天最低温度", builtin: true },
  { name: "#dayTempgao2Tom", desc: "明天最高温度", builtin: true },
  { name: "#nightTempdi2Tom", desc: "明天最低温度", builtin: true },
  { name: "#humidityNum", desc: "湿度", builtin: true },
  { name: "#steps_value", desc: "步数", builtin: true },
  { name: "#jinnianDay", desc: "今年剩余天数", builtin: true },
  { name: "#benyueDay", desc: "本月剩余天数", builtin: true },
  { name: "#jinriHour", desc: "今日剩余小时数", builtin: true },
  { name: "#jinriMinute", desc: "当前小时剩余分钟数", builtin: true },
  { name: "#jinriSecond", desc: "当前分钟剩余秒数", builtin: true },
  { name: "#benzhouDay", desc: "本周剩余天数", builtin: true },
];

const datatypes = [
  { value: "percentage", label: "百分比" },
  { value: "temperature", label: "温度" },
  { value: "steps", label: "步数" },
];

const defaults: Record<string, string> = { percentage: "#battery_level", temperature: "#weatherTemp", steps: "#steps_value" };

const varName = ref("#battery_level");
const datatype = ref("percentage");
const positionAnchor = ref<AnchorType>("topLeft");
const sortBy = ref<SortType>("xAsc");
const alignAnchor = ref<AnchorType>("topLeft");
const includeRotation = ref(true);
const outputSize = ref(false);
const xmlOutput = ref("");
const xmlVars = ref<XmlVariable[]>(DEFAULT_VARS.map(v => ({ ...v })));

// 添加变量弹窗
const addVarVisible = ref(false);
const newVarName = ref("");
const newVarDesc = ref("");
const newVarError = ref(false);

// 确认弹窗
const confirmVisible = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmResolveFn: ((value: boolean) => void) | null = null;

function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmTitle.value = title;
    confirmMessage.value = message;
    confirmVisible.value = true;
    confirmResolveFn = resolve;
  });
}

function handleConfirmOk() {
  const fn = confirmResolveFn;
  confirmVisible.value = false;
  confirmResolveFn = null;
  fn?.(true);
}

function handleConfirmCancel() {
  const fn = confirmResolveFn;
  confirmVisible.value = false;
  confirmResolveFn = null;
  fn?.(false);
}

function showAddVarModal() {
  newVarName.value = "";
  newVarDesc.value = "";
  newVarError.value = false;
  addVarVisible.value = true;
}

async function persistConfig() {
  const config: XmlTemplateConfig = { vars: xmlVars.value, includeRotation: includeRotation.value, outputSize: outputSize.value };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  try {
    const extPath = getExtensionPathSync();
    if (extPath) {
      const dir = extPath + "/dist/lib/presets/tab4";
      await psBridge.ensureDirectory(dir);
      await psBridge.writeFile(dir + "/default.json", JSON.stringify(config, null, 2));
    }
  } catch { /* ignore */ }
}

function saveConfig() { void persistConfig(); }

// 加载配置
(async () => {
  try {
    const extPath = getExtensionPathSync();
    if (extPath) {
      const dir = extPath + "/dist/lib/presets/tab4";
      const filePath = dir + "/default.json";
      await psBridge.ensureDirectory(dir);
      const fileResult = await psBridge.readFile(filePath);
      if (fileResult.success && fileResult.data) {
        const parsed = fileResult.data as unknown as XmlTemplateConfig;
        if (parsed && Array.isArray(parsed.vars)) {
          xmlVars.value = parsed.vars;
          includeRotation.value = parsed.includeRotation !== undefined ? parsed.includeRotation : true;
          outputSize.value = parsed.outputSize !== undefined ? parsed.outputSize : false;
          localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
          return;
        }
      }
      const localRaw = localStorage.getItem(CONFIG_KEY);
      if (localRaw) {
        const parsed = JSON.parse(localRaw) as XmlTemplateConfig;
        if (parsed && Array.isArray(parsed.vars)) {
          xmlVars.value = parsed.vars;
          includeRotation.value = parsed.includeRotation !== undefined ? parsed.includeRotation : true;
          outputSize.value = parsed.outputSize !== undefined ? parsed.outputSize : false;
          await persistConfig();
          return;
        }
      }
      xmlVars.value = DEFAULT_VARS.map(v => ({ ...v }));
      await persistConfig();
    }
  } catch { xmlVars.value = DEFAULT_VARS.map(v => ({ ...v })); }
})();

async function handleGenerate() {
  const name = varName.value.trim();
  if (!name) { showToast("请输入变量名", true); return; }
  const result = await psBridge.getSelectedLayersInfo();
  if (!result.success || !result.data) { showToast("获取图层失败: " + (result.error || "未知错误"), true); return; }
  if (result.data.layers.length === 0) { showToast("请先选中图层", true); return; }

  const sorted = sortLayers(result.data.layers, sortBy.value);
  const positioned = sorted.map((layer) => {
    const anchorXY = getAnchorXY(layer, positionAnchor.value);
    return {
      x: anchorXY.x, y: anchorXY.y, width: layer.width, height: layer.height,
      name: layer.name, path: layer.path || "", id: layer.id,
      rotation: includeRotation.value ? layer.rotation : undefined,
    };
  });

  const coeffs = getAnchorCoefficients(alignAnchor.value);
  const layersJson = JSON.stringify({ layers: positioned });
  const sizeParam = outputSize.value ? "true" : "false";
  const xmlResult = await psBridge.generateXMLTemplate(name, datatype.value, coeffs.alignH, coeffs.alignV, layersJson, sizeParam);

  if (!xmlResult.success || !xmlResult.data) { showToast("生成失败: " + (xmlResult.error || "未知错误"), true); return; }
  xmlOutput.value = xmlResult.data;
  const copied = await psBridge.copyText(xmlResult.data);
  if (copied.success) { showToast("已生成 XML 并复制到剪贴板"); emit("status", "XML 生成成功，已复制"); }
  else { showToast("已生成 XML，复制失败"); emit("status", "XML 生成成功，复制失败"); }
}

async function handleCopyXML() {
  if (!xmlOutput.value) { showToast("暂无可复制内容", true); return; }
  const result = await psBridge.copyText(xmlOutput.value);
  showToast(result.success ? "复制成功" : "复制失败", !result.success);
}

async function addVar() {
  const name = newVarName.value.trim();
  if (!name) { newVarError.value = true; return; }
  if (xmlVars.value.some((v) => v.name === name)) { showToast("变量已存在", true); return; }
  xmlVars.value = [...xmlVars.value, { name, desc: newVarDesc.value.trim(), builtin: false }];
  await persistConfig();
  addVarVisible.value = false;
  showToast("已添加变量 " + name);
}

async function deleteVar(name: string) {
  xmlVars.value = xmlVars.value.filter((v) => v.name !== name);
  await persistConfig();
  showToast("已删除变量 " + name);
}

async function showResetConfirm() {
  const ok = await showConfirm("恢复默认变量", "确定要恢复默认变量列表吗？自定义变量将被保留。");
  if (!ok) return;
  const custom = xmlVars.value.filter((v) => !v.builtin);
  const defaultsCopy = DEFAULT_VARS.map(v => ({ ...v }));
  xmlVars.value = [...defaultsCopy, ...custom];
  await persistConfig();
  showToast("已恢复默认变量");
}
</script>

<style scoped>
.xml-datatype-group {
  display: flex;
}

.xml-datatype-group > * + * {
  margin-left: 6px;
}

.xml-datatype-btn {
  flex: 1;
}

.xml-datatype-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.output-options-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xml-vars-panel {
  padding: 0;
  overflow-x: auto;
}

.xml-vars-list {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.6;
  min-width: min-content;
}

.xml-vars-list > .xml-var-item {
  flex-shrink: 0;
}

.xml-vars-list > * {
  margin-right: 10px;
  margin-bottom: 6px;
}

.xml-vars-list > *:last-child {
  margin-right: 0;
}

.xml-var-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}

.xml-var-item:hover {
  background: var(--border);
}

.xml-var-item > * + * {
  margin-left: 6px;
}

.xml-var-item .var-name {
  color: var(--primary);
  font-family: Consolas, Monaco, monospace;
  white-space: nowrap;
}

.xml-var-item .var-desc {
  color: var(--text-muted);
  font-size: 10px;
  white-space: nowrap;
}

.xml-var-item .var-delete {
  visibility: hidden;
  margin-left: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  width: 12px;
}

.xml-var-item:hover .var-delete {
  visibility: visible;
}

.xml-var-item .var-delete:hover {
  color: #e74c3c;
}

.xml-vars-actions {
  display: flex;
  margin-top: 0;
  padding: 14px 0 10px 4px;
}

.xml-vars-actions .btn-sm {
  padding: 6px 12px;
  font-size: 10px;
}

.xml-vars-actions .btn-sm + .btn-sm {
  margin-left: 12px;
}

/* Modal 样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalFadeIn 0.15s ease;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 320px;
  max-width: 90%;
  box-shadow: var(--shadow);
  animation: modalSlideIn 0.15s ease;
}

.modal-card-sm {
  width: 280px;
}

.modal-title {
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  border-bottom: 1px solid var(--border);
}

.modal-body {
  padding: 16px;
}

.modal-body > * + * {
  margin-top: 12px;
}

.modal-field {
  display: flex;
  flex-direction: column;
}

.modal-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.modal-label .required {
  color: var(--error);
}

.modal-input {
  height: 32px;
  padding: 0 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-main);
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.modal-input:focus {
  border-color: var(--primary);
  background: var(--bg-input-focus);
}

.modal-input::placeholder {
  color: var(--text-muted);
}

.modal-error {
  display: none;
  font-size: 10px;
  color: var(--error);
  margin-top: 4px;
}

.modal-field.error .modal-input {
  border-color: var(--error);
}

.modal-field.error .modal-error {
  display: block;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.modal-actions > * + * {
  margin-left: 8px;
}

.modal-message {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
