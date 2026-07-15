/**
 * 曲线形态自动分类器
 *
 * 分析手绘曲线的特征（单调性、周期性、拐点数量、增长速率等），
 * 推荐最合适的基函数组合和多项式阶数。
 *
 * 纯函数实现，零外部依赖，可脱离 PS 环境独立运行和测试。
 */

import { Point2D, FitConfig } from "./curveFit";

/** 分类结果 */
export interface ClassifyResult {
  /** 推荐配置 */
  config: FitConfig;
  /** 推荐描述，如 "多项式(3阶) + 三角函数" */
  description: string;
  /** 各基函数的推荐置信度 (0-1) */
  confidence: {
    polynomial: number;
    trigonometric: number;
    exponential: number;
  };
  /** 推荐的多项式阶数 */
  recommendedDegree: number;
  /** 检测到的特征详情 */
  features: {
    isMonotonic: boolean;
    isPeriodic: boolean;
    inflectionCount: number;
    isConvex: boolean;
    growthRate: "linear" | "exponential" | "neither";
  };
}

/**
 * 对采样点进行形态分类，返回推荐配置
 * @param points 采样点（需按 x 排序）
 */
export function classifyCurve(points: Point2D[]): ClassifyResult {
  var n = points.length;

  // 默认结果
  var defaultResult: ClassifyResult = {
    config: {
      polyEnabled: true,
      polyDegree: 2,
      trigEnabled: false,
      expEnabled: false,
      precision: 3,
    },
    description: "多项式(2阶)",
    confidence: { polynomial: 1, trigonometric: 0, exponential: 0 },
    recommendedDegree: 2,
    features: {
      isMonotonic: false,
      isPeriodic: false,
      inflectionCount: 0,
      isConvex: false,
      growthRate: "neither",
    },
  };

  if (n < 3) {
    defaultResult.config.polyDegree = 1;
    defaultResult.recommendedDegree = 1;
    defaultResult.description = "多项式(1阶)";
    return defaultResult;
  }

  // 提取 y 值序列
  var yVals: number[] = [];
  for (var i = 0; i < n; i++) yVals.push(points[i].y);

  // ===== 1. 一阶差分 =====
  var firstDiff: number[] = [];
  for (var i2 = 1; i2 < n; i2++) {
    firstDiff.push(yVals[i2] - yVals[i2 - 1]);
  }

  // ===== 2. 单调性检测 =====
  var posCount = 0, negCount = 0;
  for (var i3 = 0; i3 < firstDiff.length; i3++) {
    if (firstDiff[i3] > 0) posCount++;
    if (firstDiff[i3] < 0) negCount++;
  }
  var totalDiff = firstDiff.length;
  var monotonicScore = Math.max(posCount, negCount) / totalDiff;
  var isMonotonic = monotonicScore > 0.85;

  // ===== 3. 二阶差分（拐点检测）=====
  var secondDiff: number[] = [];
  for (var i4 = 1; i4 < firstDiff.length; i4++) {
    secondDiff.push(firstDiff[i4] - firstDiff[i4 - 1]);
  }

  var inflectionCount = 0;
  for (var i5 = 1; i5 < secondDiff.length; i5++) {
    if (secondDiff[i5] * secondDiff[i5 - 1] < 0) inflectionCount++;
    // 过零也算拐点
    if (secondDiff[i5] === 0 && secondDiff[i5 - 1] !== 0) inflectionCount++;
  }

  // ===== 4. 凹凸性检测 =====
  var posConv = 0, negConv = 0;
  for (var i6 = 0; i6 < secondDiff.length; i6++) {
    if (secondDiff[i6] > 0) posConv++;
    if (secondDiff[i6] < 0) negConv++;
  }
  var isConvex = Math.max(posConv, negConv) / (secondDiff.length || 1) > 0.8;

  // ===== 5. 周期性检测 =====
  var isPeriodic = false;
  var periodicScore = 0;

  // 自相关检测
  var acf = computeACF(yVals, Math.floor(n / 2));
  if (acf.length > 2) {
    // 找 lag=0 之后的第一个显著峰值
    var peakFound = false;
    var peakHeight = 0;
    for (var lag = 2; lag < acf.length - 1; lag++) {
      if (acf[lag] > acf[lag - 1] && acf[lag] > acf[lag + 1]) {
        if (acf[lag] > 0.3) {
          peakFound = true;
          peakHeight = acf[lag];
          break;
        }
      }
    }
    if (peakFound) {
      periodicScore = peakHeight;
      isPeriodic = periodicScore > 0.5;
    }
  }

  // ===== 6. 增长速率检测 =====
  var growthRate: "linear" | "exponential" | "neither" = "neither";
  if (isMonotonic) {
    // 计算相邻一阶差分的比值
    var ratios: number[] = [];
    for (var i7 = 1; i7 < firstDiff.length; i7++) {
      if (Math.abs(firstDiff[i7 - 1]) > 1e-10) {
        ratios.push(firstDiff[i7] / firstDiff[i7 - 1]);
      }
    }
    if (ratios.length > 2) {
      var ratioMean = 0;
      for (var r = 0; r < ratios.length; r++) ratioMean += ratios[r];
      ratioMean /= ratios.length;

      var ratioVariance = 0;
      for (var r2 = 0; r2 < ratios.length; r2++) {
        ratioVariance += (ratios[r2] - ratioMean) * (ratios[r2] - ratioMean);
      }
      ratioVariance /= ratios.length;

      if (Math.abs(ratioMean - 1) < 0.15 && ratioVariance < 0.1) {
        growthRate = "linear";
      } else if (ratioMean > 1.2 && ratioVariance < 0.3) {
        growthRate = "exponential";
      }
    }
  }

  // ===== 7. 综合评分，生成推荐 =====
  var confPoly = 0;
  var confTrig = 0;
  var confExp = 0;
  var recDegree = 2;

  // 多项式置信度：拐点多/非单调/非周期 → 多项式
  if (!isPeriodic && !isMonotonic) {
    confPoly = Math.min(1, (inflectionCount + 1) * 0.3);
  } else if (isMonotonic && growthRate !== "exponential") {
    confPoly = 0.9;
  } else {
    confPoly = 0.5;
  }

  // 推荐阶数
  if (isMonotonic && growthRate === "linear") {
    recDegree = 1; // 直线
  } else if (inflectionCount === 0) {
    recDegree = 2; // 抛物线型
  } else if (inflectionCount <= 2) {
    recDegree = 3;
  } else {
    recDegree = Math.min(5, inflectionCount + 1);
  }

  // 三角函数置信度：自相关峰值明显
  confTrig = periodicScore;
  if (isPeriodic) confTrig = Math.max(confTrig, 0.7);

  // 指数置信度：指数增长趋势
  if (growthRate === "exponential") {
    confExp = 0.8;
  } else if (isMonotonic && !isPeriodic) {
    confExp = 0.1;
  } else {
    confExp = 0;
  }

  // ===== 8. 构建推荐 =====
  var config: FitConfig = {
    polyEnabled: confPoly > 0.3,
    polyDegree: recDegree,
    trigEnabled: confTrig > 0.5,
    expEnabled: confExp > 0.5,
    precision: 3,
  };

  // 至少保留一项
  if (!config.polyEnabled && !config.trigEnabled && !config.expEnabled) {
    config.polyEnabled = true;
    config.polyDegree = 2;
  }

  // 生成描述
  var descParts: string[] = [];
  descParts.push("多项式(" + recDegree + "阶)");
  if (config.trigEnabled) descParts.push("三角函数");
  if (config.expEnabled) descParts.push("指数");

  return {
    config: config,
    description: descParts.join(" + "),
    confidence: {
      polynomial: confPoly,
      trigonometric: confTrig,
      exponential: confExp,
    },
    recommendedDegree: recDegree,
    features: {
      isMonotonic: isMonotonic,
      isPeriodic: isPeriodic,
      inflectionCount: inflectionCount,
      isConvex: isConvex,
      growthRate: growthRate,
    },
  };
}

/**
 * 计算自相关函数（用于周期性检测）
 */
function computeACF(values: number[], maxLag: number): number[] {
  var n = values.length;
  var lagMax = Math.min(maxLag, n - 1);

  var meanVal = 0;
  for (var i = 0; i < n; i++) meanVal += values[i];
  meanVal /= n;

  // 计算方差
  var variance = 0;
  for (var i2 = 0; i2 < n; i2++) {
    variance += (values[i2] - meanVal) * (values[i2] - meanVal);
  }
  if (variance === 0) {
    var zeros: number[] = [];
    for (var j = 0; j <= lagMax; j++) zeros.push(0);
    return zeros;
  }

  var result: number[] = [];
  for (var lag = 0; lag <= lagMax; lag++) {
    var cov = 0;
    for (var k = 0; k < n - lag; k++) {
      cov += (values[k] - meanVal) * (values[k + lag] - meanVal);
    }
    result.push(cov / variance);
  }
  return result;
}
