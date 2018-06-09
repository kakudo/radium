//=============================================================================
// RDM_MultiTarget.js
//=============================================================================

var Imported = Imported || {};
Imported.RDM_MultiTarget = true;

var Radium = Radium || {};
Radium.MT = Radium.MT || {};
Radium.MT.version = 1.00;

//=============================================================================
 /*:
 * @plugindesc v1.00 敵選択を複数化できるようにします。
 * @author Radian Kakudo
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * このプラグインはターゲット選択時に複数（重複可能）の対象を指定することを可能にします。
 *
 * ============================================================================
 * Battle Messages
 * ============================================================================
 *
 * Skill and Item Notetags:
 *
 *   <MultiTarget: x>
 *   x体を対象とします。記載しなかった場合は1体になります。
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * Version 1.00:
 * - 初版
 */
//=============================================================================

//=============================================================================
// DataManager
//=============================================================================

Radium.MT.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
  if (!Radium.MT.DataManager_isDatabaseLoaded.call(this)) return false;
  if (!Radium._loaded_RDM_MultiTarget) {
    this.processGetNoteTargetNum($dataSkills);
    this.processGetNoteTargetNum($dataItems);
    Radium._loaded_RDM_MultiTarget = true;
  }
  return true;
};

DataManager.processGetNoteTargetNum = function(group) {
  var noteMt = /<(?:MultiTarget):[ ](\d+)>/i;
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    obj.targetNum = 1;
    var notedata = obj.note.split(/[\r\n]+/);
    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(noteMt)) {
        obj.targetNum = parseInt(RegExp.$1);
      }
    }
  }
};

//=============================================================================
// Game_Action
//=============================================================================

Radium.MT.Game_Action_initialize = Game_Action.prototype.initialize;
Game_Action.prototype.initialize = function(subject, forcing) {
  this._multiTargets = [];
  this._selectedNum = 0;
  Radium.MT.Game_Action_initialize.call(this, subject, forcing);
};

Radium.MT.Game_Action_targetsForFriends = Game_Action.prototype.targetsForFriends;
Game_Action.prototype.targetsForFriends = function() {
  if (this._multiTargets != null && this._multiTargets.length > 1) {
    var targets = [];
    var unit = this.friendsUnit();
    for (i=0; i<this._multiTargets.length; i++) {
      targets.push(unit.smoothTarget(this._multiTargets[i]));
    }
    return targets;
  }
  return Radium.MT.Game_Action_targetsForFriends.call(this);
};

Radium.MT.Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
Game_Action.prototype.targetsForOpponents = function() {
  if (this._multiTargets != null && this._multiTargets.length > 1) {
    var targets = [];
    var unit = this.opponentsUnit();
    for (i=0; i<this._multiTargets.length; i++) {
      targets.push(unit.smoothTarget(this._multiTargets[i]));
    }
    return targets;
  }
  return Radium.MT.Game_Action_targetsForOpponents.call(this);
};

Game_Action.prototype.addTarget = function(targetIndex) {
  this._multiTargets.push(targetIndex);
};

Game_Action.prototype.clearTarget = function(targetIndex) {
  this._multiTargets = [];
};

//=============================================================================
// Scene_Battle
//=============================================================================

Radium.MT.Scene_Battle_onActorOk = Scene_Battle.prototype.onActorOk;
Scene_Battle.prototype.onActorOk = function() {
  var action = BattleManager.inputtingAction();
  var tIndex = this._actorWindow.index();
  action.addTarget(tIndex);
  action._selectedNum += 1;
  var targetNum = action._item.object().targetNum;
  if (targetNum <= action._selectedNum) {
    Radium.MT.Scene_Battle_onActorOk.call(this);
    this._multiSelectTargetWindow.hide();
  } else {
    var rebuildIndex = this._enemyWindow.index();
    this._actorWindow.refresh();
    this._actorWindow.show();
    this._actorWindow.select(rebuildIndex);
    this._actorWindow.activate();
    this.RDM_refreshMultiTargetWindow(action);
  }
};

Radium.MT.Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
Scene_Battle.prototype.onEnemyOk = function() {
  var action = BattleManager.inputtingAction();
  var tIndex = this._enemyWindow.enemyIndex();
  action.addTarget(tIndex);
  action._selectedNum += 1;
  var targetNum = action._item.object().targetNum;
  if (targetNum <= action._selectedNum) {
    Radium.MT.Scene_Battle_onEnemyOk.call(this);
    this._multiSelectTargetWindow.hide();
  } else {
    var rebuildIndex = this._enemyWindow.index();
    this._enemyWindow.refresh();
    this._enemyWindow.show();
    this._enemyWindow.select(rebuildIndex);
    this._enemyWindow.activate();
    this.RDM_refreshMultiTargetWindow(action);
  }
};

Radium.MT.Scene_Battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
Scene_Battle.prototype.onActorCancel = function() {
  Radium.MT.Scene_Battle_onActorCancel.call(this);
  this._multiSelectTargetWindow.hide();
};

Radium.MT.Scene_Battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
Scene_Battle.prototype.onEnemyCancel = function() {
  Radium.MT.Scene_Battle_onEnemyCancel.call(this);
  this._multiSelectTargetWindow.hide();
};

Radium.MT.Scene_Battle_selectActorSelection = Scene_Battle.prototype.selectActorSelection;
Scene_Battle.prototype.selectActorSelection = function() {
  Radium.MT.Scene_Battle_selectActorSelection.call(this);
  this.RDM_createMultiTargetWindow();
};

Radium.MT.Scene_Battle_selectEnemySelection = Scene_Battle.prototype.selectEnemySelection;
Scene_Battle.prototype.selectEnemySelection = function() {
  Radium.MT.Scene_Battle_selectEnemySelection.call(this);
  this.RDM_createMultiTargetWindow();
};

Scene_Battle.prototype.RDM_createMultiTargetWindow = function() {
  var wy = 300;
  var ww = 150;
  var wh = 70;
  var wx = 1000 - ww;
  this._multiSelectTargetWindow = new Window_Base(wx, wy, ww, wh);
  var action = BattleManager.inputtingAction();
  action.clearTarget();
  action._selectedNum = 0;
  this.RDM_refreshMultiTargetWindow(action);
  this.addWindow(this._multiSelectTargetWindow);
};

Scene_Battle.prototype.RDM_refreshMultiTargetWindow = function(action) {
  var targetNum = action._item.object().targetNum;
  this._multiSelectTargetWindow.contents.clear();
  this._multiSelectTargetWindow.drawText(action._selectedNum + " / " + targetNum, 0, 0, 100, "right");
};
//=============================================================================
// End of File
//=============================================================================
