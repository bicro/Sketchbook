import { CharacterStateBase } from "../stateLibrary.js";
import { SeatType } from '../../../enums/SeatType.js';

export class Sitting extends CharacterStateBase
{

	constructor(character, seat)
	{
		super(character);
		
		this.seat = seat;
		this.canFindVehiclesToEnter = false;

		this.character.world.updateControls([
			{
				keys: ['X'],
				desc: 'Switch seats',
			},
			{
				keys: ['F'],
				desc: 'Leave seat',
			}
		]);
		
		this.playAnimation('sitting', 0.1);
	}

	 update(timeStep)
	{
		super.update(timeStep);

		if (this.seat && this.seat.door && !this.seat.door.achievingTargetRotation && this.seat.door.rotation > 0 && this.noDirection())
		{
			this.character.setState(new this.character.anims.CloseVehicleDoorInside(this.character, this.seat));
		}
		else if (this.character.vehicleEntryInstance !== null)
		{
			if (this.character.vehicleEntryInstance.wantsToDrive)
			{
				for (const possibleDriverSeat of this.seat.connectedSeats)
				{
					if (possibleDriverSeat.type === SeatType.Driver)
					{
						if (this.seat && this.seat.door && this.seat.door.rotation > 0) this.seat.door.physicsEnabled = true;
						this.character.setState(new this.character.anims.SwitchingSeats(this.character, this.seat, possibleDriverSeat));
						break;
					}
				}
			}
			else
			{
				this.character.vehicleEntryInstance = null;
			}
		}
	}

	 onInputChange()
	{
		if (this.character.actions.seat_switch.justPressed && this.seat.connectedSeats.length > 0)
		{
			this.character.setState(new this.character.anims.SwitchingSeats(this.character, this.seat, this.seat.connectedSeats[0]));
		}

		if (this.character.actions.enter.justPressed)
		{
			this.character.exitVehicle();
			this.character.displayControls();
		}
	}
}