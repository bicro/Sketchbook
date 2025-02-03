import { SkyShader } from "../../lib/shaders/SkyShader.js";
import * as THREE from "three";
//import  CSM  from "../../lib/three-csm/three-csm.js";
//import CSM from './src/lib/three-csm/build/three-csm.module.js'
import CSM from '../../lib/three-csm/build/three-csm.module.js'

export class Sky extends THREE.Object3D {
    constructor(world) {
        super();

        this.world = world;

        this.csm;

        this.updateOrder = 5;
        this.sunPosition = new THREE.Vector3();
        this._phi = 50;
        this._theta = 145;
        this.hemiLight;
        this.maxHemiIntensity = 0.9;
        this.minHemiIntensity = 0.3;
        this.skyMesh;
        this.skyMaterial;

        // Sky material
        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(SkyShader.uniforms),
            fragmentShader: SkyShader.fragmentShader,
            vertexShader: SkyShader.vertexShader,
            side: THREE.BackSide,
        });

        // Mesh
        this.skyMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1000, 24, 12), this.skyMaterial);
        this.attach(this.skyMesh);

        // Ambient light
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
        this.refreshHemiIntensity();
        this.hemiLight.color.setHSL(0.59, 0.4, 0.6);
        this.hemiLight.groundColor.setHSL(0.095, 0.2, 0.75);
        this.hemiLight.position.set(0, 50, 0);
        this.world.graphicsWorld.add(this.hemiLight);

        // CSM
        // New version
        // let splitsCallback = (amount, near, far, target) =>
        // {
        // 	for (let i = amount - 1; i >= 0; i--)
        // 	{
        // 		target.push(Math.pow(1 / 3, i));
        // 	}
        // };

        // Legacy
        let splitsCallback = (amount, near, far) => {
            let arr = [];

            for (let i = amount - 1; i >= 0; i--) {
                arr.push(Math.pow(1 / 4, i));
            }

            return arr;
        };

        this.csm = new CSM({
            fov: 80,
            far: 250, // maxFar
            lightIntensity: 2.5,
            cascades: 3,
            shadowMapSize: 2048,
            camera: world.camera,
            parent: world.graphicsWorld,
            mode: "custom",
            customSplitsCallback: splitsCallback,
        });
        this.csm.fade = true;

        this.refreshSunPosition();

        world.graphicsWorld.add(this);
        world.registerUpdatable(this);
    }

    theta(value) {
        this._theta = value;
        this.refreshSunPosition();
    }

    phi(value) {
        this._phi = value;
        this.refreshSunPosition();
        this.refreshHemiIntensity();
    }

    update(timeScale) {
        this.position.copy(this.world.camera.position);
        this.refreshSunPosition();

        this.csm.update(this.world.camera.matrix);
        this.csm.lightDirection = new THREE.Vector3(
            -this.sunPosition.x,
            -this.sunPosition.y,
            -this.sunPosition.z
        ).normalize();
    }

    refreshSunPosition() {
        const sunDistance = 10;

        this.sunPosition.x =
            sunDistance * Math.sin((this._theta * Math.PI) / 180) * Math.cos((this._phi * Math.PI) / 180);
        this.sunPosition.y = sunDistance * Math.sin((this._phi * Math.PI) / 180);
        this.sunPosition.z =
            sunDistance * Math.cos((this._theta * Math.PI) / 180) * Math.cos((this._phi * Math.PI) / 180);

        this.skyMaterial.uniforms.sunPosition.value.copy(this.sunPosition);
        this.skyMaterial.uniforms.cameraPos.value.copy(this.world.camera.position);
    }

    refreshHemiIntensity() {
        this.hemiLight.intensity =
            this.minHemiIntensity +
            Math.pow(1 - Math.abs(this._phi - 90) / 90, 0.25) * (this.maxHemiIntensity - this.minHemiIntensity);
    }
}
