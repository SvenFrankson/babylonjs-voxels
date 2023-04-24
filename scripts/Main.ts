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

    public isTouch: boolean = false;

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
		this.scene.clearColor.copyFromFloats(166 / 255, 231 / 255, 255 / 255, 1);
        this.vertexDataLoader = new VertexDataLoader(this.scene);

        let light = new BABYLON.HemisphericLight("light", BABYLON.Vector3.One(), this.scene);

        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, 0), this.scene);
        this.camera.position.copyFromFloats(0, 5, 0);
        this.camera.attachControl();

		Config.chunckPartConfiguration.setFilename("chunck-parts", false);
		Config.chunckPartConfiguration.useXZAxisRotation = true;
		Config.chunckPartConfiguration.setLodMin(0);
		Config.chunckPartConfiguration.setLodMax(2);

        ChunckVertexData.InitializeData().then(() => {
            let terrain = new Terrain({
                scene: this.scene,
                kPosMax: 20,
                maxLevel: 16
            });
            let chunck = new Chunck(0, 0, 0, terrain);
            chunck.register();
            terrain.initialize();
    
            let debugBlock = BABYLON.MeshBuilder.CreateBox("debug-block");
            debugBlock.position.copyFromFloats(0.5, 0.5, 0.5);
            //debugBlock.position.x += CHUNCK_SIZE;
            debugBlock.position.y += 4;
            //debugBlock.position.z += CHUNCK_SIZE;
    
            let yAxis = BABYLON.MeshBuilder.CreateBox("yAxis", { width: 0.2, height: 100, depth: 0.2 });
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