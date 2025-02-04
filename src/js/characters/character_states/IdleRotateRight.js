import { CharacterStateBase } from './stateLibrary.js';

export class IdleRotateRight extends CharacterStateBase
{
	constructor(character)
	{
		super(character);

		this.character = character;

		this.character.rotationSimulator.mass = 30;
		this.character.rotationSimulator.damping = 0.6;

		this.character.velocitySimulator.damping = 0.6;
		this.character.velocitySimulator.mass = 10;

		this.character.setArcadeVelocityTarget(0);
		this.playAnimation('rotate_right', 0.1);
	}

	 update(timeStep)
	{
		super.update(timeStep);

		if (this.animationEnded(timeStep))
		{
			this.character.setState(new this.character.anims.Idle(this.character));
		}

		this.fallInAir();
	}
	
	 onInputChange()
	{
		super.onInputChange();
		
		if (this.character.actions.jump.justPressed)
		{
			this.character.setState(new this.character.anims.JumpIdle(this.character));
		}

		if (this.anyDirection())
		{
			if (this.character.velocity.length() > 0.5)
			{
				this.character.setState(new this.character.anims.Walk(this.character));
			}
			else
			{
				this.setAppropriateStartWalkState();
			}
		}
	}
}