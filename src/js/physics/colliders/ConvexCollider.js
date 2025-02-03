import * as THREE from 'three';
import * as Utils from '../../core/FunctionLibrary.js';
import {Mesh, Vector3} from 'three';

export class ConvexCollider
{
	constructor(mesh, options)
	{
		this.mesh = mesh.clone();

		this.debugModel;

		let defaults = {
			mass: 0,
			position: mesh.position,
			friction: 0.3
		};
		options = Utils.setDefaults(options, defaults);
		this.options = options;

		let mat = new CANNON.Material('convMat');
		mat.friction = options.friction;
		// mat.restitution = 0.7;

		if (this.mesh.geometry.isBufferGeometry)
		{
			this.mesh.geometry = new THREE.Geometry().fromBufferGeometry(this.mesh.geometry);
		}

		let cannonPoints = this.mesh.geometry.vertices.map((v) => {
			return new CANNON.Vec3( v.x, v.y, v.z );
		});
		
		let cannonFaces = this.mesh.geometry.faces.map((f) => {
			return [f.a, f.b, f.c];
		});

		let shape = new CANNON.ConvexPolyhedron(cannonPoints, cannonFaces);
		// shape.material = mat;

		// Add phys sphere
		let physBox = new CANNON.Body({
			mass: options.mass,
			position: options.position,
			shape
		});

		physBox.material = mat;

		this.body = physBox;
	}
}