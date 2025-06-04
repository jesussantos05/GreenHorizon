//============================================================================
// Gabe MV - Fog Effects
//----------------------------------------------------------------------------
// Adaptado para RPG Maker MV desde Gabe MZ - Fog Effects v2.1.0
// Original por: Gabe (Gabriel Nascimento)
// Conversión por: AI (basado en el código original)
// Fecha de conversión: 2025-05-07
//----------------------------------------------------------------------------
// This software is released under the zlib License.
//============================================================================

/*:
 * @plugindesc [v2.1.0-MV] Permite crear y mostrar efectos de niebla en mapas y batallas.
 * @author Gabe (Original), Adaptación AI
 * @target MV
 *
 * @help Gabe MV - Fog Effects
 * - Este plugin se distribuye bajo la licencia zlib.
 *
 * Este plugin proporciona una opción para crear y mostrar efectos de niebla
 * en mapas y batallas.
 *
 * El primer paso es configurar los "Fog Settings" en los parámetros de este plugin.
 * Después, puedes añadir un efecto de niebla en el mapa insertando la etiqueta
 * específica en las Notas del Mapa o usando los Comandos de Plugin provistos.
 *
 * * Los archivos de imagen de niebla deben colocarse en img/fogs/
 *
 * Comandos de Plugin (para MV):
 * Nota: Los comandos no distinguen mayúsculas/minúsculas, pero los argumentos sí.
 *
 * FogSetEffect fogId layerId
 * | Establece un efecto de niebla. Se pueden llamar múltiples veces
 * | para preparar un lote. Usar FogApplyChanges para aplicar.
 * | Ejemplo: FogSetEffect 1 1
 *
 * FogPrepareBatch
 * | Limpia cualquier efecto de niebla pendiente de ser añadido/eliminado.
 * | Úsalo antes de una serie de FogSetEffect o FogRemoveLayerFromBatch
 * | si quieres empezar una nueva configuración de lote.
 *
 * FogRemoveLayerFromBatch layerId
 * | Prepara la eliminación de un efecto de niebla de una capa específica en el lote.
 * | Ejemplo: FogRemoveLayerFromBatch 1
 *
 * FogApplyChanges
 * | Aplica todos los cambios pendientes hechos con FogSetEffect y FogRemoveLayerFromBatch.
 *
 * FogRemoveEffectLayer layerId1 layerId2 ...
 * | Elimina inmediatamente el efecto de niebla de las capas especificadas.
 * | Ejemplo: FogRemoveEffectLayer 1 3
 *
 * FogClearScreen
 * | Elimina todos los efectos de niebla de todas las capas inmediatamente.
 *
 * FogSetOpacity layerId opacity duration
 * | Controla la opacidad de la niebla de la capa especificada.
 * | opacity: 0-255. duration: en frames (0 para instantáneo).
 * | Ejemplo: FogSetOpacity 1 128 60
 *
 * FogSetTone layerId red green blue gray duration
 * | Controla el tono de la niebla de la capa especificada.
 * | red, green, blue: -255 a 255. gray: 0 a 255.
 * | duration: en frames (0 para instantáneo).
 * | Ejemplo: FogSetTone 1 50 0 0 0 60
 *
 * FogSetInMap true/false
 * | Establece si los efectos de niebla se mostrarán en los mapas del juego.
 * | Ejemplo: FogSetInMap true
 *
 * FogSetInBattle true/false
 * | Establece si los efectos de niebla se mostrarán durante las batallas.
 * | Ejemplo: FogSetInBattle true
 *
 * Etiqueta de Nota de Mapa:
 * <addFog layer: id>
 * | Esta etiqueta añade el efecto de niebla del ID específico a la
 * | capa específica cuando se carga el mapa.
 * Ejemplo de Uso:
 * <addFog 1: 1>  // Añade niebla de ID 1 a la capa 1.
 * <addFog 4: 3>  // Añade niebla de ID 3 a la capa 4.
 *
 * @param fogSettings
 * @text Fog Settings
 * @desc Configura los efectos de niebla a usar. Debe ser un array JSON.
 * @type note
 * @default []
 * @example [{"fogFilename":"Fog1","fogOpacity":128,"fogBlendMode":0,"fogMoveX":1,"fogMoveY":0.5}]
 *
 * @param fogInMap
 * @text Fog in Map?
 * @desc Establece si los efectos de niebla se mostrarán en los mapas por defecto.
 * @type boolean
 * @default true
 *
 * @param fogInBattle
 * @text Fog in Battle?
 * @desc Establece si los efectos de niebla se mostrarán durante las batallas por defecto.
 * @type boolean
 * @default true
 *
 * @param fogOptionsMenuCommand
 * @text Options Menu
 * @default ===============================================
 *
 * @param commandEnabled
 * @text Options Command Enabled
 * @parent fogOptionsMenuCommand
 * @desc Si es true, muestra el comando de control de niebla en el menú de opciones.
 * @type boolean
 * @default true
 *
 * @param commandName
 * @text Options Command Name
 * @parent fogOptionsMenuCommand
 * @desc Texto del comando de control de niebla en el menú de opciones.
 * @type text
 * @default Fog Effects
 */

var Imported = Imported || {};
Imported.GMV_FogEffects = true; // Cambiado de GMZ a GMV para MV

var GabeMV = GabeMV || {}; // Cambiado de GabeMZ a GabeMV
GabeMV.FogEffects = GabeMV.FogEffects || {};
GabeMV.FogEffects.VERSION = [2, 1, 0]; // Manteniendo la versión original

(() => {
    const pluginName = "GabeMV_FogEffects"; // Nombre del archivo JS, no necesariamente el del plugin manager
    const params = PluginManager.parameters(pluginName);

    try {
        GabeMV.FogEffects.fogSettings = JSON.parse(params.fogSettings || "[]");
    } catch (e) {
        console.error("Error parsing GabeMV_FogEffects fogSettings parameter. Please ensure it's a valid JSON array.", e);
        GabeMV.FogEffects.fogSettings = [];
    }
    GabeMV.FogEffects.fogInMap = params.fogInMap === "true";
    GabeMV.FogEffects.fogInBattle = params.fogInBattle === "true";
    GabeMV.FogEffects.commandEnabled = params.commandEnabled === "true";
    GabeMV.FogEffects.commandName = params.commandName || "Fog Effects";
    GabeMV.FogEffects.fogList = [];
    GabeMV.FogEffects.currentMap = 0;
    GabeMV.FogEffects.tempFog = []; // Buffer para comandos de lote
    GabeMV.FogEffects.needRefresh = false;

    //-----------------------------------------------------------------------------
    // PluginManager Commands for MV
    //-----------------------------------------------------------------------------
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        command = command.toLowerCase();

        switch (command) {
            case "fogpreparebatch":
                GabeMV.FogEffects.tempFog = [];
                break;
            case "fogseteffect": // Args: fogId, layerId
                if (args && args.length >= 2) {
                    GabeMV.FogEffects.tempFog.push([parseInt(args[0]), parseInt(args[1])]);
                }
                break;
            case "fogremovelayerfrombatch": // Args: layerId
                 if (args && args.length >= 1) {
                    GabeMV.FogEffects.tempFog.push([null, parseInt(args[0])]);
                }
                break;
            case "fogapplychanges":
                GabeMV.FogEffects.needRefresh = true;
                break;
            case "fogremoveeffectlayer": // Args: layerId1, layerId2, ...
                GabeMV.FogEffects.tempFog = [];
                if (args) {
                    args.forEach(layerStr => {
                        GabeMV.FogEffects.tempFog.push([null, parseInt(layerStr)]);
                    });
                }
                GabeMV.FogEffects.needRefresh = true;
                break;
            case "fogclearscreen":
                GabeMV.FogEffects.tempFog = []; // Empty array signals clearList in refresh
                GabeMV.FogEffects.needRefresh = true;
                break;
            case "fogsetopacity": // Args: layer, opacity, time
                if (args && args.length >= 3) {
                    const layer = parseInt(args[0]);
                    const opacity = parseInt(args[1]);
                    const time = parseInt(args[2]);
                    if (GabeMV.FogEffects.fogList[layer]) {
                        GabeMV.FogEffects.fogList[layer].setOpacityTarget(opacity, time);
                    }
                }
                break;
            case "fogsettone": // Args: layer, r, g, b, gray, time
                if (args && args.length >= 6) {
                    const layer = parseInt(args[0]);
                    const tone = [
                        parseInt(args[1]),
                        parseInt(args[2]),
                        parseInt(args[3]),
                        parseInt(args[4])
                    ];
                    const time = parseInt(args[5]);
                    if (GabeMV.FogEffects.fogList[layer]) {
                        GabeMV.FogEffects.fogList[layer].setToneTarget(tone, time);
                    }
                }
                break;
            case "fogsetinmap": // Args: true/false
                if (args && args.length >= 1) {
                    GabeMV.FogEffects.fogInMap = args[0].toLowerCase() === "true";
                    if (!GabeMV.FogEffects.fogInMap) {
                        GabeMV.FogEffects.tempFog = []; // Signal to clearList
                        GabeMV.FogEffects.needRefresh = true;
                    }
                }
                break;
            case "fogsetinbattle": // Args: true/false
                if (args && args.length >= 1) {
                    GabeMV.FogEffects.fogInBattle = args[0].toLowerCase() === "true";
                }
                break;
        }
    };

    //-----------------------------------------------------------------------------
    // ImageManager
    //-----------------------------------------------------------------------------
    ImageManager.loadFogs = function (filename) {
        return this.loadBitmap("img/fogs/", filename, 0, true); // MV loadBitmap args
    };

    //-----------------------------------------------------------------------------
    // Sprite_Fog
    //-----------------------------------------------------------------------------
    function Sprite_Fog() {
        this.initialize.apply(this, arguments);
    }

    Sprite_Fog.prototype = Object.create(TilingSprite.prototype);
    Sprite_Fog.prototype.constructor = Sprite_Fog;

    Sprite_Fog.prototype.initialize = function (bitmap) { // MV TilingSprite takes bitmap in initialize
        TilingSprite.prototype.initialize.call(this, bitmap);
        this.initMembers();
    };

    Sprite_Fog.prototype.initMembers = function () {
        this.constX = 0;
        this.constY = 0;
        this._opacityTarget = 0;
        this._opacityDuration = 0; // Renamed from _opacityTime for clarity
        this._tone = [0, 0, 0, 0];
        this._toneTarget = [0, 0, 0, 0];
        this._toneDuration = 0; // Renamed from _toneTime for clarity
        this._appliedTone = null; // For MV optimization if needed
    };

    Sprite_Fog.prototype.update = function () {
        TilingSprite.prototype.update.call(this);
        this._updateMovement();
        this._updateOpacity();
        this._updateTone();
        // Apply tone using MV's setColorTone
        // Optimization: Only call if tone changed. For simplicity, we can call it every frame.
        // If performance is an issue, add a check like:
        // if (!this._appliedTone || !this._appliedTone.equals(this._tone)) {
        //    this.setColorTone(this._tone);
        //    this._appliedTone = this._tone.clone();
        // }
        this.setColorTone(this._tone);
    };

    Sprite_Fog.prototype._updateMovement = function () {
        if (!this.bitmap || !this.bitmap.isReady()) return; // Wait for bitmap
        this.constX += this.speedX;
        this.origin.x = ($gameMap.displayX() * $gameMap.tileWidth()) + this.constX - 96;
        this.constY += this.speedY;
        this.origin.y = ($gameMap.displayY() * $gameMap.tileHeight()) + this.constY - 96;
    };

    Sprite_Fog.prototype._updateOpacity = function () {
        if (this._opacityDuration > 0) {
            const d = this._opacityDuration;
            this.opacity = (this.opacity * (d - 1) + this._opacityTarget) / d; // Smoother transition
            this._opacityDuration--;
        } else if (this.opacity !== this._opacityTarget && this._opacityTarget !== this.opacity && this._opacityDuration === 0){
             // This means target was set directly (duration 0) or duration finished.
             // The MZ code had 'this.opacity += this._opacityTarget' which is unusual for targetted opacity.
             // Assuming _opacityTarget is the final target opacity.
             // This is usually handled by setOpacityTarget directly for duration 0
        }
    };

    Sprite_Fog.prototype._updateTone = function () {
        if (this._toneDuration > 0) {
            const d = this._toneDuration;
            for (let i = 0; i < 4; i++) {
                this._tone[i] = (this._tone[i] * (d - 1) + this._toneTarget[i]) / d;
            }
            this._toneDuration--;
        }
    };

    Sprite_Fog.prototype.setOpacityTarget = function (opacity, duration) {
        this._opacityTarget = opacity;
        this._opacityDuration = duration;
        if (this._opacityDuration === 0) {
            this.opacity = this._opacityTarget;
        }
    };

    Sprite_Fog.prototype.setToneTarget = function (tone, duration) {
        this._toneTarget = tone.clone();
        this._toneDuration = duration;
        if (this._toneDuration === 0) {
            this._tone = this._toneTarget.clone();
        }
    };

    //-----------------------------------------------------------------------------
    // Spriteset_Fog
    //-----------------------------------------------------------------------------
    function Spriteset_Fog() {
        this.initialize.apply(this, arguments);
    }

    Spriteset_Fog.prototype = Object.create(Sprite.prototype);
    Spriteset_Fog.prototype.constructor = Spriteset_Fog;

    Spriteset_Fog.prototype.initialize = function () {
        Sprite.prototype.initialize.call(this);
        this.setFrame(0, 0, Graphics.boxWidth, Graphics.boxHeight); // MV uses Graphics.boxWidth/Height
        this.createFogList();
    };

    Spriteset_Fog.prototype.createFogList = function () {
        if (GabeMV.FogEffects.currentMap === $gameMap.mapId() && SceneManager._scene instanceof Scene_Map) {
            GabeMV.FogEffects.fogList.forEach((fog, id) => {
                if (fog) this.createFog(fog.id, id, fog);
            });
        } else {
            GabeMV.FogEffects.currentMap = $gameMap.mapId();
            this.clearList(); // Clear old list from previous map or state
            if ($dataMap && $dataMap.note) { // Ensure $dataMap and note exist
                const reg = /<addFog\s*(\d+):\s*(\d+)>/gi; // g for multiple, i for case-insensitive
                let match;
                while (match = reg.exec($dataMap.note)) {
                    this.createFog(parseInt(match[2]), parseInt(match[1])); // id from match[2], layer from match[1]
                }
            }
        }
    };

    Spriteset_Fog.prototype.update = function () {
        Sprite.prototype.update.call(this);
        if (GabeMV.FogEffects.needRefresh) this.refreshFogList();
    };

    Spriteset_Fog.prototype.createFog = function (id, layer, existingFogData) {
        if (layer < 1 || !GabeMV.FogEffects.fogSettings[id - 1]) return;
        // In MZ, fogSettings was an array of objects. In MV, we parsed it from JSON string.
        const fogSetting = GabeMV.FogEffects.fogSettings[id - 1];
        if (!fogSetting) {
            console.warn(`GabeMV_FogEffects: Fog setting for ID ${id} not found.`);
            return;
        }

        const bitmap = ImageManager.loadFogs(fogSetting.fogFilename);
        const sprite = new Sprite_Fog(bitmap);
        // Sprite_Fog constructor in MV takes bitmap. No need to set it again.
        // sprite.bitmap = bitmap; // Not needed if passed to constructor

        sprite.move(-96, -96, Graphics.boxWidth + 192, Graphics.boxHeight + 192);
        sprite.opacity = existingFogData ? existingFogData.opacity : parseInt(fogSetting.fogOpacity);
        sprite.blendMode = parseInt(fogSetting.fogBlendMode);
        // TilingSprite origin is different in MV (default 0,0). MZ origin seems to be related to its internal drawing.
        // For MV TilingSprite, origin.x/y affects the texture's drawing offset within the sprite frame.
        // The MZ calculation for origin combined with constX/Y needs careful review if it behaves differently.
        // Let's keep the logic similar and test.
        sprite.origin.x = -96;
        sprite.origin.y = -96;

        sprite.speedX = -parseFloat(fogSetting.fogMoveX);
        sprite.speedY = -parseFloat(fogSetting.fogMoveY);
        sprite.id = id;
        sprite.z = layer; // For sorting

        if (existingFogData) {
            sprite.constX = existingFogData.constX;
            sprite.constY = existingFogData.constY;
            sprite._opacityTarget = existingFogData._opacityTarget;
            sprite._opacityDuration = existingFogData._opacityDuration; //_opacityTime
            sprite._tone = existingFogData._tone.clone();
            sprite._toneTarget = existingFogData._toneTarget.clone();
            sprite._toneDuration = existingFogData._toneDuration; // _toneTime
        } else {
            // Initialize these values if not existingFogData
             sprite.setOpacityTarget(sprite.opacity, 0); // Set target to current opacity initially
             sprite.setToneTarget(sprite._tone.clone(), 0); // Set target to current tone initially
        }

        this.addChild(sprite);
        this._sortChildren();
        GabeMV.FogEffects.fogList[layer] = sprite;
    };

    Spriteset_Fog.prototype._sortChildren = function () {
        this.children.sort(this._compareChildOrder.bind(this));
    };

    Spriteset_Fog.prototype._compareChildOrder = function (a, b) {
        if (a.z !== b.z) {
            return a.z - b.z;
        } else if (a.y !== b.y) { // y sorting might not be relevant for full-screen fogs
            return a.y - b.y;
        } else {
            return a.spriteId - b.spriteId;
        }
    };

    Spriteset_Fog.prototype.refreshFogList = function () {
        // tempFog contains [id, layer] or [null, layer] for removal
        if (GabeMV.FogEffects.tempFog && GabeMV.FogEffects.tempFog.length > 0) {
            GabeMV.FogEffects.tempFog.forEach(fogData => {
                const fogId = fogData[0];
                const layer = fogData[1];
                if (GabeMV.FogEffects.fogList[layer]) {
                    this.removeChild(GabeMV.FogEffects.fogList[layer]);
                    GabeMV.FogEffects.fogList[layer] = null;
                }
                if (fogId) { // If an ID is provided, create new fog
                    this.createFog(fogId, layer);
                }
            });
        } else if (GabeMV.FogEffects.tempFog && GabeMV.FogEffects.tempFog.length === 0) {
            // If tempFog is an empty array (set by ClearScreen or SetFogInMap(false)), clear all
            this.clearList();
        }
        GabeMV.FogEffects.tempFog = []; // Clear tempFog after processing
        GabeMV.FogEffects.needRefresh = false;
    };

    Spriteset_Fog.prototype.clearList = function () {
        GabeMV.FogEffects.fogList.forEach(fogSprite => {
            if (fogSprite) this.removeChild(fogSprite);
        });
        GabeMV.FogEffects.fogList = [];
    };

    //-----------------------------------------------------------------------------
    // Spriteset_Base
    //-----------------------------------------------------------------------------
    const _Spriteset_Base_createUpperLayer = Spriteset_Base.prototype.createUpperLayer;
    Spriteset_Base.prototype.createUpperLayer = function() { // MZ had createFogLayer method, let's integrate directly
        _Spriteset_Base_createUpperLayer.call(this);
        // The check for fogEffects on ConfigManager will determine if it's shown
        // We need to know if this is map or battle to check fogInMap/fogInBattle
        let shouldCreate = false;
        if (this instanceof Spriteset_Map && GabeMV.FogEffects.fogInMap) {
            shouldCreate = true;
        } else if (this instanceof Spriteset_Battle && GabeMV.FogEffects.fogInBattle) {
            shouldCreate = true;
        }

        if (shouldCreate && ConfigManager.fogEffects) { // Check general toggle from options
            if (!this._fogLayer) { // Create if not exists
                 this._fogLayer = new Spriteset_Fog();
                 // In MV, Spriteset_Map adds weather to itself. Parallax to _tilemap.
                 // For something like fog, it should probably be on top of most things or just below weather.
                 // Adding to 'this' (the spriteset) means it's above tilemap/battlefield but potentially below HUD elements if any are added here.
                 // The original MZ added it to _baseSprite.
                 // For Spriteset_Map, _baseSprite is _tilemap.
                 // For Spriteset_Battle, _baseSprite is _battleField.
                 if (this._tilemap) { // Spriteset_Map
                     this._tilemap.addChild(this._fogLayer);
                 } else if (this._battleField) { // Spriteset_Battle
                     this._battleField.addChild(this._fogLayer);
                 } else {
                     this.addChild(this._fogLayer); // Fallback
                 }
            }
        } else if (this._fogLayer) { // If exists but shouldn't, remove
            if (this._tilemap && this._tilemap.children.includes(this._fogLayer)) {
                this._tilemap.removeChild(this._fogLayer);
            } else if (this._battleField && this._battleField.children.includes(this._fogLayer)) {
                this._battleField.removeChild(this._fogLayer);
            } else if (this.children.includes(this._fogLayer)) {
                this.removeChild(this._fogLayer);
            }
            this._fogLayer = null; // Destroy or nullify
        }
    };
    
    // Ensure fog layer is created/updated when config changes or scene starts
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        // Force a refresh of fog display in case settings changed via options menu
        if (this._spriteset && this._spriteset._fogLayer) {
             GabeMV.FogEffects.needRefresh = true; // Will trigger re-evaluation based on fogInMap
        } else if (this._spriteset && GabeMV.FogEffects.fogInMap && ConfigManager.fogEffects) {
            // If no foglayer exists but should, recreate.
            // This is handled by Spriteset_Base.createUpperLayer logic on spriteset creation.
            // A simpler way is just to ensure createUpperLayer is robust.
        }
    };

    const _Scene_Battle_start = Scene_Battle.prototype.start;
    Scene_Battle.prototype.start = function() {
        _Scene_Battle_start.call(this);
        if (this._spriteset && this._spriteset._fogLayer) {
            GabeMV.FogEffects.needRefresh = true;
        }
    };


    //-----------------------------------------------------------------------------
    // Window_Options
    //-----------------------------------------------------------------------------
    const _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function () {
        _Window_Options_addGeneralOptions.call(this);
        if (GabeMV.FogEffects.commandEnabled) {
            this.addCommand(GabeMV.FogEffects.commandName, "fogEffects");
        }
    };

    // Make sure to handle the status text for the new option
    const _Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (symbol === "fogEffects") {
            return ConfigManager.fogEffects ? "ON" : "OFF";
        }
        return _Window_Options_statusText.call(this, index);
    };

    // Process OK for the new option
    const _Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === "fogEffects") {
            ConfigManager.fogEffects = !ConfigManager.fogEffects;
            this.redrawItem(index);
            SoundManager.playCursor();
            // When toggling fog effects in options, maps should reflect this immediately
            if (SceneManager._scene instanceof Scene_Map && SceneManager._scene._spriteset) {
                 const spriteset = SceneManager._scene._spriteset;
                 if (!ConfigManager.fogEffects && spriteset._fogLayer) {
                     if (spriteset._tilemap && spriteset._tilemap.children.includes(spriteset._fogLayer)) {
                         spriteset._tilemap.removeChild(spriteset._fogLayer);
                     } else if (spriteset.children.includes(spriteset._fogLayer)) {
                         spriteset.removeChild(spriteset._fogLayer);
                     }
                     spriteset._fogLayer = null;
                 } else if (ConfigManager.fogEffects && !spriteset._fogLayer && GabeMV.FogEffects.fogInMap) {
                     // Re-create if it was off and now turned on
                     // This is tricky, better to just refresh the spriteset or specific layer.
                     // The createUpperLayer logic should handle this if spriteset is re-initialized or updated.
                     // For now, let's rely on re-entering map or a command. A full refresh might be too much here.
                     // For simplicity, this could set needRefresh.
                     GabeMV.FogEffects.needRefresh = true; // May need more robust handling
                 }
            }
            return;
        }
        _Window_Options_processOk.call(this);
    };


    //-----------------------------------------------------------------------------
    // ConfigManager
    //-----------------------------------------------------------------------------
    ConfigManager.fogEffects = true; // Default value

    const _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function () {
        const config = _ConfigManager_makeData.call(this);
        config.fogEffects = this.fogEffects;
        return config;
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        _ConfigManager_applyData.call(this, config);
        this.fogEffects = this.readFlag(config, "fogEffects", true);
    };

})();