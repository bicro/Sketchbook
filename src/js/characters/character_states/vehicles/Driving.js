//import { CharacterStateBase } from '../CharacterStateBase.js'

import { CharacterStateBase } from "../_stateLibrary.js";

import { CloseVehicleDoorInside } from "./CloseVehicleDoorInside.js";

export class Driving extends CharacterStateBase {
    constructor(character, seat) {
        super(character);

        this.seat = seat;
        this.canFindVehiclesToEnter = false;
        this.playAnimation("driving", 0.1);

        this.character.startControllingVehicle(seat.vehicle, this.seat);
        this.seat.vehicle.onInputChange();
        this.character.vehicleEntryInstance = null;
    }

    update(timeStep) {
        super.update(timeStep);

        if (this.seat && this.seat.door) {
            if (
                !this.seat.door.achievingTargetRotation &&
                this.seat.door.rotation > 0 &&
                this.seat.vehicle.noDirectionPressed()
            ) {
                this.character.setState(new CloseVehicleDoorInside(this.character, this.seat));
            }
        }
    }
}
