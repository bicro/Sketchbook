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

		// Extract vertices and faces from BufferGeometry
		const geometry = this.mesh.geometry;
		const position = geometry.attributes.position;
		const vertices = [];
		const faces = [];
		
		// Extract vertices
		for (let i = 0; i < position.count; i++) {
			vertices.push(new THREE.Vector3(
				position.getX(i),
				position.getY(i),
				position.getZ(i)
			));
		}
		
		// Extract faces (assuming triangles)
		for (let i = 0; i < position.count; i += 3) {
			faces.push([i, i + 1, i + 2]);
		}

		// Convert to CANNON vectors
		let cannonPoints = vertices.map((v) => {
			return new CANNON.Vec3(v.x, v.y, v.z);
		});
		
		let cannonFaces = faces;

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
