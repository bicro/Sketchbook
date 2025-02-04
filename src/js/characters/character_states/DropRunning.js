import { CharacterStateBase } from './_stateLibrary.js';

export class DropRunning extends CharacterStateBase
{
	constructor(character)
	{
		super(character);

		this.character.setArcadeVelocityTarget(0.8);
		this.playAnimation('drop_running', 0.1);
	}

	 update(timeStep)
	{
		super.update(timeStep);

		this.character.setCameraRelativeOrientationTarget();

		if (this.animationEnded(timeStep))
		{
			this.character.setState(new this.character.anims.Walk(this.character));
		}
	}

	 onInputChange()
	{
		super.onInputChange();
		
		if (this.noDirection())
		{
			this.character.setState(new this.character.anims.EndWalk(this.character));
		}

		if (this.anyDirection() && this.character.actions.run.justPressed)
		{
			this.character.setState(new this.character.anims.Sprint(this.character));
		}

		if (this.character.actions.jump.justPressed)
		{
			this.character.setState(new this.character.anims.JumpRunning(this.character));
		}
	}
}