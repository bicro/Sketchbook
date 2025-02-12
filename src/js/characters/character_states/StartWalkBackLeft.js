import { StartWalkBase } from './stateLibrary.js';

export class StartWalkBackLeft extends StartWalkBase
{
	constructor(character)
	{
		super(character);

		this.animationLength = character.setAnimation('turn_left', 0.1);
	}
}