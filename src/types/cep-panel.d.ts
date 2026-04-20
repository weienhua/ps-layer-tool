// CEP 面板侧类型声明（最小化声明）

declare class CSInterface {
  constructor();

  /** 获取宿主环境信息 */
  getHostEnvironment(): HostEnvironment;

  /** 执行 ExtendScript 代码 */
  evalScript(script: string, callback?: (result: string) => void): void;

  /** 注册事件监听器 */
  addEventListener(type: string, listener: (event: CSEvent) => void): void;

  /** 移除事件监听器 */
  removeEventListener(type: string, listener: (event: CSEvent) => void): void;

  /** 派发事件到宿主 */
  dispatchEvent(event: CSEvent): void;

  /** 获取扩展 ID */
  getExtensionID(): string;

  /** 打开 URL 在默认浏览器 */
  openURLInDefaultBrowser(url: string): void;

  /** 获取系统路径 */
  getSystemPath(pathType: SystemPathType): string;
}

declare interface HostEnvironment {
  appId: string;
  appVersion: string;
  appLocale: string;
  appName: string;
  appUILocale: string;
  appVersion: string;
}

declare interface CSEvent {
  type: string;
  scope?: string;
  appId?: string;
  extensionId?: string;
  data?: string;
}

declare enum SystemPathType {
  USER_DATA = 'userData',
  COMMON_FILES = 'commonFiles',
  MY_DOCUMENTS = 'myDocuments',
  APPLICATION = 'application',
  EXTENSION = 'extension',
  HOST_APPLICATION = 'hostApplication'
}

declare const csInterface: CSInterface;
