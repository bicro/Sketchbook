import * as THREE from "three";
import { VRM, VRMUtils } from "@pixiv/three-vrm";

import { CameraOperator } from "../core/CameraOperator.js";

import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/shaders/FXAAShader.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/loaders/GLTFLoader.js";

import { Detector } from "../../lib/utils/Detector.js";
import { Stats } from "../../lib/utils/Stats.js";
//import * as GUI from '../../lib/utils/dat.gui.js';
import { CannonDebugRenderer } from "../../lib/cannon/CannonDebugRenderer.js";
//import * as _ from 'lodash';

import { InputManager } from "../core/InputManager.js";
import * as Utils from "../core/FunctionLibrary.js";
import { LoadingManager } from "../core/LoadingManager.js";
//import { InfoStack } from '../core/InfoStack.js';
import { UIManager } from "../core/UIManager.js";
// import { IWorldEntity } from '../interfaces/IWorldEntity.js';
// import { IUpdatable } from '../interfaces/IUpdatable.js';
// import { Character } from '../characters/Character.js';
import { Path } from "./Path.js";
import { CollisionGroups } from "../enums/CollisionGroups.js";
import { BoxCollider } from "../physics/colliders/BoxCollider.js";
import { TrimeshCollider } from "../physics/colliders/TrimeshCollider.js";
import { Vehicle } from "../vehicles/Vehicle.js";
import { Scenario } from "./Scenario.js";
import { Sky } from "./Sky.js";
import { Ocean } from "./Ocean.js";

import { CharacterSpawnPoint } from "./CharacterSpawnPoint.js";

export class World {
    constructor(worldScenePath) {
        const scope = this;

        this.renderer;
        this.camera;
        this.composer;
        this.stats;
        this.graphicsWorld;
        this.sky;
        this.physicsWorld;
        this.parallelPairs;
        this.physicsFrameRate;
        this.physicsFrameTime;
        this.physicsMaxPrediction;
        this.clock;
        this.renderDelta;
        this.logicDelta;
        this.requestDelta;
        this.sinceLastFrame;
        this.justRendered;
        this.params;
        this.inputManager;
        this.cameraOperator;
        this.timeScaleTarget = 1;
        this.console;
        this.cannonDebugRenderer;
        this.scenarios = [];
        this.characters = [];
        this.vehicles = [];
        this.paths = [];
        this.scenarioGUIFolder;
        this.updatables = [];

        this.lastScenarioID;

        // WebGL not supported
        if (!Detector.webgl) {
            Swal.fire({
                icon: "warning",
                title: "WebGL compatibility",
                text: "This browser doesn't seem to have the required WebGL capabilities. The application may not work correctly.",
                footer: '<a href="https://get.webgl.org/" target="_blank">Click here for more information</a>',
                showConfirmButton: false,
                buttonsStyling: false,
            });
        }

        // Renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.generateHTML();

        // Auto window resize
        function onWindowResize() {
            scope.camera.aspect = window.innerWidth / window.innerHeight;
            scope.camera.updateProjectionMatrix();
            scope.renderer.setSize(window.innerWidth, window.innerHeight);
            fxaaPass.uniforms["resolution"].value.set(
                1 / (window.innerWidth * pixelRatio),
                1 / (window.innerHeight * pixelRatio)
            );
            scope.composer.setSize(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
        }
        window.addEventListener("resize", onWindowResize, false);

        // Three.js scene
        this.graphicsWorld = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1010);

        // Passes
        let renderPass = new RenderPass(this.graphicsWorld, this.camera);
        let fxaaPass = new ShaderPass(FXAAShader);

        // FXAA
        let pixelRatio = this.renderer.getPixelRatio();
        fxaaPass.material["uniforms"].resolution.value.x = 1 / (window.innerWidth * pixelRatio);
        fxaaPass.material["uniforms"].resolution.value.y = 1 / (window.innerHeight * pixelRatio);

        // Composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(fxaaPass);

        // Physics
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.81, 0);
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 10;
        this.physicsWorld.allowSleep = true;

        this.parallelPairs = [];
        this.physicsFrameRate = 60;
        this.physicsFrameTime = 1 / this.physicsFrameRate;
        this.physicsMaxPrediction = this.physicsFrameRate;

        // RenderLoop
        this.clock = new THREE.Clock();
        this.renderDelta = 0;
        this.logicDelta = 0;
        this.sinceLastFrame = 0;
        this.justRendered = false;

        // Stats (FPS, Frame time, Memory)
        this.stats = Stats();
        // Create right panel GUI
        this.createParamsGUI(scope);

        // Initialization
        this.inputManager = new InputManager(this, this.renderer.domElement);
        this.cameraOperator = new CameraOperator(this, this.camera, this.params.Mouse_Sensitivity);
        this.sky = new Sky(this);

        // Load scene if path is supplied
        if (worldScenePath !== undefined) {
            let loadingManager = new LoadingManager(this);
            loadingManager.onFinishedCallback = () => {
                this.update(1, 1);
                this.setTimeScale(1);
                UIManager.setUserInterfaceVisible(true);
                
                // Load VRM model
                this.loadVRMModel();

                // Swal.fire({
                // 	title: 'Welcome to Sketchbook!',
                // 	text: 'Feel free to explore the world and interact with available vehicles. There are also various scenarios ready to launch from the right panel.',
                // 	footer: '<a href="https://github.com/swift502/Sketchbook" target="_blank">GitHub page</a><a href="https://discord.gg/fGuEqCe" target="_blank">Discord server</a>',
                // 	confirmButtonText: 'Okay',
                // 	buttonsStyling: false,
                // 	onClose: () => {
                // 		UIManager.setUserInterfaceVisible(true);
                // 	}
                // });
            };
            loadingManager.loadGLTF(worldScenePath, (gltf) => {
                this.loadScene(loadingManager, gltf);
            });
        } else {
            UIManager.setUserInterfaceVisible(true);
            UIManager.setLoadingScreenVisible(false);
            Swal.fire({
                icon: "success",
                title: "Hello world!",
                text: "Empty Sketchbook world was succesfully initialized. Enjoy the blueness of the sky.",
                buttonsStyling: false,
            });
        }

        this.render(this);
    }

    // Update
    // Handles all logic updates.
    update(timeStep, unscaledTimeStep) {
        this.updatePhysics(timeStep);

        // Update registred objects
        this.updatables.forEach((entity) => {
            if (entity.entityType === "Car") {
                let ent = entity;
                let entt = entity.entityType;
            }
            entity.update(timeStep, unscaledTimeStep);
        });

        // Lerp time scale
        this.params.Time_Scale = THREE.MathUtils.lerp(this.params.Time_Scale, this.timeScaleTarget, 0.2);

        // Physics debug
        //if (this.params.Debug_Physics) this.cannonDebugRenderer.update();
    }

    updatePhysics(timeStep) {
        // Step the physics world
        this.physicsWorld.step(this.physicsFrameTime, timeStep);

        this.characters.forEach((char) => {
            if (this.isOutOfBounds(char.characterCapsule.body.position)) {
                this.outOfBoundsRespawn(char.characterCapsule.body);
            }
        });

        this.vehicles.forEach((vehicle) => {
            if (this.isOutOfBounds(vehicle.rayCastVehicle.chassisBody.position)) {
                let worldPos = new THREE.Vector3();
                vehicle.spawnPoint.getWorldPosition(worldPos);
                worldPos.y += 1;
                this.outOfBoundsRespawn(vehicle.rayCastVehicle.chassisBody, Utils.cannonVector(worldPos));
            }
        });
    }

    isOutOfBounds(position) {
        let inside =
            position.x > -211.882 &&
            position.x < 211.882 &&
            position.z > -169.098 &&
            position.z < 153.232 &&
            position.y > 0.107;
        let belowSeaLevel = position.y < 14.989;

        return !inside && belowSeaLevel;
    }

    outOfBoundsRespawn(body, position) {
        let newPos = position || new CANNON.Vec3(0, 16, 0);
        let newQuat = new CANNON.Quaternion(0, 0, 0, 1);

        body.position.copy(newPos);
        body.interpolatedPosition.copy(newPos);
        body.quaternion.copy(newQuat);
        body.interpolatedQuaternion.copy(newQuat);
        body.velocity.setZero();
        body.angularVelocity.setZero();
    }

    /**
     * Rendering loop.
     * Implements fps limiter and frame-skipping
     * Calls world's "update" function before rendering.
     * @param {World} world
     */
    render(world) {
        this.requestDelta = this.clock.getDelta();

        requestAnimationFrame(() => {
            world.render(world);
        });

        // Getting timeStep
        let unscaledTimeStep = this.requestDelta + this.renderDelta + this.logicDelta;
        let timeStep = unscaledTimeStep * this.params.Time_Scale;
        timeStep = Math.min(timeStep, 1 / 30); // min 30 fps

        // Logic
        world.update(timeStep, unscaledTimeStep);

        // Measuring logic time
        this.logicDelta = this.clock.getDelta();

        // Frame limiting
        let interval = 1 / 60;
        this.sinceLastFrame += this.requestDelta + this.renderDelta + this.logicDelta;
        this.sinceLastFrame %= interval;

        // Stats end
        this.stats.end();
        this.stats.begin();

        // Actual rendering with a FXAA ON/OFF switch
        if (this.params.FXAA) this.composer.render();
        else this.renderer.render(this.graphicsWorld, this.camera);

        // Measuring render time
        this.renderDelta = this.clock.getDelta();
    }

    setTimeScale(value) {
        this.params.Time_Scale = value;
        this.timeScaleTarget = value;
    }

    add(worldEntity) {
        worldEntity.addToWorld(this);
        this.registerUpdatable(worldEntity);
    }

    registerUpdatable(registree) {
        this.updatables.push(registree);
        this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1));
    }

    remove(worldEntity) {
        worldEntity.removeFromWorld(this);
        this.unregisterUpdatable(worldEntity);
    }

    unregisterUpdatable(registree) {
        _.pull(this.updatables, registree);
    }

    loadVRMModel() {
        const loader = new GLTFLoader();
        loader.crossOrigin = 'anonymous';
        
        // Load VRM model
        loader.load('assets/test.vrm', (gltf) => {
            // Create a new VRM instance
            const vrm = new VRM({
                scene: gltf.scene,
                meta: gltf.userData.gltfExtensions?.VRM?.meta
            });
            
            // Initialize the VRM instance
            vrm.humanoid?.setPose({});
            
            console.log('VRM model loaded:', vrm);
            
            // Add the VRM model to the scene
            this.graphicsWorld.add(vrm.scene);
            
            // Position the model
            vrm.scene.position.set(3, 15, 0); // Positioned next to the current character
            vrm.scene.scale.set(1, 1, 1);
            
            // Store the VRM model for later use
            this.vrmModel = vrm;
        },
        (progress) => console.log('Loading VRM model...', 100.0 * (progress.loaded / progress.total), '%'),
        (error) => console.error('Error loading VRM model:', error));
    }
    
    loadScene(loadingManager, gltf) {
        gltf.scene.traverse((child) => {
            if (child.hasOwnProperty("userData")) {
                if (child.type === "Mesh") {
                    Utils.setupMeshProperties(child);
                    this.sky.csm.setupMaterial(child.material);

                    if (child.material.name === "ocean") {
                        this.registerUpdatable(new Ocean(child, this));
                    }
                }

                if (child.userData.hasOwnProperty("data")) {
                    if (child.userData.data === "physics") {
                        if (child.userData.hasOwnProperty("type")) {
                            // Convex doesn't work! Stick to boxes!
                            if (child.userData.type === "box") {
                                let phys = new BoxCollider({
                                    size: new THREE.Vector3(child.scale.x, child.scale.y, child.scale.z),
                                });
                                phys.body.position.copy(Utils.cannonVector(child.position));
                                phys.body.quaternion.copy(Utils.cannonQuat(child.quaternion));
                                phys.body.computeAABB();

                                phys.body.shapes.forEach((shape) => {
                                    shape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
                                });

                                this.physicsWorld.addBody(phys.body);
                            } else if (child.userData.type === "trimesh") {
                                let phys = new TrimeshCollider(child, {});
                                this.physicsWorld.addBody(phys.body);
                            }

                            child.visible = false;
                        }
                    }

                    if (child.userData.data === "path") {
                        this.paths.push(new Path(child));
                    }

                    if (child.userData.data === "scenario") {
                        this.scenarios.push(new Scenario(child, this));
                    }
                }
            } else {
                console.log("Doing something else");
            }
        });

        this.graphicsWorld.add(gltf.scene);

        // Launch default scenario
        let defaultScenarioID;
        for (const scenario of this.scenarios) {
            // start in aircraft mode
            // if (scenario.id === "default001") {
            // 	defaultScenarioID = scenario.id;
            // 	break;
            // }
            // start in car mode
            if (scenario.default) {
                defaultScenarioID = scenario.id;
                break;
            }
        }
        if (defaultScenarioID !== undefined) this.launchScenario(defaultScenarioID, loadingManager);

		// force a new character but he seems to have no physics
		// just keeps respawning for falling throught the floor
        //const object = new THREE.Object3D();
        //object.position.set(3, 0, 0);
        //let sp = new CharacterSpawnPoint(object);
        //sp.spawn(loadingManager, this);
        //this.spawnPoints.push(sp);
    }

    launchScenario(scenarioID, loadingManager) {
        this.lastScenarioID = scenarioID;

        this.clearEntities();

        // Launch default scenario
        if (!loadingManager) loadingManager = new LoadingManager(this);
        for (const scenario of this.scenarios) {
            if (scenario.id === scenarioID || scenario.spawnAlways) {
                scenario.launch(loadingManager, this);
            }
        }
    }

    restartScenario() {
        if (this.lastScenarioID !== undefined) {
            document.exitPointerLock();
            this.launchScenario(this.lastScenarioID);
        } else {
            console.warn("Can't restart scenario. Last scenarioID is undefined.");
        }
    }

    clearEntities() {
        for (let i = 0; i < this.characters.length; i++) {
            this.remove(this.characters[i]);
            i--;
        }

        for (let i = 0; i < this.vehicles.length; i++) {
            this.remove(this.vehicles[i]);
            i--;
        }
    }

    scrollTheTimeScale(scrollAmount) {
        // Changing time scale with scroll wheel
        const timeScaleBottomLimit = 0.003;
        const timeScaleChangeSpeed = 1.3;

        if (scrollAmount > 0) {
            this.timeScaleTarget /= timeScaleChangeSpeed;
            if (this.timeScaleTarget < timeScaleBottomLimit) this.timeScaleTarget = 0;
        } else {
            this.timeScaleTarget *= timeScaleChangeSpeed;
            if (this.timeScaleTarget < timeScaleBottomLimit) this.timeScaleTarget = timeScaleBottomLimit;
            this.timeScaleTarget = Math.min(this.timeScaleTarget, 1);
        }
    }

    updateControls(controls) {
        let html = "";
        html += '<h2 class="controls-title">Controls:</h2>';

        controls.forEach((row) => {
            html += '<div class="ctrl-row">';
            row.keys.forEach((key) => {
                if (key === "+" || key === "and" || key === "or" || key === "&") html += "&nbsp;" + key + "&nbsp;";
                else html += '<span class="ctrl-key">' + key + "</span>";
            });

            html += '<span class="ctrl-desc">' + row.desc + "</span></div>";
        });

        document.getElementById("controls").innerHTML = html;
    }

    generateHTML() {
        // Fonts
        $("head").append(
            '<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap" rel="stylesheet">'
        );
        $("head").append(
            '<link href="https://fonts.googleapis.com/css2?family=Solway:wght@400;500;700&display=swap" rel="stylesheet">'
        );
        $("head").append(
            '<link href="https://fonts.googleapis.com/css2?family=Cutive+Mono&display=swap" rel="stylesheet">'
        );

        // Loader
        $(`	<div id="loading-screen">
				<div id="loading-screen-background"></div>
				<h1 id="main-title" class="sb-font">Sketchbook 0.4</h1>
				<div class="cubeWrap">
					<div class="cube">
						<div class="faces1"></div>
						<div class="faces2"></div>     
					</div> 
				</div> 
				<div id="loading-text">Loading...</div>
			</div>
		`).appendTo("body");

        // UI
        $(`	<div id="ui-container" style="display: none;">
				<div class="github-corner">
					<a href="https://github.com/swift502/Sketchbook" target="_blank" title="Fork me on GitHub">
						<svg viewbox="0 0 100 100" fill="currentColor">
							<title>Fork me on GitHub</title>
							<path d="M0 0v100h100V0H0zm60 70.2h.2c1 2.7.3 4.7 0 5.2 1.4 1.4 2 3 2 5.2 0 7.4-4.4 9-8.7 9.5.7.7 1.3 2
							1.3 3.7V99c0 .5 1.4 1 1.4 1H44s1.2-.5 1.2-1v-3.8c-3.5 1.4-5.2-.8-5.2-.8-1.5-2-3-2-3-2-2-.5-.2-1-.2-1
							2-.7 3.5.8 3.5.8 2 1.7 4 1 5 .3.2-1.2.7-2 1.2-2.4-4.3-.4-8.8-2-8.8-9.4 0-2 .7-4 2-5.2-.2-.5-1-2.5.2-5
							0 0 1.5-.6 5.2 1.8 1.5-.4 3.2-.6 4.8-.6 1.6 0 3.3.2 4.8.7 2.8-2 4.4-2 5-2z"></path>
						</svg>
					</a>
				</div>
				<div class="left-panel">
					<div id="controls" class="panel-segment flex-bottom"></div>
				</div>
			</div>
		`).appendTo("body");

        // Canvas
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = "canvas";
    }

    createParamsGUI(scope) {
        this.params = {
            Pointer_Lock: true,
            Mouse_Sensitivity: 0.3,
            Time_Scale: 1,
            Shadows: true,
            FXAA: true,
            Debug_Physics: false,
            Debug_FPS: false,
            Sun_Elevation: 50,
            Sun_Rotation: 145,
        };

        const gui = new dat.GUI();

        // Scenario
        this.scenarioGUIFolder = gui.addFolder("Scenarios");
        this.scenarioGUIFolder.open();

        // World
        let worldFolder = gui.addFolder("World");
        worldFolder
            .add(this.params, "Time_Scale", 0, 1)
            .listen()
            .onChange((value) => {
                scope.timeScaleTarget = value;
            });
        worldFolder
            .add(this.params, "Sun_Elevation", 0, 180)
            .listen()
            .onChange((value) => {
                scope.sky.phi = value;
            });
        worldFolder
            .add(this.params, "Sun_Rotation", 0, 360)
            .listen()
            .onChange((value) => {
                scope.sky.theta = value;
            });

        // Input
        let settingsFolder = gui.addFolder("Settings");
        settingsFolder.add(this.params, "FXAA");
        settingsFolder.add(this.params, "Shadows").onChange((enabled) => {
            if (enabled) {
                this.sky.csm.lights.forEach((light) => {
                    light.castShadow = true;
                });
            } else {
                this.sky.csm.lights.forEach((light) => {
                    light.castShadow = false;
                });
            }
        });
        settingsFolder.add(this.params, "Pointer_Lock").onChange((enabled) => {
            scope.inputManager.setPointerLock(enabled);
        });
        settingsFolder.add(this.params, "Mouse_Sensitivity", 0, 1).onChange((value) => {
            scope.cameraOperator.setSensitivity(value, value * 0.8);
        });
        settingsFolder.add(this.params, "Debug_Physics").onChange((enabled) => {
            if (enabled) {
                this.cannonDebugRenderer = new CannonDebugRenderer(this.graphicsWorld, this.physicsWorld);
            } else {
                this.cannonDebugRenderer.clearMeshes();
                this.cannonDebugRenderer = undefined;
            }

            scope.characters.forEach((char) => {
                char.raycastBox.visible = enabled;
            });
        });
        settingsFolder.add(this.params, "Debug_FPS").onChange((enabled) => {
            UIManager.setFPSVisible(enabled);
        });

        gui.open();
    }
}
