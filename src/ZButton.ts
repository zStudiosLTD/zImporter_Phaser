
import { ZContainer } from "./ZContainer";

type LabelState = "single" | "multi" | "none";

// Remove all click listeners (pointerdown, pointerup, etc.)
export const RemoveClickListener = (container: Phaser.GameObjects.Container): void => {
    container.off('mouseup');
    container.off('touchend');
    container.off('touchendoutside');
    container.off('mouseupoutside');
    container.off('mousedown');
    container.off('touchstart');
};


// Update the hit area of a button container to match its visible graphics, ignoring origin/pivot
export function updateHitArea(container: Phaser.GameObjects.Container & { _hitAreaGraphics?: Phaser.GameObjects.Graphics }) {
    // Remove old hit area graphics if present
    if (container._hitAreaGraphics) {
        container.remove(container._hitAreaGraphics, true);
        container._hitAreaGraphics.destroy();
        container._hitAreaGraphics = undefined;
    }
    if (!container.scene || !container.scene.add) return;

    // Compute local bounds of all children, taking into account scale, pivot, and origin
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    // Get the container's world transform matrix
    const containerMatrix = container.getWorldTransformMatrix();
    container.iterate((child: any) => {
        if (!child.visible || !child.getBounds) return;
        const b = child.getBounds(); // world coordinates
        // Transform all four corners to container local space
        const points = [
            { x: b.x, y: b.y },
            { x: b.x + b.width, y: b.y },
            { x: b.x, y: b.y + b.height },
            { x: b.x + b.width, y: b.y + b.height }
        ];
        points.forEach(pt => {
            const local = containerMatrix.applyInverse(pt.x, pt.y);
            minX = Math.min(minX, local.x);
            minY = Math.min(minY, local.y);
            maxX = Math.max(maxX, local.x);
            maxY = Math.max(maxY, local.y);
        });
    });
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        // fallback: default to 0,0,1,1
        minX = 0; minY = 0; maxX = 1; maxY = 1;
    }
    const width = maxX - minX;
    const height = maxY - minY;

    // Create a new invisible graphics object at (minX, minY) in local space
    const g = container.scene.add.graphics();
    g.fillStyle(0xffffff, 0.001); // visible for debug, set to 0.001 for production
    g.fillRect(minX, minY, width, height);
    g.setName("_hitAreaGraphics");
    g.setInteractive(new Phaser.Geom.Rectangle(minX, minY, width, height), Phaser.Geom.Rectangle.Contains);
    g.input!.cursor = 'pointer'; // Set the cursor style
    // Forward pointer events to this button
    const events = ['pointerdown', 'pointerup', 'pointerover', 'pointerout', 'mouseup', 'touchend', 'touchendoutside', 'mouseupoutside', 'mousedown', 'touchstart'];
    for (let ev of events) {
        g.on(ev, (e: any) => container.emit(ev, e));
    }

    // Add to container at the bottom
    container.add(g);
    container._hitAreaGraphics = g;
}


// Attach click and long-press listeners, with drag threshold
export const AttachClickListener = (
    container: Phaser.GameObjects.Container,
    pressCallback?: () => void,
    longPressCallback?: () => void
): void => {
    // Calculate bounds based on children and set the hit area
    // Calculate bounds relative to (0,0) to ignore origin/pivot


    if (pressCallback) (container as any).pressCallback = pressCallback;
    if (longPressCallback) (container as any).longPressCallback = longPressCallback;

    let longPressTimer: any = null;
    const LONG_PRESS_DURATION = 500;
    const MAX_DRAG_DISTANCE = 20;
    let longPressFired = false;
    let startPos: { x: number; y: number } | null = null;

    const getPointerPos = (pointer: Phaser.Input.Pointer) => {
        return { x: pointer.worldX, y: pointer.worldY };
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
        longPressFired = false;
        startPos = getPointerPos(pointer);
        longPressTimer = setTimeout(() => {
            longPressFired = true;
            if ((container as any).longPressCallback) {
                (container as any).longPressCallback();
            }
            updateHitArea(container);
        }, LONG_PRESS_DURATION);
        container.on('pointerupoutside', onPointerUp);
        container.on('pointerup', onPointerUp);
        container.on('mouseup', onPointerUp);
        container.on('touchend', onPointerUp);
        container.on('touchendoutside', onPointerUp);
        container.on('mouseupoutside', onPointerUp);
    };

    const onPointerUp = (pointer: Phaser.Input.Pointer) => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        let isDrag = false;
        const endPos = getPointerPos(pointer);
        if (startPos && endPos) {
            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > MAX_DRAG_DISTANCE) isDrag = true;
        }
        startPos = null;
        if (!longPressFired && !isDrag) {
            if ((container as any).pressCallback) {
                (container as any).pressCallback();
            }
        }

        container.off('pointerupoutside', onPointerUp);
        container.off('pointerup', onPointerUp);
        container.off('mouseup', onPointerUp);
        container.off('touchend', onPointerUp);
        container.off('touchendoutside', onPointerUp);
        container.off('mouseupoutside', onPointerUp);
        updateHitArea(container);

        // No global cursor changes here; let Phaser handle per-object cursor
    };
    container.on('pointerdown', onPointerDown);
    container.on('touchstart', onPointerDown);
    updateHitArea(container);
}

export class ZButton extends ZContainer {
    _hitAreaGraphics?: Phaser.GameObjects.Graphics;
    topLabelContainer2?: ZContainer;
    topLabelContainer?: ZContainer;

    overState?: ZContainer;
    overLabelContainer?: ZContainer;
    overLabelContainer2?: ZContainer;

    downState?: ZContainer;
    downLabelContainer?: ZContainer;
    downLabelContainer2?: ZContainer;

    upState?: ZContainer;
    upLabelContainer?: ZContainer;
    upLabelContainer2?: ZContainer;

    disabledState?: ZContainer;
    disabledLabelContainer?: ZContainer;
    disabledLabelContainer2?: ZContainer;

    pressCallback?: () => void;
    longPressCallback?: () => void;

    private labelState: LabelState = "none";

    public getType(): string {
        return "ZButton";
    }

    init(_labelStr: string = "") {
        super.init?.();

        if (this.overState) {
            this.overLabelContainer = this.overState.getByName?.("labelContainer") as ZContainer;
            this.overLabelContainer2 = this.overState.getByName?.("labelContainer2") as ZContainer;
        }
        if (this.disabledState) {
            this.disabledLabelContainer = this.disabledState.getByName?.("labelContainer") as ZContainer;
            this.disabledLabelContainer2 = this.disabledState.getByName?.("labelContainer2") as ZContainer;
        }
        if (this.downState) {
            this.downLabelContainer = this.downState.getByName?.("labelContainer") as ZContainer;
            this.downLabelContainer2 = this.downState.getByName?.("labelContainer2") as ZContainer;
        }
        if (this.upState) {
            this.upLabelContainer = this.upState.getByName?.("labelContainer") as ZContainer;
            this.upLabelContainer2 = this.upState.getByName?.("labelContainer2") as ZContainer;
        }

        this.topLabelContainer = (this as any).labelContainer;
        this.topLabelContainer2 = (this as any).labelContainer2;

        // Detect single vs multi label
        if (this.topLabelContainer) {
            this.labelState = "single";
        } else if (
            this.overState &&
            this.disabledState &&
            this.downState &&
            this.upState &&
            this.overLabelContainer &&
            this.disabledLabelContainer &&
            this.downLabelContainer &&
            this.upLabelContainer
        ) {
            this.labelState = "multi";
        }

        this.enable();
    }

    applyTransform() {
        super.applyTransform();
        updateHitArea(this);
    }


    setLabel(name: string): void {
        if (this.labelState === "single" && this.topLabelContainer) {
            this.topLabelContainer.setVisible(true);
            (this.topLabelContainer as any).setText?.(name);
        } else if (this.labelState === "multi") {
            [this.overLabelContainer, this.disabledLabelContainer, this.downLabelContainer, this.upLabelContainer].forEach(
                (label) => {
                    if (label) {
                        label.setVisible(true);
                        (label as any).setText?.(name);
                    }
                }
            );
        }
    }

    setLabel2(name: string): void {
        if (this.labelState === "single" && this.topLabelContainer2) {
            this.topLabelContainer2.setVisible(true);
            (this.topLabelContainer2 as any).setText?.(name);
        } else if (this.labelState === "multi") {
            [this.overLabelContainer2, this.disabledLabelContainer2, this.downLabelContainer2, this.upLabelContainer2].forEach(
                (label) => {
                    if (label) {
                        label.setVisible(true);
                        (label as any).setText?.(name);
                    }
                }
            );
        }
    }

    setFixedTextSize(fixed: boolean): void {
        const labelContainers = this.getAllByName("labelContainer") as ZContainer[];
        const labelContainers2 = this.getAllByName("labelContainer2") as ZContainer[];
        labelContainers.forEach(container => container.setFixedBoxSize(fixed));
        labelContainers2.forEach(container => container.setFixedBoxSize(fixed));
    }

    makeSingleLine(): void {
        const labelContainers = this.getAllByName("labelContainer") as ZContainer[];
        const labelContainers2 = this.getAllByName("labelContainer2") as ZContainer[];
        labelContainers2.forEach(label => label.setVisible(false));
        labelContainers.forEach(label => {
            const parent = label.parentContainer as ZContainer;
            if (parent) {
                label.y = parent.height / 2;
            }
        });
    }

    public getLabel(): Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | null {
        if (this.labelState === "single" && this.topLabelContainer) {
            return this.topLabelContainer.getTextField();
        } else if (this.labelState === "multi" && this.upLabelContainer) {
            return this.upLabelContainer.getTextField();
        }
        return null;
    }

    public getLabel2(): Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText | null {
        if (this.labelState === "single" && this.topLabelContainer2) {
            return this.topLabelContainer2.getTextField();
        } else if (this.labelState === "multi" && this.upLabelContainer2) {
            return this.upLabelContainer2.getTextField();
        }
        return null;
    }

    public hasLabel(): boolean {
        return this.getLabel() !== null;
    }

    public hasLabel2(): boolean {
        return this.getLabel2() !== null;
    }

    setCallback(func: () => void) {
        this.pressCallback = func;
    }

    removeCallback() {
        this.pressCallback = undefined;
    }

    setLongPressCallback(func: () => void) {
        this.longPressCallback = func;
    }

    removeLongPressCallback() {
        this.longPressCallback = undefined;
    }

    onClicked() {
        if (this.pressCallback) this.pressCallback();
    }

    enable() {
        this.removeAllListeners && this.removeAllListeners();
        // Do NOT call enablePointerInteraction here; only the white graphics will be interactive

        // No global cursor change here; let Phaser handle per-object cursor

        this.hideAllStates();
        if (this.upState) {
            this.upState.setVisible(true);
            this.add(this.upState);
        }
        if (this.labelState === "single" && this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 1;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 1;
            }
        }

        // Hover/press listeners
        this.on("pointerout", this.onOut, this);
        this.on("pointerover", this.onOver, this);
        this.on("pointerdown", this.onDown, this);
        this.on("pointerup", this.onOut, this);
        AttachClickListener(this, undefined, undefined);

    }

    disable() {
        this.removeAllListeners && this.removeAllListeners();
        this.disableInteractive && this.disableInteractive();
        // No global cursor change here; let Phaser handle per-object cursor
        this.hideAllStates();
        if (this.disabledState) {
            this.disabledState.setVisible(true);
            this.add(this.disabledState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 0.5;
        }
        if (this.topLabelContainer2) {
            this.add(this.topLabelContainer2);
            (this.topLabelContainer2 as any).alpha = 0.5;
        }
    }

    hideAllStates() {
        if (this.overState) this.overState.setVisible(false);
        if (this.downState) this.downState.setVisible(false);
        if (this.upState) this.upState.setVisible(false);
        if (this.disabledState) this.disabledState.setVisible(false);
    }

    onDown() {
        if (this.downState) {
            this.hideAllStates();
            this.downState.setVisible(true);
            this.add(this.downState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 0.5;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 0.5;
            }
        }
    }

    onOut() {
        if (this.upState) {
            this.hideAllStates();
            this.upState.setVisible(true);
            this.add(this.upState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 1;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 1;
            }
        }
    }

    onOver() {
        if (this.overState) {
            this.hideAllStates();
            this.overState.setVisible(true);
            this.add(this.overState);
        }
        if (this.topLabelContainer) {
            this.add(this.topLabelContainer);
            (this.topLabelContainer as any).alpha = 1;
            if (this.topLabelContainer2) {
                this.add(this.topLabelContainer2);
                (this.topLabelContainer2 as any).alpha = 1;
            }
        }
    }
}
