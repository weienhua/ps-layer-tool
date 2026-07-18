/**
 * 曲线拟合状态管理 composable
 *
 * 管理手绘/表达式双模式下的拟合状态，包括：
 * - 采样点（原始/平滑）
 * - 拟合配置和结果
 * - 形态分类推荐
 * - 模式切换
 * - 控制点拖拽
 */

import { ref, reactive, computed, watch } from "vue";
import { combinedFit, smoothPoints, sampleCurve, type Point2D, type FitConfig, type FitResult } from "../algo/curveFit";
import { classifyCurve, type ClassifyResult } from "../algo/functionClassify";

/** 工作模式 */
export type FitMode = "draw" | "expression";

/** 拟合状态 */
export interface CurveFitState {
  /** 原始采样点（来自手绘或表达式生成） */
  rawPoints: Point2D[];
  /** 平滑后的点 */
  smoothedPoints: Point2D[];
  /** 当前拟合配置 */
  config: FitConfig;
  /** 当前拟合结果 */
  result: FitResult | null;
  /** 形态分类推荐 */
  classification: ClassifyResult | null;
  /** 当前工作模式 */
  mode: FitMode;
  /** 表达式模式下的输入表达式 */
  expressionInput: string;
  /** 是否正在计算中 */
  computing: boolean;
}

/** 默认拟合配置 */
const DEFAULT_CONFIG: FitConfig = {
  polyEnabled: true,
  polyDegree: 2,
  trigEnabled: false,
  expEnabled: false,
  precision: 3,
};

/** 从 localStorage 加载持久化配置 */
function loadConfig(): Record<string, unknown> | null {
  try {
    var raw = localStorage.getItem("layerTool.curveFitConfig.v1");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * useCurveFit composable
 */
export function useCurveFit() {
  // ===== 响应式状态 =====
  const rawPoints = ref<Point2D[]>([]);
  const smoothedPoints = ref<Point2D[]>([]);
  const config = reactive<FitConfig>({ ...DEFAULT_CONFIG });
  const result = ref<FitResult | null>(null);
  const classification = ref<ClassifyResult | null>(null);
  const mode = ref<FitMode>("draw");
  const expressionInput = ref("");
  const computing = ref(false);
  const variableName = ref("x");

  // ===== 持久化：从 localStorage 恢复配置和模式 =====
  var STORAGE_KEY = "layerTool.curveFitConfig.v1";
  var saved = loadConfig();
  if (saved) {
    if (typeof saved.polyEnabled === "boolean") config.polyEnabled = saved.polyEnabled;
    if (typeof saved.polyDegree === "number") config.polyDegree = saved.polyDegree;
    if (typeof saved.trigEnabled === "boolean") config.trigEnabled = saved.trigEnabled;
    if (typeof saved.expEnabled === "boolean") config.expEnabled = saved.expEnabled;
    if (typeof saved.precision === "number") config.precision = saved.precision;
    if (saved.mode === "draw" || saved.mode === "expression") mode.value = saved.mode;
    if (typeof saved.variableName === "string" && saved.variableName.length > 0) variableName.value = saved.variableName;
  }

  // 监听配置变化，自动保存
  watch(
    () => ({ ...config, mode: mode.value, variableName: variableName.value }),
    function (val) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)); } catch (e) { /* ignore */ }
    },
    { deep: true }
  );

  // ===== 计算属性 =====
  const hasPoints = computed(() => rawPoints.value.length > 0);
  const expression = computed(() => result.value?.expression || "");
  const r2 = computed(() => result.value?.rSquared || 0);
  const curvePoints = computed(() => result.value?.curvePoints || []);

  // ===== 操作 =====

  /**
   * 设置原始采样点（手绘完成后调用）
   * 自动进行平滑、重采样、拟合和分类推荐
   */
  function setRawPoints(points: Point2D[]): void {
    rawPoints.value = points;

    if (points.length < 2) {
      smoothedPoints.value = [];
      result.value = null;
      classification.value = null;
      return;
    }

    // 平滑
    var smoothed = smoothPoints(points, 5);
    // 重采样（最多 200 个点）
    var sampled = points.length > 200 ? sampleCurve(smoothed, 200) : smoothed;
    smoothedPoints.value = sampled;

    // 形态分类推荐
    var cls = classifyCurve(sampled);
    classification.value = cls;

    // 自动应用高置信度线性推荐（仅当配置为出厂默认值时）
    // 避免用户手绘直线后仍需手动点击"应用推荐"按钮
    var isDefaultConfig =
      config.polyEnabled === true &&
      config.polyDegree === 2 &&
      config.trigEnabled === false &&
      config.expEnabled === false;

    if (isDefaultConfig && cls.confidence.polynomial > 0.8 && cls.recommendedDegree === 1) {
      config.polyDegree = 1;
    }

    // 使用用户当前配置执行拟合
    runFit(sampled);
  }

  /**
   * 根据表达式生成采样点
   * @param expr 数学表达式字符串，如 "y = sin(x) + 0.5*x"
   * @param xMin x 范围最小值
   * @param xMax x 范围最大值
   * @param count 采样点数
   */
  function generateFromExpression(expr: string, xMin: number, xMax: number, count: number): boolean {
    // 移除 y = 前缀
    var cleanExpr = expr.trim();
    if (cleanExpr.startsWith("y = ") || cleanExpr.startsWith("y=")) {
      cleanExpr = cleanExpr.substring(cleanExpr.indexOf("=") + 1).trim();
    }

    // 使用 MathExpr 逐点求值
    // 注意：需要动态导入以避免循环依赖，这里使用简单的 eval 替代方案
    // 实际上直接用 Function 构造求值函数
    try {
      // 构建求值函数（受限的 math 环境）
      var compiled = compileExpression(cleanExpr);
      if (!compiled.fn) return false;

      // 自动填入检测到的变量名
      variableName.value = compiled.varName;

      var points: Point2D[] = [];
      var step = (xMax - xMin) / (count - 1);
      for (var i = 0; i < count; i++) {
        var x = xMin + i * step;
        var y = compiled.fn(x);
        if (isNaN(y) || !isFinite(y)) return false;
        points.push({ x: x, y: y });
      }
      setRawPoints(points);
      expressionInput.value = expr;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 执行拟合
   */
  function runFit(points?: Point2D[]): void {
    var pts = points || smoothedPoints.value;
    if (pts.length < 2) {
      result.value = null;
      return;
    }

    computing.value = true;
    try {
      var fitResult = combinedFit(pts, { ...config });
      result.value = fitResult;
      // 自动填入表达式输入框
      expressionInput.value = fitResult.expression;
    } catch (e) {
      result.value = null;
    } finally {
      computing.value = false;
    }
  }

  /**
   * 应用拟合配置并重新拟合
   */
  function applyConfig(newConfig: FitConfig): void {
    config.polyEnabled = newConfig.polyEnabled;
    config.polyDegree = newConfig.polyDegree;
    config.trigEnabled = newConfig.trigEnabled;
    config.expEnabled = newConfig.expEnabled;
  }

  /**
   * 应用形态分类推荐
   */
  function applyRecommendation(): void {
    if (classification.value) {
      applyConfig(classification.value.config);
      runFit();
    }
  }

  /**
   * 切换模式
   */
  function switchMode(newMode: FitMode): void {
    mode.value = newMode;
  }

  /**
   * 清除所有数据
   */
  function clear(): void {
    rawPoints.value = [];
    smoothedPoints.value = [];
    result.value = null;
    classification.value = null;
    expressionInput.value = "";
  }

  /**
   * 拖拽曲线上某点，以高斯影响半径扩散位移到周围点，然后重新拟合
   * @param index 在 smoothedPoints 中的索引
   * @param newPoint 新位置（数据坐标）
   */
  function deformCurveAt(index: number, newPoint: Point2D): void {
    var pts = smoothedPoints.value;
    if (pts.length < 2 || index < 0 || index >= pts.length) return;

    var oldPoint = pts[index];
    var dx = newPoint.x - oldPoint.x;
    var dy = newPoint.y - oldPoint.y;

    // 高斯影响半径：sigma = 总点数的 1/6
    var sigma = pts.length / 6;
    if (sigma < 2) sigma = 2;
    var sigma2 = 2 * sigma * sigma;

    var newPts: Point2D[] = [];
    for (var i = 0; i < pts.length; i++) {
      var dist = i - index;
      var weight = Math.exp(-(dist * dist) / sigma2);
      newPts.push({
        x: pts[i].x + dx * weight,
        y: pts[i].y + dy * weight,
      });
    }
    smoothedPoints.value = newPts;
    runFit(newPts);
  }

  return {
    // 状态
    rawPoints,
    smoothedPoints,
    config,
    result,
    classification,
    mode,
    expressionInput,
    computing,
    variableName,
    // 计算属性
    hasPoints,
    expression,
    r2,
    curvePoints,
    // 操作
    setRawPoints,
    generateFromExpression,
    runFit,
    applyConfig,
    applyRecommendation,
    switchMode,
    clear,
    deformCurveAt,
  };
}

// ============================================================================
// 表达式求值辅助
// ============================================================================

/** 合法 JS 标识符正则 */
var VALID_ID_RE = /^[a-zA-Z_$][\w$]*$/;

/** 已知数学函数名（用于排除，不作为变量名） */
var KNOWN_FUNCTIONS: Record<string, boolean> = {
  sin: true, cos: true, tan: true,
  abs: true, sqrt: true, pow: true, exp: true, log: true, log10: true,
  round: true, ceil: true, floor: true,
  PI: true, E: true,
};

/**
 * 从表达式中检测独立变量名（支持 # 前缀，如 #cur_listan）
 * 排除已知数学函数名，取出现频率最高的标识符作为变量名
 */
function detectVariable(expr: string): string {
  var ids = expr.match(/#?[a-zA-Z_]\w*/g);
  if (!ids || ids.length === 0) return "x";

  var freq: Record<string, number> = {};
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (!KNOWN_FUNCTIONS[id]) {
      freq[id] = (freq[id] || 0) + 1;
    }
  }

  var keys = Object.keys(freq);
  if (keys.length === 0) return "x";

  // 取出现次数最多的
  var best = keys[0];
  for (var k = 1; k < keys.length; k++) {
    if (freq[keys[k]] > freq[best]) best = keys[k];
  }
  return best;
}

/** 全局字符串替换（ES3 兼容，split + join） */
function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

/**
 * 将数学表达式字符串编译为可调用的函数，并返回检测到的变量名
 *
 * 支持的数学语法：
 * - x^N → pow(x, N)
 * - 隐式乘法：2x → 2*x, x(x+1) → x*(x+1), 2sin(x) → 2*sin(x)
 * - sin/cos/tan/sqrt/abs/exp/log/round/ceil/floor/pow
 * - e^(expr) → exp(expr)
 * - 自动检测变量名（支持 # 前缀）
 */
function compileExpression(rawExpr: string): { fn: ((x: number) => number) | null; varName: string } {
  try {
    // 1. 检测原始变量名
    var varName = detectVariable(rawExpr);

    // 2. 归一化：将变量名替换为 x（mathToJS 只处理 x）
    var normalized = rawExpr;
    if (varName !== "x") {
      normalized = replaceAll(rawExpr, varName, "x");
    }

    var jsExpr = mathToJS(normalized);
    var body = [
      "'use strict';",
      "var sin = Math.sin, cos = Math.cos, tan = Math.tan,",
      "abs = Math.abs, sqrt = Math.sqrt, pow = Math.pow,",
      "exp = Math.exp, log = Math.log, log10 = Math.log10,",
      "PI = Math.PI, E = Math.E,",
      "round = Math.round, ceil = Math.ceil, floor = Math.floor;",
      "return " + jsExpr + ";",
    ].join("\n");
    var fn = new Function("x", body) as (x: number) => number;
    // 测试调用
    fn(0);
    return { fn: fn, varName: varName };
  } catch (e) {
    return { fn: null, varName: "x" };
  }
}

/**
 * 将数学表达式转换为 JavaScript 表达式
 *
 * 转换规则（按顺序）：
 * 1. e^(expr) → exp(expr)（必须在 x^N 之前）
 * 2. x^N → pow(x, N)
 * 3. 数字^N → pow(数字, N)（剩余的 ^ 幂运算）
 * 4. 隐式乘法：数字x → 数字*x, 数字( → 数字*(, )x → )*x, x( → x*(
 *    数字后跟字母 → 数字*字母, )后跟数字 → )*数字
 */
function mathToJS(expr: string): string {
  // 去除多余空格
  var s = expr.replace(/\s+/g, "");

  // 1. e^(expr) → exp(expr)
  // 匹配 e^(...) 其中括号内可以是嵌套括号的内容
  s = replaceExpParens(s);

  // 2. 隐式乘法（必须在 x^N 转换之前）
  // 数字(含小数)后跟 x → 数字*x，如 0.023x → 0.023*x
  s = s.replace(/(\d+(?:\.\d+)?)x/g, "$1*x");
  // 数字后跟字母（函数名如 sin/cos/exp）→ 数字*字母，如 4.094exp → 4.094*exp
  s = s.replace(/(\d+(?:\.\d+)?)([a-z])/g, "$1*$2");
  // 数字后跟 ( → 数字*(，如 2(x+1) → 2*(x+1)
  s = s.replace(/(\d+(?:\.\d+)?)\(/g, "$1*(");
  // x 后跟 ( → x*(，如 x(x+1) → x*(x+1)
  s = s.replace(/x\(/g, "x*(");
  // ) 后跟数字 → )*数字
  s = s.replace(/\)(\d+(?:\.\d+)?)/g, ")*$1");
  // ) 后跟 x → )*x
  s = s.replace(/\)x/g, ")*x");
  // ) 后跟 ( → )*(
  s = s.replace(/\)\(/g, ")*(");
  // ) 后跟字母（函数名）→ )*字母，如 )sin → )*sin
  s = s.replace(/\)([a-z])/g, ")*$1");

  // 3. x^N 或 x^(N) → pow(x, N)
  s = s.replace(/x\^(\d+(?:\.\d+)?)/g, "pow(x,$1)");
  s = s.replace(/x\^\((-?\d+(?:\.\d+)?)\)/g, "pow(x,$1)");

  // 4. 剩余的数字^数字 → pow(数字, 数字)
  s = s.replace(/(\d+(?:\.\d+)?)\^(\d+(?:\.\d+)?)/g, "pow($1,$2)");
  s = s.replace(/(\d+(?:\.\d+)?)\^\((-?\d+(?:\.\d+)?)\)/g, "pow($1,$2)");

  return s;
}

/**
 * 替换 e^(expr) 为 exp(expr)
 * 处理嵌套括号，如 e^(0.178x) → exp(0.178*x)
 */
function replaceExpParens(s: string): string {
  var result = "";
  var i = 0;
  while (i < s.length) {
    // 查找 e^(
    if (i + 2 < s.length && s[i] === "e" && s[i + 1] === "^" && s[i + 2] === "(") {
      // 找到匹配的右括号
      var depth = 1;
      var j = i + 3;
      while (j < s.length && depth > 0) {
        if (s[j] === "(") depth++;
        else if (s[j] === ")") depth--;
        j++;
      }
      if (depth === 0) {
        var inner = s.substring(i + 3, j - 1);
        result += "exp(" + inner + ")";
        i = j;
        continue;
      }
    }
    result += s[i];
    i++;
  }
  return result;
}
