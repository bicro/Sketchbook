import * as THREE from 'three';
import { Helicopter } from '../vehicles/Helicopter.js';
import { Airplane } from '../vehicles/Airplane.js';
import { Car } from '../vehicles/Car.js';
import * as Utils from '../core/FunctionLibrary.js';
import { Character } from '../characters/Character.js';
import { FollowPath } from '../characters/character_ai/FollowPath.js';


export class VehicleSpawnPoint
{
	constructor(object)
	{
		this.object = object;
		this.type;
		this.driver;
		this.firstAINode;
	}

	spawn(loadingManager, world)
	{
		loadingManager.loadGLTF('assets/' + this.type + '.glb', (model) =>
		{
			let vehicle = this.getNewVehicleByType(model, this.type);
			vehicle.spawnPoint = this.object;

			let worldPos = new THREE.Vector3();
			let worldQuat = new THREE.Quaternion();
			this.object.getWorldPosition(worldPos);
			this.object.getWorldQuaternion(worldQuat);

			vehicle.setPosition(worldPos.x, worldPos.y + 1, worldPos.z);
			vehicle.collision.quaternion.copy(Utils.cannonQuat(worldQuat));
			world.add(vehicle);

			if (this.driver !== undefined)
			{
				loadingManager.loadGLTF('assets/boxman.glb', (charModel) =>
				{
					let character = new Character(charModel);
					world.add(character);
					character.teleportToVehicle(vehicle, vehicle.seats[0]);

					if (this.driver === 'player')
					{
						character.takeControl();
					}
					else if (this.driver === 'ai')
					{
						if (this.firstAINode !== undefined)
						{
							let nodeFound = false;
							for (const pathName in world.paths) {
								if (world.paths.hasOwnProperty(pathName)) {
									const path = world.paths[pathName];
									
									for (const nodeName in path.nodes) {
										if (Object.prototype.hasOwnProperty.call(path.nodes, nodeName)) {
											const node = path.nodes[nodeName];
											
											if (node.object.name === this.firstAINode)
											{
												character.setBehaviour(new FollowPath(node, 10));
												nodeFound = true;
											}
										}
									}
								}
							}

							if (!nodeFound)
							{
								console.error('Path node ' + this.firstAINode + 'not found.');
							}
						}
					}
				});
			}
		});
	}

	 getNewVehicleByType(model, type)
	{
		switch (type)
		{
			case 'car': return new Car(model);
			case 'heli': return new Helicopter(model);
			case 'airplane': return new Airplane(model);
		}
	}
}