import {StartWalkBase} from './stateLibrary.js';

export class StartWalkForward extends StartWalkBase
{
	constructor(character)
	{
		super(character);

		this.animationLength = character.setAnimation('walk_normal', 0.1);
	}
}