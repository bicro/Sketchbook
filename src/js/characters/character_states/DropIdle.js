import { CharacterStateBase } from './CharacterStateBase.js';

export class DropIdle extends CharacterStateBase
{
	constructor(character)
	{
		super(character);

		this.character.velocitySimulator.damping = 0.5;
		this.character.velocitySimulator.mass = 7;

		this.character.setArcadeVelocityTarget(0);
		this.playAnimation('drop_landing', 0.1);

		if (this.anyDirection())
		{
			this.character.setState(new this.character.anims.StartWalkForward(character));
		}
	}

	 update(timeStep)
	{
		super.update(timeStep);
		this.character.setCameraRelativeOrientationTarget();
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
			this.character.setState(new this.character.anims.StartWalkForward(this.character));
		}
	}
}