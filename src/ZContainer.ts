import Phaser from "phaser";
import { InstanceData, SpineData } from "./SceneData";
import { OrientationData } from "./SceneData";
import { ZScene } from "./ZScene";
import { ZTimeline } from "./ZTimeline";
import { SpineGameObject } from "@esotericsoftware/spine-phaser";

export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}

export class ZContainer extends Phaser.GameObjects.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean = true;
    name: string = "";
    _fitToScreen: boolean = false;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    particleSystems: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;
    private graphics?: Phaser.GameObjects.Graphics;
    private _maskSiblingName?: string;
    private _maskGraphics?: Phaser.GameObjects.Graphics;
    _flashSkewX: number | undefined;
    _flashSkewY: number | undefined;

    private childSpineData:SpineData;

    public setChilSpineData(data: SpineData){
        this.childSpineData = data;
    }

    public getChildSpineData(): SpineData{
        return this.childSpineData;
    }

    constructor(scene: Phaser.Scene, x = 0, y = 0, children?: Phaser.GameObjects.GameObject[]) {
        super(scene, x, y, children);
        scene.add.existing(this);

        // Patch localTransform to support Flash-style skew.
        // Phaser's Container renderer calls either applyITRS (root level) or
        // translate+rotate+scale (nested). We intercept both to inject skew.
        const lt = this.localTransform as any;
        const self = this;
        const origApplyITRS = lt.applyITRS.bind(lt);
        const origScale = lt.scale.bind(lt);

        lt.applyITRS = function (x: number, y: number, rotation: number, scaleX: number, scaleY: number) {
            origApplyITRS(x, y, rotation, scaleX, scaleY);
            const flashSkewX = self._flashSkewX;
            const flashSkewY = self._flashSkewY;
            if (flashSkewX !== undefined || flashSkewY !== undefined) {
                const skewX = flashSkewX ?? rotation;
                const skewY = flashSkewY ?? rotation;
                const m = lt.matrix;
                m[0] = Math.cos(skewY) * scaleX;
                m[1] = Math.sin(skewY) * scaleX;
                m[2] = -Math.sin(skewX) * scaleY;
                m[3] = Math.cos(skewX) * scaleY;
            }
            return lt;
        };

        lt.scale = function (sx: number, sy: number) {
            origScale(sx, sy);
            const flashSkewX = self._flashSkewX;
            const flashSkewY = self._flashSkewY;
            if ((flashSkewX !== undefined || flashSkewY !== undefined) && sx !== 0 && sy !== 0) {
                const r = self.rotation;
                const skewX = flashSkewX ?? r;
                const skewY = flashSkewY ?? r;
                const dry = r - skewY;
                const drx = r - skewX;
                const k_xy = sx / sy;
                const k_yx = sy / sx;
                const m = lt.matrix;
                const A = m[0], B = m[1], C = m[2], D = m[3];
                m[0] = A * Math.cos(dry) - C * k_xy * Math.sin(dry);
                m[1] = B * Math.cos(dry) - D * k_xy * Math.sin(dry);
                m[2] = A * k_yx * Math.sin(drx) + C * Math.cos(drx);
                m[3] = B * k_yx * Math.sin(drx) + D * Math.cos(drx);
            }
            return lt;
        };
    }/**/

    getChildByName(name: string): Phaser.GameObjects.GameObject | null {
        return this.list.find(c => c.name === name) || null;
    }

    public get(childName: string): ZContainer | null {
        const queue: ZContainer[] = [];

        this.list.forEach(child => {
            if (child instanceof ZContainer) queue.push(child);
        });

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) {
                return current;
            }
            current.list.forEach(child => {
                if (child instanceof ZContainer) queue.push(child);
            });
        }

        return null;
    }

    /**
     * Searches direct children for a Spine animation object and returns the first match.
     * @returns The first `SpineGameObject` found, or `undefined` if none exists.
     */
    getSpine(): SpineGameObject | undefined {
        for (const child of this.list) {
            if ((child as any).skeleton && (child as any).animationState) {
                return child as unknown as SpineGameObject;
            }
        }
        return undefined;
    }

    getAllByName(childName: string): ZContainer[] {
        const result: ZContainer[] = [];
        const queue: ZContainer[] = [];

        this.list.forEach(child => {
            if (child instanceof ZContainer) queue.push(child);
        });

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.name === childName) result.push(current);
            current.list.forEach(child => {
                if (child instanceof ZContainer) queue.push(child);
            });
        }

        return result;
    }

    init(): void {
        // Text field original size setup
        const tf = this.getTextField();
        if (tf) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            // Phaser stores fontSize as a string e.g. "24px"
            if (tf instanceof Phaser.GameObjects.Text) {
                const fs = tf.style?.fontSize;
                this.originalFontSize = fs !== undefined ? parseFloat(fs as string) : undefined;
            }
        }
    }

    public getType(): string {
        return "ZContainer";
    }

    public getProps(): any {
        return this._props;
    }

    public setText(text: string): void {
        let textChild = this.getTextField();
        if (textChild) {
            // Reset to original font size before resizing, so repeated calls
            // always start from full size (mirrors the PIXI version behaviour)
            if (this.originalFontSize !== undefined) {
                textChild.setFontSize(this.originalFontSize);
            }
            textChild.setText(text);
            this.resizeText(textChild);

            //if (textChild.style?.align === "center") {
            //    textChild.setOrigin(0.5, 0.5);
            //}
        }
    }

    public setTextStyle(data: Partial<Phaser.Types.GameObjects.Text.TextStyle>): void {
        let tf = this.getTextField();
        if (tf) {
            if (tf instanceof Phaser.GameObjects.Text) {
                tf.setStyle(data);
                this.resizeText(tf);
            }
        }
    }

    private resizeText(textChild: Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText): void {
        if (this.fixedBoxSize) {
            let maxWidth = this.originalTextWidth;
            let maxHeight = this.originalTextHeight;
            if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                while (
                    (maxWidth !== undefined && textChild.width > maxWidth) ||
                    (maxHeight !== undefined && textChild.height > maxHeight)
                ) {
                    if (textChild instanceof Phaser.GameObjects.Text) {
                        const currentSize = parseFloat(textChild.style?.fontSize as string) || 12;
                        if (currentSize <= 1) break;
                        textChild.setFontSize(currentSize - 1);
                    }
                }
            }
        }
    }

    public getTextField(): Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | null {
        const byName = this.getByName("label");
        if (byName instanceof Phaser.GameObjects.BitmapText) return byName;
        if (byName instanceof Phaser.GameObjects.Text) return byName;

        for (let child of this.list) {
            if (child instanceof Phaser.GameObjects.Text || child instanceof Phaser.GameObjects.BitmapText) {
                return child;
            }
        }
        return null;
    }

    public setInstanceData(data: InstanceData, orientation: string): void {
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
        this.name = data.instanceName || "";
        this._props = data;

        if (data.attrs?.fitToScreen !== undefined) {
            this.fitToScreen = data.attrs.fitToScreen;
        }

        // Text field original size setup
        const tf = this.getTextField();
        if (tf) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            // Phaser stores fontSize as a string e.g. "24px"
            if (tf instanceof Phaser.GameObjects.Text) {
                const fs = tf.style?.fontSize;
                this.originalFontSize = fs !== undefined ? parseFloat(fs as string) : undefined;
            }
        }

        //at this moment the sybling that is masking may not be created yet. so wait. yes it's a hack for now...
        if (data.mask) {
            this.addMask(data.mask,0);
        }

        if (data.playOnStart) {
            for (const child of this.list) {
                if (child instanceof Phaser.GameObjects.Sprite && (child as any)._animKey) {
                    const animKey = (child as any)._animKey;
                    const looping = data.looping ?? false;
                    (child as Phaser.GameObjects.Sprite).play({ key: animKey, repeat: looping ? -1 : 0 });
                }
            }
        }
    }

    private addMask(mskName: string, retry: number): void {
        if (retry >= 3) return;
        setTimeout(() => {
            const sybling = this.parentContainer?.getByName(mskName);
            if (sybling) {
                this._maskSiblingName = mskName;
                (sybling as ZContainer).setVisible(false);
                this.applyMask();
            } else {
                this.addMask(mskName, retry + 1);
            }
        }, 50);
    }

    private applyMask(): void {
        if (!this._maskSiblingName || !this.parentContainer) return;
        const sybling = this.parentContainer.getByName(this._maskSiblingName) as Phaser.GameObjects.Container;
        if (!sybling) return;
        const bounds = sybling.getBounds();
        if (!this._maskGraphics) {
            this._maskGraphics = new Phaser.GameObjects.Graphics(this.scene);
            this.mask = this._maskGraphics.createGeometryMask();
        }
        this._maskGraphics.clear();
        this._maskGraphics.fillStyle(0xffffff);
        this._maskGraphics.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    public setFixedBoxSize(value: boolean): void {
        this.fixedBoxSize = value;
    }

    set fitToScreen(value: boolean) {
        this._fitToScreen = value;
        if (value) {
            this.executeFitToScreen();
        } else {
            this.applyTransform();
        }
    }

    get fitToScreen(): boolean {
        return this._fitToScreen;
    }

    applyTransform() {
        if (this._fitToScreen) // if fitToScreen is true, do not apply transform
        {
            this.executeFitToScreen();
            return;
        }
        if (!this.currentTransform) return;
        if (!this.resizeable) return;
        if (this.parentContainer) {
            const parentFrames = (this.parentContainer as any)._frames;
            if (parentFrames != null && parentFrames[this.name] != null) {
                return; // animated by parent timeline — gotoAndStop handles positioning
            }
        }

        let parentContainer = this.parentContainer as ZContainer;
        if (parentContainer && parentContainer.currentTransform) {
            let parentPivotX = parentContainer.currentTransform.pivotX || 0;
            let parentPivotY = parentContainer.currentTransform.pivotY || 0;

            // Use super directly — we must NOT write back into currentTransform here
            super.setX((this.currentTransform.x - parentPivotX) || 0);
            super.setY((this.currentTransform.y - parentPivotY) || 0);
        }
        else {
            super.setX(this.currentTransform.x || 0);
            super.setY(this.currentTransform.y || 0);
        }

        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha ?? 1;
        this.setScale(this.currentTransform.scaleX || 1, this.currentTransform.scaleY || 1);

        // Apply Flash-style skew. Store raw Flash skew values; the localTransform
        // patch in the constructor converts them to the correct matrix each frame.
        if (this.currentTransform.skewY !== undefined) {
            this._flashSkewY = this.currentTransform.skewY;
        } else {
            this._flashSkewY = undefined;
        }
        if (this.currentTransform.skewX !== undefined) {
            this._flashSkewX = this.currentTransform.skewX;
        } else {
            this._flashSkewX = undefined;
        }

        // Handle pivot - Phaser Containers don't have pivot, so we adjust children positions
        // This mimics PIXI's pivot behavior

        this.setOrigin();

        this.applyAnchor();

        this.applyMask();
        /*
        if (!this.graphics) {
            this.graphics = this.scene.add.graphics();
            this.graphics.setDepth(9999);
        }

        this.graphics.clear();
        this.graphics.lineStyle(2, 0xffffff * Math.random(), 1);
        // Get container bounds in world coordinates
        const bounds = this.getBounds();

        // Draw the rectangle around it
        this.graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.graphics.strokeCircle(this.x, this.y, 5);
        */

    }

    setOrigin() {
        const pivotX = (this.currentTransform.pivotX) || 0;
        const pivotY = (this.currentTransform.pivotY) || 0;

        this.list.forEach(child => {
            // Skip children that manage their own position via fitToScreen
            if ((child as any)._fitToScreen) return;

            let childTransform = (child as any).currentTransform;
            if (childTransform) {
                // Use _setDisplayX/Y to bypass the logical-save override on ZContainer children
                if ((child as any)._setDisplayX) {
                    (child as any)._setDisplayX(childTransform.x - pivotX);
                    (child as any)._setDisplayY(childTransform.y - pivotY);
                } else {
                    (child as any).x = childTransform.x - pivotX;
                    (child as any).y = childTransform.y - pivotY;
                }
            }
            else {
                if (!(child instanceof ZContainer)) {
                    (child as any).setX(-pivotX);
                    (child as any).setY(-pivotY);
                }
            }

        });
    }

    public resize(width: number, height: number, orientation: "portrait" | "landscape") {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }

    private computeContentBounds(container: Phaser.GameObjects.Container): { minX: number, minY: number, maxX: number, maxY: number } {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const child of container.list) {
            const c = child as any;
            const dw: number = c.displayWidth ?? c.width ?? 0;
            const dh: number = c.displayHeight ?? c.height ?? 0;
            if (dw === 0 && dh === 0) {
                if (child instanceof Phaser.GameObjects.Container) {
                    const inner = this.computeContentBounds(child as Phaser.GameObjects.Container);
                    if (isFinite(inner.minX)) {
                        const sx: number = c.scaleX ?? 1;
                        const sy: number = c.scaleY ?? 1;
                        minX = Math.min(minX, c.x + inner.minX * sx);
                        minY = Math.min(minY, c.y + inner.minY * sy);
                        maxX = Math.max(maxX, c.x + inner.maxX * sx);
                        maxY = Math.max(maxY, c.y + inner.maxY * sy);
                    }
                }
                continue;
            }
            const ox: number = (c.originX ?? 0) * dw;
            const oy: number = (c.originY ?? 0) * dh;
            minX = Math.min(minX, c.x - ox);
            minY = Math.min(minY, c.y - oy);
            maxX = Math.max(maxX, c.x - ox + dw);
            maxY = Math.max(maxY, c.y - oy + dh);
        }
        return { minX, minY, maxX, maxY };
    }

    executeFitToScreen() {
        if (this.list.length === 0) return;

        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        // Helper: convert a world-space point to parent-local coords
        const parentMat = this.parentContainer
            ? this.parentContainer.getWorldTransformMatrix()
            : null;
        const toLocal = (wx: number, wy: number): { x: number; y: number } =>
            parentMat ? parentMat.applyInverse(wx, wy) : { x: wx, y: wy };

        // Screen corners in parent-local space
        const topLeft = toLocal(0, 0);
        const btmRight = toLocal(screenWidth, screenHeight);
        const mid = toLocal(screenWidth / 2, screenHeight / 2);

        // Local dimensions of the screen (accounts for parent scale/rotation)
        const localScreenW = btmRight.x - topLeft.x;
        const localScreenH = btmRight.y - topLeft.y;

        const firstChild = this.list[0] as any;
        const isNineSlice = firstChild instanceof Phaser.GameObjects.NineSlice;

        if (isNineSlice) {
            this.x = topLeft.x;
            this.y = topLeft.y;
            this.setScale(1, 1);
            firstChild.width = localScreenW;
            firstChild.height = localScreenH;
            return;
        }

        // Compute content bounds in this container's local space, recursing into
        // sub-containers that have no intrinsic size (e.g. ZContainers).
        const { minX, minY, maxX, maxY } = this.computeContentBounds(this);

        if (!isFinite(minX) || !isFinite(minY)) return;

        const localContentW = maxX - minX;
        const localContentH = maxY - minY;
        if (localContentW === 0 || localContentH === 0) return;

        // Scale to cover the screen (use max to cover, min to fit)
        const scaleX = localScreenW / localContentW;
        const scaleY = localScreenH / localContentH;
        const scale = Math.max(scaleX, scaleY);

        this.setScale(scale, scale);

        // Center the content around the screen midpoint in parent-local space.
        // The content's local top-left is at (minX, minY); after scale it offset
        // from the container origin by (minX*scale, minY*scale).
        // We want content center to land on mid:
        //   this.x + (minX + localContentW/2) * scale = mid.x
        this.x = mid.x - (minX + localContentW / 2) * scale;
        this.y = mid.y - (minY + localContentH / 2) * scale;
    }

    /**/

    /**
     * Internal helper — sets the raw Phaser display position without touching
     * `currentTransform`. Used by `setOrigin` and `applyTransform` to avoid
     * corrupting the logical (editor) x/y stored in the transform.
     */
    public _setDisplayX(value: number): void {
        super.setX(value);
    }

    public _setDisplayY(value: number): void {
        super.setY(value);
    }

    /**
     * Returns the logical x position as set via setX() / currentTransform.x.
     * Unlike the Phaser `.x` getter (which returns the display position adjusted
     * for the parent's pivot), this always reflects the authored coordinate.
     */
    public getX(): number {
        return this.currentTransform?.x ?? this.x;
    }

    /**
     * Returns the logical y position as set via setY() / currentTransform.y.
     * Unlike the Phaser `.y` getter (which returns the display position adjusted
     * for the parent's pivot), this always reflects the authored coordinate.
     */
    public getY(): number {
        return this.currentTransform?.y ?? this.y;
    }

    /**
     * Sets the logical x position, saves it to `currentTransform.x` (mirroring
     * the PIXI pattern), and applies the parent-pivot correction so the display
     * position is consistent.
     */
    public setX(value?: number | undefined): this {
        if (this.currentTransform && value !== undefined) {
            this.currentTransform.x = value;
        }
        // Compute the display position the same way applyTransform would
        const parentPivotX = (this.parentContainer as ZContainer)?.currentTransform?.pivotX || 0;
        super.setX(((value ?? 0) - parentPivotX) || 0);
        return this;
    }

    public setY(value?: number | undefined): this {
        if (this.currentTransform && value !== undefined) {
            this.currentTransform.y = value;
        }
        const parentPivotY = (this.parentContainer as ZContainer)?.currentTransform?.pivotY || 0;
        super.setY(((value ?? 0) - parentPivotY) || 0);
        return this;
    }

    public setWidth(value: number): this {
        super.setSize(value, this.height);
        if (this.currentTransform) {
            // this.currentTransform.width = value;
        }
        return this;
    }

    public setHeight(value: number): this {
        super.setSize(this.width, value);
        if (this.currentTransform) {
            // this.currentTransform.height = value;
        }
        return this;
    }

    public setScaleX(x?: number): this {
        super.setScale(x, this.scaleY);
        if (this.currentTransform) {
            // this.currentTransform.scaleX = x!;
        }
        return this;

    }

    public setScaleY(y?: number): this {
        super.setScale(this.scaleX, y);
        if (this.currentTransform) {
            // this.currentTransform.scaleY = y!;
        }
        return this;
    }



    public applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parentContainer) {
            let xPer = this.currentTransform.anchorPercentage?.x ?? 0;
            let yPer = this.currentTransform.anchorPercentage?.y ?? 0;
            let x = xPer * this.scene.scale.width;
            let y = yPer * this.scene.scale.height;
            // x, y are already in world/screen space — convert directly to parent-local space
            const mat = this.parentContainer.getWorldTransformMatrix();
            const inv = new Phaser.GameObjects.Components.TransformMatrix();
            inv.copyFrom(mat);
            inv.invert();
            const localPoint = inv.transformPoint(x, y);

            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }

    public isAnchored(): boolean {
        return !!this.currentTransform?.isAnchored;
    }

    public setAlpha(value: number): this {
        this.alpha = value;
        if (this.portrait) this.portrait.alpha = value;
        if (this.landscape) this.landscape.alpha = value;
        return this;
    }

    public getAlpha(): number {
        return this.alpha;

    }

    public setVisible(value: boolean): this {
        this.visible = value;
        if (this.portrait) this.portrait.visible = value;
        if (this.landscape) this.landscape.visible = value;
        return this;
    }

    public getVisible(): boolean {
        return this.visible;
    }

    public getTextStyle(): Phaser.Types.GameObjects.Text.TextStyle | null {
        const tf = this.getTextField();
        if (!tf) return null;
        if (tf instanceof Phaser.GameObjects.Text) {
            return tf.style as unknown as Phaser.Types.GameObjects.Text.TextStyle;
        }
        return null;
    }

    /**
     * Creates a shallow structural clone of this `ZContainer`, copying position,
     * scale, rotation, alpha, visibility, and name. Direct children are cloned
     * by type: `Phaser.GameObjects.Text`, `Phaser.GameObjects.Image`,
     * `Phaser.GameObjects.NineSlice`, and any object that exposes its own `clone()` method.
     */
    public clone(): ZContainer {
        const newContainer = new ZContainer(this.scene, this.x, this.y);
        newContainer.name = this.name;
        newContainer.setScale(this.scaleX, this.scaleY);
        newContainer.rotation = this.rotation;
        newContainer.alpha = this.alpha;
        newContainer.setVisible(this.visible);

        for (const child of this.list) {
            if (child instanceof Phaser.GameObjects.Text) {
                const c = this.scene.add.text(child.x, child.y, child.text, child.style as Phaser.Types.GameObjects.Text.TextStyle);
                c.name = child.name;
                c.setScale(child.scaleX, child.scaleY);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.setOrigin(child.originX, child.originY);
                newContainer.add(c);
            } else if (child instanceof Phaser.GameObjects.NineSlice) {
                const c = this.scene.add.nineslice(child.x, child.y, child.texture.key, child.frame.name,
                    child.width, child.height, child.leftWidth, child.rightWidth, child.topHeight, child.bottomHeight);
                c.name = child.name;
                c.setScale(child.scaleX, child.scaleY);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.add(c);
            } else if (child instanceof Phaser.GameObjects.Image) {
                const c = this.scene.add.image(child.x, child.y, child.texture.key, child.frame.name);
                c.name = child.name;
                c.setScale(child.scaleX, child.scaleY);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.setOrigin(child.originX, child.originY);
                newContainer.add(c);
            } else if ((child as any).clone) {
                newContainer.add((child as any).clone());
            }
        }
        return newContainer;
    }

    public getAllOfType(type: string): ZContainer[] {
        // Ensure `getType` is defined for ZContainer instances
        (this as any).getType = (this as any).getType || (() => "default");
        const queue: ZContainer[] = [];
        const result: ZContainer[] = [];
        if (this.list && this.list.length > 0) {
            for (let child of this.list) {
                if ((child as any).getType) {
                    queue.push(child as ZContainer);
                }
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            let _t = (current as any).getType?.();
            if (_t === type) {
                result.push(current);
            }

            if (current.list && current.list.length > 0) {
                for (let child of current.list) {
                    if ((child as any).getType) {
                        queue.push(child as ZContainer);
                    }
                }
            }
        }

        return result as ZContainer[];
    }

    public addParticleSystem(particles: Phaser.GameObjects.Particles.ParticleEmitter): void {
        this.particleSystems.push(particles);
        if (!this.emitter) {
            this.emitter = particles; // Keep reference to first emitter for backwards compatibility
        }
    }

    public loadParticle(emitterConfig: any, textureKey: string): void {
        try {
            const particles = this.scene.add.particles(0, 0, textureKey, emitterConfig);
            this.add(particles);
            this.addParticleSystem(particles);
            this.playParticleAnim();
        } catch (error) {
            console.error("Error creating ParticleEmitter:", error);
        }
    }

    playParticleAnim() {
        this.particleSystems.forEach(particles => {
            if (particles) {
                particles.start();
            }
        });
    }

    stopParticleAnim() {
        this.particleSystems.forEach(particles => {
            if (particles) {
                particles.stop();
            }
        });
    }

    /**
     * Enable pointer interaction on a Container by assigning a Rectangle hit area
     * based on its current bounds. Containers don't have a default hit area in Phaser.
     
    public enablePointerInteraction(useHandCursor: boolean = true): void {
        const bounds = this.getBounds();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        // Set the local input size and a Rectangle hit area in local space
        this.setSize(width, height);
        const rect = new Phaser.Geom.Rectangle(0, 0, width, height);
        this.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
        if (useHandCursor && (this as any).input) {
            // Phaser will switch cursor when hovering this object
            ((this as any).input).cursor = 'pointer';
        }
    }*/
}
