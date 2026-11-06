/**
 * Manages a stack of `ZScene` instances, providing static methods to manipulate the stack.
 *
 * This class allows pushing, popping, peeking, and clearing scenes from the stack.
 * It also provides utility methods to spawn entities from the topmost scene and resize all scenes in the stack.
 *
 * @remarks
 * - The stack is implemented as a static array, so all operations affect the global stack.
 * - The stack size and top index are tracked separately for efficient access.
 *
 * @public
 */
export class ZSceneStack {
    //the following is a stack of resources of tyoe T
    static stack = [];
    static stackSize = 0;
    static top = 0;
    static push(resource) {
        this.stack[this.top] = resource;
        this.top++;
        this.stackSize++;
    }
    static pop() {
        if (this.stackSize > 0) {
            this.top--;
            this.stackSize--;
            const scene = this.stack[this.top];
            // Drop the slot so a popped scene no longer receives resize or spawn calls.
            this.stack.length = this.top;
            return scene;
        }
        return null;
    }
    static peek() {
        if (this.stackSize > 0) {
            return this.stack[this.top - 1];
        }
        return null;
    }
    static getStackSize() {
        return this.stackSize;
    }
    static clear() {
        this.stack = [];
        this.stackSize = 0;
        this.top = 0;
    }
    //////
    static spawn(templateName) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            let gameScene = this.stack[i];
            let ent = gameScene.spawn(templateName);
            if (ent) {
                return ent;
            }
        }
    }
    static resize(width, height) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            let gameScene = this.stack[i];
            gameScene.resize(width, height);
        }
    }
}
//# sourceMappingURL=ZSceneStack.js.map