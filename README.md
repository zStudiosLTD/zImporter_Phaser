# zImporter

The `zImporter` is a TypeScript package designed to import and manage graphical hierarchies created in **zStudio**. This package allows seamless integration of assets and scenes built in **zStudio** into your JavaScript or TypeScript-based projects, particularly those using **Phaser**.

## Features

* Import and manage scenes and graphical hierarchies from **zStudio**
* Works with **Phaser** to display and interact with imported assets
* Provides a flexible and easy-to-use API for handling assets and scenes.

* Download zStudios to get started: https://zstudiosltd.com/

## Community & Support

Questions, bug reports or something to show off? Join the zImporter channel on the zStudio Discord: https://discord.com/channels/1570547074414547094/1570777267804835931

## Installation

To install the `zImporter` package from the npm registry:

```bash
npm install zimporter-phaser@1.0.40
```

Or to always get the latest version:

```bash
npm install zimporter-phaser@latest
```

> **Note:** Your `tsconfig.json` should include:

```json
"module": "ESNext",
"moduleResolution": "bundler"
```

## HTML Setup

To use zImporter in a browser (without a bundler), include the following scripts in your HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>zImporter Phaser Example</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.js"></script>
    <!-- Load your compiled zImporter bundle -->
    <script src="./dist/zimporter-phaser.min.js"></script>
    <!-- Spine plugin for Phaser -->
    <script src="./node_modules/@esotericsoftware/spine-phaser/dist/iife/spine-phaser.js"></script>
    <style>
        body { margin: 0; overflow: hidden; }
        #game-container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script>
        // All zImporter classes are available under the `zimporter` global namespace:
        // zimporter.ZScene, zimporter.ZTimeline, zimporter.ZUpdatables, etc.

        const sceneJsonPath = './assets/myScene/';

        class MyPhaserScene extends Phaser.Scene {
            create() {
                zimporter.ZUpdatables.init(24);
                this._frameCount = 0;
                this._lastTime = performance.now();
                this._fpsText = this.add.text(10, 10, 'FPS: --', {
                    fontSize: '16px', fill: '#ffffff'
                }).setDepth(9999);

                this.zScene = new zimporter.ZScene('testScene', this);
                this.zScene.load(sceneJsonPath, () => {
                    this.zScene.loadStage(this);

                    const stage = this.zScene.sceneStage;
                    for (const child of stage.list) {
                        if (child instanceof zimporter.ZTimeline) {
                            child.play();
                        }
                    }
                });
            }

            update(time, delta) {
                this._frameCount++;
                const now = performance.now();
                const elapsed = now - this._lastTime;
                if (elapsed >= 1000) {
                    const fps = (this._frameCount / elapsed) * 1000;
                    this._fpsText.setText(`FPS: ${fps.toFixed(1)}`);
                    this._frameCount = 0;
                    this._lastTime = now;
                }
                zimporter.ZUpdatables.update();
            }
        }

        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: 'game-container',
            scene: [MyPhaserScene],
            backgroundColor: '#000000',
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            plugins: {
                scene: [{
                    key: 'SpinePlugin',
                    plugin: spine.SpinePlugin,
                    mapping: 'spine'
                }]
            }
        };

        const game = new Phaser.Game(config);

        window.addEventListener('resize', () => {
            const scene = game.scene.scenes[0];
            if (scene && scene.zScene) {
                scene.zScene.resize(window.innerWidth, window.innerHeight);
            }
        });
    </script>
</body>
</html>
```

## Building
npm run package

## Usage

### Importing zImporter into Your Project

You can find an example project here:
[https://github.com/yonnyzohar/zImporter\_Phaser\_Example](https://github.com/yonnyzohar/zImporter_Phaser_Example)

Basic import:

```ts
import { ZTimeline } from 'zimporter-phaser';
```

### Example: Creating a New Phaser Game

```ts
import Phaser from 'phaser';
import * as spine from '@esotericsoftware/spine-phaser';
import { ZScene, ZTimeline, ZUpdatables } from 'zimporter-phaser';

const sceneJsonPath = './assets/myScene/';

class GameScene extends Phaser.Scene {
  private zScene!: ZScene;
  private _frameCount = 0;
  private _lastTime = 0;
  private _fpsText!: Phaser.GameObjects.Text;

  preload() {
    // Optionally preload assets here
  }

  create() {
    ZUpdatables.init(24);

    // Optional FPS display
    this._lastTime = performance.now();
    this._fpsText = this.add.text(10, 10, 'FPS: --', {
      fontSize: '16px',
      color: '#ffffff'
    }).setDepth(9999);

    // Load the zStudio scene
    this.zScene = new ZScene('testScene', this);
    this.zScene.load(sceneJsonPath, () => {
      this.zScene.loadStage(this);

      // Play any top-level timelines
      const stage = this.zScene.sceneStage;
      for (const child of stage.list) {
        if (child instanceof ZTimeline) {
          child.play();
        }
      }
    });
  }

  update(time: number, delta: number) {
    // FPS counter
    this._frameCount++;
    const now = performance.now();
    const elapsed = now - this._lastTime;
    if (elapsed >= 1000) {
      const fps = (this._frameCount / elapsed) * 1000;
      this._fpsText.setText(`FPS: ${fps.toFixed(1)}`);
      this._frameCount = 0;
      this._lastTime = now;
    }

    // delta is in ms — advance all registered updatables (timelines, etc.)
    ZUpdatables.update();
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    scene: [{
      key: 'SpinePlugin',
      plugin: spine.SpinePlugin,
      mapping: 'spine'
    }]
  }
};

const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  const scene = game.scene.scenes[0] as any;
  if (scene?.zScene) {
    scene.zScene.resize(window.innerWidth, window.innerHeight);
  }
});
```

> This sets up a Phaser game and integrates zImporter's update system.

### Example: Loading a Stage Created in zStudio

```ts
// Inside your Phaser Scene's create():
const scene = new ZScene('testScene', this);
scene.load('./assets/myScene/', () => {
  scene.loadStage(this);

  // Access spawned objects by name
  const stage = scene.sceneStage;
  const btn = stage.get('myButton') as ZButton;
  if (btn) {
    btn.setCallback(() => console.log('clicked'));
  }
});
```

## API

The package exposes several classes and methods for interacting with imported assets:

### `ZScene`

* Container for your entire scene.
* Handles screen resizing.
* Allows spawning of assets or loading full stages.

### `ZContainer`

* Core class for all visual elements.
* Extends `Phaser.GameObjects.Container` and adds:

  * Anchoring support
  * Orientation data from zStudio
* Set `.resizeable = false` to disable responsive behavior.

#### `Working with Text`
  In ZStudio, texts are always wrapper in a container, and are called "label" by default.
  If you know a specific container holds a text fields, you can acces it via:
  `getTextField():Phaser.GameObjects.Text | null`
  You can also set a string on the text via the container using:
  `setText(text:string):void`

#### `Transform Properties — Orientation-Aware vs Global`

Every element stores a `portrait` and a `landscape` transform, and every resize re-applies the one for the current orientation. Anything not in the stored transform is undone at the next resize.

```ts
container.setX(100);          // stored for the current orientation. Read back with getX().
container.setY(200);          // stored for the current orientation
container.setVisible(false);  // stored for both orientations
container.setAlpha(0.5);      // stored for both orientations

// container.x, scaleX, setScaleX() and rotation are NOT stored: a resize undoes them.
// To store them, write the transforms and re-apply:
container.portrait.scaleX = 1.5;
container.landscape.scaleX = 1.5;
container.applyTransform();

// Your code owns the position (player, projectile)
container.resizeable = false;
```

Full guide: https://zstudiosltd.com/z-importer/guide/responsive

#### `Working with Spine`

Spine assets are loaded automatically by the scene. Once the stage is loaded, retrieve the `SpineGameObject` from any `ZContainer` using `getSpine()` and then interact with it through the standard Spine API:

```ts
import { SpineGameObject } from '@esotericsoftware/spine-phaser';

const spineContainer = stage.get('mySpineAsset');
const spineObj: SpineGameObject | undefined = spineContainer?.getSpine();

if (spineObj) {
    // Play an animation on track 0, looping
    spineObj.animationState.setAnimation(0, 'run', true);

    // Change the active skin
    spineObj.skeleton.setSkinByName('mySkin');
    spineObj.skeleton.setToSetupPose();

    // Listen for animation completion
    spineObj.animationState.addListener({
        complete: (entry) => {
            console.log('Animation complete:', entry.animation?.name);
        }
    });
}
```

### `ZButton`

* Extends `ZContainer`.
* Has `.enable()` / `.disable()` methods.
* Supports child containers with special names:

  * `upState`, `downState`, `overState`, `disabledState`, `labelContainer`

> When these are defined in **zStudio**, the button works automatically.

### `ZTimeline`

* Extends `ZContainer`.
* Manages frame-based timeline animations.
* API includes:

  * `.play()`, `.stop()`
  * `.gotoAndPlay(frameNum)`, `.gotoAndStop(frameNum)`
  * `.addStateEndEventListener(cb)`, `.removeStateEndEventListener(cb)`

### `ZState`

* Extends `ZContainer`.
* Only one child is visible at a time.
* Use `.setState(name: string)` to switch visible content.
* Can contain nested `ZTimeline` objects.


## AI skills

The [`skills/`](./skills) folder has short guides that teach an AI tool to use this package correctly: setup, components, responsive layout, animation and spawning. Add the folder in zStudio under **Help → AI Skill Libraries**, or point your AI tool at `node_modules/zimporter-phaser/skills/`.

Usage guide with examples: https://zstudiosltd.com/z-importer/guide

## Contributing

We welcome contributions!
To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request.

Please follow the existing code style and add tests where relevant.

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
