//=============================================================================
// Nebula Team Plugins - Visual Move Route Utility
// NE_VisualMoveRoute.js    VERSION 1.00
//=============================================================================

var Imported = Imported || {};
Imported.NE_VisualMoveRoute = true;

var Nebula = Nebula || {};
Nebula.VisualMoveRoute = Nebula.VisualMoveRoute || {};

//=============================================================================
 /*:
 * @plugindesc v1.00 Visual Move Route Utility for Rpg Maker MV;
 * @author Nebula Games
 * @help
 * CHANGELOG:
 * VERSION 1.00: Plugin Released!
 *
 * This plugin is an useful development tool for making move routes visually. 
 * You have only to activate the plugin and to press the "TAB" key to open the 
 * edit mode. 
 * A grid will be created where you can set your move route.
 *
 * You can select each tile using the Left Mouse Button. They will be numbered 
 * in relation to the selection showing the flow of the move route. 
 * Only the starting position will have a different color and It's not count 
 * in the actual route movement.
 *
 * You can use arrow keys to move the map pivot to surf bigger map than your 
 * screen size to test your move route where you want!
 *
 * Pressing "Cancel" (X Key or the Key you have set) you can open the result window.
 * The result can be shown in two formats: 
 *
 * - DEFAULT RPG MAKER MV FORMAT
 * - YANFLY MOVE ROUTE CORE FORMAT
 *
 * You can switch between the two format using the "OK" Key Button. 
 * You can close the result window and return to edit mode pressing again the "Cancel"
 * button.
 *
 * You can close the Visual Move Route mode pressing again "TAB";
 */
 //=============================================================================


(function($) {

	var Parameters = PluginManager.parameters('NE_VisualMoveRoute'); 
	//$.tile_size = JSON.parse(Parameters['Tile Size']).map(Number);

	$.tile_size = [48,48];
	$.route_mode = false;
	$.visual_route = null;
	$.square_texture = null;
	$.map_offset = [0,0];

	(function(_) {
		var gg = new PIXI.Graphics(); 
		gg.beginFill(0xff0000, 0.7); 
		gg.lineStyle(0.8, 0x000000)
		gg.drawRect(0,0,$.tile_size[0], $.tile_size[1]); 
		gg.endFill() 
		var wait_graphic = setTimeout(function exec() {
			if(!Graphics._renderer) return setTimeout(exec, 1);
			_.square_texture = Graphics._renderer.generateTexture(gg);
			return;
		}, 1)		
	})($);

	$.update_map_offset = function(e) {
		e.preventDefault();
		if($.win_result && $.win_result.visible) return;
		switch(e.key) {
			case 'ArrowLeft':
				if($gameMap.displayX() + $.map_offset[0] < 0) {
					return;
					break;
				}
				SoundManager.playCursor();
				return $.map_offset[0]--;
				break;
			case 'ArrowRight':
				if($gameMap.displayX() + $.map_offset[0] > $gameMap.width()) {
					return;
					break;
				}
				SoundManager.playCursor();
				return $.map_offset[0]++;
				break;
			case 'ArrowUp':
				if($gameMap.displayY() + $.map_offset[1] < 0) {
					return;
					break;
				}
				SoundManager.playCursor();
				return $.map_offset[1]--;
				break;
			case 'ArrowDown':
				if($gameMap.displayY() + $.map_offset[1] > $gameMap.height()) {
					return;
					break;
				}
				SoundManager.playCursor();
				return $.map_offset[1]++;
				break;
		}
	} 

	$.startVisualMoveRoute = function() {
		if(!(SceneManager._scene instanceof Scene_Map)) return; 
		if($.route_mode) {
			$.visual_route.parent.removeChild($.visual_route); 
			$.visual_route = null;
			document.body.removeEventListener('keydown', $.update_map_offset)
			if($.win_result) {
				$.win_result.deactivate()
				$.win_result.hide()
				$.win_result.parent.removeChild($.win_result)
			}
			return $.route_mode = false;
		}
		var scene = SceneManager._scene; 
		$.route_mode = true;
		$.map_offset = [0,0];
		document.body.addEventListener('keydown', $.update_map_offset)
		$.visual_route = new Sprite(); 
		$.visual_route.update = null;
		var map_width = $gameMap.width(); 
		var map_height = $gameMap.height(); 
		for(var y = 0; y < map_height; y++) {
			for(var x = 0; x < map_width; x++) {
				var tile = new Sprite();
				tile.texture = $.square_texture.clone(); 
				tile.coord = [x, y];
				tile.interactive = true; 
				tile.selected = false; 
				tile.cacheAsBitmap = true;
				tile.text = new PIXI.Text('');
				tile.text.style.fill = 'white';
				tile.text.style.fontFamily = 'GameFont';
				tile.text.fontSize = 18; 
				tile.text.stroke = 'rgba(0,0,0,0.5)';
				tile.text.strokeThickness = 3;
				tile.text.anchor.set(0.5);
				tile.text.position.set(tile.texture.width / 2, tile.texture.height / 2);
				tile.addChild(tile.text)
				tile.matrix = new PIXI.filters.ColorMatrixFilter(); 
				tile._filters = [tile.matrix];
				tile.position.set($.tile_size[0] * x, $.tile_size[1] * y);
				tile.update = null;
				tile.on('pointerdown', function() {
					if($.win_result.visible) return;
					var last = $.last_selection(); 
					if(this.selected) {
						if(last) {
							var last_coord = JSON.stringify(last.coord);
							var this_coord = JSON.stringify(this.coord);
							if(last_coord !== this_coord) return;
						}
						SoundManager.playCancel();
						this.cacheAsBitmap = false;
						this.selected = 0; 
						this.text.text = '';
						this.matrix.reset(); 
						this.cacheAsBitmap = true;
						return;
					}
					if(last) {
						var difference_x = Math.abs(last.coord[0] - this.coord[0]);
						var difference_y = Math.abs(last.coord[1] - this.coord[1]); 
						if(difference_y > 1 || difference_x > 1) return; 
					}
					SoundManager.playCursor();
					var select = last ? last.selected + 1 : 1;
					this.selected = select; 
					this.cacheAsBitmap = false;
					this.text.text = String(select);
					var color = last ? 90 : 180;
					this.matrix.hue(color, true); 
					this.cacheAsBitmap = true;
					return;
				}.bind(tile))
				$.visual_route.addChild(tile);
			}
		}
		$.win_result = new Window_Selectable(Graphics.boxWidth / 2 - Graphics.boxWidth / 8, Graphics.boxHeight / 2 - Graphics.boxHeight / 4, Graphics.boxWidth / 4, Graphics.boxHeight / 2);
		$.win_result.itemWidth = function() { return this.contents.width};
		$.win_result.itemHeight = function() {return this.lineHeight()};
		$.win_result.data = []; 
		$.win_result.type = 0;
		$.win_result.visible = false;
		$.win_result.maxItems = function() {
			var data = !this.type ? this.data['default'] : this.data['yanfly_mode'];
			if(!data) return 1;
			return data.length;
		}
		$.win_result.drawItem = function(index) {
			var rect = this.itemRect(index); 
			var data = !this.type ? this.data['default'] : this.data['yanfly_mode'];
			this.drawText(data[index], rect.x, rect.y, rect.width, 'center'); 
		}
		var old_refresh = $.win_result.refresh 
		$.win_result.refresh = function(is_switch) {
			if(!is_switch) this.data = $.calculate_move_route()
			if(is_switch) this.type = !this.type ? 1 : 0;
			return old_refresh.call(this)
		}
		$.win_result.setHandler('ok', function() {
			if(!$.win_result.visible) return $.win_result.activate();
			$.win_result.refresh(true);
			$.win_result.select(0);
			$.win_result.activate();
		})
		$.win_result.setHandler('cancel', function() {
			if($.win_result.visible) {
				$.win_result.visible = false;
				return $.win_result.activate();
			}
			else {
				SoundManager.playOk()
				$.win_result.refresh()
				$.win_result.select(0)
				$.win_result.activate();
				return $.win_result.visible = true;
			}
		})
		$.win_result.activate()
		scene.addChild($.visual_route);
		scene.addChild($.win_result);
	}

	$.selected_tiles = function() {
		if(!$.visual_route) return []; 
		return $.visual_route.children.filter(function(child) { return child.selected})
	}

	$.last_selection = function() {
		var tiles = $.selected_tiles();
		tiles.sort(function(a,b) {return a.selected - b.selected})
		return tiles[tiles.length - 1];
	}

	$.calculate_move_route = function() {
		var tiles = $.selected_tiles();
		tiles.sort(function(a,b) {return a.selected - b.selected});
		var result = {
			default: [],
			yanfly_mode: []
		}
		for(var i = 1; i < tiles.length; i++) {
			var tile = tiles[i]; 
			var prev = tiles[i - 1];
			var diff_x = prev.coord[0] - tile.coord[0];
			var diff_y = prev.coord[1] - tile.coord[1]; 
			if(diff_x < 0 && diff_y === 0) {
				result.default.push('right');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('RIGHT') && !yy[yy.length - 1].contains('LOWER') && !yy[yy.length - 1].contains('UPPER')) {
					var match = yy[yy.length - 1].match(/RIGHT:\s*(.*)/);
					yy[yy.length - 1] = 'RIGHT: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('RIGHT: 1');
			}	
			else if(diff_x > 0 && diff_y === 0) {
				result.default.push('left');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('LEFT') && !yy[yy.length - 1].contains('LOWER') && !yy[yy.length - 1].contains('UPPER')) {
					var match = yy[yy.length - 1].match(/LEFT:\s*(.*)/);
					yy[yy.length - 1] = 'LEFT: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('LEFT: 1');
			}	
			else if(diff_x === 0 && diff_y < 0) {
				result.default.push('down');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('DOWN')) {
					var match = yy[yy.length - 1].match(/DOWN:\s*(.*)/);
					yy[yy.length - 1] = 'DOWN: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('DOWN: 1');
			}	
			else if(diff_x === 0 && diff_y > 0) {
				result.default.push('up');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('UP')) {
					var match = yy[yy.length - 1].match(/UP:\s*(.*)/);
					yy[yy.length - 1] = 'UP: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('UP: 1');
			}	
			else if(diff_x > 0 && diff_y < 0) {
				result.default.push('lower-left');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('LOWER LEFT')) {
					var match = yy[yy.length - 1].match(/LOWER LEFT:\s*(.*)/);
					yy[yy.length - 1] = 'LOWER LEFT: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('LOWER LEFT: 1');
			}		
			else if(diff_x < 0 && diff_y < 0) {
				result.default.push('lower-right');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('LOWER RIGHT')) {
					var match = yy[yy.length - 1].match(/LOWER RIGHT:\s*(.*)/);
					yy[yy.length - 1] = 'LOWER RIGHT: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('LOWER RIGHT: 1');
			}
			else if(diff_x > 0 && diff_y > 0) {
				result.default.push('upper-left');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('UPPER LEFT')) {
					var match = yy[yy.length - 1].match(/UPPER LEFT:\s*(.*)/);
					yy[yy.length - 1] = 'UPPER LEFT: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('UPPER LEFT: 1');
			}		
			else if(diff_x < 0 && diff_y > 0) {
				result.default.push('upper-right');
				var yy = result.yanfly_mode; 
				if(yy.length > 0 && yy[yy.length - 1].contains('UPPER RIGHT')) {
					var match = yy[yy.length - 1].match(/UPPER RIGHT:\s*(.*)/);
					yy[yy.length - 1] = 'UPPER RIGHT: ' + String(parseInt(match[1]) + 1);
				}
				else yy.push('UPPER RIGHT: 1');
			}			
		}
		return result;
	}

    //###############################################################################
    //
    // GRAPHICS --> FIX FOR PIXI INTERACTIVE API
    //
    //###############################################################################

    $.GraphicsChanges = {
        modeBox: Graphics._createModeBox,
        video: Graphics._updateVideo,
        upperCanvas: Graphics._createUpperCanvas,
        errorPrinter: Graphics._createErrorPrinter
    }

    Graphics._createModeBox = function() {
        $.GraphicsChanges['modeBox'].call(this)
        this._modeBox.style.pointerEvents = 'none';
    };

    Graphics._updateVideo = function() {
        $.GraphicsChanges['video'].call(this)
        this._video.style.pointerEvents = 'none';
    };

    Graphics._createUpperCanvas = function() {
        $.GraphicsChanges['upperCanvas'].call(this)
        this._upperCanvas.style.pointerEvents = 'none';
    };

    Graphics._createErrorPrinter = function() {
    	$.GraphicsChanges['errorPrinter'].call(this)
    	this._errorPrinter.style.pointerEvents = 'none';
    }

    //###############################################################################
    //
    // GAME MAP
    //
    //###############################################################################

    $.oldGameMapIsEventRunning = Game_Map.prototype.isEventRunning 
    Game_Map.prototype.isEventRunning = function() {
    	return $.oldGameMapIsEventRunning.call(this) || $.route_mode; 
    }

    //###############################################################################
    //
    // SPRITESET MAP
    //
    //###############################################################################

    $.oldSpritesetMapUpdateTilemap = Spriteset_Map.prototype.updateTilemap
	Spriteset_Map.prototype.updateTilemap = function() {
		if(!$.route_mode) return $.oldSpritesetMapUpdateTilemap.call(this);
	    this._tilemap.origin.x = ($gameMap.displayX() + $.map_offset[0]) * $gameMap.tileWidth();
	    this._tilemap.origin.y = ($gameMap.displayY() + $.map_offset[1]) * $gameMap.tileHeight();
	    $.visual_route.pivot.set(this._tilemap.origin.x, this._tilemap.origin.y);
	};

    //###############################################################################
    //
    // GRAPHICS
    //
    //###############################################################################

    $.oldGraphicsOnKeyDown = Graphics._onKeyDown;
	Graphics._onKeyDown = function(event) {
	    if (!event.ctrlKey && !event.altKey) {
	        switch (event.keyCode) {
	        case 9:   // F2
	            event.preventDefault();
	            SoundManager.playCursor();
	            $.startVisualMoveRoute();
	            break;
	        default:
	        	return $.oldGraphicsOnKeyDown.call(this, event);
	        	break;
	        }
	    }
	};

})(Nebula.VisualMoveRoute)
