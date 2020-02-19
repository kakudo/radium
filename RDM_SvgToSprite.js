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
 * @desc 使用するSVGファイルのリストをカンマ区切りで入力します。拡張子.svgは不要です。
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
 * S2S_SHOW sample rgb(0,0,0) 1 100 50 2 3 4 5 0.6 0.7 0.8 0.9 center
 * #sample.svgファイルのSVGを表示する。(色はrgb(0,0,0)で線の太さは1px)
 *  100カウント後から50カウントかけてx:2, y:3の位置から
 *  x:4, y:5の位置までx縮尺:0.6, y縮尺:0.7からx縮尺:0.8, y縮尺:0.9まで拡大しつつ表示する。
 *  SVGの中心を表示中心にする場合は最後にcenterを指定する。
 * 
 * S2S_ERASE 100 50 2 3 4 5 0.6 0.7 0.8 0.9 center
 * #先行して表示したスプライトを使い、100カウント後から50カウントかけてx:2, y:3の位置から
 *  x:4, y:5の位置までx縮尺:0.6, y縮尺:0.7からx縮尺:0.8, y縮尺:0.9まで拡大しつつ消去する。
 *  SVGの中心を表示中心にする場合は最後にcenterを指定する。
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
    Game_Interpreter.prototype.isFillthenFillCtx = function(tag, ctx, color) {
      var st = tag.getAttribute("style");
      if (st && st.startsWith("fill")) {
        ctx.fillStyle = color;
        ctx.fill(p);
      } else {
        st = tag.getAttribute("fill");
        if (st && st !== "none") {
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    };
    Game_Interpreter.prototype.execShowSvg = function(args) {
      var scene = SceneManager._scene;
      var sp_set = scene._spriteset;
      var oParser = new DOMParser();
      var oDOM = oParser.parseFromString(DataManager._svgData.get(args[0]), "text/xml");
      var sprite = new Sprite();
      if (oDOM.documentElement.tagName === "svg" && oDOM.documentElement.getAttribute("viewBox")) {
        var width = parseInt(oDOM.documentElement.getAttribute("width").replace("px",""));
        var height = parseInt(oDOM.documentElement.getAttribute("height").replace("px",""));
      } else {
        var tagsSvg = oDOM.documentElement.getElementsByTagName("svg");
        for (var k=0; k<tagsSvg.length; k++) {
          var v = tagsSvg[k].getAttribute("viewBox");
          if (!v) continue;
          var width = parseInt(tagsSvg[k].getAttribute("width").replace("px",""));
          var height = parseInt(tagsSvg[k].getAttribute("height").replace("px",""));
        }
      }
      var tags = oDOM.documentElement.getElementsByTagName("path");
      //for (var i=0; i<tags.length; i++) {
        var spPath = new Sprite(new Bitmap(width,height));
        var ctx = spPath.bitmap.context;
        for (var i=0; i<tags.length; i++) {
          var p = new Path2D(tags[i].getAttribute("d"));
          ctx.strokeStyle = args[1];
          ctx.lineWidth = parseInt(args[2]);
          ctx.stroke(p);
          this.isFillthenFillCtx(tags[i], ctx, args[1]);
        }
        sprite.addChild(spPath);
      //}
      var tagsCircle = oDOM.documentElement.getElementsByTagName("circle");
      var spCircle = new Sprite(new Bitmap(width,height));
      var ctx = spCircle.bitmap.context;
      for (var j=0; j<tagsCircle.length; j++) {
        var x = tagsCircle[j].getAttribute("cx");
        var y = tagsCircle[j].getAttribute("cy");
        var r = tagsCircle[j].getAttribute("r");
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.strokeStyle = args[1];
        ctx.lineWidth = parseInt(args[2]);
        ctx.stroke();
        this.isFillthenFillCtx(tagsCircle[j], ctx, args[1]);
      }
      sprite.addChild(spCircle);

      var tagsPolygon = oDOM.documentElement.getElementsByTagName("polygon");
      var spPolygon = new Sprite(new Bitmap(width,height));
      var ctx = spPolygon.bitmap.context;
      var separatorString = /\s+/;
      for (var j=0; j<tagsPolygon.length; j++) {
        var points = tagsPolygon[j].getAttribute("points");
        if (points != null) {
          ctx.beginPath();
          var arrayStrig = points.split(separatorString);
          arrayStrig.forEach((p,i) => {
            var ps = p.split(",");
            if (i==0) {
              ctx.moveTo(ps[0],ps[1]);
            } else {
              ctx.lineTo(ps[0],ps[1]);
            }
          });
          ctx.closePath();
          ctx.strokeStyle = args[1];
          ctx.lineWidth = parseInt(args[2]);
          ctx.stroke();
          this.isFillthenFillCtx(tagsPolygon[j], ctx, args[1]);
        }
      }
      sprite.addChild(spPolygon);

      var tagsPolyline = oDOM.documentElement.getElementsByTagName("polyline");
      var spPolyline = new Sprite(new Bitmap(width,height));
      var ctx = spPolyline.bitmap.context;
      var separatorString = /\s+/;
      for (var j=0; j<tagsPolyline.length; j++) {
        var points = tagsPolyline[j].getAttribute("points");
        if (points != null) {
          ctx.beginPath();
          var arrayStrig = points.split(separatorString);
          arrayStrig.forEach((p,i) => {
            var ps = p.split(",");
            if (i==0) {
              ctx.moveTo(ps[0],ps[1]);
            } else {
              ctx.lineTo(ps[0],ps[1]);
            }
          });
          ctx.strokeStyle = args[1];
          ctx.lineWidth = parseInt(args[2]);
          ctx.stroke();
          this.isFillthenFillCtx(tagsPolyline[j], ctx, args[1]);
        }
      }
      sprite.addChild(spPolyline);

      if (args.length >=14 && args[13] === "center") {
        var xhose = width / 2;
        var yhose = height / 2;
      } else {
        var xhose = 0;
        var yhose = 0;        
      }
      sprite._SmaxDur = parseInt(args[4]);
      sprite._Sdur = parseInt(args[4]);
      sprite._Six = parseInt(args[5]) - xhose * parseFloat(args[9]);
      sprite._Siy = parseInt(args[6]) - yhose * parseFloat(args[10]);
      sprite._Sfx = parseInt(args[7]) - xhose * parseFloat(args[11]);
      sprite._Sfy = parseInt(args[8]) - yhose * parseFloat(args[12]);
      sprite._Siscalex = parseFloat(args[9]);
      sprite._Siscaley = parseFloat(args[10]);
      sprite._Sfscalex = parseFloat(args[11]);
      sprite._Sfscaley = parseFloat(args[12]);
      sprite.x = parseInt(args[5]) - xhose;
      sprite.y = parseInt(args[6]) - yhose;
      sprite.scale.x = parseFloat(args[9]);
      sprite.scale.y = parseFloat(args[10]);
      sprite._Sinittime = parseInt(args[3]);
      sprite.opacity = 0;
      sprite._xhose = xhose;
      sprite._yhose = yhose;
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
      if (args.length >=11 && args[10] === "center") {
        var xhose = sprite._xhose;
        var yhose = sprite._yhose;
      } else {
        var xhose = 0;
        var yhose = 0;        
      }
      sprite._DdisDur = parseInt(args[1]);
      sprite._Ddur = parseInt(args[1]);
      sprite._Dix = parseInt(args[2]) - xhose * parseFloat(args[6]);
      sprite._Diy = parseInt(args[3]) - yhose * parseFloat(args[7]);
      sprite._Dfx = parseInt(args[4]) - xhose * parseFloat(args[8]);
      sprite._Dfy = parseInt(args[5]) - yhose * parseFloat(args[9]);
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

