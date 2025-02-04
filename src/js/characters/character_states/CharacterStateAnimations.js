import {
	DropIdle,
	DropRolling,
	DropRunning,
	Falling,
	Idle,
	JumpIdle,
	JumpRunning,
	IdleRotateLeft,
	IdleRotateRight,
	Sprint,
	StartWalkBackLeft,
	StartWalkBackRight,
	StartWalkForward,
	StartWalkLeft,
	StartWalkRight,
	EndWalk,
	Walk,
} from './stateLibrary.js';

import{ Driving } from './vehicles/Driving.js'
import{ EnteringVehicle } from './vehicles/EnteringVehicle.js'
import{ OpenVehicleDoor } from './vehicles/OpenVehicleDoor.js'
import{ Sitting } from './vehicles/Sitting.js'
import{ SwitchingSeats } from './vehicles/SwitchingSeats.js'
import { CloseVehicleDoorInside } from "./vehicles/CloseVehicleDoorInside.js";

export class CharacterStateAnimations {
    constructor()
	{
		this.Idle = Idle;
		this.DropIdle = DropIdle;
		this.DropRolling = DropRolling;
		this.DropRunning = DropRunning;
		this.Falling = Falling;
		this.JumpIdle = JumpIdle;
		this.JumpRunning = JumpRunning;
		this.IdleRotateLeft = IdleRotateLeft;
		this.IdleRotateRight = IdleRotateRight;
		this.Sprint = Sprint;
		this.StartWalkBackLeft = StartWalkBackLeft;
		this.StartWalkBackRight = StartWalkBackRight;
		this.StartWalkForward = StartWalkForward;
		this.StartWalkLeft = StartWalkLeft;
		this.StartWalkRight = StartWalkRight;
		this.EndWalk = EndWalk;
		this.Walk = Walk;

		this.Driving = Driving;
		this.EnteringVehicle = EnteringVehicle;
		this.OpenVehicleDoor = OpenVehicleDoor;
		this.Sitting = Sitting;
		this.SwitchingSeats = SwitchingSeats;
		this.CloseVehicleDoorInside = CloseVehicleDoorInside;
	}
}