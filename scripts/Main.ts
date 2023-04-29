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
    public camera: BABYLON.Camera;
    public vertexDataLoader: VertexDataLoader;

    public rand: Rand;
    public terrain: Terrain;

    public isTouch: boolean = false;

    public static Test1(): Chunck {
        let current = Main.Instance.terrain.getChunckAtPos(Main.Instance.camera.position, 0);
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
		this.scene = new BABYLON.Scene(this.engine);
		//this.scene.clearColor.copyFromFloats(166 / 255, 231 / 255, 255 / 255, 1);
        this.scene.clearColor = BABYLON.Color4.FromHexString("#eb4034ff");
        this.vertexDataLoader = new VertexDataLoader(this.scene);

        let light = new BABYLON.HemisphericLight("light", BABYLON.Vector3.One(), this.scene);

        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(-3, 6, -3), this.scene);
        this.camera.position.copyFromFloats(0, 25, 0);
        this.camera.attachControl();

		Config.chunckPartConfiguration.setFilename("chunck-parts", false);
		Config.chunckPartConfiguration.useXZAxisRotation = true;
		Config.chunckPartConfiguration.setLodMin(0);
		Config.chunckPartConfiguration.setLodMax(2);

        let perfDebug = new DebugPlanetPerf(this);
        perfDebug.show();

        ChunckVertexData.InitializeData().then(() => {
            this.terrain = new Terrain({
                scene: this.scene,
                chunckCountHeight: 20,
                maxLevel: 15
            });
            this.terrain.root.genMaps = [
                new GenMap(this.terrain.root.level, 0, 0, this.terrain)
            ];
            this.terrain.root.register();
            this.terrain.initialize();

            setTimeout(() => {
                //this.terrain.chunckManager.dispose();
            }, 6000);
    
            //let debugBlock = BABYLON.MeshBuilder.CreateBox("debug-block");
            //debugBlock.position.copyFromFloats(0.5, 0.5, 0.5);
            //debugBlock.position.y += 4;

            let redMaterial = new BABYLON.StandardMaterial("debug");
            redMaterial.specularColor.copyFromFloats(0, 0, 0);
            redMaterial.diffuseColor.copyFromFloats(1, 0, 0);
            let xAxis = BABYLON.MeshBuilder.CreateBox("xAxis", { width: 20, height: 0.2, depth: 0.2 });
            xAxis.position.x = 11;
            xAxis.material = redMaterial;

            let greenMaterial = new BABYLON.StandardMaterial("debug");
            greenMaterial.specularColor.copyFromFloats(0, 0, 0);
            greenMaterial.diffuseColor.copyFromFloats(0, 1, 0);
            let yAxis = BABYLON.MeshBuilder.CreateBox("yAxis", { width: 0.2, height: 20, depth: 0.2 });
            yAxis.position.y = 11;
            yAxis.material = greenMaterial;

            let blueMaterial = new BABYLON.StandardMaterial("debug");
            blueMaterial.specularColor.copyFromFloats(0, 0, 0);
            blueMaterial.diffuseColor.copyFromFloats(0, 0, 1);
            let zAxis = BABYLON.MeshBuilder.CreateBox("zAxis", { width: 0.2, height: 0.2, depth: 20 });
            zAxis.position.z = 11;
            zAxis.material = blueMaterial;
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