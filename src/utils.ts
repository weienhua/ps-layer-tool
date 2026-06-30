/**
 * 共享工具函数（从原 index.ts 提取的纯逻辑）
 */

import { SelectedLayerInfo } from "./bridge";
import { AnchorType, SortType } from "./types";

/**
 * 数学表达式求值器（递归下降解析器）
 */
export class MathExpr {
  private pos: number;
  private expr: string;
  private scope: Record<string, number>;

  private static readonly FUNCTIONS: Record<string, (...args: number[]) => number> = {
    round: (x: number, n?: number) => n != null ? Math.round(x * Math.pow(10, n)) / Math.pow(10, n) : Math.round(x),
    ceil: (x: number) => Math.ceil(x),
    floor: (x: number) => Math.floor(x),
    int: (x: number) => Math.floor(x),
    abs: (x: number) => Math.abs(x),
    min: (a: number, b: number) => Math.min(a, b),
    max: (a: number, b: number) => Math.max(a, b),
    rand: () => Math.random(),
    pow: (x: number, y: number) => Math.pow(x, y),
    sqrt: (x: number) => x < 0 ? 0 : Math.sqrt(x),
  };

  private constructor(expr: string, scope: Record<string, number>) {
    this.pos = 0;
    this.expr = expr;
    this.scope = scope;
  }

  static evaluate(expr: string, scope: Record<string, number>): number | null {
    try {
      const parser = new MathExpr(expr.trim(), scope);
      const result = parser.parseExpression();
      if (parser.pos < parser.expr.length) return null;
      return result;
    } catch { return null; }
  }

  private skipSpaces(): void {
    while (this.pos < this.expr.length && this.expr[this.pos] === " ") this.pos++;
  }

  private parseExpression(): number {
    let left = this.parseTerm();
    this.skipSpaces();
    while (this.pos < this.expr.length) {
      const ch = this.expr[this.pos];
      if (ch === "+" || ch === "-") {
        this.pos++;
        const right = this.parseTerm();
        left = ch === "+" ? left + right : left - right;
        this.skipSpaces();
      } else break;
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();
    this.skipSpaces();
    while (this.pos < this.expr.length) {
      const ch = this.expr[this.pos];
      if (ch === "*" || ch === "/" || ch === "%") {
        this.pos++;
        const right = this.parseFactor();
        if (ch === "*") left = left * right;
        else if (ch === "/") left = right !== 0 ? left / right : NaN;
        else left = right !== 0 ? left % right : NaN;
        this.skipSpaces();
      } else break;
    }
    return left;
  }

  private parseFactor(): number {
    this.skipSpaces();
    if (this.pos < this.expr.length && this.expr[this.pos] === "-") {
      this.pos++;
      return -this.parseFactor();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    this.skipSpaces();
    if (this.pos >= this.expr.length) throw new Error("unexpected end");
    const ch = this.expr[this.pos];
    if (ch === "(") {
      this.pos++;
      const val = this.parseExpression();
      this.skipSpaces();
      if (this.pos >= this.expr.length || this.expr[this.pos] !== ")") throw new Error("missing ')'");
      this.pos++;
      return val;
    }
    if ((ch >= "0" && ch <= "9") || ch === ".") return this.parseNumber();
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") return this.parseIdentifierOrFunction();
    throw new Error("unexpected char: " + ch);
  }

  private parseIdentifierOrFunction(): number {
    const start = this.pos;
    while (this.pos < this.expr.length &&
      ((this.expr[this.pos] >= "a" && this.expr[this.pos] <= "z") ||
       (this.expr[this.pos] >= "A" && this.expr[this.pos] <= "Z") ||
       (this.expr[this.pos] >= "0" && this.expr[this.pos] <= "9") ||
       this.expr[this.pos] === "_")) this.pos++;
    const name = this.expr.substring(start, this.pos);
    this.skipSpaces();
    if (this.pos < this.expr.length && this.expr[this.pos] === "(") {
      this.pos++;
      const args: number[] = [];
      this.skipSpaces();
      if (this.pos < this.expr.length && this.expr[this.pos] !== ")") {
        args.push(this.parseExpression());
        while (this.pos < this.expr.length && this.expr[this.pos] === ",") {
          this.pos++;
          args.push(this.parseExpression());
        }
      }
      this.skipSpaces();
      if (this.pos >= this.expr.length || this.expr[this.pos] !== ")") throw new Error("missing ')'");
      this.pos++;
      const fn = MathExpr.FUNCTIONS[name];
      if (!fn) throw new Error("unknown function: " + name);
      return fn.apply(null, args);
    }
    if (!(name in this.scope)) throw new Error("unknown variable: " + name);
    const val = this.scope[name];
    if (typeof val !== "number") throw new Error("non-numeric variable: " + name);
    return val;
  }

  private parseNumber(): number {
    const start = this.pos;
    while (this.pos < this.expr.length && ((this.expr[this.pos] >= "0" && this.expr[this.pos] <= "9") || this.expr[this.pos] === ".")) this.pos++;
    if (this.pos === start) throw new Error("expected number");
    return parseFloat(this.expr.substring(start, this.pos));
  }
}

/** 模板替换引擎 */
export function applyTemplate(
  template: string,
  scope: Record<string, string>,
  numericScope: Record<string, number>
): string {
  return template.replace(/\{([^}]*)\}/g, (_all, content) => {
    const trimmed = content.trim();
    if (trimmed === "") return "";
    if (/^[a-zA-Z_]\w*$/.test(trimmed)) return scope[trimmed] ?? "";
    const result = MathExpr.evaluate(trimmed, numericScope);
    if (result !== null && isFinite(result)) return formatNumber(result);
    return "{" + content + "}";
  });
}

/** 数组索引模板替换引擎 */
export function applyArrayTemplate(
  template: string,
  layers: Record<string, string>[],
  numericLayers: Record<string, number>[]
): string {
  return template.replace(/\{([^}]*)\}/g, (_all, content) => {
    const trimmed = content.trim();
    if (trimmed === "") return "";
    const simpleMatch = /^(\w+)\[(\d+)\]$/.exec(trimmed);
    if (simpleMatch) {
      const key = simpleMatch[1];
      const idx = parseInt(simpleMatch[2], 10);
      if (idx >= 0 && idx < layers.length) return layers[idx][key] ?? "";
      return "";
    }
    const expr = trimmed.replace(/(\w+)\[(\d+)\]/g, (_m: string, key: string, idx: string) => {
      const i = parseInt(idx, 10);
      if (i >= 0 && i < numericLayers.length && key in numericLayers[i]) return String(numericLayers[i][key]);
      return _m;
    });
    if (/^-?\d+(\.\d+)?$/.test(expr)) return formatNumber(parseFloat(expr));
    const result = MathExpr.evaluate(expr, {});
    if (result !== null && isFinite(result)) return formatNumber(result);
    return "{" + content + "}";
  });
}

/** 格式化数字 */
export function formatNumber(num: number): string {
  if (num % 1 === 0) return String(num);
  return String(Math.round(num * 100) / 100);
}

/** 根据锚点计算坐标 */
export function getAnchorXY(layer: SelectedLayerInfo, anchor: AnchorType): { x: number; y: number } {
  const map: Record<AnchorType, { x: number; y: number }> = {
    topLeft: { x: layer.x, y: layer.y },
    topCenter: { x: layer.centerX, y: layer.y },
    topRight: { x: layer.x + layer.width, y: layer.y },
    middleLeft: { x: layer.x, y: layer.centerY },
    center: { x: layer.centerX, y: layer.centerY },
    middleRight: { x: layer.x + layer.width, y: layer.centerY },
    bottomLeft: { x: layer.x, y: layer.y + layer.height },
    bottomCenter: { x: layer.centerX, y: layer.y + layer.height },
    bottomRight: { x: layer.x + layer.width, y: layer.y + layer.height },
  };
  return map[anchor];
}

/** 排序图层 */
export function sortLayers(layers: SelectedLayerInfo[], sortBy: SortType): SelectedLayerInfo[] {
  const list = layers.slice();
  if (sortBy === "xAsc") list.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  else if (sortBy === "yAsc") list.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  else list.sort((a, b) => a.order - b.order);
  return list;
}

/** 锚点对齐系数 */
export function getAnchorCoefficients(anchor: AnchorType): { alignH: number; alignV: number } {
  const map: Record<AnchorType, { alignH: number; alignV: number }> = {
    topLeft: { alignH: 1, alignV: 1 },
    topCenter: { alignH: 0.5, alignV: 1 },
    topRight: { alignH: 0, alignV: 1 },
    middleLeft: { alignH: 1, alignV: 0.5 },
    center: { alignH: 0.5, alignV: 0.5 },
    middleRight: { alignH: 0, alignV: 0.5 },
    bottomLeft: { alignH: 1, alignV: 0 },
    bottomCenter: { alignH: 0.5, alignV: 0 },
    bottomRight: { alignH: 0, alignV: 0 },
  };
  return map[anchor];
}

/** HTML 转义 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** 获取扩展路径 */
export function getExtensionPathSync(): string {
  try {
    const cs = new (window as any).CSInterface();
    return cs.getSystemPath("extension") || "";
  } catch {
    return "";
  }
}

/** 计算相对组路径 */
export function computeRelativePath(groupPath: string, rootGroupPaths: string[]): string {
  if (rootGroupPaths.length === 0) return "";
  for (const rootPath of rootGroupPaths) {
    if (groupPath.indexOf(rootPath) === 0) {
      const lastSlash = rootPath.lastIndexOf("/", rootPath.length - 2);
      const parentLen = lastSlash >= 0 ? lastSlash + 1 : 0;
      return groupPath.substring(parentLen);
    }
  }
  return "";
}

/** 提取根组路径 */
export function getRootGroupPaths(selectedGroupPaths: string[]): string[] {
  if (selectedGroupPaths.length === 0) return [];
  const sorted = selectedGroupPaths.slice().sort((a, b) => a.length - b.length);
  const roots: string[] = [];
  for (const path of sorted) {
    if (!roots.some((r) => path.indexOf(r) === 0)) roots.push(path);
  }
  return roots;
}
