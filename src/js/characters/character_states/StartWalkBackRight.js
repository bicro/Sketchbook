import {StartWalkBase} from './stateLibrary.js';

export class StartWalkBackRight extends StartWalkBase
{
	constructor(character)
	{
		super(character);

		this.animationLength = character.setAnimation('turn_right', 0.1);
	}
}