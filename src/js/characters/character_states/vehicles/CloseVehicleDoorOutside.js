import { CharacterStateBase } from "../stateLibrary.js";

import { Side } from '../../../enums/Side.js';
import * as Utils from '../../../core/FunctionLibrary.js';

export class CloseVehicleDoorOutside extends CharacterStateBase
{
	constructor(character, seat)
	{
		super(character);

		this.seat = seat;
		this.canFindVehiclesToEnter = false;
		this.hasClosedDoor = false;


		const side = Utils.detectRelativeSide(seat.seatPointObject, seat.door.doorObject);
		if (side === Side.Left)
		{
			this.playAnimation('close_door_standing_right', 0.1);
		}
		else if (side === Side.Right)
		{
			this.playAnimation('close_door_standing_left', 0.1);
		}
	}

	 update(timeStep)
	{
		super.update(timeStep);

		if (this.timer > 0.3 && !this.hasClosedDoor)
		{
			this.hasClosedDoor = true;
			this.seat.door.close();   
		}

		if (this.animationEnded(timeStep))
		{
			this.character.setState(new this.character.anims.Idle(this.character));
			this.character.leaveSeat();
		}
	}
}