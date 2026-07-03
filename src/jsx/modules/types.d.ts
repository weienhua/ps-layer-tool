/**
 * ExtendScript ActionManager 全局类型声明
 * @description 各模块共享的宿主环境类型，参考 ps-api/src/types/index.d.ts
 */

declare var __DEV__: boolean;

declare function executeActionGet(ref: any): any;
declare function executeAction(typeID: number, desc: any, mode: any): any;
declare function typeIDToStringID(typeID: number): string;
declare function stringIDToTypeID(name: string): number;
declare function charIDToTypeID(name: string): number;
