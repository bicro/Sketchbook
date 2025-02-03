export class PathNode
{
	constructor(child, path)
	{
		this.object = child;
		this.path = path;
		this.nextNode;
		this.previousNode;
	}
}