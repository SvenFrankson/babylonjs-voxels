class DebugPlanetPerf {
    
    private _initialized: boolean = false;
    public get initialized(): boolean {
        return this._initialized;
    }

    public debugContainer: HTMLDivElement;
    public container: HTMLDivElement;

    private _frameRate: DebugDisplayFrameValue;
    private _meshesCount: DebugDisplayTextValue;

    public get scene(): BABYLON.Scene {
        return this.main.scene;
    }

    constructor(public main: Main, private _showLayer: boolean = false) {

    }

    public initialize(): void {
        this.debugContainer = document.querySelector("#debug-container");
        if (!this.debugContainer) {
            this.debugContainer = document.createElement("div");
            this.debugContainer.id = "debug-container";
            document.body.appendChild(this.debugContainer);
        }

        this.container = document.querySelector("#debug-planet-perf");
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.id = "debug-planet-perf";
            this.container.classList.add("debug", "hidden");
            this.debugContainer.appendChild(this.container);
        }
        
        let frameRateId = "#frame-rate";
        this._frameRate = document.querySelector(frameRateId) as DebugDisplayFrameValue;
        if (!this._frameRate) {
            this._frameRate = document.createElement("debug-display-frame-value") as DebugDisplayFrameValue;
            this._frameRate.id = frameRateId;
            this._frameRate.setAttribute("label", "Frame Rate fps");
            this._frameRate.setAttribute("min", "0");
            this._frameRate.setAttribute("max", "60");
            this.container.appendChild(this._frameRate);
        }

        let meshesCountId = "#meshes-count";
        this._meshesCount = document.querySelector(meshesCountId) as DebugDisplayTextValue;
        if (!this._meshesCount) {
            this._meshesCount = document.createElement("debug-display-text-value") as DebugDisplayTextValue;
            this._meshesCount.id = meshesCountId;
            this._meshesCount.setAttribute("label", "Meshes Count");
            this.container.appendChild(this._meshesCount);
        }

        this._initialized = true;
    }

    private _update = () => {
		this._frameRate.addValue(this.main.engine.getFps());

        this._meshesCount.setText(this.main.scene.meshes.length.toFixed(0));
    }

    public show(): void {
        if (!this.initialized) {
            this.initialize();
        }
        this.container.classList.remove("hidden");
        this.scene.onBeforeRenderObservable.add(this._update);
    }

    public hide(): void {
        this.container.classList.add("hidden");
        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}