import Phaser from "phaser";
import { InstanceData, SpineData } from "./SceneData";
import { OrientationData } from "./SceneData";
import { SpineGameObject } from "@esotericsoftware/spine-phaser";
export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}
export declare class ZContainer extends Phaser.GameObjects.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean;
    name: string;
    /** Screen size from the latest ZScene.resize; scene.scale only catches up after the window's resize event. */
    static screenWidth: number | undefined;
    static screenHeight: number | undefined;
    _fitToScreen: boolean;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    particleSystems: Phaser.GameObjects.Particles.ParticleEmitter[];
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;
    private graphics?;
    private _maskSiblingName?;
    private _maskGraphics?;
    _flashSkewX: number | undefined;
    _flashSkewY: number | undefined;
    private childSpineData;
    setChilSpineData(data: SpineData): void;
    getChildSpineData(): SpineData;
    constructor(scene: Phaser.Scene, x?: number, y?: number, children?: Phaser.GameObjects.GameObject[]);
    getChildByName(name: string): Phaser.GameObjects.GameObject | null;
    get(childName: string): ZContainer | null;
    /**
     * Searches direct children for a Spine animation object and returns the first match.
     * @returns The first `SpineGameObject` found, or `undefined` if none exists.
     */
    getSpine(): SpineGameObject | undefined;
    getAllByName(childName: string): ZContainer[];
    init(): void;
    getType(): string;
    getProps(): any;
    setText(text: string): void;
    setTextStyle(data: Partial<Phaser.Types.GameObjects.Text.TextStyle>): void;
    private resizeText;
    getTextField(): Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | null;
    setInstanceData(data: InstanceData, orientation: string): void;
    private addMask;
    private applyMask;
    setFixedBoxSize(value: boolean): void;
    set fitToScreen(value: boolean);
    get fitToScreen(): boolean;
    applyTransform(): void;
    setOrigin(): void;
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    private computeContentBounds;
    executeFitToScreen(): void;
    /**
     * Internal helper — sets the raw Phaser display position without touching
     * `currentTransform`. Used by `setOrigin` and `applyTransform` to avoid
     * corrupting the logical (editor) x/y stored in the transform.
     */
    _setDisplayX(value: number): void;
    _setDisplayY(value: number): void;
    /**
     * Returns the logical x position as set via setX() / currentTransform.x.
     * Unlike the Phaser `.x` getter (which returns the display position adjusted
     * for the parent's pivot), this always reflects the authored coordinate.
     */
    getX(): number;
    /**
     * Returns the logical y position as set via setY() / currentTransform.y.
     * Unlike the Phaser `.y` getter (which returns the display position adjusted
     * for the parent's pivot), this always reflects the authored coordinate.
     */
    getY(): number;
    /**
     * Sets the logical x position, saves it to `currentTransform.x` (mirroring
     * the PIXI pattern), and applies the parent-pivot correction so the display
     * position is consistent.
     */
    setX(value?: number | undefined): this;
    setY(value?: number | undefined): this;
    setWidth(value: number): this;
    setHeight(value: number): this;
    setScaleX(x?: number): this;
    setScaleY(y?: number): this;
    applyAnchor(): void;
    isAnchored(): boolean;
    setAlpha(value: number): this;
    getAlpha(): number;
    setVisible(value: boolean): this;
    getVisible(): boolean;
    getTextStyle(): Phaser.Types.GameObjects.Text.TextStyle | null;
    /**
     * Creates a shallow structural clone of this `ZContainer`, copying position,
     * scale, rotation, alpha, visibility, and name. Direct children are cloned
     * by type: `Phaser.GameObjects.Text`, `Phaser.GameObjects.Image`,
     * `Phaser.GameObjects.NineSlice`, and any object that exposes its own `clone()` method.
     */
    clone(): ZContainer;
    getAllOfType(type: string): ZContainer[];
    addParticleSystem(particles: Phaser.GameObjects.Particles.ParticleEmitter): void;
    loadParticle(emitterConfig: any, textureKey: string): void;
    playParticleAnim(): void;
    stopParticleAnim(): void;
}
//# sourceMappingURL=ZContainer.d.ts.map