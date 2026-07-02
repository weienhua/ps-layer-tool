<template>
  <div>
    <SectionCollapsible sectionKey="tab1-preset-form" title="预设配置">
      <div class="row">
        <label>预设名</label>
        <input type="text" v-model="presetName" placeholder="例如：UI导出模板" />
      </div>
      <div class="row">
        <label>位置锚点</label>
        <AnchorGrid v-model="anchor" />
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
        <label>缩放动画</label>
        <input type="text" v-model="scaleAnim" placeholder='例如：(1-0.1*sin((#loop-100*0)/300))' />
      </div>
      <div class="row">
        <label>旋转动画</label>
        <input type="text" v-model="rotateAnim" placeholder='例如：(5*sin((#loop-100*0)/300))' />
      </div>
      <div class="row">
        <label>输出模板</label>
        <CustomSelect :options="templateOptions" :modelValue="templateSelectValue" @update:modelValue="handleTemplateSelectChange" />
        <textarea v-model="templateInput" rows="4" placeholder='例如：x="{x}" y="{y}" w="{width}" h="{height}"'></textarea>
        <HintCollapsible hintKey="tab1-vars" title="模板变量提示">
          <div class="template-hint">
            <span v-for="v in TEMPLATE_VARS" :key="v.key" class="hint-item" @click="copyVar('{' + v.key + '}')">
              <span class="hint-var">{{ '{' + v.key + '}' }}</span>
              <span class="hint-desc">{{ v.desc }}</span>
            </span>
            <div class="hint-rules">
              <strong>表达式规则：</strong>仅数字字段可用（i, x, y, width, height, rotation, centerX, centerY, fontSize），
              支持 <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>%</code> 和括号。
              示例：<code>{i+1}</code> <code>{width*2}</code> <code>{(i+1)*100}</code>。
              字符串字段（name, path 等）不可参与计算。
            </div>
            <div class="hint-rules">
              <strong>支持的函数：</strong>
              <code>round(x)</code> 四舍五入 · <code>round(x,n)</code> 保留n位小数 · <code>ceil(x)</code> 向上取整 ·
              <code>floor(x)</code> 向下取整 · <code>int(x)</code> 取整数部分 · <code>abs(x)</code> 绝对值 ·
              <code>min(a,b)</code> 最小值 · <code>max(a,b)</code> 最大值 · <code>rand()</code> 随机数(0-1) ·
              <code>pow(x,y)</code> x的y次方 · <code>sqrt(x)</code> 平方根
              <br />示例：<code>{round(width/2)}</code> <code>{int(rand()*10)}</code> <code>{max(x,y)}</code>
            </div>
          </div>
        </HintCollapsible>
      </div>
      <div class="row actions action-group">
        <button class="btn btn-primary" @click="fetchLayers">获取选中图层信息</button>
        <button class="btn" @click="handleSavePreset">保存预设</button>
      </div>
    </SectionCollapsible>

    <SectionCollapsible sectionKey="tab1-output" title="输出结果">
      <div class="row actions">
        <button class="btn" @click="copyOutput">复制输出</button>
      </div>
      <textarea v-model="outputText" rows="8" readonly></textarea>
    </SectionCollapsible>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { psBridge, SelectedLayerInfo } from "../bridge";
import AnchorGrid from "./AnchorGrid.vue";
import CustomSelect from "./CustomSelect.vue";
import SectionCollapsible from "./SectionCollapsible.vue";
import HintCollapsible from "./HintCollapsible.vue";
import type { AnchorType, SortType, PresetCardData } from "../types";
import { applyTemplate, getAnchorXY, sortLayers } from "../utils";

const emit = defineEmits(["status", "save-preset"]);
const showToast = inject<(msg: string, isError?: boolean) => void>("showToast")!;

interface LayerInfoPresetConfig {
  id: string;
  name: string;
  anchor: AnchorType;
  sortBy: SortType;
  scaleAnim: string;
  rotateAnim: string;
  template: string;
}

const TEMPLATE_VARS = [
  { key: "i", desc: "图层序号" }, { key: "name", desc: "图层名称" },
  { key: "acname", desc: "去_数字后缀" }, { key: "type", desc: "图层类型" },
  { key: "x", desc: "锚点X" }, { key: "y", desc: "锚点Y" },
  { key: "width", desc: "宽度" }, { key: "height", desc: "高度" },
  { key: "rotation", desc: "旋转角度" }, { key: "centerX", desc: "中心X" },
  { key: "centerY", desc: "中心Y" }, { key: "path", desc: "图层路径" },
  { key: "scaleAnim", desc: "缩放动画" }, { key: "rotateAnim", desc: "旋转动画" },
  { key: "fontSize", desc: "字体大小" }, { key: "fontColor", desc: "字体颜色" },
  { key: "text", desc: "文字内容" },
];

const presetName = ref("");
const anchor = ref<AnchorType>("topLeft");
const sortBy = ref<SortType>("xAsc");
const scaleAnim = ref("");
const rotateAnim = ref("");
const templateInput = ref("");
const templateSelectValue = ref("0");
const outputText = ref("");
const templatePresets = ref<string[]>([]);

// 加载模板预设
(async () => {
  try {
    const cs = new (window as any).CSInterface();
    const extPath = cs.getSystemPath("extension");
    const filePath = extPath + "/dist/lib/presets.md";
    const result = (window as any).cep.fs.readFile(filePath);
    if (result.err !== 0) return;
    const raw = result.data as string;
    const blocks = raw.split("```");
    const list: string[] = [];
    for (let bi = 1; bi < blocks.length; bi += 2) {
      const blockContent = blocks[bi].replace(/^\r?\n/, "").replace(/\r?\n$/, "");
      if (blockContent.split("\n")[0].trim().startsWith("example")) continue;
      const lines = blocks[bi].split("\n").map((l: string) => l.replace(/\r$/, "")).filter((l: string) => l.trim() !== "");
      list.push(...lines);
    }
    templatePresets.value = list;
    if (list.length > 0) templateInput.value = list[0];
  } catch { /* ignore */ }
})();

const templateOptions = computed(() => [
  ...templatePresets.value.map((t, i) => ({ label: t, value: String(i) })),
  { label: "自定义", value: "custom" },
]);

function handleTemplateSelectChange(value: string) {
  templateSelectValue.value = value;
  if (value === "custom") {
    templateInput.value = 'x="{x}" y="{y}" ';
  } else {
    const idx = parseInt(value, 10);
    templateInput.value = templatePresets.value[idx] || "";
  }
}


function formatLayerLine(layer: SelectedLayerInfo, preset: LayerInfoPresetConfig, index: number): string {
  const anchorXY = getAnchorXY(layer, preset.anchor);
  const baseScope: Record<string, string> = {
    name: layer.name, acname: layer.acname, type: layer.layerType,
    x: String(anchorXY.x), y: String(anchorXY.y),
    width: String(layer.width), height: String(layer.height),
    rotation: String(layer.rotation), centerX: String(layer.centerX), centerY: String(layer.centerY),
    path: layer.path || "", text: layer.text?.content || "",
    fontSize: layer.text?.fontSize != null ? String(layer.text.fontSize) : "",
    fontColor: layer.text?.fontColor || "", i: String(index),
  };
  const baseNumericScope: Record<string, number> = {
    i: index, x: anchorXY.x, y: anchorXY.y,
    width: layer.width, height: layer.height, rotation: layer.rotation,
    centerX: layer.centerX, centerY: layer.centerY,
    fontSize: layer.text?.fontSize != null ? layer.text.fontSize : 0,
  };
  const sAnim = applyTemplate(preset.scaleAnim, baseScope, baseNumericScope);
  const rAnim = applyTemplate(preset.rotateAnim, baseScope, baseNumericScope);
  return applyTemplate(preset.template, { ...baseScope, scaleAnim: sAnim, rotateAnim: rAnim }, baseNumericScope);
}

async function fetchLayers() {
  const preset: LayerInfoPresetConfig = {
    id: "current", name: presetName.value, anchor: anchor.value,
    sortBy: sortBy.value, scaleAnim: scaleAnim.value, rotateAnim: rotateAnim.value,
    template: templateInput.value,
  };
  const result = await psBridge.getSelectedLayersInfo();
  if (!result.success || !result.data) {
    emit("status", `获取图层失败: ${result.error || "未知错误"}`, true);
    showToast("获取图层失败", true);
    return;
  }
  if (result.data.layers.length === 0) {
    outputText.value = "";
    emit("status", "未选中图层", true);
    showToast("未选中图层", true);
    return;
  }
  const sorted = sortLayers(result.data.layers, preset.sortBy);
  const lines = sorted.map((layer, i) => formatLayerLine(layer, preset, i));
  const output = lines.join("\n");
  outputText.value = output;
  const copyResult = await psBridge.copyText(output);
  const skipped = result.data.skipped.length;
  if (copyResult.success) {
    emit("status", `获取成功：${sorted.length} 个图层${skipped ? `，跳过 ${skipped} 个图层组` : ""}，已复制`);
    showToast(`获取成功：${sorted.length} 个图层${skipped ? `，跳过 ${skipped} 个图层组` : ""}`);
  } else {
    emit("status", '已生成输出，但复制到剪贴板失败，请点击"复制输出"重试', true);
    showToast("复制到剪贴板失败", true);
  }
}

function handleSavePreset() {
  if (!presetName.value.trim()) { emit("status", "请先输入预设名称", true); return; }
  const config: PresetCardData = {
    id: "", name: presetName.value.trim(), anchor: anchor.value,
    sortBy: sortBy.value, template: templateInput.value, tab: 'layerInfo',
  };
  emit("save-preset", config);
}

/**
 * 应用预设配置（供外部调用）
 */
function applyPresetConfig(preset: PresetCardData) {
  presetName.value = preset.name;
  anchor.value = preset.anchor as AnchorType;
  sortBy.value = preset.sortBy as SortType;
  // 尝试匹配模板预设
  let matched = false;
  for (let i = 0; i < templatePresets.value.length; i++) {
    if (templatePresets.value[i] === preset.template) {
      templateSelectValue.value = String(i);
      templateInput.value = templatePresets.value[i];
      matched = true;
      break;
    }
  }
  if (!matched) {
    templateSelectValue.value = "custom";
    templateInput.value = preset.template;
  }
}

/**
 * 应用预设并执行获取（供外部调用）
 */
async function applyAndFetch(preset: PresetCardData) {
  applyPresetConfig(preset);
  await fetchLayers();
}

async function copyOutput() {
  if (!outputText.value) { emit("status", "暂无可复制内容", true); return; }
  const ok = await psBridge.copyText(outputText.value);
  emit("status", ok ? "复制成功" : "复制失败，请检查 Photoshop 状态", !ok);
}

async function copyVar(varText: string) {
  const result = await psBridge.copyText(varText);
  if (result.success) showToast("复制成功 " + varText);
  else showToast("复制失败", true);
}

// 暴露方法供父组件调用
defineExpose({
  applyPresetConfig,
  applyAndFetch,
  fetchLayers,
});
</script>

<style scoped>
.preset-form {
  display: flex;
  flex-direction: column;
}

.preset-form > :deep(* + *) {
  margin-top: 6px;
}

.template-hint {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.6;
}

.template-hint > * {
  margin-right: 10px;
  margin-bottom: 6px;
}

.template-hint .hint-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: var(--bg-card);
  border-radius: 4px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}

.template-hint .hint-item > * + * {
  margin-left: 3px;
}

.template-hint .hint-item:hover {
  background: var(--border);
}

.template-hint .hint-var,
.template-hint .hint-desc {
  white-space: nowrap;
}

.template-hint .hint-rules {
  width: 100%;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--border);
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.template-hint .hint-rules code {
  background: var(--bg-card);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  color: var(--text);
}
</style>
