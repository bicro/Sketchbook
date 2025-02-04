import { StartWalkBase } from './stateLibrary.js';

export class StartWalkBackLeft extends StartWalkBase
{
	constructor(character)
	{
		super(character);

		this.animationLength = character.setAnimation('start_back_left', 0.1);
	}
}