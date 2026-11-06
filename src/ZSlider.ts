import Phaser from "phaser";
import { updateHitArea, ZButton } from "./ZButton";
import { ZContainer } from "./ZContainer";


export class ZSlider extends ZContainer {
    dragging = false;
    sliderWidth: number | undefined = 0;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;

    handle!: ZContainer;
    track!: ZContainer;

    init() {
        super.init();

        this.handle = this.getByName('handle') as ZContainer;
        this.track = this.getByName('track') as ZContainer;
        if (!this.handle || !this.track) {
            console.error("ZSlider is missing handle or track");
            return;
        }

        // ZContainer.width is always 0 in Phaser — compute from the image child inside the track.
        let trackWidth = 0;
        for (const child of this.track.list) {
            const w = (child as any).displayWidth ?? (child as any).width ?? 0;
            if (w > trackWidth) trackWidth = w;
        }
        this.sliderWidth = trackWidth;

        this.onDragStartBinded = this.onDragStart.bind(this);
        this.onDragEndBinded = this.onDragEnd.bind(this);
        this.onDragBinded = this.onDrag.bind(this);

        // ZButton manages its own hit area via _hitAreaGraphics which forwards events;
        // calling setInteractive() on a zero-sized Container does nothing useful.
        // A plain container handle needs the same hit area to receive pointer events.
        if (!(this.handle instanceof ZButton)) {
            updateHitArea(this.handle);
        }
        this.handle.on('pointerdown', this.onDragStartBinded);
        this.handle.on('touchstart', this.onDragStartBinded);
    }

    public getType(): string {
        return "ZSlider";
    }

    setHandlePosition(t: number) {
        this.handle.x = t * this.sliderWidth!;
        if (this.callback) {
            this.callback(t);
        }
    }

    setCallback(callback: (t: number) => void) {
        this.callback = callback;
    }

    removeCallback() {
        this.callback = undefined;
    }

    onDragStart(e: any) {
        this.dragging = true;
        this.handle.on('pointerup', this.onDragEndBinded);
        this.handle.on('pointerupoutside', this.onDragEndBinded);
        this.handle.on('touchend', this.onDragEndBinded);
        this.handle.on('touchendoutside', this.onDragEndBinded);
        window.addEventListener('pointerup', this.onDragEndBinded);
        window.addEventListener('touchend', this.onDragEndBinded);
        window.addEventListener('pointermove', this.onDragBinded);
        window.addEventListener('touchmove', this.onDragBinded);
    }

    onDragEnd(e: any) {
        this.dragging = false;
        this.handle.off('pointerup', this.onDragEndBinded);
        this.handle.off('pointerupoutside', this.onDragEndBinded);
        this.handle.off('touchend', this.onDragEndBinded);
        this.handle.off('touchendoutside', this.onDragEndBinded);
        window.removeEventListener('pointerup', this.onDragEndBinded);
        window.removeEventListener('touchend', this.onDragEndBinded);
        window.removeEventListener('pointermove', this.onDragBinded);
        window.removeEventListener('touchmove', this.onDragBinded);
    }

    onDrag(e: any): void {
        let clientX: number | undefined;
        if (e && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else if (e && typeof e.clientX === 'number') {
            clientX = e.clientX;
        }
        if (clientX === undefined) return;
        if (!this.sliderWidth) return;

        // Convert clientX (CSS viewport pixels) → canvas pixels → Phaser world X → slider-local X.
        // This correctly handles canvas CSS scaling and camera zoom/scroll.
        const canvas = this.scene.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const cssToCanvas = canvas.width / rect.width;
        const cam = this.scene.cameras.main;
        const worldX = ((clientX - rect.left) * cssToCanvas) / cam.zoom + cam.scrollX;

        // applyInverse maps world coords → this container's local coords.
        // Pass the container's own world Y (mat.ty) so that any rotation is handled correctly.
        const mat = this.getWorldTransformMatrix();
        const localPt = mat.applyInverse(worldX, mat.ty);

        const localX = Phaser.Math.Clamp(localPt.x, 0, this.sliderWidth);
        this.handle.x = localX;
        const t = localX / this.sliderWidth;
        if (this.callback) {
            this.callback(t);
        }
        if (e.stopPropagation) e.stopPropagation();
    }
}
