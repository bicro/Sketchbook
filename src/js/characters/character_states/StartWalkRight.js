import {StartWalkBase} from './_stateLibrary.js';

export class StartWalkRight extends StartWalkBase
{
	constructor(character)
	{
		super(character);

		this.animationLength = character.setAnimation('start_right', 0.1);
	}
}