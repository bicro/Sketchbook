import { CharacterStateBase } from "./stateLibrary.js";

export class Walk extends CharacterStateBase {
    constructor(character) {
        super(character);

        this.canEnterVehicles = true;
        this.character.setArcadeVelocityTarget(0.8);
        this.playAnimation("running_normal", 0.1);
    }

    update(timeStep) {
        super.update(timeStep);

        this.character.setCameraRelativeOrientationTarget();

        this.fallInAir();
    }

    onInputChange() {
        super.onInputChange();

        if (this.noDirection()) {
            this.character.setState(new this.character.anims.EndWalk(this.character));
        }

        if (this.character.actions.run.isPressed) {
            this.character.setState(new this.character.anims.Sprint(this.character));
        }

        if (this.character.actions.run.justPressed) {
            this.character.setState(new this.character.anims.Sprint(this.character));
        }

        if (this.character.actions.jump.justPressed) {
            this.character.setState(new this.character.anims.JumpRunning(this.character));
        }

        if (this.noDirection()) {
            if (this.character.velocity.length() > 1) {
                this.character.setState(new this.character.anims.EndWalk(this.character));
            } else {
                this.character.setState(new this.character.anims.Idle(this.character));
            }
        }
    }
}
