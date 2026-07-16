<template>
  <div class="function-canvas-wrapper" :style="{ minHeight: isEmpty ? '200px' : '' }">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="fit-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    ></canvas>
    <div v-if="isEmpty" class="canvas-placeholder">在画布上自由绘制曲线</div>
    <div class="canvas-hint">滚轮缩放 · 拖拽曲线变形 · 拖拽空白平移 · 空画布绘制</div>
    <button class="legend-toggle" @mousedown.stop @click.stop="showLegend = !showLegend" :title="showLegend ? '隐藏图例' : '显示图例'">
      {{ showLegend ? '✕' : '📖' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import type { Point2D, FitResult } from "../algo/curveFit";

const props = defineProps<{
  rawPoints: Point2D[];
  smoothedPoints: Point2D[];
  fitResult: FitResult | null;
  computing: boolean;
  mode: "draw" | "expression";
}>();

const emit = defineEmits<{
  drawComplete: [points: Point2D[]];
  curveDeformed: [index: number, point: Point2D];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(600);
const canvasHeight = ref(400);
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;
let resizeObserver: ResizeObserver | null = null;

const PADDING = { top: 36, right: 30, bottom: 30, left: 50 };
const ARROW_SIZE = 8;
const CURVE_HIT_THRESHOLD = 15;
const DEFAULT_VIEW_SCALE = 3;

// 绘制状态
const drawState = { isDrawing: false, points: [] as Point2D[], lastMouseX: 0, lastMouseY: 0, rafId: 0 };

// 曲线变形状态
const deformState = { isDragging: false, closestIndex: -1 };

// 视图变换
const viewScale = ref(DEFAULT_VIEW_SCALE);
const viewOffset = ref({ x: 0, y: 0 });
const viewDragState = { isPanning: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 };

const showLegend = ref(false);

const isEmpty = computed(() => {
  return props.rawPoints.length === 0 && (!props.fitResult || props.fitResult.curvePoints.length === 0);
});

// ============================================================================
// 坐标系统
// ============================================================================

function resizeCanvas(): void {
  var wrapper = canvasRef.value?.parentElement;
  if (!wrapper) return;
  var parent = wrapper.parentElement;
  var w = parent ? parent.clientWidth : wrapper.clientWidth;
  if (w < 280) w = 280;
  canvasWidth.value = w;
  canvasHeight.value = Math.round(w * 2 / 3);
  offscreenCanvas = null;
  offscreenCtx = null;
}

function getDataBounds(): { xMin: number; xMax: number; yMin: number; yMax: number } {
  var allPts: Point2D[] = [];
  if (props.rawPoints.length > 0) allPts = allPts.concat(props.rawPoints);
  if (props.smoothedPoints.length > 0) allPts = allPts.concat(props.smoothedPoints);
  if (props.fitResult && props.fitResult.curvePoints.length > 0) allPts = allPts.concat(props.fitResult.curvePoints);
  if (allPts.length === 0) return { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
  var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (var i = 0; i < allPts.length; i++) {
    var p = allPts[i];
    if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y;
  }
  var xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
  // 裁剪 y 轴范围，避免极端值压扁视图（以 0 为中心，默认显示 ±20）
  var MAX_Y_RANGE = 20;
  if (yRange > MAX_Y_RANGE) {
    yMin = -MAX_Y_RANGE / 2;
    yMax = MAX_Y_RANGE / 2;
    yRange = MAX_Y_RANGE;
  }
  return { xMin: xMin - xRange * 0.1, xMax: xMax + xRange * 0.1, yMin: yMin - yRange * 0.1, yMax: yMax + yRange * 0.1 };
}

function getViewBounds(): { xMin: number; xMax: number; yMin: number; yMax: number } {
  var db = getDataBounds();
  var cx = (db.xMin + db.xMax) / 2 + viewOffset.value.x;
  var cy = (db.yMin + db.yMax) / 2 + viewOffset.value.y;
  var hw = (db.xMax - db.xMin) / 2 / viewScale.value;
  var hh = (db.yMax - db.yMin) / 2 / viewScale.value;
  if (hw < 0.001) hw = 0.5; if (hh < 0.001) hh = 0.5;
  return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
}

function toCanvas(dx: number, dy: number, b: { xMin: number; xMax: number; yMin: number; yMax: number }): { x: number; y: number } {
  var w = canvasWidth.value - PADDING.left - PADDING.right;
  var h = canvasHeight.value - PADDING.top - PADDING.bottom;
  return { x: PADDING.left + ((dx - b.xMin) / (b.xMax - b.xMin)) * w, y: PADDING.top + ((b.yMax - dy) / (b.yMax - b.yMin)) * h };
}

function toData(cx: number, cy: number, b: { xMin: number; xMax: number; yMin: number; yMax: number }): { x: number; y: number } {
  var w = canvasWidth.value - PADDING.left - PADDING.right;
  var h = canvasHeight.value - PADDING.top - PADDING.bottom;
  return { x: b.xMin + ((cx - PADDING.left) / w) * (b.xMax - b.xMin), y: b.yMax - ((cy - PADDING.top) / h) * (b.yMax - b.yMin) };
}

// ============================================================================
// 鼠标事件
// ============================================================================

function getCanvasPos(e: MouseEvent): { x: number; y: number } {
  var canvas = canvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  var rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
}

/** 检测鼠标到 smoothedPoints 曲线的最短距离，返回最近点的索引，超过阈值返回 -1 */
function findClosestCurvePoint(e: MouseEvent): number {
  var pts = props.smoothedPoints;
  if (pts.length === 0) return -1;
  var pos = getCanvasPos(e);
  var bounds = getViewBounds();
  var bestIdx = 0, bestDist = Infinity;

  // 检测到每条线段的最短距离
  for (var i = 0; i < pts.length - 1; i++) {
    var a = toCanvas(pts[i].x, pts[i].y, bounds);
    var b = toCanvas(pts[i + 1].x, pts[i + 1].y, bounds);
    var dist = pointToSegmentDist(pos.x, pos.y, a.x, a.y, b.x, b.y);
    if (dist < bestDist) {
      bestDist = dist;
      // 选线段两端中更近的那个点
      var da = (pos.x - a.x) * (pos.x - a.x) + (pos.y - a.y) * (pos.y - a.y);
      var db = (pos.x - b.x) * (pos.x - b.x) + (pos.y - b.y) * (pos.y - b.y);
      bestIdx = da <= db ? i : i + 1;
    }
  }
  return bestDist <= CURVE_HIT_THRESHOLD ? bestIdx : -1;
}

/** 点到线段的最短距离 */
function pointToSegmentDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  var abx = bx - ax, aby = by - ay;
  var apx = px - ax, apy = py - ay;
  var len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.sqrt(apx * apx + apy * apy); // 线段退化为点
  var t = (apx * abx + apy * aby) / len2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  var cx = ax + t * abx, cy = ay + t * aby;
  var dx2 = px - cx, dy2 = py - cy;
  return Math.sqrt(dx2 * dx2 + dy2 * dy2);
}

function onMouseDown(e: MouseEvent): void {
  if (e.ctrlKey || e.button === 1) { startPan(e); return; }
  if (e.button === 0 && props.rawPoints.length === 0 && !props.fitResult) { startDraw(e); return; }
  if (e.button === 0 && props.smoothedPoints.length > 0) {
    var hitIdx = findClosestCurvePoint(e);
    if (hitIdx >= 0) { deformState.isDragging = true; deformState.closestIndex = hitIdx; return; }
  }
  if (e.button === 0) { startPan(e); return; }
}

function onMouseMove(e: MouseEvent): void {
  if (deformState.isDragging) { handleCurveDrag(e); return; }
  if (viewDragState.isPanning) { handlePan(e); return; }
  if (drawState.isDrawing) { handleDrawMove(e); return; }
}

function onMouseUp(_e: MouseEvent): void {
  if (deformState.isDragging) { deformState.isDragging = false; deformState.closestIndex = -1; renderAll(); return; }
  if (viewDragState.isPanning) { viewDragState.isPanning = false; renderAll(); return; }
  if (drawState.isDrawing) { endDraw(); return; }
}

// ============================================================================
// 手绘
// ============================================================================

function startDraw(e: MouseEvent): void {
  var pos = getCanvasPos(e);
  drawState.isDrawing = true;
  drawState.points = [];
  drawState.lastMouseX = pos.x;
  drawState.lastMouseY = pos.y;
  drawState.points.push(toData(pos.x, pos.y, getViewBounds()));
}

function handleDrawMove(e: MouseEvent): void {
  var pos = getCanvasPos(e);
  if (Math.abs(pos.x - drawState.lastMouseX) < 3 && Math.abs(pos.y - drawState.lastMouseY) < 3) return;
  drawState.lastMouseX = pos.x; drawState.lastMouseY = pos.y;
  if (drawState.rafId !== 0) return;
  drawState.rafId = requestAnimationFrame(function () {
    drawState.rafId = 0;
    drawState.points.push(toData(pos.x, pos.y, getViewBounds()));
    renderDrawPreview();
  });
}

function endDraw(): void {
  drawState.isDrawing = false;
  if (drawState.rafId !== 0) { cancelAnimationFrame(drawState.rafId); drawState.rafId = 0; }
  if (drawState.points.length < 3) { drawState.points = []; return; }
  emit("drawComplete", drawState.points);
  drawState.points = [];
}

// ============================================================================
// 平移 & 缩放
// ============================================================================

function startPan(e: MouseEvent): void {
  viewDragState.isPanning = true;
  viewDragState.startX = e.clientX; viewDragState.startY = e.clientY;
  viewDragState.startOffsetX = viewOffset.value.x; viewDragState.startOffsetY = viewOffset.value.y;
}

function handlePan(e: MouseEvent): void {
  var bounds = getViewBounds();
  viewOffset.value.x = viewDragState.startOffsetX - (e.clientX - viewDragState.startX) * (bounds.xMax - bounds.xMin) / canvasWidth.value;
  viewOffset.value.y = viewDragState.startOffsetY + (e.clientY - viewDragState.startY) * (bounds.yMax - bounds.yMin) / canvasHeight.value;
  renderAll();
}

function onWheel(e: Event): void {
  var we = e as WheelEvent;
  var newScale = viewScale.value * (we.deltaY > 0 ? 0.85 : 1.15);
  if (newScale < 0.1) newScale = 0.1; if (newScale > 20) newScale = 20;
  var oldBounds = getViewBounds();
  viewScale.value = newScale;
  var newBounds = getViewBounds();
  viewOffset.value.x += (newBounds.xMin + newBounds.xMax - oldBounds.xMin - oldBounds.xMax) / 2;
  viewOffset.value.y += (newBounds.yMin + newBounds.yMax - oldBounds.yMin - oldBounds.yMax) / 2;
  renderAll();
}

// ============================================================================
// 曲线变形
// ============================================================================

function handleCurveDrag(e: MouseEvent): void {
  var pos = getCanvasPos(e);
  var dp = toData(pos.x, pos.y, getViewBounds());
  var idx = deformState.closestIndex;
  if (idx >= 0 && idx < props.smoothedPoints.length) {
    emit("curveDeformed", idx, dp);
    // 父组件会更新 smoothedPoints 并重拟合，这里不直接操作
  }
}
// ============================================================================
// 渲染
// ============================================================================

function initOffscreen(): void {
  if (offscreenCanvas) return;
  offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = canvasWidth.value; offscreenCanvas.height = canvasHeight.value;
  offscreenCtx = offscreenCanvas.getContext("2d");
}

function getCtx(): CanvasRenderingContext2D | null { return canvasRef.value?.getContext("2d") || null; }

function renderAll(): void {
  var ctx = getCtx(); if (!ctx) return;
  initOffscreen(); if (!offscreenCtx) return;
  var octx = offscreenCtx;
  octx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  var bounds = getViewBounds();
  drawGrid(octx, bounds);
  if (props.rawPoints.length > 0) drawPoints(octx, props.rawPoints, "rgba(150,150,150,0.6)", 2, bounds);
  if (props.smoothedPoints.length > 1) drawCurve(octx, props.smoothedPoints, "rgba(59,130,246,0.8)", 2, bounds);
  if (props.fitResult && props.fitResult.curvePoints.length > 1) drawDashedCurve(octx, props.fitResult.curvePoints, "rgba(239,68,68,0.9)", 2, bounds);
  if (showLegend.value && hasDataToShow()) drawLegend(octx);
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  ctx.drawImage(offscreenCanvas!, 0, 0);
}

function renderDrawPreview(): void {
  var ctx = getCtx(); if (!ctx) return;
  renderAll();
  if (drawState.points.length > 1) drawCurve(ctx, drawState.points, "rgba(147,197,253,0.9)", 3, getViewBounds());
}

function hasDataToShow(): boolean {
  return props.rawPoints.length > 0 || props.smoothedPoints.length > 0 || !!(props.fitResult && props.fitResult.curvePoints.length > 0);
}

// ============================================================================
// 绘制函数
// ============================================================================

function drawGrid(ctx: CanvasRenderingContext2D, bounds: { xMin: number; xMax: number; yMin: number; yMax: number }): void {
  var w = canvasWidth.value, h = canvasHeight.value;
  ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, w, h);
  var xStep = calcNiceStep(bounds.xMax - bounds.xMin), yStep = calcNiceStep(bounds.yMax - bounds.yMin);

  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
  var xStart = Math.floor(bounds.xMin / xStep) * xStep;
  for (var x = xStart; x <= bounds.xMax + xStep * 0.5; x += xStep) {
    var cx = toCanvas(x, bounds.yMin, bounds).x;
    if (cx < PADDING.left || cx > w - PADDING.right) continue;
    ctx.beginPath(); ctx.moveTo(cx, PADDING.top); ctx.lineTo(cx, h - PADDING.bottom); ctx.stroke();
  }
  var yStart = Math.floor(bounds.yMin / yStep) * yStep;
  for (var y = yStart; y <= bounds.yMax + yStep * 0.5; y += yStep) {
    var cy = toCanvas(bounds.xMin, y, bounds).y;
    if (cy < PADDING.top || cy > h - PADDING.bottom) continue;
    ctx.beginPath(); ctx.moveTo(PADDING.left, cy); ctx.lineTo(w - PADDING.right, cy); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
  var ox = toCanvas(0, bounds.yMin, bounds).x, oy = toCanvas(bounds.xMin, 0, bounds).y;
  if (ox >= PADDING.left && ox <= w - PADDING.right) {
    ctx.beginPath(); ctx.moveTo(ox, PADDING.top); ctx.lineTo(ox, h - PADDING.bottom); ctx.stroke();
    drawArrow(ctx, ox, PADDING.top, ox, PADDING.top - 4, "up");
  }
  if (oy >= PADDING.top && oy <= h - PADDING.bottom) {
    ctx.beginPath(); ctx.moveTo(PADDING.left, oy); ctx.lineTo(w - PADDING.right, oy); ctx.stroke();
    drawArrow(ctx, w - PADDING.right, oy, w - PADDING.right + 4, oy, "right");
  }

  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
  if (ox >= PADDING.left && ox <= w - PADDING.right) { ctx.textAlign = "left"; ctx.fillText("y", ox + 6, PADDING.top + 12); }
  if (oy >= PADDING.top && oy <= h - PADDING.bottom) { ctx.textAlign = "right"; ctx.fillText("x", w - PADDING.right - 2, oy - 8); }

  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (var x2 = xStart; x2 <= bounds.xMax + xStep * 0.5; x2 += xStep) {
    var cx2 = toCanvas(x2, bounds.yMin, bounds).x;
    if (cx2 < PADDING.left || cx2 > w - PADDING.right) continue;
    ctx.fillText(formatTickValue(x2), cx2, h - PADDING.bottom + 4);
  }
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (var y2 = yStart; y2 <= bounds.yMax + yStep * 0.5; y2 += yStep) {
    var cy2 = toCanvas(bounds.xMin, y2, bounds).y;
    if (cy2 < PADDING.top || cy2 > h - PADDING.bottom) continue;
    ctx.fillText(formatTickValue(y2), PADDING.left - 6, cy2);
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, dir: "up" | "right"): void {
  ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.beginPath();
  if (dir === "up") { ctx.moveTo(x2, y2); ctx.lineTo(x2 - ARROW_SIZE, y2 + ARROW_SIZE * 1.5); ctx.lineTo(x2 + ARROW_SIZE, y2 + ARROW_SIZE * 1.5); }
  else { ctx.moveTo(x2, y2); ctx.lineTo(x2 - ARROW_SIZE * 1.5, y2 - ARROW_SIZE); ctx.lineTo(x2 - ARROW_SIZE * 1.5, y2 + ARROW_SIZE); }
  ctx.closePath(); ctx.fill();
}

function calcNiceStep(range: number): number {
  var rough = range / 5, exp = Math.pow(10, Math.floor(Math.log10(rough))), m = rough / exp;
  if (m <= 1.5) return exp; if (m <= 3.5) return 2 * exp; if (m <= 7.5) return 5 * exp; return 10 * exp;
}

function formatTickValue(v: number): string {
  if (Math.abs(v) < 1e-10) return "0";
  if (Math.abs(v - Math.round(v)) < 1e-10) return String(Math.round(v));
  return Number(v.toFixed(2)).toString();
}

function drawPoints(ctx: CanvasRenderingContext2D, pts: Point2D[], color: string, r: number, b: { xMin: number; xMax: number; yMin: number; yMax: number }): void {
  ctx.fillStyle = color;
  for (var i = 0; i < pts.length; i++) { var p = toCanvas(pts[i].x, pts[i].y, b); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
}

function drawCurve(ctx: CanvasRenderingContext2D, pts: Point2D[], color: string, lw: number, b: { xMin: number; xMax: number; yMin: number; yMax: number }): void {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
  var p0 = toCanvas(pts[0].x, pts[0].y, b); ctx.moveTo(p0.x, p0.y);
  for (var i = 1; i < pts.length; i++) { var pi = toCanvas(pts[i].x, pts[i].y, b); ctx.lineTo(pi.x, pi.y); }
  ctx.stroke();
}

function drawDashedCurve(ctx: CanvasRenderingContext2D, pts: Point2D[], color: string, lw: number, b: { xMin: number; xMax: number; yMin: number; yMax: number }): void {
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash([6, 4]); ctx.lineCap = "round"; ctx.beginPath();
  var p0 = toCanvas(pts[0].x, pts[0].y, b); ctx.moveTo(p0.x, p0.y);
  for (var i = 1; i < pts.length; i++) { var pi = toCanvas(pts[i].x, pts[i].y, b); ctx.lineTo(pi.x, pi.y); }
  ctx.stroke(); ctx.setLineDash([]);
}

function drawLegend(ctx: CanvasRenderingContext2D): void {
  var w = canvasWidth.value;
  var items: Array<{ color: string; label: string; dashed?: boolean }> = [];
  if (props.rawPoints.length > 0) items.push({ color: "rgba(150,150,150,0.8)", label: "原始采样点" });
  if (props.smoothedPoints.length > 0) items.push({ color: "rgba(59,130,246,0.9)", label: "平滑曲线（拖拽变形）" });
  if (props.fitResult && props.fitResult.curvePoints.length > 0) items.push({ color: "rgba(239,68,68,0.9)", label: "拟合曲线", dashed: true });
  if (items.length === 0) return;

  var pad = 10, lw2 = 20, ih = 18, fs = 11;
  ctx.font = fs + "px sans-serif";
  var mlw = 0;
  for (var i = 0; i < items.length; i++) { var tw = ctx.measureText(items[i].label).width; if (tw > mlw) mlw = tw; }
  var bw = pad * 2 + lw2 + 6 + mlw, bh = pad * 2 + items.length * ih;
  var bx = w - PADDING.right - bw, by = PADDING.top + 4;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
  var x2 = bx, y2 = by, bw2 = bw, bh2 = bh, r = 6;
  ctx.beginPath();
  ctx.moveTo(x2 + r, y2); ctx.lineTo(x2 + bw2 - r, y2); ctx.arcTo(x2 + bw2, y2, x2 + bw2, y2 + r, r);
  ctx.lineTo(x2 + bw2, y2 + bh2 - r); ctx.arcTo(x2 + bw2, y2 + bh2, x2 + bw2 - r, y2 + bh2, r);
  ctx.lineTo(x2 + r, y2 + bh2); ctx.arcTo(x2, y2 + bh2, x2, y2 + bh2 - r, r);
  ctx.lineTo(x2, y2 + r); ctx.arcTo(x2, y2, x2 + r, y2, r); ctx.closePath();
  ctx.fill(); ctx.stroke();

  for (var i2 = 0; i2 < items.length; i2++) {
    var item = items[i2], iy = by + pad + i2 * ih + ih / 2;
    ctx.strokeStyle = item.color; ctx.lineWidth = 2;
    if (item.dashed) ctx.setLineDash([4, 2]); else ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(bx + pad, iy); ctx.lineTo(bx + pad + lw2, iy); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(item.label, bx + pad + lw2 + 6, iy);
  }
}

// ============================================================================
// 生命周期
// ============================================================================

watch(
  () => [props.rawPoints, props.smoothedPoints, props.fitResult] as const,
  () => { nextTick(renderAll); },
  { deep: true }
);

// 手绘完成（rawPoints 从空变有）时自动重置视角
watch(
  () => props.rawPoints.length,
  (newLen, oldLen) => {
    if (oldLen === 0 && newLen > 0) {
      viewScale.value = 1;
      viewOffset.value = { x: 0, y: 0 };
    }
  }
);

watch(showLegend, () => { nextTick(renderAll); });

watch(
  () => props.rawPoints.length + props.smoothedPoints.length,
  (newLen) => { if (newLen === 0) { viewScale.value = DEFAULT_VIEW_SCALE; viewOffset.value = { x: 0, y: 0 }; } }
);

onMounted(() => {
  resizeCanvas(); initOffscreen(); renderAll();
  var wrapper = canvasRef.value?.parentElement;
  var parent = wrapper?.parentElement;
  if (parent) { resizeObserver = new ResizeObserver(function () { resizeCanvas(); initOffscreen(); nextTick(renderAll); }); resizeObserver.observe(parent); }
});
</script>

<script lang="ts">export default { name: "FunctionCanvas" };</script>

<style scoped>
.function-canvas-wrapper { position: relative; width: 100%; background: #1a1a2e; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
.fit-canvas { display: block; width: 100%; cursor: crosshair; }
.canvas-placeholder { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); font-size: 14px; pointer-events: none; }
.canvas-hint { position: absolute; top: 8px; left: 8px; color: rgba(255,255,255,0.25); font-size: 10px; pointer-events: none; white-space: nowrap; }
.legend-toggle { position: absolute; top: 6px; right: 8px; width: 24px; height: 24px; padding: 0; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.5); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; outline: none; }
.legend-toggle:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); }
</style>
