---
name: zimporter-responsive-layout
description: Move, scale, hide or animate zStudio elements from code with zimporter-phaser (Phaser) without breaking the responsive layout. Load before changing any element's position, scale, alpha or visibility.
---
# Moving elements without breaking the layout (Phaser)

Every element stores two transforms: `portrait` and `landscape`. On each resize zImporter scales and centres the stage, re-applies the stored transform for the current orientation to every element, and moves anchored elements to their percentage of the window. **Anything not in the stored transform is undone at the next resize**, and resizes happen often on phones.

| Write | Result on the next resize | Use instead |
|---|---|---|
| `mc.x = 100` | Undone | `mc.setX(100)`, kept for the current orientation; read with `getX()` |
| `mc.setScaleX(2)`, `mc.scaleX = 2` | Undone | Write the stored transform |
| `mc.rotation = 1` | Undone | Write the stored transform |
| `mc.alpha = 0.5` | Undone | `mc.setAlpha(0.5)` |
| `mc.visible = false` | Kept | `mc.setVisible(false)` is still preferred |
| any position on an anchored element | Snaps back to the anchor | Change `anchorPercentage` |

## Choosing the approach

**Move for good.** Write both stored transforms, then re-apply. Works for `x`, `y`, `scaleX`, `scaleY`, `rotation`.
```ts
mc.portrait.x = 120; mc.portrait.y = 900;
mc.landscape.x = 40; mc.landscape.y = 300;
mc.applyTransform();
```

**Move in this orientation only.**
```ts
mc.setX(120); // other orientation unchanged. Read back with mc.getX().
```

**Animate and come back.** Use a wrapper. In zStudio, nest the art in an inner container named `content`; the outer one keeps the layout. A tween on a laid-out element can jump if a resize re-applies its stored transform mid-tween.
```ts
const content = mc.get('content') as ZContainer;
this.tweens.add({ targets: content, y: content.y - 30, duration: 150, yoyo: true });
```

**Anchored elements.** Positions do not stick. Change the anchor (0 to 1), or animate an inner wrapper.
```ts
mc.portrait.anchorPercentage = { x: 0.9, y: 0.05 };
mc.landscape.anchorPercentage = { x: 0.95, y: 0.1 };
mc.applyTransform();
```

**Game logic owns the position** (player, projectile). Opt out; it still scales with the stage.
```ts
mc.resizeable = false;
mc.x += speed * delta;
```

**Show, hide, fade.** `mc.setVisible(false)`, `mc.setAlpha(0.5)`. Both apply to both orientations.

**Spawned objects** have no stored transforms, so resizing never moves them. Set `x`/`y` directly.

## Trap

**Timelines control their children.** Their frames overwrite your changes. Move the timeline itself or a container around it.

Positions are in scene units. `scene.sceneWidth` and `scene.sceneHeight` give the stage size for the current orientation.
