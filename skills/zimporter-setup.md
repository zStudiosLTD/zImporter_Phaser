---
name: zimporter-setup
description: Set up zimporter-phaser, load a zStudio scene and find elements by name (Phaser). Load before writing any code that uses a zStudio scene.
---
# zImporter setup (Phaser)

zImporter loads scenes exported from zStudio. Install with `npm i zimporter-phaser`. The exported folder holds `placements.json` and images; serve it from somewhere like `public/assets/mainMenu/`.

```ts
import Phaser from 'phaser';
import { ZScene, ZSceneStack, ZUpdatables } from 'zimporter-phaser';

class GameScene extends Phaser.Scene {
  create() {
    ZUpdatables.init(24);                        // timeline frame rate

    this.scale.on('resize', (size: Phaser.Structs.Size) => ZSceneStack.resize(size.width, size.height));

    const scene = new ZScene('mainMenu', this);
    scene.load('./assets/mainMenu/', () => {     // keep the trailing slash
      ZSceneStack.push(scene);
      scene.loadStage(this);
      // wire up the scene here
    }, (progress: number) => { /* 0 to 1 */ });
  }
  update() { ZUpdatables.update(); }             // required, or timelines stay frozen
}

new Phaser.Game({ type: Phaser.AUTO, width: innerWidth, height: innerHeight, parent: 'game-container',
  scene: [GameScene], scale: { mode: Phaser.Scale.RESIZE } });
```
If scenes use Spine, add `plugins: { scene: [{ key: 'SpinePlugin', plugin: SpinePlugin, mapping: 'spine' }] }` to the game config. `SpinePlugin` is exported by this package.

A failed load of `placements.json` can stay silent. If nothing appears, check the Network tab and the trailing slash.

## Finding elements

Always call these after `loadStage()`.

```ts
const stage = scene.sceneStage;
const btn = stage.get('playBtn') as ZButton;     // searches all levels, first match or null
const close = popup.get('closeBtn') as ZButton;  // search inside one container
stage.getAllByName('coin');                     // all elements with this name
stage.getAllOfType('ZButton');                   // all elements of a type
stage.playBtn;                                   // direct children are also properties
```

Names are the instance names set in zStudio. The class comes from the container type: Button = `ZButton`, Toggle = `ZToggle`, Slider = `ZSlider`, Scroll Bar = `ZScroll`, State = `ZState`. Check timelines with `instanceof ZTimeline`.

## Switching scenes

```ts
ZSceneStack.pop();          // or clear() to remove every scene
await oldScene.destroy();
const next = new ZScene('mainMenu', this);
next.load(path, () => { ZSceneStack.push(next); next.loadStage(this); });
```

 To layer a scene over another, push and load it without destroying the first. Also available: `ZSceneStack.peek()`, `getStackSize()`, `ZScene.getSceneById(id)`.
