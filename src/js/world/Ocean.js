import * as THREE from 'three';
import { WaterShader } from '../../lib/shaders/WaterShader.js';

export class Ocean
{
	constructor(object, world)
	{
		this.world = world;

		this.updateOrder = 10;

		let uniforms = THREE.UniformsUtils.clone(WaterShader.uniforms);
		uniforms.iResolution.value.x = window.innerWidth;
		uniforms.iResolution.value.y = window.innerHeight;

		this.material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			fragmentShader: WaterShader.fragmentShader,
			vertexShader: WaterShader.vertexShader,
		});

		object.material = this.material;
		object.material.transparent = true;
	}

	update(timeStep)
	{
		this.material.uniforms.cameraPos.value.copy(this.world.camera.position);
		this.material.uniforms.lightDir.value.copy(new THREE.Vector3().copy(this.world.sky.sunPosition).normalize());
		this.material.uniforms.iGlobalTime.value += timeStep;
	}
}