export class InfoStackMessage
{
	constructor(console, domElement)
	{
		this.customConsole = console;
		this.domElement = domElement;

		this.elapsedTime = 0;
		this.removalTriggered = false;
	}

	 update(timeStep)
	{
		this.elapsedTime += timeStep;

		if (this.elapsedTime > this.customConsole.messageDuration && !this.removalTriggered)
		{
			this.triggerRemoval();
		}
	}

	 triggerRemoval()
	{
		this.removalTriggered = true;
		this.domElement.classList.remove(this.customConsole.entranceAnimation);
		this.domElement.classList.add(this.customConsole.exitAnimation);
		this.domElement.style.setProperty('--animate-duration', '1s');

		this.domElement.addEventListener('animationend', () => {
			this.domElement.parentNode.removeChild(this.domElement);
		});
	}
}