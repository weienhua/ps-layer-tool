<template>
  <div>
    <SectionCollapsible sectionKey="tab5-curve-fit" title="曲线拟合">
      <div class="curve-fit-content">
    <!-- 模式切换 -->
    <div class="mode-switch">
      <button :class="['mode-btn', { active: state.mode.value === 'draw' }]" @click="onModeSwitch('draw')">
        ✏️ 手绘模式
      </button>
      <button :class="['mode-btn', { active: state.mode.value === 'expression' }]" @click="onModeSwitch('expression')">
        📐 表达式模式
      </button>
    </div>

    <!-- 表达式输入框（表达式模式下显示） -->
    <div v-if="state.mode.value === 'expression'" class="expr-row">
      <label class="expr-label">表达式:</label>
      <input
        v-model="state.expressionInput.value"
        class="expr-input"
        type="text"
        placeholder="y = sin(x) + 0.5*x"
        @keydown.enter="onGenerate"
      />
      <button class="btn btn-primary" :disabled="state.computing.value" @click="onGenerate">
        生成曲线
      </button>
    </div>

    <!-- Canvas 画布 -->
    <FunctionCanvas
      :rawPoints="state.rawPoints.value"
      :smoothedPoints="state.smoothedPoints.value"
      :fitResult="state.result.value"
      :computing="state.computing.value"
      :mode="state.mode.value"
      @drawComplete="onDrawComplete"
      @curveDeformed="onCurveDeformed"
    />

    <!-- 形态分类推荐 -->
    <div v-if="state.classification.value" class="recommendation">
      💡 推荐：{{ state.classification.value.description }}
      <button class="btn btn-sm btn-outline" @click="state.applyRecommendation()">应用推荐</button>
    </div>

    <!-- 基函数复选框 -->
    <div class="basis-checkboxes">
      <label class="checkbox-label">
        <input type="checkbox" v-model="state.config.polyEnabled" @change="onConfigChanged" />
        多项式
      </label>
      <label class="degree-label" v-if="state.config.polyEnabled">
        阶数: {{ state.config.polyDegree }}
        <input type="range" min="1" max="5" step="1" v-model.number="state.config.polyDegree" @change="onConfigChanged" class="degree-slider" />
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="state.config.trigEnabled" @change="onConfigChanged" />
        三角函数
      </label>
      <label class="checkbox-label">
        <input type="checkbox" v-model="state.config.expEnabled" @change="onConfigChanged" />
        指数
      </label>
      <label class="precision-label">
        精度:
        <input type="number" min="0" max="10" v-model.number="state.config.precision" @change="onConfigChanged" class="precision-input" />
      </label>
    </div>

    <!-- 操作按钮 -->
    <div class="action-row">
      <button class="btn btn-secondary" @click="onClear">清除画布</button>
      <button
        v-if="state.expression.value"
        class="btn btn-primary"
        @click="onCopyExpression"
      >复制表达式</button>
    </div>

    <!-- 拟合结果 -->
    <div v-if="state.result.value" class="result-card">
      <div class="result-title">拟合结果</div>
      <div class="result-expr">{{ state.expression.value }}</div>
      <div class="result-r2">R² = {{ state.r2.value.toFixed(4) }}</div>
    </div>

    <!-- 加载指示 -->
    <div v-if="state.computing.value" class="computing-hint">计算中...</div>
  </div>
  </SectionCollapsible>
  </div>
</template>

<script setup lang="ts">
import SectionCollapsible from "./SectionCollapsible.vue";
import FunctionCanvas from "./FunctionCanvas.vue";
import { useCurveFit } from "../composables/useCurveFit";
import { useToast } from "../composables/useToast";
import { psBridge } from "../bridge";
import type { Point2D } from "../algo/curveFit";

// ============================================================================
// 状态管理
// ============================================================================

const state = useCurveFit();
const showToast = useToast();

// ============================================================================
// 事件处理
// ============================================================================

/** 手绘完成 */
function onDrawComplete(points: Point2D[]): void {
  state.setRawPoints(points);
}

/** 曲线拖拽变形 */
function onCurveDeformed(index: number, point: Point2D): void {
  state.deformCurveAt(index, point);
}

/** 表达式生成 */
function onGenerate(): void {
  var expr = state.expressionInput.value.trim();
  if (!expr) {
    showToast("请输入表达式", true);
    return;
  }
  var success = state.generateFromExpression(expr, -5, 5, 100);
  if (!success) {
    showToast("表达式语法错误", true);
  }
}

/** 复选框变化 */
function onConfigChanged(): void {
  if (state.config.precision < 0) state.config.precision = 0;
  state.runFit();
}

/** 切换模式 */
function onModeSwitch(mode: "draw" | "expression"): void {
  state.switchMode(mode);
}

/** 清除 */
function onClear(): void {
  state.clear();
}

/** 复制表达式到剪贴板 */
async function onCopyExpression(): Promise<void> {
  var expr = state.expression.value;
  if (!expr) return;
  var result = await psBridge.copyText(expr);
  if (result.success) {
    showToast("表达式已复制到剪贴板");
  } else {
    showToast("复制失败，请手动复制", true);
  }
}

</script>

<style scoped>
.curve-fit-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-switch {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn:hover {
  color: var(--text-secondary);
  border-color: var(--text-muted);
}

.mode-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.expr-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expr-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.expr-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  font-family: monospace;
}

.expr-input::placeholder {
  color: var(--text-muted);
}

.recommendation {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  font-size: 13px;
  color: #93c5fd;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 11px;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: #fff;
}

.basis-checkboxes {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.degree-label {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.degree-slider {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-input);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.degree-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  border: 2px solid #fff;
}

.action-row {
  display: flex;
  gap: 8px;
}

.result-card {
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.result-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-expr {
  font-size: 14px;
  font-family: monospace;
  color: #4ade80;
  word-break: break-all;
  margin-bottom: 4px;
}

.result-r2 {
  font-size: 12px;
  color: var(--text-secondary);
}

.precision-label {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.precision-input {
  width: 44px;
  height: 24px;
  padding: 0 4px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.computing-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
