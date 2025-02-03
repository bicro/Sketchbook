export class LoadingTrackerEntry
{
	constructor(path)
	{
		this.path = path;
		this.progress = 0;
		this.finished = false;
	}
}