import * as THREE from 'three';

import { CharacterStateBase } from "../stateLibrary.js";

import { Side } from '../../../enums/Side.js';
import { SeatType } from '../../../enums/SeatType.js';
import { EntityType } from '../../../enums/EntityType.js';
import * as Utils from '../../../core/FunctionLibrary.js';
import { SpringSimulator } from '../../../physics/spring_simulation/SpringSimulator.js';

export class EnteringVehicle extends CharacterStateBase
{
	constructor(character, seat, entryPoint)
	{
		super(character);

		this.canFindVehiclesToEnter = false;
		this.vehicle = seat.vehicle;
		this.seat = seat;

		this.initialPositionOffset = new THREE.Vector3();
		this.startPosition = new THREE.Vector3();
		this.endPosition = new THREE.Vector3();
		this.startRotation = new THREE.Quaternion();
		this.endRotation = new THREE.Quaternion();

		const side = Utils.detectRelativeSide(entryPoint, seat.seatPointObject);
		this.animData = this.getEntryAnimations(seat.vehicle.entityType);
		this.playAnimation(this.animData[side], 0.1);

		this.character.resetVelocity();
		this.character.tiltContainer.rotation.z = 0;
		this.character.setPhysicsEnabled(false);
		this.seat.vehicle.attach(this.character);

		this.startPosition.copy(entryPoint.position);
		this.startPosition.y += 0.53;
		this.endPosition.copy(seat.seatPointObject.position);

		// how high is the seat
		this.endPosition.y += 0.3;
		this.initialPositionOffset.copy(this.startPosition).sub(this.character.position);

		this.startRotation.copy(this.character.quaternion);
		this.endRotation.copy(this.seat.seatPointObject.quaternion);

		this.factorSimulator = new SpringSimulator(60, 10, 0.5);
		this.factorSimulator.target = 1;

		// speed up entering the vehicle
		this.animationLength = 0.25;
	}

	 update(timeStep)
	{
		super.update(timeStep);

		if (this.animationEnded(timeStep))
		{
			this.character.occupySeat(this.seat);
			this.character.setPosition(this.endPosition.x, this.endPosition.y, this.endPosition.z);

			if (this.seat.type === SeatType.Driver)
			{
				if (this.seat.door) this.seat.door.physicsEnabled = true;
				this.character.setState(new this.character.anims.Driving(this.character, this.seat));
			}
			else if (this.seat.type === SeatType.Passenger)
			{
				this.character.setState(new this.character.anims.Sitting(this.character, this.seat));
			}
		}
		else
		{
			if (this.seat.door)
			{
				this.seat.door.physicsEnabled = false;
				this.seat.door.rotation = 1;
			}

			let factor = THREE.MathUtils.clamp(this.timer / (this.animationLength - this.animData.end_early), 0, 1);
			let sineFactor = Utils.easeInOutSine(factor);
			this.factorSimulator.simulate(timeStep);
			
			let currentPosOffset = new THREE.Vector3().lerpVectors(this.initialPositionOffset, new THREE.Vector3(), this.factorSimulator.position);
			let lerpPosition = new THREE.Vector3().lerpVectors(this.startPosition.clone().sub(currentPosOffset), this.endPosition, sineFactor);
			this.character.setPosition(lerpPosition.x, lerpPosition.y, lerpPosition.z);

			THREE.Quaternion.slerp(this.startRotation, this.endRotation, this.character.quaternion, this.factorSimulator.position);
		}
	}

	 getEntryAnimations(type)
	{
		switch (type)
		{
			case EntityType.Airplane:
				return {
					[Side.Left]: 'jump',
					[Side.Right]: 'jump',
					end_early: 0.3
				};
			default:
				return {
					[Side.Left]: 'entering_car',
					[Side.Right]: 'entering_car',
					end_early: 0.0
				};
		}
	}
}