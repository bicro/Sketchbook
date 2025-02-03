export class KeyBinding
{	
	constructor(...code)
	{
		this.eventCodes;
		this.isPressed = false;
		this.justPressed = false;
		this.justReleased = false;
		this.eventCodes = code;
	}
}