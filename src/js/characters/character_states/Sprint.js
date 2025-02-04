import { CharacterStateBase } from './stateLibrary.js';

export class Sprint extends CharacterStateBase
{
	constructor(character)
	{
		super(character);
		
		this.canEnterVehicles = true;

		this.character.velocitySimulator.mass = 10;
		this.character.rotationSimulator.damping = 0.8;
		this.character.rotationSimulator.mass = 50;

		this.character.setArcadeVelocityTarget(1.4);
		this.playAnimation('sprint', 0.1);
	}

	 update(timeStep)
	{
		super.update(timeStep);
		this.character.setCameraRelativeOrientationTarget();
		this.fallInAir();
	}

	 onInputChange()
	{
		super.onInputChange();

		if (!this.character.actions.run.isPressed)
		{
			this.character.setState(new this.character.anims.Walk(this.character));
		}

		if (this.character.actions.jump.justPressed)
		{
			this.character.setState(new this.character.anims.JumpRunning(this.character));
		}

		if (this.noDirection())
		{
			this.character.setState(new this.character.anims.EndWalk(this.character));
		}
	}
}