import { VehicleSpawnPoint } from "./VehicleSpawnPoint.js";
import { CharacterSpawnPoint } from "./CharacterSpawnPoint.js";

export class Scenario {
    constructor(root, world) {
        this.rootNode = root;
        this.world = world;
        this.id = root.name;

        this.name;
        this.default = false;
        this.spawnAlways = false;
        this.invisible = false;
        this.descriptionTitle;
        this.descriptionContent;
        this.initialCameraAngle;

        this.spawnPoints = [];

        // Scenario
        if (root.userData.hasOwnProperty("name")) {
            this.name = root.userData.name;
        }
        if (root.userData.hasOwnProperty("default") && root.userData.default === "true") {
            this.default = true;
        }
        if (root.userData.hasOwnProperty("spawn_always") && root.userData.spawn_always === "true") {
            this.spawnAlways = true;
        }
        if (root.userData.hasOwnProperty("invisible") && root.userData.invisible === "true") {
            this.invisible = true;
        }
        if (root.userData.hasOwnProperty("desc_title")) {
            this.descriptionTitle = root.userData.desc_title;
        }
        if (root.userData.hasOwnProperty("desc_content")) {
            this.descriptionContent = root.userData.desc_content;
        }
        if (root.userData.hasOwnProperty("camera_angle")) {
            this.initialCameraAngle = root.userData.camera_angle;
        }

        if (!this.invisible) this.createLaunchLink();

        // Find all scenario spawns and enitites
        root.traverse((child) => {
            if (child.hasOwnProperty("userData") && child.userData.hasOwnProperty("data")) {
                if (child.userData.data === "spawn") {
                    if (
                        child.userData.type === "car" ||
                        child.userData.type === "airplane" ||
                        child.userData.type === "heli"
                    ) {
                        let sp = new VehicleSpawnPoint(child);

                        if (child.userData.hasOwnProperty("type")) {
                            sp.type = child.userData.type;
                        }

                        if (child.userData.hasOwnProperty("driver")) {
                            sp.driver = child.userData.driver;

                            if (child.userData.driver === "ai" && child.userData.hasOwnProperty("first_node")) {
                                sp.firstAINode = child.userData.first_node;
                            }
                        }

                        this.spawnPoints.push(sp);
                    } else if (child.userData.type === "player") {
                        let sp = new CharacterSpawnPoint(child);
                        this.spawnPoints.push(sp);
                    }
                }
            }
        });
    }

    createLaunchLink() {
        this.world.params[this.name] = () => {
            this.world.launchScenario(this.id);
        };
        this.world.scenarioGUIFolder.add(this.world.params, this.name);
    }

    launch(loadingManager, world) {
        let boss = this;
        this.spawnPoints.forEach((sp) => {
            sp.spawn(loadingManager, world);
        });

        if (!this.spawnAlways) {
            loadingManager.createWelcomeScreenCallback(this);

            world.cameraOperator.theta = this.initialCameraAngle;
            world.cameraOperator.phi = 15;
        }
    }
}
