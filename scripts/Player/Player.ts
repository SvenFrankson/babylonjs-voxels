enum MoveType {
    Free,
    Lock,
    Rotate
}

class Player extends BABYLON.Mesh {

    public static DEBUG_INSTANCE: Player;

    private maxSpeed: number = 10;
    private speedX: number = 0;
    private speedZ: number = 0;
    public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public isWalking: boolean = false;

    private underWater: boolean = false;
    public head: BABYLON.AbstractMesh;
    public inputForward: number = 0;
    public inputRight: number = 0;
    public inputHeadUp: number = 0;
    public inputHeadRight: number = 0;
    public godMode: boolean;
    public manager: PlayerManager;
    
    public currentAction: PlayerAction;

    public moveType: MoveType = MoveType.Free;
    public rotateMoveCenter: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public rotateMoveNorm: BABYLON.Vector3 = BABYLON.Vector3.Up();

    public headMove: boolean = false;
    public targetLookStrength: number = 0.5;
    public targetLook: BABYLON.Vector3;
    public targetDestination: BABYLON.Vector3;
    private _lastDistToTarget: number;

    private groundCollisionVData: BABYLON.VertexData;
    private groundCollisionMesh: BABYLON.Mesh;
    private wallCollisionVData: BABYLON.VertexData;
    private wallCollisionMeshes: BABYLON.Mesh[] = [];

    private moveDelay: number = 1;
    private moveIndicatorDisc: BABYLON.Mesh;
    private moveIndicatorLandmark: BABYLON.Mesh;

    private _initialized: boolean = false;
    private _isRegisteredUIOnly: boolean = false;
    private _isRegistered: boolean = false;

    public playerActionManager: PlayerActionManager;
    public inventory: Inventory;

    public get inputManager(): InputManager {
        return this.main.inputManager;
    }

    public get scene(): BABYLON.Scene {
        return this._scene;
    }

    public animateCamPosRotX = AnimationFactory.EmptyNumberCallback;
    public animateCamPosRotY = AnimationFactory.EmptyNumberCallback;

    constructor(position: BABYLON.Vector3, public main: Main) {
        super("Player", main.scene);
        Player.DEBUG_INSTANCE = this;
        this.position = position;
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.head = new BABYLON.Mesh("Dummy", this.main.scene);
        this.head.parent = this;
        this.head.position = new BABYLON.Vector3(0, 1.77, 0);
        this.head.rotation.x = Math.PI / 8;
        this.manager = new PlayerManager(this);
        
        BABYLON.CreateSphereVertexData({ diameter: 0.2 }).applyToMesh(this);
        let material = new BABYLON.StandardMaterial("material", this.getScene());
        material.alpha = 0.5;
        this.material = material;
        this.layerMask = 0x10000000;

        let mat = new ToonMaterial("move-indicator-material", this.scene);
        this.moveIndicatorDisc = new BABYLON.Mesh("player-move-indicator-disc", this.main.scene);
        this.moveIndicatorDisc.material = mat;
        this.moveIndicatorDisc.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.moveIndicatorDisc.isVisible = false; 
        
        this.moveIndicatorLandmark = new BABYLON.Mesh("player-move-indicator-landmark", this.main.scene);
        this.moveIndicatorLandmark.material = mat;
        this.moveIndicatorLandmark.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.moveIndicatorLandmark.isVisible = false;
        
        this.animateCamPosRotX = AnimationFactory.CreateNumber(this, this.head.rotation, "x");
        this.animateCamPosRotY = AnimationFactory.CreateNumber(this, this.head.rotation, "y");
        
        let savedPlayerPosString = window.localStorage.getItem("player-position");
        if (savedPlayerPosString) {
            let savedPlayerPos = JSON.parse(savedPlayerPosString);
            this.position.x = savedPlayerPos.x;
            this.position.y = savedPlayerPos.y;
            this.position.z = savedPlayerPos.z;
            this.head.rotation.x = savedPlayerPos.rx;
            this.rotationQuaternion.x = savedPlayerPos.qx;
            this.rotationQuaternion.y = savedPlayerPos.qy;
            this.rotationQuaternion.z = savedPlayerPos.qz;
            this.rotationQuaternion.w = savedPlayerPos.qw;
        }
    }

    public async initialize(): Promise<void> {
        if (!this._initialized) {
            this.main.scene.onBeforeRenderObservable.add(this._update);
            this.manager.initialize();
            this._initialized = true;
            this.groundCollisionVData = (await this.main.vertexDataLoader.get("chunck-part"))[2];
            this.wallCollisionVData = (await this.main.vertexDataLoader.get("chunck-part"))[3];
            (await this.main.vertexDataLoader.get("landmark"))[0].applyToMesh(this.moveIndicatorDisc);
            (await this.main.vertexDataLoader.get("landmark"))[1].applyToMesh(this.moveIndicatorLandmark);
        }
    }

    public registerControlUIOnly(): void {
        if (this._isRegisteredUIOnly) {
            return;
        }
        this.inputManager.pointerUpObservable.add(this._onPointerUpUIOnly);
        this.inputManager.pointerDownObservable.add(this._onPointerDownUIOnly);
        this._isRegisteredUIOnly = true;
    }

    public unregisterControlUIOnly(): void {
        this.inputManager.pointerUpObservable.removeCallback(this._onPointerUpUIOnly);
        this.inputManager.pointerDownObservable.removeCallback(this._onPointerDownUIOnly);
        this._isRegisteredUIOnly = false;
    }

    private _onPointerUpUIOnly = (pickableElement: Pickable) => {
        if (this.manager) {
            this.manager.armManager.pointerUpAnimation(pickableElement, () => {
                if (pickableElement) {
                    pickableElement.onPointerUp();
                }
            });
        }
    }

    private _onPointerDownUIOnly = (pickableElement: Pickable) => {
        if (this.inputManager.aimedElement) {
            this.inputManager.aimedElement.onPointerDown();
        }
    }

    public registerControl(): void {
        if (this._isRegisteredUIOnly) {
            this.unregisterControlUIOnly();
        }
        if (this._isRegistered) {
            return;
        }

        this.inputManager.addMappedKeyDownListener(KeyInput.MOVE_FORWARD, () => {
            this.inputForward = 1;
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.MOVE_BACK, () => {
            this.inputForward = - 1;
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.MOVE_RIGHT, () => {
            this.inputRight = 1;
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.MOVE_LEFT, () => {
            this.inputRight = - 1;
        });

        this.inputManager.addMappedKeyUpListener(KeyInput.MOVE_FORWARD, () => {
            this.inputForward = 0;
        });
        this.inputManager.addMappedKeyUpListener(KeyInput.MOVE_BACK, () => {
            this.inputForward = 0;
        });
        this.inputManager.addMappedKeyUpListener(KeyInput.MOVE_RIGHT, () => {
            this.inputRight = 0;
        });
        this.inputManager.addMappedKeyUpListener(KeyInput.MOVE_LEFT, () => {
            this.inputRight = 0;
        });
        this.inputManager.addMappedKeyUpListener(KeyInput.JUMP, () => {
            if (this._isGrounded || this.godMode) {
                this.velocity.addInPlace(this.getDirection(BABYLON.Axis.Y).scale(5));
                this._isGrounded = false;
                this._jumpTimer = 0.2;
            }
        });
        this.main.canvas.addEventListener("keyup", this._keyUp);

        this.main.canvas.addEventListener("pointermove", this._mouseMove);

        this.inputManager.pointerUpObservable.add((pickable: IPickable) => {
            this.abortTeleportation();

            this._headMoveWithMouse = false;

            if (!pickable) {
                if (this.currentAction) {
                    if (this.currentAction.onClick) {
                        this.currentAction.onClick();
                        return;
                    }
                }
            }
            
            if (this.manager) {
                this.manager.armManager.pointerUpAnimation(pickable, () => {
                    if (pickable) {
                        pickable.onPointerUp();
                    }
                });
            }
        });

        this.inputManager.pointerDownObservable.add((pickable: IPickable) => {
            
            if (this.manager) {
                this.manager.armManager.pointerDownAnimation(pickable, () => {
                    if (pickable) {
                        pickable.onPointerDown();
                    }
                });
            }

            if (!this.inputManager.inventoryOpened) {
                if (!this.inputManager.aimedElement || !this.inputManager.aimedElement.interceptsPointerMove()) {
                    this.startTeleportation();
                    this._headMoveWithMouse = true;
                }
            }
        });

        this._isRegistered = true;
    }

    private _keyUp = (e: KeyboardEvent) => {
        if (e.code === "KeyG") {
            if (!this._initialized) {
                this.initialize();
            }
            this.godMode = !this.godMode;
        }
        if (e.code === "ControlLeft") {
            if (this.godMode) {
                this.velocity.subtractInPlace(this.getDirection(BABYLON.Axis.Y).scale(5));
                this._isGrounded = false;
                this._jumpTimer = 0.2;
            }
        }
    };

    private _headMoveWithMouse: boolean = false;
    private _mouseMove = (event: MouseEvent) => {
        if (this._headMoveWithMouse || this.inputManager.isPointerLocked) {
            let movementX: number = event.movementX;
            let movementY: number = event.movementY;
            let size = Math.min(this.main.canvas.width, this.main.canvas.height)
            this.inputHeadRight += movementX / size * 5;
            this.inputHeadUp += movementY / size * 5;
        }
    };

    private _moveTarget: BABYLON.Vector3;
    private _moveTimer: number = Infinity;
    private startTeleportation(): void {
        if (this.inputManager.isPointerLocked) {
            return;
        }
        this._moveTimer = 1;
        this._moveTarget = undefined;
    }

    private abortTeleportation(): void {
        this._moveTimer = Infinity;
    }

    public unregisterControl(): void {
        this.main.canvas.removeEventListener("keyup", this._keyUp);
        this.main.canvas.removeEventListener("mousemove", this._mouseMove);
    }

    private _gravityFactor: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _groundFactor: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _surfaceFactor: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _controlFactor: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    private _rightDirection: BABYLON.Vector3 = new BABYLON.Vector3(1, 0, 0);
    private _leftDirection: BABYLON.Vector3 = new BABYLON.Vector3(-1, 0, 0);
    private _forwardDirection: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 1);
    private _backwardDirection: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, -1);

    private _feetPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _headPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    private _collisionAxis: BABYLON.Vector3[] = [];
    private _collisionPositions: BABYLON.Vector3[] = [];

    private _jumpTimer: number = 0;
    private _isGrounded: boolean = false;

    private _debugCollisionGroundMesh: BABYLON.Mesh;
    private _debugCollisionWallMesh: BABYLON.Mesh;
    private _debugAimGroundMesh: BABYLON.Mesh;
    private _chuncks: Chunck[] = [];
    public get chuncks(): Chunck[] {
        return this._chuncks;
    }
    private _meshes: BABYLON.Mesh[] = [];
    public get meshes(): BABYLON.Mesh[] {
        return this._meshes;
    }
    
    private _isPosAnimating: boolean = false;
    public get isPosAnimating(): boolean {
        return this._isPosAnimating;
    }
    public async animatePos(posTarget: BABYLON.Vector3, duration: number, lookingAt?: boolean): Promise<void> {
        return new Promise<void>(resolve => {
            let posZero = this.position.clone();
            let quaternionZero: BABYLON.Quaternion;
            let quaternionTarget: BABYLON.Quaternion;
            if (lookingAt) {
                quaternionZero = this.rotationQuaternion.clone();
                let targetZ = posTarget.subtract(posZero).normalize();
                let targetX = BABYLON.Vector3.Cross(BABYLON.Axis.Y, targetZ);
                targetZ = BABYLON.Vector3.Cross(targetX, BABYLON.Axis.Y);
                quaternionTarget = BABYLON.Quaternion.RotationQuaternionFromAxis(targetX, BABYLON.Axis.Y, targetZ);
            }
            let t = 0;
            let cb = () => {
                t += this.main.engine.getDeltaTime() / 1000;
                if (t < duration) {
                    this._isPosAnimating = true;
                    let f = Easing.easeInOutSine(t / duration);
                    this.position.copyFrom(posZero).scaleInPlace(1 - f).addInPlace(posTarget.scale(f));
                    if (lookingAt) {
                        BABYLON.Quaternion.SlerpToRef(quaternionZero, quaternionTarget, f, this.rotationQuaternion);
                    }
                }
                else {
                    this._isPosAnimating = false;
                    this.position.copyFrom(posTarget);
                    this.main.scene.onBeforeRenderObservable.removeCallback(cb);
                    resolve();
                }
            }
            this.main.scene.onBeforeRenderObservable.add(cb);
        });
    }

    public lockInPlace: boolean = false;
    private _currentChunck: Chunck;
    private _savePositionTimer: number = 0;
    private _update = () => {
        if (this.main.cameraManager.cameraMode != CameraMode.Player) {
            return;
        }

        let deltaTime: number = this.main.engine.getDeltaTime() / 1000;
        if (Config.saveConfiguration.useLocalStorage) {
            this._savePositionTimer += deltaTime;
        }

        if (this.lockInPlace) {
            return;
        }

        if (isFinite(this._moveTimer)) {
            let p = this.inputManager.getPickInfo(this._meshes);
            if (p && p.hit && p.pickedPoint) {
                if (!this._moveTarget) {
                    this._moveTarget = p.pickedPoint.clone();
                }
                
                if (BABYLON.Vector3.DistanceSquared(this._moveTarget, p.pickedPoint) > 1) {
                    this.abortTeleportation();
                }

                if (this._moveTarget) {
                    this._moveTimer -= deltaTime;
                }
            }
            if (this._moveTimer < 0) {
                this.animatePos(this._moveTarget, 1, true);
                this.abortTeleportation();
            }
        }

        let moveTimerNormalized = this._moveTimer / this.moveDelay;
        if (moveTimerNormalized < 0.75 && this._moveTarget) {
            let sDisc = 0;
            if (moveTimerNormalized > 0.6) {
                sDisc = Easing.easeInOutSine(1 - (moveTimerNormalized - 0.6) / 0.15);
            }
            else {
                sDisc = Easing.easeInOutSine(moveTimerNormalized / 0.6);
            }
            let sLandmark = 0;
            if (moveTimerNormalized <= 0.6) {
                sLandmark = Easing.easeInOutSine(1 - moveTimerNormalized / 0.6);
            }

            this.moveIndicatorDisc.isVisible = true;
            this.moveIndicatorDisc.scaling.copyFromFloats(sDisc, sDisc, sDisc);
            this.moveIndicatorDisc.position.copyFrom(this._moveTarget);
            this.moveIndicatorLandmark.isVisible = true;
            this.moveIndicatorLandmark.scaling.copyFromFloats(sLandmark, sLandmark, sLandmark);
            this.moveIndicatorLandmark.position.copyFrom(this._moveTarget);
        }
        else {
            this.moveIndicatorDisc.isVisible = false;
            this.moveIndicatorLandmark.isVisible = false;
        }

        this._jumpTimer = Math.max(this._jumpTimer - deltaTime, 0);

        if (this.targetLook) {
            let forward = this.head.forward;
            let targetForward = this.targetLook.subtract(this.head.absolutePosition).normalize();
            let aY = VMath.AngleFromToAround(forward, targetForward, BABYLON.Axis.Y);
            if (isFinite(aY)) {
                this.inputHeadRight += aY / Math.PI * this.targetLookStrength;
            }
            let aX = VMath.AngleFromToAround(forward, targetForward, this._rightDirection);
            if (isFinite(aX)) {
                this.inputHeadUp += aX / (2 * Math.PI) * this.targetLookStrength;
            }
            if (!this.targetDestination && this.velocity.lengthSquared() < 0.001) {
                if (Math.abs(aY) < Math.PI / 180 && Math.abs(aX) < Math.PI / 180) {
                    this.targetLook = undefined;
                    this.targetLookStrength = 0.5;
                }
            }
        }

        let rotationPower: number = this.inputHeadRight * Math.PI * deltaTime;
        let rotationCamPower: number = this.inputHeadUp * Math.PI * deltaTime;
        if (!this.headMove) {
            let localY: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Y, this.getWorldMatrix());
            let rotation: BABYLON.Quaternion = BABYLON.Quaternion.RotationAxis(localY, rotationPower);
            this.rotationQuaternion = rotation.multiply(this.rotationQuaternion);
        }
        else {
            this.head.rotation.y += rotationPower;
            this.head.rotation.y = Math.max(this.head.rotation.y, -Math.PI / 2);
            this.head.rotation.y = Math.min(this.head.rotation.y, Math.PI / 2);
        }
        this.head.rotation.x += rotationCamPower;
        this.head.rotation.x = Math.max(this.head.rotation.x, -Math.PI / 2);
        this.head.rotation.x = Math.min(this.head.rotation.x, Math.PI / 2);
        
        let chunck = this.main.terrain.getChunckAtPos(this.position, 0);
        if (chunck != this._currentChunck) {
            if (this._currentChunck) {
                //this._currentChunck.unlit();
            }
            
            this._currentChunck = chunck;

            if (this._currentChunck) {
                //this._currentChunck.highlight();
                this._chuncks = this._currentChunck.getChuncksAround(2);
            }
            else {
                this._chuncks = [];
            }
            //console.log(this._meshes);
        }

        this._meshes = this._chuncks.map(c => { return c ? c.mesh : undefined; });

        let inputFactor = Easing.smooth010Sec(this.getEngine().getFps());
        this.inputHeadRight *= inputFactor;
        this.inputHeadUp *= inputFactor;

        this._collisionPositions[0] = this._headPosition;
        this._collisionPositions[1] = this._feetPosition;
        this._collisionAxis[0] = this._rightDirection;
        this._collisionAxis[1] = this._leftDirection;
        this._collisionAxis[2] = this._forwardDirection;
        this._collisionAxis[3] = this._backwardDirection;

        this.getDirectionToRef(BABYLON.Axis.X, this._rightDirection);
        this._leftDirection.copyFrom(this._rightDirection);
        this._leftDirection.scaleInPlace(-1);

        this.getDirectionToRef(BABYLON.Axis.Z, this._forwardDirection);
        this._backwardDirection.copyFrom(this._forwardDirection);
        this._backwardDirection.scaleInPlace(-1);

        this._feetPosition.copyFrom(this.position);
        this._feetPosition.addInPlace(BABYLON.Axis.Y.scale(0.5));

        this._headPosition.copyFrom(this.position);
        this._headPosition.addInPlace(BABYLON.Axis.Y.scale(1.5));

        if (this.moveType === MoveType.Lock) {
            return;
        }

        let fVert = 1;
        // Add gravity and ground reaction.
        let gFactor = 1;
        gFactor = Math.max(Math.min(gFactor, 1), 0) * 9.8;
        this._gravityFactor.copyFromFloats(0, - 1, 0).scaleInPlace(gFactor * deltaTime);
        this._groundFactor.copyFromFloats(0, 0, 0);

        if (this._jumpTimer === 0) {

            let checkGroundCollision: boolean = false;
            if (this.groundCollisionVData) {
                let localIJK = this.main.terrain.getChunckAndIJKAtPos(this.position.add(BABYLON.Axis.Y.scale(0.75 * BLOCK_HEIGHT_M)), 0);
                if (localIJK) {
                    let data = localIJK.chunck.getData(localIJK.ijk.i, localIJK.ijk.j, localIJK.ijk.k);
                    if (data <= BlockType.Water) {
                        localIJK = this.main.terrain.getChunckAndIJKAtPos(this.position.subtract(BABYLON.Axis.Y.scale(0.25 * BLOCK_HEIGHT_M)), 0);
                        if (localIJK) {
                            data = localIJK.chunck.getData(localIJK.ijk.i, localIJK.ijk.j, localIJK.ijk.k);
                        }
                    }
                    if (data > BlockType.Water) {
                        if (!this.groundCollisionMesh) {
                            this.groundCollisionMesh = BABYLON.MeshBuilder.CreateBox("debug-current-block", { width: 3 * BLOCK_SIZE_M, height: BLOCK_HEIGHT_M, depth: 3 * BLOCK_SIZE_M });
                            if (DebugDefine.SHOW_PLAYER_COLLISION_MESHES) {
                                let material = new BABYLON.StandardMaterial("material");
                                material.alpha = 0.25;
                                this.groundCollisionMesh.material = material;
                                //this.groundCollisionMesh.scaling.copyFromFloats(1.1, 1.1, 1.1);
                            }
                            else {
                                this.groundCollisionMesh.isVisible = false;
                            }
                        }
        
                        this.groundCollisionMesh.position.copyFrom(localIJK.chunck.position);
                        this.groundCollisionMesh.position.addInPlace(new BABYLON.Vector3(
                            (localIJK.ijk.i + 0.5) * BLOCK_SIZE_M,
                            (localIJK.ijk.k) * BLOCK_HEIGHT_M,
                            (localIJK.ijk.j + 0.5) * BLOCK_SIZE_M
                        ));
                        checkGroundCollision = true;
                    }
                }
            }

            if (checkGroundCollision) {
                let ray: BABYLON.Ray = new BABYLON.Ray(this.head.absolutePosition, new BABYLON.Vector3(0, - 1, 0));
                let hit: BABYLON.PickingInfo = ray.intersectsMesh(this.groundCollisionMesh);
                if (hit && hit.pickedPoint) {
                    if (DebugDefine.SHOW_PLAYER_COLLISION_MESHES) {
                        if (!this._debugCollisionGroundMesh) {
                            this._debugCollisionGroundMesh = BABYLON.MeshBuilder.CreateSphere("debug-collision-mesh", { diameter: 0.2 }, this.getScene());
                            let material = new BABYLON.StandardMaterial("material", this.getScene());
                            material.alpha = 0.5;
                            this._debugCollisionGroundMesh.material = material;
                        }
                        this._debugCollisionGroundMesh.position.copyFrom(hit.pickedPoint);
                    }
                    let d: number = BABYLON.Vector3.Dot(hit.pickedPoint.subtract(this.position), BABYLON.Axis.Y);
                    /*
                    if (d <= 0.2) {
                        let v = 0;
                        if (d < 0) {
                            v = Math.abs(15 * d);
                        }
                        this._groundFactor
                            .copyFrom(this._gravityFactor)
                            .scaleInPlace(- 1 - v);
                        fVert = 0.005;
                        this._isGrounded = true;
                    }
                    */
                    if (d >= 0) {
                        let dy = d * 0.3;
                        dy = Math.min(dy, 5 * deltaTime);
                        this.position.addInPlace(BABYLON.Axis.Y.scale(dy))
                        this._gravityFactor.copyFromFloats(0, 0, 0);
                        this.velocity.scaleInPlace(0.5);
                        this._isGrounded = true;
                    }
                }
            }
        }

        // Add input force.
        this._controlFactor.copyFromFloats(0, 0, 0);

        this.speedX = this.speedX * 0.9 + this.inputRight * this.maxSpeed * 0.1;
        this.speedZ = this.speedZ * 0.9 + this.inputForward * this.maxSpeed * 0.1;

        if (this.targetDestination) {
            this._controlFactor.copyFrom(this.targetDestination);
            this._controlFactor.subtractInPlace(this.position);
            let dist = this._controlFactor.length();
            if (dist > this._lastDistToTarget && this.velocity.length() < 0.1) {
                this.targetDestination = undefined;
                this._lastDistToTarget = undefined;
            }
            else {
                this._lastDistToTarget = dist;
                this._controlFactor.normalize();
                this._controlFactor.scaleInPlace((dist * 20) * deltaTime);
            }
        }
        else {
            this.velocity.addInPlace(this._gravityFactor);
            this.velocity.addInPlace(this._groundFactor);

            this._controlFactor.addInPlace(this._rightDirection.scale(this.speedX));
            this._controlFactor.addInPlace(this._forwardDirection.scale(this.speedZ));
            if (this._controlFactor.lengthSquared() > this.maxSpeed * this.maxSpeed) {
                this._controlFactor.normalize().scaleInPlace(this.maxSpeed);
            }
            if (this._controlFactor.lengthSquared() > 0.01) {
                this._controlFactor.scaleInPlace(deltaTime);
                if (this.godMode) {
                    this._controlFactor.scaleInPlace(10);
                }
            }
            else {
                this._controlFactor.copyFromFloats(0, 0, 0);
            }
            /*
            let speed = this.speed;
            if (this.isWalking) {
                speed *= 0.5;
            }
            */
        }
        this.position.addInPlace(this._controlFactor);

        // Check wall collisions.
        this._surfaceFactor.copyFromFloats(0, 0, 0);

        let wallCount = 0;
        if (this.wallCollisionVData) {
            /*
            for (let i = 0; i < this._collisionPositions.length; i++) {
                let pos = this._collisionPositions[i];
                for (let j = 0; j < this._collisionAxis.length; j++) {
                    let axis = this._collisionAxis[j];
                    let localIJK = PlanetTools.WorldPositionToLocalIJK(this.planet, pos.add(axis.scale(0.35)));
                    if (localIJK) {
                        let data = localIJK.planetChunck.GetData(localIJK.i, localIJK.j, localIJK.k);
                        if (data > BlockType.Water) {
                            let globalIJK = PlanetTools.LocalIJKToGlobalIJK(localIJK);
                            if (globalIJK) {
                                if (!this.wallCollisionMeshes[wallCount]) {
                                    this.wallCollisionMeshes[wallCount] = BABYLON.MeshBuilder.CreateSphere("wall-collision-mesh", { diameter: 1 });
                                    if (DebugDefine.SHOW_PLAYER_COLLISION_MESHES) {
                                        let material = new BABYLON.StandardMaterial("material");
                                        material.alpha = 0.25;
                                        this.wallCollisionMeshes[wallCount].material = material;
                                    }
                                    else {
                                        this.wallCollisionMeshes[wallCount].isVisible = false;
                                    }
                                }
                
                                PlanetTools.SkewVertexData(this.wallCollisionVData, localIJK.planetChunck.size, globalIJK.i, globalIJK.j, globalIJK.k).applyToMesh(this.wallCollisionMeshes[wallCount]);
                                this.wallCollisionMeshes[wallCount].parent = localIJK.planetChunck.planetSide;
                                wallCount++;
                            }
                        }
                    }
                }
            }
            */
        }

        if (!this.godMode && !this.targetDestination) {
            for (let i = 0; i < this._collisionPositions.length; i++) {
                let pos = this._collisionPositions[i];
                for (let j = 0; j < this._collisionAxis.length; j++) {
                    let axis = this._collisionAxis[j];
                    let ray: BABYLON.Ray = new BABYLON.Ray(pos, axis, 0.35);
                    let hit: BABYLON.PickingInfo[] = ray.intersectsMeshes(this.wallCollisionMeshes.filter((m, index) => { return index < wallCount; }));
                    hit = hit.sort((h1, h2) => { return h1.distance - h2.distance; });
                    if (hit[0] && hit[0].pickedPoint) {
                        /*
                        if (DebugDefine.SHOW_PLAYER_COLLISION_MESHES) {
                            if (!this._debugCollisionWallMesh) {
                                this._debugCollisionWallMesh = BABYLON.MeshBuilder.CreateSphere("debug-collision-mesh", { diameter: 0.2 }, this.getScene());
                                let material = new BABYLON.StandardMaterial("material", this.getScene());
                                material.alpha = 0.5;
                                this._debugCollisionWallMesh.material = material;
                            }
                            this._debugCollisionWallMesh.position.copyFrom(hit[0].pickedPoint);
                        }
                        */
                        let d: number = hit[0].pickedPoint.subtract(pos).length();
                        if (d > 0.01) {
                            this._surfaceFactor.addInPlace(axis.scale((((-10 / 1) * 0.3) / d) * deltaTime));
                        } else {
                            // In case where it stuck to the surface, force push.
                            this.position.addInPlace(hit[0].getNormal(true).scale(0.01));
                        }
                    }
                }
            }
        }
        this.velocity.addInPlace(this._surfaceFactor);

        // Add friction
        let downVelocity = new BABYLON.Vector3(0, this.velocity.y, 0);
        this.velocity.subtractInPlace(downVelocity);
        downVelocity.scaleInPlace(Math.pow(0.99 * fVert, deltaTime));
        this.velocity.addInPlace(downVelocity);

        // Safety check.
        if (!VMath.IsFinite(this.velocity)) {
            this.velocity.copyFromFloats(-0.1 + 0.2 * Math.random(), -0.1 + 0.2 * Math.random(), -0.1 + 0.2 * Math.random());
        }
        let dp = this.velocity.scale(deltaTime);
        if (this.moveType === MoveType.Rotate && this.velocity.lengthSquared() > 0) {
            let dr = - BABYLON.Vector3.Dot(this.forward, dp);

            let p0 = this.position.subtract(this.rotateMoveCenter);
            let d = p0.length();

            this.position.addInPlace(dp);
            let p1 = this.position.subtract(this.rotateMoveCenter);
            let a = VMath.AngleFromToAround(p0, p1, this.rotateMoveNorm);
            let quat = BABYLON.Quaternion.RotationAxis(this.rotateMoveNorm, a);
            this.rotationQuaternion = quat.multiply(this.rotationQuaternion);
            VMath.RotateVectorByQuaternionToRef(this.velocity, quat, this.velocity);

            let newRadius = Math.max(d + dr, 0.5);
            VMath.ForceDistanceFromOriginInPlace(this.position, this.rotateMoveCenter, newRadius);
        }
        else {
            this.position.addInPlace(dp);
        }

        // Update action
        if (!this.inputManager.aimedElement && this.currentAction) {
            if (this.currentAction.onUpdate) {
                this.currentAction.onUpdate();
            }
        }

        if (Config.saveConfiguration.useLocalStorage) {
            if (this._savePositionTimer > 0.5) {
                this._savePositionTimer = 0;
                let savedPlayerPos = {
                    x: this.position.x,
                    y: this.position.y,
                    z: this.position.z,                
                    rx: this.head.rotation.x,
                    qx: this.rotationQuaternion.x,
                    qy: this.rotationQuaternion.y,
                    qz: this.rotationQuaternion.z,
                    qw: this.rotationQuaternion.w
                };
                window.localStorage.setItem("player-position", JSON.stringify(savedPlayerPos));
            }
        }

        //document.querySelector("#camera-altitude").textContent = this.camPos.absolutePosition.length().toFixed(1);
    };
}
