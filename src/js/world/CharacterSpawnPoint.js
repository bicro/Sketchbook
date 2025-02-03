import * as THREE from "three";
import { Character } from "../characters/Character.js";
import * as Utils from "../core/FunctionLibrary.js";

export class CharacterSpawnPoint {
    constructor(object) {
        this.object = object;
    }

    spawn(loadingManager, world) {
        loadingManager.loadGLTF("build/assets/boxman.glb", (model) => {
            let player = new Character(model);

            let worldPos = new THREE.Vector3();
            this.object.getWorldPosition(worldPos);
            player.setPosition(worldPos.x, worldPos.y, worldPos.z);

            let forward = Utils.getForward(this.object);
            player.setOrientation(forward, true);

            world.add(player);
            player.takeControl();
        });
    }
}
