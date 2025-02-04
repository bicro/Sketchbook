import * as THREE from 'three';

import { CharacterStateBase } from "../_stateLibrary.js";


import { Side } from '../../../enums/Side.js';
import * as Utils from '../../../core/FunctionLibrary.js';
import { SpringSimulator } from '../../../physics/spring_simulation/SpringSimulator.js';

export class OpenVehicleDoor extends CharacterStateBase
{
	constructor(character, seat, entryPoint)
	{
		super(character);

		this.canFindVehiclesToEnter = false;
		this.seat = seat;
		this.entryPoint = entryPoint;

		this.hasOpenedDoor = false;
		this.startPosition = new THREE.Vector3();
		this.endPosition = new THREE.Vector3();
		this.startRotation = new THREE.Quaternion();
		this.endRotation = new THREE.Quaternion();

		const side = Utils.detectRelativeSide(entryPoint, seat.seatPointObject);
		if (side === Side.Left)
		{
			this.playAnimation('open_door_standing_left', 0.1);
		}
		else if (side === Side.Right)
		{
			this.playAnimation('open_door_standing_right', 0.1);
		}

		this.character.resetVelocity();
		this.character.rotateModel();
		this.character.setPhysicsEnabled(false);

		this.character.setPhysicsEnabled(false);
		this.seat.vehicle.attach(this.character);

		this.startPosition.copy(this.character.position);
		this.endPosition.copy(this.entryPoint.position);
		this.endPosition.y += 0.53;

		this.startRotation.copy(this.character.quaternion);
		this.endRotation.copy(this.entryPoint.quaternion);

		this.factorSimluator = new SpringSimulator(60, 10, 0.5);
		this.factorSimluator.target = 1;
	}

	 update(timeStep)
	{
		super.update(timeStep);

		if (this.timer > 0.3 && !this.hasOpenedDoor)
		{
			this.hasOpenedDoor = true;
			if (this.seat && this.seat.door) {
				this.seat.door.open();   
			}
		}

		if (this.animationEnded(timeStep))
		{
			if (this.anyDirection())
			{
				this.character.vehicleEntryInstance = null;
				this.character.world.graphicsWorld.attach(this.character);
				this.character.setPhysicsEnabled(true);
				this.character.setState(new this.character.anims.Idle(this.character));
			}
			else
			{
				this.character.setState(new this.character.anims.EnteringVehicle(this.character, this.seat, this.entryPoint));
			}
		}
		else
		{
			this.factorSimluator.simulate(timeStep);

			let lerpPosition = new THREE.Vector3().lerpVectors(this.startPosition, this.endPosition, this.factorSimluator.position);
			this.character.setPosition(lerpPosition.x, lerpPosition.y, lerpPosition.z);
	
			THREE.Quaternion.slerp(this.startRotation, this.endRotation, this.character.quaternion, this.factorSimluator.position);
		}
	}
}