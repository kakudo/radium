//=============================================================================
// RDM_DispActionOrderResult.js
//=============================================================================

var Imported = Imported || {};
Imported.RDM_DispActionOrderResult = true;

var Radium = Radium || {};
Radium.DAO = Radium.DAO || {};
Radium.DAO.version = 1.00;

//=============================================================================
 /*:
 * @plugindesc v1.00 行動後順番可視化
 * @author Radian Kakudo
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * スキル選択時に行動後の順番が見えるようになります。
 * 同時、行動順アイコン上に待機時間を表示します。
 * YEP_X_BattleSysCTB.js が導入されていることが前提。
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.00:
 * - 初版
 */
//=============================================================================

Radium.DAO.Window_CTBIcon_updateRedraw = Window_CTBIcon.prototype.updateRedraw;
Window_CTBIcon.prototype.updateRedraw = function() {
	if (!this._speed || this._speed != this._battler._ctbSpeed) {
		this._speed = this._battler._ctbSpeed;
		this._redraw = true;
	}
	Radium.DAO.Window_CTBIcon_updateRedraw.call(this);
	var size = 30;
	var width = this.iconWidth() - size + 4;
	var height = this.iconHeight() - size + 4;
	this.drawText(Math.round(this._battler._ctbSpeed/1000), width, height, 30, "right");
}

