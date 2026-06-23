
export enum AnchorConsts {
  NONE = "none",
  TOP_LEFT = "topLeft",
  TOP_RIGHT = "topRight",
  BOTTOM_LEFT = "btmLeft",
  BOTTOM_RIGHT = "btmRight",
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "btm",
  CENTER = "center"
}

//export type assetTypes = "img" | "9slice" | "textField" | "inputField" | "particle";


export interface InputBoxStyle {
  fill: number;
  rounded?: number;
  stroke?: BoxStroke;
}

export interface InputParams {
  fontFamily: string;
  fontSize: string;
  padding: string;
  width: string;
  color: string | number;
  fontWeight?: string;//need to do this
  textAlign: string;//need to do this
  textIndent?: string;
  lineHeight?: string;
}

export interface TextInputObj {
  input: InputParams;
  box: {
    default: InputBoxStyle;
    focused: InputBoxStyle;
    disabled: InputBoxStyle;
  };
};

export interface BoxStroke {
  color?: number;
  width?: number;
  alpha?: number;
}


export type SpriteType = "img" | "9slice";

export interface ResolutionData {
  x: number;
  y: number;
}

export interface OrientationData {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  pivotX: number;
  pivotY: number;
  visible: boolean;
  isAnchored: boolean;
  anchorType?: AnchorConsts;
  anchorPercentage?: { x: number, y: number };
  anchorLocalPercentage?: { x: number, y: number };
  width: number;
  height: number;
  skewX?: number;
  skewY?: number;
}

export interface BaseAssetData {
  type: string,
  name: string,
  filters: any,
}

export interface InstanceAttributes {
  fitToScreen?: boolean;
}

export interface InstanceData extends BaseAssetData {

  template: boolean,
  instanceName: string,
  guide: boolean,
  portrait: OrientationData;
  landscape: OrientationData;
  attrs?: InstanceAttributes;
  playOnStart?: boolean;
  looping?: boolean;
  mask?:string;

}

export interface SpineData extends BaseAssetData {
  name: string,
  spineJson: string;
  spineAtlas: string;
  pngFiles: string[];
  animations: string[];
  skin?: string;
  playOnStart?: {
    value: boolean;
    animation: string;
    loop: boolean;
  };
  slotAttachments?: Array<{ slotName: string; assetName: string; assetData: BaseAssetData }>;
};

export interface ParticleData extends BaseAssetData {
  jsonPath: string;
  pngPaths: string[];
  name: string;
  emitterConfig: any;
}


export interface AnimatedSpriteData extends BaseAssetData {
  framePaths: string[];
  fps: number;
  x: number;
  y: number;
  playOnStart?: boolean;
  looping?: boolean;
}

export interface SpriteData extends BaseAssetData {
  name: string,
  type: SpriteType,
  width: number;
  height: number;
  filePath: string;
  x: number;
  y: number;
  pivotX?: number;
  pivotY?: number;
}

export interface NineSliceData extends SpriteData {
  top: number;
  bottom: number;
  left: number;
  origWidth: number;
  origHeight: number;
  right: number;
  portrait: OrientationData;
  landscape: OrientationData;
}


export interface TextInputData extends BaseAssetData {
  x: number;
  y: number;
  text: string;
  props: TextInputObj;
}


// Gradient and fill types for bitmap text
export type FillType = "solid" | "gradient";

export class BitmapTextGradientData {
  public colors: Array<number> = [];
  public percentages: Array<number> = [];
  public fillGradientType: string = "vertical"; // Phaser does not have PIXI.TEXT_GRADIENT, so use string
}

export interface TextData extends BaseAssetData {
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  alpha: number;
  size: number | string;
  color?: any;
  align: string;
  lineJoin?: string;
  text: string;
  fontName: string | string[];
  lineHeight?: number;
  z: number;
  stroke?: string | number;
  strokeThickness?: number;
  wordWrap?: boolean;
  wordWrapWidth?: number;
  breakWords?: boolean;
  leading?: number;
  letterSpacing?: number;
  padding?: number | number[];
  textAnchorX: number;
  textAnchorY: number;
  pivotX?: number;
  pivotY?: number;
  fontWeight: string;
  uniqueFontName?: string;
  fillType?: FillType;
  dropShadow?: boolean;
  dropShadowAngle?: number;
  dropShadowBlur?: number;
  dropShadowColor?: string | number;
  dropShadowDistance?: number;
  gradientData?: BitmapTextGradientData;
}


export interface TemplateData {
  type: string,
  name: string,
  children: BaseAssetData[],
}

/**
 * BitmapFontLocked — a bitmap text element with a locked/fixed font.
 * Mirrors the PIXI version for cross-engine compatibility.
 */
export interface BitmapFontLocked extends BaseAssetData {
  fntPath?: string;
  pngPath?: string;
  fontName: string;
  x?: number;
  y?: number;
  text?: string;
  align?: string;
  textAnchorX?: number;
  textAnchorY?: number;
  pivotX?: number;
  pivotY?: number;
}

export interface AnimTrackData {
  chilName?: string;
  parentTemplate?: string;
  x?: number;
  y?: number;
  alpha?: number;
  keyFrame?: boolean;
  currentFrame?: number;
  endFrame?: number;
  pivotX?: number;
  pivotY?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  easing?: string;
}

export interface SceneData {
  fps: number;
  resolution: ResolutionData;
  cuePoints: Record<string, Record<number, string>>;
  animTracks?: Record<string, AnimTrackData[]>;
  stage: TemplateData | undefined;
  templates: Record<string, TemplateData>;
  fonts: string[];
  atlas?: boolean;
}