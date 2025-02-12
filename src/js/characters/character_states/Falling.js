import { CharacterStateBase } from './stateLibrary.js';

export class Falling extends CharacterStateBase
{
	constructor(character)
	{
		super(character);

		this.character.velocitySimulator.mass = 100;
		this.character.rotationSimulator.damping = 0.3;

		this.character.arcadeVelocityIsAdditive = true;
		this.character.setArcadeVelocityInfluence(0.05, 0, 0.05);

		this.playAnimation('falling_idle', 0.3);
	}

	 update(timeStep)
	{
		super.update(timeStep);

		this.character.setCameraRelativeOrientationTarget();
		this.character.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);

		if (this.character.rayHasHit)
		{
			this.setAppropriateDropState();
		}
	}
}