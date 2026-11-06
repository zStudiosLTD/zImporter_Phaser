import Phaser from "phaser";
import { ZContainer } from "./ZContainer";
export class ZScroll extends ZContainer {
    /** Height of the scroll track — ZScroll LOCAL space (not world space) */
    scrollBarHeight = 0;
    contentHeight = 0;
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    isBeedDragging = false;
    scrollingEnabled = true;
    beed;
    scrollBar;
    scrollContent;
    msk = null;
    init() {
        super.init();
        // Use ZContainer's recursive BFS get() — Phaser's getByName only searches direct children
        this.beed = this.get("beed");
        this.scrollBar = this.get("scrollBar");
        this.scrollContent = this.get("scrollContent");
        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn("ZScroll requires 'beed', 'scrollBar', and 'scrollContent' children.", this.name);
            return;
        }
        // Defer one tick — children need their applyTransform called before we measure them
        this.scene.time.delayedCall(0, () => this.calculateScrollBar());
    }
    getType() {
        return "ZScroll";
    }
    calculateScrollBar() {
        if (this.msk) {
            this.scrollContent?.clearMask(true);
            this.msk.destroy();
            this.msk = null;
        }
        this.removeEventListeners();
        if (!this.scrollBar || !this.scrollContent || !this.beed)
            return;
        // ── CRITICAL: Phaser Container.height = 0 (unlike PIXI). ────────────
        // getBounds() returns WORLD-space bounds. Divide by world scale to get
        // the LOCAL-space equivalent, which is consistent with beed.y (local).
        const worldScaleY = this.getWorldScaleY();
        this.scrollBarHeight = this.scrollBar.getBounds().height / worldScaleY;
        this.contentHeight = this.scrollContent.getBounds().height / worldScaleY;
        console.log(`[ZScroll] "${this.name}" scrollBarH=${this.scrollBarHeight.toFixed(1)}, contentH=${this.contentHeight.toFixed(1)}`);
        if (this.contentHeight <= this.scrollBarHeight) {
            console.log(`[ZScroll] "${this.name}" content fits — no scroll needed`);
            this.beed.setVisible(false);
            this.scrollBar.setVisible(false);
            this.scrollContent.y = 0;
            return;
        }
        this.beed.setVisible(true);
        this.scrollBar.setVisible(true);
        const w = this.scrollBar.x - this.scrollContent.x;
        const scx = this.scrollContent.x;
        // Use the data y so resets are idempotent across multiple resizes
        const scy = this.scrollContent.currentTransform?.y ?? this.scrollContent.y;
        // ── Geometry mask in world space ─────────────────────────────────────
        // Key trick: create the Graphics WITHOUT adding it to any display list
        // (no this.add / no scene.add.existing). It is never rendered as a visible
        // rectangle, but Phaser's GeometryMask still calls willRender() → true
        // (visible=true, alpha=1 by default) and writes the stencil buffer.
        //
        // Because the Graphics has no parent, its coords are world space.
        // We convert the local clip rect through ZScroll's world transform matrix.
        this.msk = new Phaser.GameObjects.Graphics(this.scene);
        const mat = new Phaser.GameObjects.Components.TransformMatrix();
        const tempMat = new Phaser.GameObjects.Components.TransformMatrix();
        this.getWorldTransformMatrix(mat, tempMat);
        const tl = mat.transformPoint(scx, scy);
        const br = mat.transformPoint(scx + w, scy + this.scrollBarHeight);
        this.msk.fillStyle(0xffffff, 1);
        this.msk.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        this.scrollContent.setMask(this.msk.createGeometryMask());
        // Store the clip rect in Phaser world-space so ZTextInput descendants
        // can apply a matching CSS clip-path to their DOM elements.
        this._clipWorld = { tl: { x: tl.x, y: tl.y }, br: { x: br.x, y: br.y } };
        this.scrollContent.y = scy;
        this.beed.y = 0;
        this.addEventListeners();
    }
    addEventListeners() {
        this.removeEventListeners();
        // All events are scene-level so drags never get stuck when pointer leaves any object
        this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onScenePointerDown, this);
        this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
        this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
        this.scene.input.on("wheel", this.onWheel, this);
    }
    removeEventListeners() {
        if (!this.scene?.input)
            return;
        this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onScenePointerDown, this);
        this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
        this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
        this.scene.input.off("wheel", this.onWheel, this);
    }
    removeListeners() {
        this.removeEventListeners();
    }
    onScenePointerDown(pointer) {
        const local = this.worldToLocal(pointer.worldX, pointer.worldY);
        const scx = this.scrollContent.x;
        const scy = this.scrollContent.currentTransform?.y ?? this.scrollContent.y;
        const w = this.scrollBar.x - scx;
        const worldScaleY = this.getWorldScaleY();
        this.scrollBarHeight = this.scrollBar.getBounds().height / worldScaleY;
        // Check beed first — its column is to the right of the content area (at scrollBar.x)
        // so we test it separately against world bounds to avoid coordinate-space confusion.
        const beedBounds = this.beed.getBounds();
        if (pointer.worldX >= beedBounds.x && pointer.worldX <= beedBounds.right &&
            pointer.worldY >= beedBounds.y && pointer.worldY <= beedBounds.bottom) {
            this.isBeedDragging = true;
            this.dragStartY = local.y;
            this.beedStartY = this.beed.y;
            console.log(`[ZScroll] beedDrag start beed.y=${this.beed.y.toFixed(1)}`);
            return;
        }
        // Check content/scrollBar area
        if (local.x < scx || local.x > scx + w || local.y < scy || local.y > scy + this.scrollBarHeight)
            return;
        this.isDragging = true;
        this.dragStartY = local.y;
        this.beedStartY = this.beed.y;
        console.log(`[ZScroll] contentDrag start local=(${local.x.toFixed(1)},${local.y.toFixed(1)})`);
    }
    onPointerMove(pointer) {
        if (!this.isDragging && !this.isBeedDragging)
            return;
        const currentY = this.worldToLocal(pointer.worldX, pointer.worldY).y;
        const deltaY = this.isDragging
            ? this.dragStartY - currentY // invert: drag down → content scrolls up
            : currentY - this.dragStartY; // beed: direct 1:1
        this.beed.y = this.beedStartY + deltaY;
        this.clampAndSync();
    }
    onPointerUp() {
        this.isDragging = false;
        this.isBeedDragging = false;
    }
    onWheel(_pointer, _over, _dx, dy) {
        if (!this.scrollingEnabled)
            return;
        this.scrollBarHeight = this.scrollBar.getBounds().height / this.getWorldScaleY();
        this.beed.y += dy * 0.5; // dy > 0 = scroll down → beed moves down
        this.clampAndSync();
    }
    /** Clamp beed to [0, scrollBarHeight - beedH] and sync scrollContent. All local space. */
    clampAndSync() {
        const worldScaleY = this.getWorldScaleY();
        const beedH = Math.max(1, this.beed.getBounds().height / worldScaleY);
        const maxBeedY = Math.max(0, this.scrollBarHeight - beedH);
        this.beed.y = Phaser.Math.Clamp(this.beed.y, 0, maxBeedY);
        const per = maxBeedY > 0 ? this.beed.y / maxBeedY : 0;
        const totalH = this.scrollContent.getBounds().height / worldScaleY;
        const scy0 = this.scrollContent.currentTransform?.y ?? 0;
        this.scrollContent.y = scy0 - per * (totalH - this.scrollBarHeight);
    }
    /** Convert world-space coords to ZScroll's local coordinate space. */
    worldToLocal(wx, wy) {
        const mat = new Phaser.GameObjects.Components.TransformMatrix();
        this.getWorldTransformMatrix(mat);
        mat.invert();
        return mat.transformPoint(wx, wy);
    }
    /** Accumulated world Y-scale of this container (includes all parent scales). */
    getWorldScaleY() {
        const mat = new Phaser.GameObjects.Components.TransformMatrix();
        this.getWorldTransformMatrix(mat);
        // getScaleY() exists at runtime but is absent from Phaser's TS types
        return (mat.getScaleY?.() ?? Math.sqrt(mat.c * mat.c + mat.d * mat.d)) || 1;
    }
    applyTransform() {
        super.applyTransform();
        // Defer so sibling children finish their resize before we measure them
        if (this.beed && this.scrollBar && this.scrollContent) {
            this.scene.time.delayedCall(0, () => this.calculateScrollBar());
        }
    }
}
//# sourceMappingURL=ZScroll.js.map