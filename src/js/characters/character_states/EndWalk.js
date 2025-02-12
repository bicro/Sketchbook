import { CharacterStateBase } from './stateLibrary.js';

export class EndWalk extends CharacterStateBase
{
	constructor(character)
	{
		super(character);

		this.character = character;

		this.character.setArcadeVelocityTarget(0);
		this.animationLength = character.setAnimation('idle_neutral', 0.1);
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
			if (this.character.actions.run.isPressed)
			{
				this.character.setState(new this.character.anims.Sprint(this.character));
			}
			else
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
}