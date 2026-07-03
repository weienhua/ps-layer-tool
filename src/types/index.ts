/** 锚点类型 */
export type AnchorType =
  | "topLeft" | "topCenter" | "topRight"
  | "middleLeft" | "center" | "middleRight"
  | "bottomLeft" | "bottomCenter" | "bottomRight";

/** 排序类型 */
export type SortType = "xAsc" | "yAsc" | "psOrderBottomToTop";

/** Tab ID */
export type TabId = "layerInfo" | "templateOutput" | "layerExport" | "xmlTemplate";

/** 预设卡片数据（用于 PresetList 组件） */
export interface PresetCardData {
  id: string;
  name: string;
  anchor: string;
  sortBy: string;
  template: string;
  /** 缩放动画表达式（仅 layerInfo） */
  scaleAnim?: string;
  /** 旋转动画表达式（仅 layerInfo） */
  rotateAnim?: string;
  /** 预设来源：layerInfo = 图层信息，templateOutput = 模板输出 */
  tab: 'layerInfo' | 'templateOutput';
}
