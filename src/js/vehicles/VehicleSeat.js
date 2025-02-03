import { VehicleDoor } from "./VehicleDoor.js";

export class VehicleSeat {
    constructor(vehicle, object, gltf) {
        this.vehicle = vehicle;
        this.seatPointObject = object;

        this.connectedSeatsString;
        this.connectedSeats = [];

        this.type;
        this.entryPoints = [];
        this.door;
        this.occupiedBy = null;

        if (object.hasOwnProperty("userData") && object.userData.hasOwnProperty("data")) {
            if (object.userData.hasOwnProperty("door_object")) {
                this.door = new VehicleDoor(this, gltf.scene.getObjectByName(object.userData.door_object));
            }

            if (object.userData.hasOwnProperty("entry_points")) {
                let entry_points = object.userData.entry_points.split(";");
                for (const entry_point of entry_points) {
                    if (entry_point.length > 0) {
                        this.entryPoints.push(gltf.scene.getObjectByName(entry_point));
                    }
                }
            } else {
                console.error("Seat object " + object + " has no entry point reference property.");
            }

            if (object.userData.hasOwnProperty("seat_type")) {
                this.type = object.userData.seat_type;
            } else {
                console.error("Seat object " + object + " has no seat type property.");
            }

            if (object.userData.hasOwnProperty("connected_seats")) {
                this.connectedSeatsString = object.userData.connected_seats;
            }
        }
    }

    update(timeStep) {
        if (this.door !== undefined) {
            this.door.update(timeStep);
        }
    }
}
