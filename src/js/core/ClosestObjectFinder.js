export class ClosestObjectFinder {
    constructor(referencePosition, maxDistance) {
        this.closestObject;
        this.closestDistance = Number.POSITIVE_INFINITY;
        this.referencePosition;
        this.maxDistance = Number.POSITIVE_INFINITY;

        this.referencePosition = referencePosition;
        if (maxDistance !== undefined) this.maxDistance = maxDistance;
    }

    consider(object, objectPosition) {
        let distance = this.referencePosition.distanceTo(objectPosition);

        if (distance < this.maxDistance && distance < this.closestDistance) {
            this.closestDistance = distance;
            this.closestObject = object;
        }
    }
}
