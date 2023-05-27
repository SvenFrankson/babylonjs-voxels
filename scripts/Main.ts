/// <reference path="../lib/babylon.d.ts"/>

class Main {

    public static ClearSave(): void {
        Config.saveConfiguration.useLocalStorage = false;
        window.localStorage.clear();
    }
    
    public static Instance: Main;

	public canvas: HTMLCanvasElement;
	public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
	public inputManager: InputManager;
    public cameraManager: CameraManager;
    public vertexDataLoader: VertexDataLoader;
    public player: Player;

    public rand: Rand;
    public terrain: Terrain;

    public isTouch: boolean = false;

    public static redMaterial: BABYLON.StandardMaterial;
    public static greenMaterial: BABYLON.StandardMaterial;
    public static blueMaterial: BABYLON.StandardMaterial;

    public static Test1(): Chunck {
        let current = Main.Instance.terrain.getChunckAtPos(Main.Instance.cameraManager.absolutePosition, 0);
        let doLog = (c: Chunck) => {
            console.log(c.name);
            if (c.parent) {
                doLog(c.parent);
            }
        }
        if (current) {
            doLog(current);
            current.highlight();
            setTimeout(() => {
                current.unlit();
            }, 3000);
        }
        return current;
    }

    constructor(canvasElement: string) {
        Main.Instance = this;
        
		this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
		this.engine = new BABYLON.Engine(this.canvas, true);
        this.rand = new Rand();
		BABYLON.Engine.ShadersRepository = "./shaders/";
	}

    public createScene(): void {
        window.localStorage.clear();

		this.scene = new BABYLON.Scene(this.engine);

        Main.redMaterial = new BABYLON.StandardMaterial("debug");
        Main.redMaterial.specularColor.copyFromFloats(0, 0, 0);
        Main.redMaterial.diffuseColor.copyFromFloats(1, 0, 0);
        Main.greenMaterial = new BABYLON.StandardMaterial("debug");
        Main.greenMaterial.specularColor.copyFromFloats(0, 0, 0);
        Main.greenMaterial.diffuseColor.copyFromFloats(0, 1, 0);
        Main.blueMaterial = new BABYLON.StandardMaterial("debug");
        Main.blueMaterial.specularColor.copyFromFloats(0, 0, 0);
        Main.blueMaterial.diffuseColor.copyFromFloats(0, 0, 1);

        this.inputManager = new InputManager(this.scene, this.canvas, this);
		//this.scene.clearColor.copyFromFloats(166 / 255, 231 / 255, 255 / 255, 1);
        //this.scene.clearColor = BABYLON.Color4.FromHexString("#eb4034ff");
        this.scene.clearColor = BABYLON.Color4.FromHexString("#ffffffff");
        this.vertexDataLoader = new VertexDataLoader(this.scene);

        let light = new BABYLON.HemisphericLight("light", BABYLON.Vector3.One(), this.scene);

        this.cameraManager = new CameraManager(this);
        this.cameraManager.freeCamera.position.copyFromFloats(-10, 40, -30);

        let debugPlane0 = BABYLON.CreatePlane("debug-plane-0", { size: 1.5 });
        debugPlane0.parent = this.cameraManager.freeCamera;
        debugPlane0.position.x = - 2;
        debugPlane0.position.y = 0.8;
        debugPlane0.position.z = 4.05;

        let debugMaterial0 = new BABYLON.StandardMaterial("debug-material-0");
        debugMaterial0.specularColor.copyFromFloats(0, 0, 0);
        debugMaterial0.emissiveColor.copyFromFloats(1, 1, 1);
        debugPlane0.material = debugMaterial0;

        let debugPlane1 = BABYLON.CreatePlane("debug-plane-1", { size: 1.5 });
        debugPlane1.parent = this.cameraManager.freeCamera;
        debugPlane1.position.x = - 2;
        debugPlane1.position.y = - 0.8;
        debugPlane1.position.z = 4;

        let debugMaterial1 = new BABYLON.StandardMaterial("debug-material-1");
        debugMaterial1.specularColor.copyFromFloats(0, 0, 0);
        debugMaterial1.emissiveColor.copyFromFloats(1, 1, 1);
        debugPlane1.material = debugMaterial1;

		Config.chunckPartConfiguration.setFilename("chunck-parts", false);
		Config.chunckPartConfiguration.useXZAxisRotation = true;
		Config.chunckPartConfiguration.setLodMin(0);
		Config.chunckPartConfiguration.setLodMax(2);

        let perfDebug = new DebugTerrainPerf(this);
        perfDebug.show();

        this.player = new Player(new BABYLON.Vector3(-5, 30, -5), this);
        this.cameraManager.player = this.player;
        this.cameraManager.setMode(CameraMode.Player);

        ChunckVertexData.InitializeData().then(async () => {
            this.terrain = new Terrain({
                scene: this.scene,
                chunckCountHeight: 20,
                maxLevel: 15
            });

            this.player.initialize();
            this.player.lockInPlace = true;
            setTimeout(() => {
                this.player.lockInPlace = false;
            }, 3000);
            this.inputManager.initialize(this.player);
            this.player.inventory = new Inventory(this.player);
            await this.player.inventory.initialize();
            this.player.inventory.addItem(await InventoryItem.Block(this.player, BlockType.Grass));
            this.player.inventory.addItem(await InventoryItem.Block(this.player, BlockType.Dirt));
            this.player.inventory.addItem(await InventoryItem.Block(this.player, BlockType.Rock));
            
            let hud = new HeadUpDisplay(this.player, this);

            let wristWatch = new WristWatch(this.player, this);
            await wristWatch.instantiate();

            await hud.instantiate();

            this.player.playerActionManager = new PlayerActionManager(this.player, hud, this);
            this.player.playerActionManager.initialize();

            this.player.registerControl();

            this.terrain.root.genMaps = [
                new GenMap(0, this.terrain.root.level, 0, 0, this.terrain, {
                    lowestRandLevel: 2,
                    highestRandLevel: 9
                }),
                new GenMap(1, this.terrain.root.level, 0, 0, this.terrain, {
                    lowestRandLevel: 3,
                    highestRandLevel: 6
                }),
                new GenMap(2, this.terrain.root.level, 0, 0, this.terrain, {
                    lowestRandLevel: 2,
                    highestRandLevel: 9
                }),
                new GenMap(3, this.terrain.root.level, 0, 0, this.terrain, {
                    lowestRandLevel: 1,
                    highestRandLevel: 4
                }),
                new GenMap(4, this.terrain.root.level, 0, 0, this.terrain, {
                    lowestRandLevel: 4,
                    highestRandLevel: 7
                }),
            ];

            let testBiomeMap = new ComposedGenMap(5, this.terrain.root.level, 0, 0, this.terrain, [ this.terrain.root.genMaps[0] as GenMap, this.terrain.root.genMaps[2] as GenMap ]);
            this.terrain.root.genMaps.push(testBiomeMap);
            
            this.terrain.root.register();
            this.terrain.initialize();

            window.addEventListener("keyup", (ev: KeyboardEvent) => {
                if (ev.code === "KeyX") {
                    this.terrain.chunckManager.pause = !this.terrain.chunckManager.pause;
                }
            })

            setTimeout(() => {
                //this.terrain.chunckManager.dispose();
            }, 6000);
    
            //let debugBlock = BABYLON.MeshBuilder.CreateBox("debug-block");
            //debugBlock.position.copyFromFloats(0.5, 0.5, 0.5);
            //debugBlock.position.y += 4;

            let xAxis = BABYLON.MeshBuilder.CreateBox("xAxis", { width: 100, height: 0.2, depth: 0.2 });
            xAxis.position.x = 51;
            xAxis.material = Main.redMaterial;

            let yAxis = BABYLON.MeshBuilder.CreateBox("yAxis", { width: 0.2, height: 100, depth: 0.2 });
            yAxis.position.y = 51;
            yAxis.material = Main.greenMaterial;

            let zAxis = BABYLON.MeshBuilder.CreateBox("zAxis", { width: 0.2, height: 0.2, depth: 100 });
            zAxis.position.z = 51;
            zAxis.material = Main.blueMaterial;

            let currentChunck: Chunck;
            let cb = () => {
                let heading = VMath.AngleFromToAround(Main.Instance.cameraManager.freeCamera.getForwardRay().direction, BABYLON.Axis.Z, BABYLON.Axis.Y);
                debugPlane0.rotation.z = - heading;
                debugPlane1.rotation.z = - heading;
                let newCurrentChunck = Main.Instance.terrain.getChunckAtPos(Main.Instance.cameraManager.absolutePosition, 0);
                if (newCurrentChunck) {
                    newCurrentChunck = newCurrentChunck.parent.parent.parent.parent.parent;
                    if (newCurrentChunck != currentChunck) {
                        let genMap0 = this.terrain.getGenMap(0, newCurrentChunck.level, newCurrentChunck.iPos, newCurrentChunck.jPos);
                        //let genMap1 = this.terrain.getGenMap(2, newCurrentChunck.level, newCurrentChunck.iPos, newCurrentChunck.jPos);
                        if (genMap0) {
                            let texture0 = genMap0.getTexture(-1, 1, -1, 1);
                            //let texture1 = genMap1.getTexture(-1, 1, -1, 1);
                            if (texture0) {
                                debugMaterial0.diffuseTexture = texture0;
                                //debugMaterial1.diffuseTexture = texture1;
                                currentChunck = newCurrentChunck;
                            }
                        }
                    }
                }
            }
            this.scene.onBeforeRenderObservable.add(cb);
            //debugPlane0.isVisible = false;
            debugPlane1.isVisible = false;
        });
	}

	public animate(): void {
		this.engine.runRenderLoop(() => {
			this.scene.render();
			this.update();
		});

		window.addEventListener("resize", () => {
			this.engine.resize();
		});
	}

    public async initialize(): Promise<void> {
        
    }

    public update(): void {
        
    }
}

var loadingInterval: number;

function showLoading(darkBackground?: boolean): boolean {
    let loadingElement = document.getElementById("loading");
    if (loadingElement.style.display != "block") {
        console.log("showLoading " + darkBackground)
        if (darkBackground) {
            delete loadingElement.style.backgroundColor;
            loadingElement.querySelector("div").classList.remove("small");
        }
        else {
            loadingElement.style.backgroundColor = "rgba(0, 0, 0, 0%)";
            loadingElement.querySelector("div").classList.add("small");
        }
        loadingElement.style.display = "block";
        let n = 0;
        clearInterval(loadingInterval);
        loadingInterval = setInterval(() => {
            for (let i = 0; i < 4; i++) {
                if (i === n) {
                    document.getElementById("load-" + i).style.display = "";
                }
                else {
                    document.getElementById("load-" + i).style.display = "none";
                }
            }
            n = (n + 1) % 4;
        }, 500);
        return true;
    }
    return false;
}

function hideLoading(): void {
    console.log("hideLoading");
    document.getElementById("loading").style.display = "none";
    clearInterval(loadingInterval);
}

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded " + window.location.href);

    hideLoading();
    let main: Main = new Main("renderCanvas");
    main.createScene();
    main.initialize().then(() => {
        main.animate();
    });
});