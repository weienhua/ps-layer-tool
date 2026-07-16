/**
 * 曲线拟合算法引擎
 *
 * 提供多项式、三角函数、指数拟合及组合拟合能力。
 * 采用迭代交替逼近策略：各类基函数分别对残差进行拟合，2-3 轮迭代至 R² 收敛。
 * 纯函数实现，零外部依赖，可脱离 PS 环境独立运行和测试。
 */

// ============================================================================
// 类型定义
// ============================================================================

/** 二维点 */
export interface Point2D {
  x: number;
  y: number;
}

/** 拟合配置 */
export interface FitConfig {
  /** 是否启用多项式拟合 */
  polyEnabled: boolean;
  /** 多项式阶数（1-5） */
  polyDegree: number;
  /** 是否启用三角函数拟合 */
  trigEnabled: boolean;
  /** 是否启用指数拟合 */
  expEnabled: boolean;
  /** 表达式小数位数（1-6，默认 3） */
  precision: number;
}

/** 拟合结果 */
export interface FitResult {
  /** 解析表达式字符串，如 "2.3x² + 0.8sin(1.5x + 0.3) + 1.7x + 0.5" */
  expression: string;
  /** 拟合参数（各组件系数） */
  params: FitParams;
  /** R² 决定系数 */
  rSquared: number;
  /** 用于渲染拟合曲线的采样点 */
  curvePoints: Point2D[];
}

/** 拟合参数 */
export interface FitParams {
  /** 多项式系数 [a₀, a₁, a₂, ...]，a₀ + a₁x + a₂x² + ... */
  polyCoeffs: number[];
  /** 三角函数幅值 */
  trigAmplitude: number;
  /** 三角函数频率 */
  trigFrequency: number;
  /** 三角函数相位 */
  trigPhase: number;
  /** 三角函数垂直偏移（与多项式 a₀ 合并时不单独使用） */
  trigOffset: number;
  /** 指数系数 a，y = a·e^(b·x) + c */
  expA: number;
  /** 指数底数系数 b */
  expB: number;
  /** 指数垂直偏移 c */
  expC: number;
  /** 是否成功拟合出三角函数成分 */
  trigDetected: boolean;
  /** 是否成功拟合出指数成分 */
  expDetected: boolean;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 计算一组点的 x 值范围
 */
function xRange(points: Point2D[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < points.length; i++) {
    if (points[i].x < min) min = points[i].x;
    if (points[i].x > max) max = points[i].x;
  }
  return { min, max };
}

/**
 * 计算均值
 */
function mean(values: number[]): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return sum / values.length;
}

/**
 * 计算自相关函数值（用于周期性检测）
 * 返回 [lag, correlation] 数组
 */
function autocorrelation(y: number[], maxLag?: number): number[] {
  var n = y.length;
  var lagMax = maxLag || Math.floor(n / 2);
  var meanY = mean(y);
  // 计算方差
  var variance = 0;
  for (var i = 0; i < n; i++) {
    variance += (y[i] - meanY) * (y[i] - meanY);
  }
  if (variance === 0) {
    // 全部值相同，返回零数组
    var zeros: number[] = [];
    for (var j = 0; j <= lagMax; j++) zeros.push(0);
    return zeros;
  }
  var result: number[] = [];
  for (var lag = 0; lag <= lagMax; lag++) {
    var cov = 0;
    for (var k = 0; k < n - lag; k++) {
      cov += (y[k] - meanY) * (y[k + lag] - meanY);
    }
    result.push(cov / variance * n / (n - lag));
  }
  return result;
}

// ============================================================================
// 高斯消元法求解线性方程组
// ============================================================================

/**
 * 高斯消元求解 Ax = b
 * @param A 系数矩阵（方阵）
 * @param b 右侧向量
 * @returns 解向量 x
 */
function gaussElimination(A: number[][], b: number[]): number[] {
  var n = b.length;
  // 增广矩阵
  var aug: number[][] = [];
  for (var i = 0; i < n; i++) {
    aug[i] = [];
    for (var j = 0; j < n; j++) {
      aug[i][j] = A[i][j];
    }
    aug[i][n] = b[i];
  }

  // 前向消元
  for (var col = 0; col < n; col++) {
    // 部分选主元
    var maxRow = col;
    var maxVal = Math.abs(aug[col][col]);
    for (var row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) {
      // 奇异矩阵，跳过该列
      continue;
    }
    // 交换行
    if (maxRow !== col) {
      var tmp = aug[col];
      aug[col] = aug[maxRow];
      aug[maxRow] = tmp;
    }
    // 消元
    for (var row2 = col + 1; row2 < n; row2++) {
      var factor = aug[row2][col] / aug[col][col];
      for (var col2 = col; col2 <= n; col2++) {
        aug[row2][col2] -= factor * aug[col][col2];
      }
    }
  }

  // 回代
  var x: number[] = [];
  for (var i3 = n - 1; i3 >= 0; i3--) {
    var sum = aug[i3][n];
    for (var j2 = i3 + 1; j2 < n; j2++) {
      sum -= aug[i3][j2] * x[j2];
    }
    x[i3] = Math.abs(aug[i3][i3]) < 1e-12 ? 0 : sum / aug[i3][i3];
  }
  return x;
}

// ============================================================================
// 多项式拟合
// ============================================================================

/**
 * 最小二乘多项式拟合 y = a₀ + a₁x + a₂x² + ... + aₖxᵏ
 * @param points 采样点
 * @param degree 多项式阶数（1-5）
 * @returns 系数 [a₀, a₁, ..., aₖ]
 */
export function polyFit(points: Point2D[], degree: number): number[] {
  if (points.length === 0 || degree < 1) return [];
  var n = points.length;
  var d = Math.min(degree, n - 1); // 确保 degree 不超过点数-1

  // 构建正规方程 XᵀX β = Xᵀy
  var m = d + 1; // 系数个数
  var XTX: number[][] = [];
  var XTy: number[] = [];
  for (var i = 0; i < m; i++) {
    XTX[i] = [];
    for (var j = 0; j < m; j++) {
      XTX[i][j] = 0;
    }
    XTy[i] = 0;
  }

  for (var p = 0; p < n; p++) {
    var x = points[p].x;
    var y = points[p].y;
    var xPow: number[] = [];
    xPow[0] = 1;
    for (var k = 1; k < m; k++) {
      xPow[k] = xPow[k - 1] * x;
    }
    for (var i2 = 0; i2 < m; i2++) {
      for (var j2 = 0; j2 < m; j2++) {
        XTX[i2][j2] += xPow[i2] * xPow[j2];
      }
      XTy[i2] += xPow[i2] * y;
    }
  }

  return gaussElimination(XTX, XTy);
}

/** 根据多项式系数计算 y 值 */
export function polyEval(coeffs: number[], x: number): number {
  var result = 0;
  var xPow = 1;
  for (var i = 0; i < coeffs.length; i++) {
    result += coeffs[i] * xPow;
    xPow *= x;
  }
  return result;
}

// ============================================================================
// 三角函数拟合
// ============================================================================

/**
 * 使用自相关检测信号的基频
 * @param y 信号值
 * @returns 估计的角频率
 */
function detectFrequency(y: number[], xMin: number, xMax: number): number {
  var n = y.length;
  if (n < 4) return 2 * Math.PI / (xMax - xMin);

  var xSpan = xMax - xMin;
  var dx = xSpan / (n - 1);
  var bestOmega = 2 * Math.PI / xSpan; // 默认：1 个周期
  var bestSSE = Infinity;

  // 网格搜索：尝试 0.5 ~ 10 个周期的候选频率
  var periodStep = 0.5;
  for (var periods = 0.5; periods <= 10; periods += periodStep) {
    var omega = 2 * Math.PI * periods / xSpan;

    // 3×3 最小二乘拟合：y = A·sin(ωx) + B·cos(ωx) + d
    var sumSin2 = 0, sumCos2 = 0, sumSinCos = 0;
    var sumSin = 0, sumCos = 0, sumY = 0;
    var sumYSin = 0, sumYCos = 0;

    for (var i = 0; i < n; i++) {
      var x = xMin + i * dx;
      var s = Math.sin(omega * x);
      var c = Math.cos(omega * x);
      var yi = y[i];
      sumSin2 += s * s;
      sumCos2 += c * c;
      sumSinCos += s * c;
      sumSin += s;
      sumCos += c;
      sumY += yi;
      sumYSin += yi * s;
      sumYCos += yi * c;
    }

    // 解 3×3 正规方程（Cramer 法则）
    var det = sumSin2 * (sumCos2 * n - sumCos * sumCos)
            - sumSinCos * (sumSinCos * n - sumCos * sumSin)
            + sumSin * (sumSinCos * sumCos - sumCos2 * sumSin);
    if (Math.abs(det) < 1e-12) continue;

    var A = (sumYSin * (sumCos2 * n - sumCos * sumCos)
           - sumSinCos * (sumYCos * n - sumCos * sumY)
           + sumSin * (sumYCos * sumCos - sumCos2 * sumY)) / det;
    var B = (sumSin2 * (sumYCos * n - sumCos * sumY)
           - sumYSin * (sumSinCos * n - sumCos * sumSin)
           + sumSin * (sumSinCos * sumY - sumYCos * sumSin)) / det;
    var D = (sumSin2 * (sumCos2 * sumY - sumYCos * sumCos)
           - sumSinCos * (sumSinCos * sumY - sumYCos * sumSin)
           + sumYSin * (sumSinCos * sumCos - sumCos2 * sumSin)) / det;

    // 计算 SSE（残差平方和）
    var sse = 0;
    for (var j = 0; j < n; j++) {
      var xj = xMin + j * dx;
      var pred = A * Math.sin(omega * xj) + B * Math.cos(omega * xj) + D;
      var err = y[j] - pred;
      sse += err * err;
    }

    if (sse < bestSSE) {
      bestSSE = sse;
      bestOmega = omega;
    }
  }

  return bestOmega;
}

/**
 * 三角函数拟合 y = a·sin(ωx + φ) + d
 * 使用 sin/cos 基函数展开：y = A·sin(ωx) + B·cos(ωx) + d
 * 然后合并为 a·sin(ωx + φ) + d
 *
 * @param points 采样点
 * @returns { amplitude, frequency, phase, offset }
 */
export function trigFit(points: Point2D[], fixedOmega?: number): {
  amplitude: number;
  frequency: number;
  phase: number;
  offset: number;
} {
  var n = points.length;
  var result = { amplitude: 0, frequency: 0, phase: 0, offset: 0 };

  if (n < 4) return result;

  var range = xRange(points);
  var yVals: number[] = [];
  for (var i = 0; i < n; i++) yVals.push(points[i].y);

  // 检测频率（如果已提供则跳过检测）
  if (fixedOmega !== undefined && fixedOmega > 0) {
    result.frequency = fixedOmega;
  } else {
    result.frequency = detectFrequency(yVals, range.min, range.max);
  }

  // 用 sin(ωx) + cos(ωx) 基函数做线性最小二乘
  // 模型：y = A·sin(ωx) + B·cos(ωx) + d
  // 正规方程维度：3 × 3
  var sumSin2 = 0, sumCos2 = 0, sumSinCos = 0;
  var sumSin = 0, sumCos = 0, sumY = 0;
  var sumYSin = 0, sumYCos = 0;

  for (var i2 = 0; i2 < n; i2++) {
    var x = points[i2].x;
    var y = points[i2].y;
    var s = Math.sin(result.frequency * x);
    var c = Math.cos(result.frequency * x);
    sumSin2 += s * s;
    sumCos2 += c * c;
    sumSinCos += s * c;
    sumSin += s;
    sumCos += c;
    sumY += y;
    sumYSin += y * s;
    sumYCos += y * c;
  }

  var A_mat = [
    [sumSin2, sumSinCos, sumSin],
    [sumSinCos, sumCos2, sumCos],
    [sumSin, sumCos, n]
  ];
  var b_vec = [sumYSin, sumYCos, sumY];
  var coeffs = gaussElimination(A_mat, b_vec);

  if (coeffs.length >= 3) {
    var A = coeffs[0]; // sin 系数
    var B = coeffs[1]; // cos 系数
    var D = coeffs[2]; // 偏移

    // a·sin(ωx + φ) = a·sin(ωx)cos(φ) + a·cos(ωx)sin(φ)
    // A = a·cos(φ), B = a·sin(φ)
    result.amplitude = Math.sqrt(A * A + B * B);
    result.phase = Math.atan2(B, A);
    result.offset = D;
  }

  return result;
}

// ============================================================================
// 指数拟合
// ============================================================================

/**
 * 指数拟合 y = a·e^(b·x) + c
 *
 * 通过迭代优化 c 值，将问题转化为线性回归：
 * 1. 给定 c，变换为 ln(y - c) = ln(a) + b·x（线性）
 * 2. 搜索最优 c 最小化残差平方和
 *
 * @param points 采样点
 * @returns { a, b, c }
 */
export function expFit(points: Point2D[]): { a: number; b: number; c: number } {
  var n = points.length;
  if (n < 3) return { a: 0, b: 0, c: 0 };

  // y 值范围
  var yMin = Infinity, yMax = -Infinity;
  for (var i = 0; i < n; i++) {
    if (points[i].y < yMin) yMin = points[i].y;
    if (points[i].y > yMax) yMax = points[i].y;
  }
  var yRange = yMax - yMin;

  // c 应小于所有 y 值（使 y-c > 0 可做对数变换）
  // 或者 c 应大于所有 y 值（使 c-y > 0，负指数）
  // 这里假设 a > 0 的情况，c < min(y)
  var cLow = yMin - yRange * 2;
  var cHigh = yMin - yRange * 0.01;

  // 线性回归辅助函数：给定 c，返回 { a, b, residual }
  function fitForC(cVal: number): { a: number; b: number; residual: number } {
    var sumX = 0, sumY2 = 0, sumXY2 = 0, sumX2 = 0;
    var count = 0;
    for (var j = 0; j < n; j++) {
      var diff = points[j].y - cVal;
      if (diff <= 0) continue; // 跳过无效点
      var lnY = Math.log(diff);
      var x = points[j].x;
      sumX += x;
      sumY2 += lnY;
      sumXY2 += x * lnY;
      sumX2 += x * x;
      count++;
    }
    if (count < 2) return { a: 0, b: 0, residual: Infinity };

    var denom = count * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-12) return { a: 0, b: 0, residual: Infinity };

    var bVal = (count * sumXY2 - sumX * sumY2) / denom;
    var lnA = (sumY2 - bVal * sumX) / count;
    var aVal = Math.exp(lnA);

    // 计算残差平方和
    var residual = 0;
    for (var k = 0; k < n; k++) {
      var pred = aVal * Math.exp(bVal * points[k].x) + cVal;
      var diff2 = points[k].y - pred;
      residual += diff2 * diff2;
    }
    return { a: aVal, b: bVal, residual: residual };
  }

  // 简单网格搜索最优 c
  var bestC = cLow;
  var bestResult = fitForC(bestC);
  var steps = 20;
  var stepSize = (cHigh - cLow) / steps;

  for (var s = 1; s <= steps; s++) {
    var cTry = cLow + s * stepSize;
    var r = fitForC(cTry);
    if (r.residual < bestResult.residual) {
      bestResult = r;
      bestC = cTry;
    }
  }

  return { a: bestResult.a, b: bestResult.b, c: bestC };
}

// ============================================================================
// 组合拟合（迭代交替逼近）
// ============================================================================

/**
 * 迭代交替逼近组合拟合
 *
 * 流程：
 * 1. 多项式拟合原始点 → 得到 p(x)，计算残差 r₁ = y - p(x)
 * 2. 对残差 r₁ 做三角函数拟合 → 得到 t(x)，计算残差 r₂ = r₁ - t(x)
 * 3. 如果勾选指数，对残差 r₂ 做指数拟合
 * 4. 汇总所有线性系数，统一重做一次最小二乘
 * 5. 重复 1-4 直到 R² 收敛
 *
 * @param points 原始采样点
 * @param config 拟合配置
 * @returns 拟合结果
 */
export function combinedFit(points: Point2D[], config: FitConfig): FitResult {
  var n = points.length;
  var params: FitParams = {
    polyCoeffs: [],
    trigAmplitude: 0,
    trigFrequency: 0,
    trigPhase: 0,
    trigOffset: 0,
    expA: 0,
    expB: 0,
    expC: 0,
    trigDetected: false,
    expDetected: false,
  };

  if (n < 2) {
    return {
      expression: "",
      params: params,
      rSquared: 0,
      curvePoints: [],
    };
  }

  var xVals: number[] = [];
  for (var i = 0; i < n; i++) xVals.push(points[i].x);
  var range = xRange(points);
  var xMin = range.min;
  var xMax = range.max;

  // 初始残差 = y
  var residuals: number[] = [];
  for (var i2 = 0; i2 < n; i2++) residuals.push(points[i2].y);

  var maxIter = 3;
  var prevR2 = -Infinity;

  for (var iter = 0; iter < maxIter; iter++) {
    // --- 第 1 步：多项式拟合 ---
    if (config.polyEnabled) {
      var polyPts: Point2D[] = [];
      for (var i3 = 0; i3 < n; i3++) {
        polyPts.push({ x: points[i3].x, y: residuals[i3] });
      }
      params.polyCoeffs = polyFit(polyPts, config.polyDegree);
      // 更新残差
      for (var i4 = 0; i4 < n; i4++) {
        residuals[i4] -= polyEval(params.polyCoeffs, points[i4].x);
      }
    } else {
      params.polyCoeffs = [];
    }

    // --- 第 2 步：三角函数拟合 ---
    if (config.trigEnabled) {
      var trigPts: Point2D[] = [];
      for (var i5 = 0; i5 < n; i5++) {
        trigPts.push({ x: points[i5].x, y: residuals[i5] });
      }
      // 首次检测频率，后续迭代锁定频率只重拟幅度/相位
      var trigResult = params.trigDetected
        ? trigFit(trigPts, params.trigFrequency)
        : trigFit(trigPts);
      if (trigResult.amplitude > 1e-6) {
        params.trigAmplitude = trigResult.amplitude;
        params.trigFrequency = trigResult.frequency;
        params.trigPhase = trigResult.phase;
        params.trigOffset = trigResult.offset;
        params.trigDetected = true;
        // 更新残差
        for (var i6 = 0; i6 < n; i6++) {
          residuals[i6] -= params.trigAmplitude * Math.sin(params.trigFrequency * points[i6].x + params.trigPhase) + params.trigOffset;
        }
      } else {
        params.trigDetected = false;
      }
    } else {
      params.trigDetected = false;
    }

    // --- 第 3 步：指数拟合 ---
    if (config.expEnabled) {
      var expPts: Point2D[] = [];
      for (var i7 = 0; i7 < n; i7++) {
        expPts.push({ x: points[i7].x, y: residuals[i7] });
      }
      var expResult = expFit(expPts);
      if (Math.abs(expResult.a) > 1e-6) {
        params.expA = expResult.a;
        params.expB = expResult.b;
        params.expC = expResult.c;
        params.expDetected = true;
        // 更新残差
        for (var i8 = 0; i8 < n; i8++) {
          residuals[i8] -= params.expA * Math.exp(params.expB * points[i8].x) + params.expC;
        }
      } else {
        params.expDetected = false;
      }
    } else {
      params.expDetected = false;
    }

    // --- 第 4 步：统一重做最小二乘 ---
    // 将所有已检测到的线性参数汇总，用原始 y 做一次全局最小二乘
    if (config.polyEnabled || params.trigDetected || params.expDetected) {
      var allCoeffs = globalRefit(points, params, config);
      if (allCoeffs.length > 0) {
        // 分配回各组件
        var idx = 0;
        // poly 禁用时，共享常数项排在第一位
        var hasConst = !config.polyEnabled && (params.trigDetected || params.expDetected);
        var sharedConst = hasConst ? (allCoeffs[idx++] || 0) : 0;
        if (config.polyEnabled) {
          var deg = Math.min(config.polyDegree, points.length - 1);
          var pLen = deg + 1;
          params.polyCoeffs = [];
          for (var pi = 0; pi < pLen; pi++) {
            params.polyCoeffs.push(allCoeffs[idx++]);
          }
        }
        if (params.trigDetected) {
          // sin 和 cos 系数：A·sin(ωx) + B·cos(ωx) 形式
          var sinCoeff = allCoeffs[idx++] || 0;
          var cosCoeff = allCoeffs[idx++] || 0;
          params.trigAmplitude = Math.sqrt(sinCoeff * sinCoeff + cosCoeff * cosCoeff);
          params.trigPhase = Math.atan2(cosCoeff, sinCoeff);
          // poly 启用时 offset 由 polyCoeffs[0] 承担；禁用时使用共享常数
          params.trigOffset = config.polyEnabled ? 0 : sharedConst;
        }
        if (params.expDetected) {
          params.expA = allCoeffs[idx++] || 0;
          // b 是非线性参数，保持之前的值
          // poly 启用时 c 由 polyCoeffs[0] 承担；禁用时若 trig 已检测则用共享常数
          params.expC = config.polyEnabled ? 0 : (params.trigDetected ? 0 : sharedConst);
        }
      }
    }

    // --- 检查收敛 ---
    var currR2 = computeR2(points, params, config);
    if (Math.abs(currR2 - prevR2) < 0.001) break;
    prevR2 = currR2;

    // 重置残差 = y - 当前拟合值
    for (var i9 = 0; i9 < n; i9++) {
      residuals[i9] = points[i9].y - evalFit(params, points[i9].x, config);
    }
  }

  var finalR2 = computeR2(points, params, config);
  var expr = formatExpression(params, config);
  var curvePts = generateCurvePoints(params, config, xMin, xMax, 200);

  return {
    expression: expr,
    params: params,
    rSquared: finalR2,
    curvePoints: curvePts,
  };
}

// ============================================================================
// 全局重拟合
// ============================================================================

/**
 * 汇总所有线性参数，用原始 y 做一次全局线性最小二乘
 */
function globalRefit(points: Point2D[], params: FitParams, config: FitConfig): number[] {
  var n = points.length;
  var basisCount = 0;

  // 共享常数项（poly 启用时由 polyCoeffs[0] 承担，否则单独添加）
  var hasConstant = !config.polyEnabled && (params.trigDetected || params.expDetected);
  if (hasConstant) basisCount += 1;

  // 计算基函数数量
  if (config.polyEnabled) {
    var deg = Math.min(config.polyDegree, n - 1);
    basisCount += deg + 1; // 1, x, x², ..., xᵏ
  }
  if (params.trigDetected) {
    basisCount += 2; // sin(ωx), cos(ωx)（不含常数项，由共享常数项承担）
  }
  if (params.expDetected) {
    basisCount += 1; // e^(bx)（不含常数项，由共享常数项承担）
  }
  if (basisCount === 0 || basisCount > n) return [];

  // 构建设计矩阵 X（n × basisCount）
  var m = basisCount;
  var XTX: number[][] = [];
  var XTy: number[] = [];
  for (var i = 0; i < m; i++) {
    XTX[i] = [];
    for (var j = 0; j < m; j++) XTX[i][j] = 0;
    XTy[i] = 0;
  }

  for (var p = 0; p < n; p++) {
    var x = points[p].x;
    var y = points[p].y;
    var basis: number[] = [];

    // 共享常数项
    if (hasConstant) {
      basis.push(1);
    }

    // 多项式基函数: 1, x, x², ..., xᵏ（内含常数项）
    if (config.polyEnabled) {
      var xPow = 1;
      for (var k = 0; k <= Math.min(config.polyDegree, n - 1); k++) {
        basis.push(xPow);
        xPow *= x;
      }
    }

    // 三角基函数: sin(ωx), cos(ωx)（不含常数项）
    if (params.trigDetected) {
      basis.push(Math.sin(params.trigFrequency * x));
      basis.push(Math.cos(params.trigFrequency * x));
    }

    // 指数基函数: e^(bx)（不含常数项）
    if (params.expDetected) {
      basis.push(Math.exp(params.expB * x));
    }

    for (var i2 = 0; i2 < basis.length; i2++) {
      for (var j2 = 0; j2 < basis.length; j2++) {
        XTX[i2][j2] += basis[i2] * basis[j2];
      }
      XTy[i2] += basis[i2] * y;
    }
  }

  return gaussElimination(XTX, XTy);
}

// ============================================================================
// 辅助函数
// ============================================================================

/** 根据拟合参数计算单个点的 y 值 */
function evalFit(params: FitParams, x: number, config: FitConfig): number {
  var y = 0;
  if (config.polyEnabled && params.polyCoeffs.length > 0) {
    y += polyEval(params.polyCoeffs, x);
  }
  if (params.trigDetected) {
    y += params.trigAmplitude * Math.sin(params.trigFrequency * x + params.trigPhase);
    // poly 启用时，trigOffset 已被 polyCoeffs[0] 吸收；poly 禁用时需单独加上
    if (!config.polyEnabled) {
      y += params.trigOffset;
    }
  }
  if (params.expDetected) {
    y += params.expA * Math.exp(params.expB * x) + params.expC;
  }
  return y;
}

/** 计算 R² 决定系数 */
function computeR2(points: Point2D[], params: FitParams, config: FitConfig): number {
  var n = points.length;
  if (n === 0) return 0;

  var yMean = 0;
  for (var i = 0; i < n; i++) yMean += points[i].y;
  yMean /= n;

  var ssTot = 0;
  var ssRes = 0;
  for (var i2 = 0; i2 < n; i2++) {
    var y = points[i2].y;
    var yPred = evalFit(params, points[i2].x, config);
    ssTot += (y - yMean) * (y - yMean);
    ssRes += (y - yPred) * (y - yPred);
  }

  if (ssTot === 0) return 1; // 所有 y 相等，完美拟合
  return 1 - ssRes / ssTot;
}

/**
 * 计算 R² 决定系数（公开版本，用于外部评估）
 */
export function rSquared(points: Point2D[], fn: (x: number) => number): number {
  var n = points.length;
  if (n === 0) return 0;

  var yMean = 0;
  for (var i = 0; i < n; i++) yMean += points[i].y;
  yMean /= n;

  var ssTot = 0;
  var ssRes = 0;
  for (var i2 = 0; i2 < n; i2++) {
    var y = points[i2].y;
    var yPred = fn(points[i2].x);
    ssTot += (y - yMean) * (y - yMean);
    ssRes += (y - yPred) * (y - yPred);
  }

  if (ssTot === 0) return 1;
  return 1 - ssRes / ssTot;
}

// ============================================================================
// 表达式格式化
// ============================================================================

/**
 * 将拟合参数格式化为人类可读的数学表达式
 */
function formatExpression(params: FitParams, config: FitConfig): string {
  var p = config.precision;
  var parts: string[] = [];
  var hasContent = false;

  // 多项式部分
  if (config.polyEnabled && params.polyCoeffs.length > 0) {
    var coeffs = params.polyCoeffs;
    for (var i = coeffs.length - 1; i >= 0; i--) {
      var c = coeffs[i];
      if (Math.abs(c) < 1e-10) continue;
      var formatted = formatPolyTerm(c, i, p);
      if (formatted !== "") {
        if (hasContent && c > 0) { parts.push("+"); }
        parts.push(formatted);
        hasContent = true;
      }
    }
  }

  // 三角函数部分
  if (params.trigDetected) {
    var amp = params.trigAmplitude;
    var freq = params.trigFrequency;
    var phase = params.trigPhase;
    if (Math.abs(amp) > 1e-10) {
      if (hasContent && amp > 0) parts.push("+");
      var trigPart = formatNumber(amp, p) + "sin(" + formatNumber(freq, p) + "x";
      if (Math.abs(phase) > 1e-10) {
        trigPart += (phase > 0 ? " + " : " - ") + formatNumber(Math.abs(phase), p);
      }
      trigPart += ")";
      parts.push(trigPart);
      hasContent = true;
    }
  }

  // 指数部分
  if (params.expDetected) {
    var expA = params.expA;
    var expB = params.expB;
    if (Math.abs(expA) > 1e-10) {
      if (hasContent && expA > 0) parts.push("+");
      var expPart = formatNumber(expA, p) + "e^(" + formatNumber(expB, p) + "x)";
      parts.push(expPart);
      hasContent = true;
    }
  }

  if (!hasContent) return "y = 0";
  var expr = parts.join(" ");
  if (expr.startsWith("+ ")) expr = expr.substring(2);
  return "y = " + expr;
}

/** 格式化单个多项式项 */
function formatPolyTerm(coeff: number, degree: number, precision: number): string {
  if (Math.abs(coeff) < 1e-10) return "";
  var sign = coeff < 0 ? "-" : "";
  var absVal = Math.abs(coeff);
  if (degree === 0) return sign + formatNumber(absVal, precision);
  if (degree === 1) {
    if (Math.abs(absVal - 1) < 1e-10) return sign + "x";
    return sign + formatNumber(absVal, precision) + "x";
  }
  if (Math.abs(absVal - 1) < 1e-10) return sign + "x^" + degree;
  return sign + formatNumber(absVal, precision) + "x^" + degree;
}

/** 格式化数字（保留合理小数位） */
function formatNumber(n: number, precision: number): string {
  if (Math.abs(n) < 1e-10) return "0";
  if (Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n));
  var factor = Math.pow(10, precision);
  var rounded = Math.round(n * factor) / factor;
  return String(rounded);
}

// ============================================================================
// 表达式重新格式化（自定义变量名、展开幂次）
// ============================================================================

/**
 * 将拟合表达式格式化为目标系统可用形式
 *
 * 转换规则（按顺序）：
 * 1. 去掉 "y = " 前缀
 * 2. e^(expr) → pow(2.718, expr)
 * 3. 隐式乘法显式化：2.3x → 2.3*x, 0.8sin → 0.8*sin
 * 4. 展开幂次：x^N → x*x*...*x（N 个 x 用 * 连接）
 * 5. 替换变量名：x → 自定义变量名
 *
 * @param expression 拟合引擎生成的原始表达式（如 "y = 2.3x^2 + 1.7x + 0.5"）
 * @param variableName 自定义自变量名（如 "cur_listan"、"#cur_aa"）
 * @returns 格式化后的表达式字符串
 */
export function reformatExpression(expression: string, variableName: string): string {
  // 1. 去掉 "y = " 前缀
  var s = expression.replace(/^y\s*=\s*/, "");

  // 2. 如果变量名不是 x，先临时替换为 x，以便后续正则统一处理
  if (variableName !== "x") {
    s = s.split(variableName).join("x");
  }

  // 3. e^(expr) → pow(2.718, expr)
  s = replaceEWithPow(s);

  // 4. 隐式乘法显式化：数字后跟字母 → 数字*字母
  //    如 2.3x → 2.3*x, 0.8sin → 0.8*sin, 1.5pow → 1.5*pow
  s = s.replace(/(\d+(?:\.\d+)?)([a-z]+)/g, "$1*$2");

  // 5. 展开幂次：x^N → x*x*...*x
  s = s.replace(/x\^(\d+)/g, function (_match: string, powerStr: string): string {
    var power = parseInt(powerStr, 10);
    if (power <= 1) return "x";
    var parts: string[] = [];
    for (var i = 0; i < power; i++) {
      parts.push("x");
    }
    return parts.join("*");
  });

  // 6. 替换变量名 x → 自定义变量名
  //    注意：函数名中仅 "exp" 含字母 x，但 e^ 已转为 pow，exp 不会出现
  //    其他函数名（sin/cos/tan/log/pow/sqrt/abs）均不含 x，可直接全局替换
  if (variableName !== "x") {
    s = s.split("x").join(variableName);
  }

  return s;
}

/**
 * 替换 e^(expr) 为 pow(2.718, expr)
 * 处理嵌套括号，如 e^(0.5x) → pow(2.718, 0.5x)
 */
function replaceEWithPow(s: string): string {
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
        result += "pow(2.718, " + inner + ")";
        i = j;
        continue;
      }
    }
    result += s[i];
    i++;
  }
  return result;
}

// ============================================================================
// 曲线生成
// ============================================================================

/**
 * 根据拟合结果生成曲线渲染用的采样点
 */
function generateCurvePoints(params: FitParams, config: FitConfig, xMin: number, xMax: number, count: number): Point2D[] {
  var points: Point2D[] = [];
  var step = (xMax - xMin) / (count - 1);
  for (var i = 0; i < count; i++) {
    var x = xMin + i * step;
    var y = evalFit(params, x, config);
    points.push({ x: x, y: y });
  }
  return points;
}

// ============================================================================
// 预处理函数
// ============================================================================

/**
 * 移动平均平滑
 * @param points 原始点
 * @param windowSize 窗口大小（3 / 5 / 7 / 9 / 11，默认 5）
 */
export function smoothPoints(points: Point2D[], windowSize: number): Point2D[] {
  if (windowSize === undefined || windowSize === null) windowSize = 5;
  if (points.length < windowSize) return points.slice();
  var half = Math.floor(windowSize / 2);
  var result: Point2D[] = [];
  for (var i = 0; i < points.length; i++) {
    var sumX = 0;
    var sumY = 0;
    var count = 0;
    for (var j = Math.max(0, i - half); j <= Math.min(points.length - 1, i + half); j++) {
      sumX += points[j].x;
      sumY += points[j].y;
      count++;
    }
    result.push({ x: sumX / count, y: sumY / count });
  }
  return result;
}

/**
 * 等距重采样
 * 对曲线沿 x 轴等距采样 count 个点，使用线性插值
 *
 * @param points 原始点（需按 x 排序）
 * @param count 目标采样数
 */
export function sampleCurve(points: Point2D[], count: number): Point2D[] {
  if (points.length < 2 || count <= 0) return points.slice();
  var range = xRange(points);
  var xMin = range.min;
  var xMax = range.max;

  // 确保原始点按 x 排序
  var sorted = points.slice().sort(function (a, b) { return a.x - b.x; });

  var result: Point2D[] = [];
  var step = (xMax - xMin) / (count - 1);

  for (var i = 0; i < count; i++) {
    var x = xMin + i * step;
    // 线性插值
    var y = interpolateSorted(sorted, x);
    result.push({ x: x, y: y });
  }
  return result;
}

/** 在已排序的点集上线性插值 */
function interpolateSorted(sorted: Point2D[], x: number): number {
  if (sorted.length === 0) return 0;
  if (x <= sorted[0].x) return sorted[0].y;
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;

  for (var i = 0; i < sorted.length - 1; i++) {
    if (x >= sorted[i].x && x <= sorted[i + 1].x) {
      var t = (x - sorted[i].x) / (sorted[i + 1].x - sorted[i].x);
      return sorted[i].y + t * (sorted[i + 1].y - sorted[i].y);
    }
  }
  return 0;
}
