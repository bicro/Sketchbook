export class Wheel
{
	constructor(wheelObject)
	{
		this.wheelObject = wheelObject;

		this.position = wheelObject.position;

		this.steering = false;
		this.drive; // Drive type "fwd" or "rwd"
		this.rayCastWheelInfoIndex; // Linked to a raycast vehicle WheelInfo structure

		if (wheelObject.hasOwnProperty('userData') && wheelObject.userData.hasOwnProperty('data'))
		{
			if (wheelObject.userData.hasOwnProperty('steering')) 
			{
				this.steering = (wheelObject.userData.steering === 'true');
			}

			if (wheelObject.userData.hasOwnProperty('drive')) 
			{
				this.drive = wheelObject.userData.drive;
			}
		}
	}
}