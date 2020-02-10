//=============================================================================
// RDM_SvgToSprite.js
//=============================================================================

var Imported = Imported || {};
Imported.RDM_SvgToSprite = true;

var Radium = Radium || {};
Radium.S2S = Radium.S2S || {};
Radium.S2S.version = 1.00;

//=============================================================================
 /*:
 * @plugindesc v1.00 SVG To Sprite
 * @author 角度ゆいえ(Radian)
 * 
 * @param SVGs
 * @text SVGファイルリスト
 * @desc 使用するSVGファイルのリストをカンマ区切りで入力します。
 * @default sample1, sample2
 * 
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * SVGファイルをSprite化し、画面上に表示します。
 * プロジェクトファイルのあるフォルダにsvgフォルダを作成し、SVGファイルを入れてください。
 * SVGファイルは、path要素とcircle要素のみを変換します。text要素は変換されませんので
 * ご留意願います。
 * 
 * プラグインコマンド詳細
 *  イベントコマンド「プラグインコマンド」から実行。
 *  （パラメータの間は半角スペースで区切る）
 *
 * S2S_SHOW sample 1000 1000 rgb(0,0,0) 1 100 50 2 3 4 5 0.6 0.7 0.8 0.9
 * #sample.svgファイルのSVGを(1000,1000)のcanvasに表示する。(色はrgb(0,0,0)で線の太さは1px)
 *  100カウント後から50カウントかけてx:2, y:3の位置から
 *  x:4, y:5の位置までx縮尺:0.6, y縮尺:0.7からx縮尺:0.8, y縮尺:0.9まで拡大しつつ表示する。
 * 
 * S2S_ERASE 100 50 2 3 4 5 0.6 0.7 0.8 0.9
 * #先行して表示したスプライトを使い、100カウント後から50カウントかけてx:2, y:3の位置から
 *  x:4, y:5の位置までx縮尺:0.6, y縮尺:0.7からx縮尺:0.8, y縮尺:0.9まで拡大しつつ消去する。
 * 
 *
 * 利用規約：
 * クレジットやご連絡無しでの商用のご利用、改変、再配布ともに自由に行っていただいてOKです。
 * ただし、説明文は削除しないようよろしくお願いいたします。
 * 
 * Radianは当プラグインの修正は承っておりません。ご了承ください。
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.00:
 * - 初版
 */
//=============================================================================
(function() {
  'use strict';

  var parameters = PluginManager.parameters('RDM_SvgToSprite');
  var svgs = String(parameters['SVGs'] || '').split(",");

  var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'S2S_SHOW') {
            this.execShowSvg(args);
        } else if (command === 'S2S_ERASE') {
          this.execEraseSvg(args);
      }
    };
    DataManager.loadRdmSvgFile = function() {
      DataManager._svgData = new Map();
      svgs.forEach(f => {
        var xhr = new XMLHttpRequest();
        var url = 'svg/' + f.trim() + ".svg";
        xhr.open('GET', url);
        xhr.overrideMimeType('text/xml');
        xhr.onload = function() {
            if (xhr.status < 400) {
              DataManager._svgData.set(f.trim(), xhr.responseText);
            }
            xhr.onerror = this._mapLoader || function() {
                DataManager._errorUrl = DataManager._errorUrl || url;
            };
        };
        xhr.send();  
      });
    };

    var _Scene_Boot_prototype_create = Scene_Boot.prototype.create;
    Scene_Boot.prototype.create = function() {
      _Scene_Boot_prototype_create.call(this);
      DataManager.loadRdmSvgFile();
    };
    Game_Interpreter.prototype.execShowSvg = function(args) {
      var scene = SceneManager._scene;
      var sp_set = scene._spriteset;
      var oParser = new DOMParser();
      var oDOM = oParser.parseFromString(DataManager._svgData.get(args[0]), "text/xml");
      var tags = oDOM.documentElement.getElementsByTagName("path");
      var sprite = new Sprite();
      for (var i=0; i<tags.length; i++) {
        console.log(tags[i].getAttribute("d"))
        var sp = new Sprite(new Bitmap(parseInt(args[1]),parseInt(args[2])));
        var ctx = sp.bitmap.context;
        var p = new Path2D(tags[i].getAttribute("d"));
        ctx.strokeStyle = args[3];
        ctx.lineWidth = parseInt(args[4]);
        ctx.stroke(p);
        sprite.addChild(sp);
      }
      var tagsCircle = oDOM.documentElement.getElementsByTagName("circle");
      for (var j=0; j<tagsCircle.length; j++) {
        var sp = new Sprite(new Bitmap(parseInt(args[1]),parseInt(args[2])));
        var ctx = sp.bitmap.context;
        var x = tagsCircle[j].getAttribute("cx");
        var y = tagsCircle[j].getAttribute("cy");
        var r = tagsCircle[j].getAttribute("r");
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.strokeStyle = args[3];
        ctx.lineWidth = parseInt(args[4]);
        ctx.stroke();
        sprite.addChild(sp);
      }
      sprite._SmaxDur = parseInt(args[6]);
      sprite._Sdur = parseInt(args[6]);
      sprite._Six = parseInt(args[7]);
      sprite._Siy = parseInt(args[8]);
      sprite._Sfx = parseInt(args[9]);
      sprite._Sfy = parseInt(args[10]);
      sprite._Siscalex = parseFloat(args[11]);
      sprite._Siscaley = parseFloat(args[12]);
      sprite._Sfscalex = parseFloat(args[13]);
      sprite._Sfscaley = parseFloat(args[14]);
      sprite.x = parseInt(args[7]);
      sprite.y = parseInt(args[8]);
      sprite.scale.x = parseFloat(args[11]);
      sprite.scale.y = parseFloat(args[12]);
      sprite._Sinittime = parseInt(args[5]);
      sprite.opacity = 0;
      sp_set.addChild(sprite);
      if (!sp_set._moveMagicCircleStaySprite) {
        sp_set._moveMagicCircleStaySprite = [sprite];
      } else {
        sp_set._moveMagicCircleStaySprite.push(sprite);
      }

    };
    Game_Interpreter.prototype.execEraseSvg = function(args) {
      var scene = SceneManager._scene;
      var sp_set = scene._spriteset;
      if (!sp_set._moveMagicCircleStaySprite || sp_set._moveMagicCircleStaySprite.length <= 0) return;
      var sprite = sp_set._moveMagicCircleStaySprite[0];
      sprite._DdisDur = parseInt(args[1]);
      sprite._Ddur = parseInt(args[1]);
      sprite._Dix = parseInt(args[2]);
      sprite._Diy = parseInt(args[3]);
      sprite._Dfx = parseInt(args[4]);
      sprite._Dfy = parseInt(args[5]);
      sprite._Discalex = parseFloat(args[6]);
      sprite._Discaley = parseFloat(args[7]);
      sprite._Dfscalex = parseFloat(args[8]);
      sprite._Dfscaley = parseFloat(args[9]);
      sprite._Dinittime = parseInt(args[0]);
      sprite._targetBaseSprite = sp_set;
      if (!sp_set._moveMagicCircleDisposeSprite) {
        sp_set._moveMagicCircleDisposeSprite = [sprite];
      } else {
        sp_set._moveMagicCircleDisposeSprite.push(sprite);
      }
    };

    var _Spriteset_Base_prototype_update = Spriteset_Base.prototype.update;
    Spriteset_Base.prototype.update = function() {
      _Spriteset_Base_prototype_update.call(this);
      this.updateMoveMagicCircleStaySprite();
    	this.updateMoveMagicCircleDisposeSprite();
    };
    Spriteset_Base.prototype.updateMoveMagicCircleStaySprite = function() {
      if (this._moveMagicCircleStaySprite) {
        for (var i=0; i<this._moveMagicCircleStaySprite.length; i++) {
          var sp = this._moveMagicCircleStaySprite[i];
          if (sp != null) {
            if (sp._Sinittime > 0) {
              sp._Sinittime--;
              continue;
            }
            var dur = sp._Sdur;
            if (dur <= 0) {
              this._moveMagicCircleStaySprite[i] = null;
              continue;	
            }
            var time = sp._SmaxDur - dur;
            sp.opacity = 255 / sp._SmaxDur * time;
            sp.scale.x = (sp._Sfscalex * time + sp._Siscalex * (sp._SmaxDur-time)) / (sp._SmaxDur);
            sp.scale.y = (sp._Sfscaley * time + sp._Siscaley * (sp._SmaxDur-time)) / (sp._SmaxDur);
            sp.x = (sp._Sfx * time + sp._Six * (sp._SmaxDur-time)) / (sp._SmaxDur);
            sp.y = (sp._Sfy * time + sp._Siy * (sp._SmaxDur-time)) / (sp._SmaxDur);	
            sp._Sdur--;
          }
        }
        this._moveMagicCircleStaySprite = this._moveMagicCircleStaySprite.filter(ms => ms);
      }
    };
    Spriteset_Base.prototype.updateMoveMagicCircleDisposeSprite = function() {
      if (this._moveMagicCircleDisposeSprite) {
        for (var i=0; i<this._moveMagicCircleDisposeSprite.length; i++) {
          var sp = this._moveMagicCircleDisposeSprite[i];
          if (sp != null) {
            if (sp._Dinittime > 0) {
              sp._Dinittime--;
              continue;
            }
            var dur = sp._Ddur;
            if (dur <= 0) {
              var tbs = sp._targetBaseSprite;
              tbs.removeChild(sp);
              this._moveMagicCircleDisposeSprite[i] = null;
              continue;	
            }
            var time = sp._DdisDur - dur;
            sp.opacity = 255 - time / sp._DdisDur * 255;
            sp.scale.x = (sp._Dfscalex * time + sp._Discalex * (sp._DdisDur-time)) / (sp._DdisDur);
            sp.scale.y = (sp._Dfscaley * time + sp._Discaley * (sp._DdisDur-time)) / (sp._DdisDur);
            sp.x = (sp._Dfx * time + sp._Dix * (sp._DdisDur-time)) / (sp._DdisDur);
            sp.y = (sp._Dfy * time + sp._Diy * (sp._DdisDur-time)) / (sp._DdisDur);	
            sp._Ddur--;
          }
        }
        this._moveMagicCircleDisposeSprite = this._moveMagicCircleDisposeSprite.filter(ms => ms);
      }
    };
})();

