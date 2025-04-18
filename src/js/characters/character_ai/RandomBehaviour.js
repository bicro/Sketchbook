import * as THREE from "three";

export class RandomBehaviour {
    character;
    randomFrequency;

    constructor(randomFrequency = 100) {
        this.randomFrequency = randomFrequency;
    }

    update(timeStep) {
        let rndInt = Math.floor(Math.random() * this.randomFrequency);
        let rndBool = Math.random() > 0.5 ? true : false;

        if (rndInt === 0) {
            this.character.setViewVector(
                new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
            );

            this.character.triggerAction("up", true);
            this.character.charState.update(timeStep);
            this.character.triggerAction("up", false);
        } else if (rndInt === 1) {
            this.character.triggerAction("up", rndBool);
        } else if (rndInt === 2) {
            this.character.triggerAction("run", rndBool);
        } else if (rndInt === 3) {
            this.character.triggerAction("jump", rndBool);
        }
    }
}
