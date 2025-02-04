import * as THREE from 'three';

import { CharacterStateBase } from "../_stateLibrary.js";


import { Side } from '../../../enums/Side.js';
import { SeatType } from '../../../enums/SeatType.js';
import { Driving } from './Driving.js';
import { Sitting } from './Sitting.js';
import * as Utils from '../../../core/FunctionLibrary.js';
import { Space } from '../../../enums/Space.js';

export class SwitchingSeats extends CharacterStateBase
{
	constructor(character, fromSeat, toSeat)
	{
		super(character);

		this.toSeat = toSeat;
		this.canFindVehiclesToEnter = false;
		this.canLeaveVehicles = false;

		this.startPosition = new THREE.Vector3();
				this.endPosition = new THREE.Vector3();
				this.startRotation = new THREE.Quaternion();
				this.endRotation = new THREE.Quaternion();

		character.leaveSeat();
		this.character.occupySeat(toSeat);

		const right = Utils.getRight(fromSeat.seatPointObject, Space.Local);
		const viewVector = toSeat.seatPointObject.position.clone().sub(fromSeat.seatPointObject.position).normalize();
		const side = right.dot(viewVector) > 0 ? Side.Left : Side.Right;

		if (side === Side.Left)
		{
			this.playAnimation('sitting_shift_left', 0.1);
		}
		else if (side === Side.Right)
		{
			this.playAnimation('sitting_shift_right', 0.1);
		}

		this.startPosition.copy(fromSeat.seatPointObject.position);
		this.startPosition.y += 0.6;
		this.endPosition.copy(toSeat.seatPointObject.position);
		this.endPosition.y += 0.6;

		this.startRotation.copy(fromSeat.seatPointObject.quaternion);
		this.endRotation.copy(toSeat.seatPointObject.quaternion);
	}

	 update(timeStep)
	{
		super.update(timeStep);

		if (this.animationEnded(timeStep))
		{
			if (this.toSeat.type === SeatType.Driver)
			{
				this.character.setState(new Driving(this.character, this.toSeat));
			}
			else if (this.toSeat.type === SeatType.Passenger)
			{
				this.character.setState(new Sitting(this.character, this.toSeat));
			}
		}
		else
		{
			let factor = this.timer / this.animationLength;
			let sineFactor = Utils.easeInOutSine(factor);
	
			let lerpPosition = new THREE.Vector3().lerpVectors(this.startPosition, this.endPosition, sineFactor);
			this.character.setPosition(lerpPosition.x, lerpPosition.y, lerpPosition.z);
	
			THREE.Quaternion.slerp(this.startRotation, this.endRotation, this.character.quaternion, sineFactor);
		}
	}
}