//=============================================================================
// RDM_AddValueOfVariablesByCsv.js
//=============================================================================

var Imported = Imported || {};
Imported.RDM_AddValueOfVariablesByCsv = true;

var Radium = Radium || {};
Radium.AVVC = Radium.AVVC || {};
Radium.AVVC.version = 1.00;

//=============================================================================
 /*:
 * @plugindesc v1.00 Add Value of Variables by CSV
 * @author 角度ゆいえ(Radian)
 * 
 * @param CSVs
 * @text CSVファイルリスト
 * @desc 使用するCSVファイルのリストを入力します。拡張子「.csv」は不要です。
 * @default sample1, sample2
 * 
 * @param init_variables
 * @text 初期化対象変数
 * @desc AVVC_INITで0に初期化する変数番号のリストを入力します。
 * @default 1, 2
 * 
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * CSVの内容を参照して、条件に合致する場合は指定の変数番号の値を指定数増減します。
 * プロジェクトファイルのあるフォルダにcsvフォルダを作成し、csvファイルを入れてください。
 * 特定のニコニコIDのユーザに対して、課金プラグインで指定した格納変数の値を
 * 指定件数増やしたい場合などにご利用いただけるかと思います。
 * （AVVC_EXECは加減算のみを行うため、通信を切った状態で何度も呼ぶと変数が壊れます。
 * 　AVVC_INITなどで適切に初期化を行いつつ実施してください）
 * ※この方法だと元の処理と変わってしまうため（元々は通信失敗しても変数に変化なし）、
 * 　JSが使える方のために専用のメソッドも用意しています。
 * 　DataManager.rdmGetCsvAddedVariable(照合する値, 変数番号, CSVファイル名（※全ての場合はnullにする）)
 * 　の戻り値には、指定した変数番号の値にCSVファイルで照合して加算した値が返却されます。
 * 　変数に変更を加えないので、安全に使用することができます。
 * 
 * プラグインコマンド詳細
 *  イベントコマンド「プラグインコマンド」から実行。
 * 
 * CSVファイルは以下のようなフォーマットで作成してください。
 * 照合する値（ニコニコIDなど）,増減する変数番号,増減量
 * （例）
 * 38857656,401,1
 * 14375638,402,-1
 * 
 * AVVC_EXEC 1 sample1
 * 変数番号1の値で照合します(ニコニコIDの場合はその人のニコニコIDを格納した変数番号)。sample1.csvのみ実行します。
 * 
 * AVVC_EXEC 2
 * 変数番号2の値で照合します。リストに含まれる全csvで実行します。
 * 
 * AVVC_INIT
 * リストに含まれる変数番号の値を全て0で初期化します。
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

  var parameters = PluginManager.parameters('RDM_AddValueOfVariablesByCsv');
  var svgs = String(parameters['CSVs'] || '').split(",");
  var initVariables = String(parameters['init_variables'] || '').split(",");

  var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'AVVC_EXEC') {
            this.execAddValue(args);
        } else if (command === 'AVVC_INIT') {
            this.execInit();
        }
    };
    DataManager.rdmLoadCsvFile = function() {
      DataManager._csvData = new Map();
      svgs.forEach(f => {
        var xhr = new XMLHttpRequest();
        var url = 'csv/' + f.trim() + ".csv";
        xhr.open('GET', url);
        xhr.overrideMimeType('text/csv');
        xhr.onload = function() {
            if (xhr.status < 400) {
              DataManager._csvData.set(f.trim(), xhr.responseText);
            }
            xhr.onerror = this._mapLoader || function() {
                DataManager._errorUrl = DataManager._errorUrl || url;
            };
        };
        xhr.send();  
      });
    };
    DataManager.rdmGetCsvAddedVariable = function(keyValue, variableNo, csvFile) {
        let ret = $gameVariables._data[variableNo];
        if (!DataManager._csvData) return ret;
        let targetCsv = [];
        if (csvFile == null || csvFile === "") {
            for (let value of DataManager._csvData.values()) {
                targetCsv.push(value);
            }
        } else {
            targetCsv.push(DataManager._csvData.get(csvFile));
        }
        targetCsv.forEach(c => {
            if (!c || c == "") return;
            c.split(/[\r\n]+/).forEach(line => {
                let data = line.split(",");
                if (data[0] == null || data[0] === "" || data[0].trim() === "") return;
                if (data[0].trim() !== String(keyValue)) return;
                let no = parseInt(data[1]);
                if (no != variableNo) return;
                let val = parseInt(data[2]);
                if (!ret) {
                    ret = val;
                } else {
                    ret += val;
                }
            })
        });
        return ret;
    };

    var _Scene_Boot_prototype_create = Scene_Boot.prototype.create;
    Scene_Boot.prototype.create = function() {
      _Scene_Boot_prototype_create.call(this);
      DataManager.rdmLoadCsvFile();
    };
    Game_Interpreter.prototype.execInit = function() {
        initVariables.forEach(v => {
            if (!v || v === "" || v.trim() === "") return;
            var no = parseInt(v.trim());
            $gameVariables._data[no] = 0;
        })
    };
    Game_Interpreter.prototype.execAddValue = function(args) {
        let targetCsv = [];
        if (!args || args.length <= 0) return;
        if (args.length == 1) {
            for (let value of DataManager._csvData.values()) {
                targetCsv.push(value);
            }
        } else {
            targetCsv.push(DataManager._csvData.get(args[1]))
        }
        targetCsv.forEach(c => {
            if (!c || c == "") return;
            c.split(/[\r\n]+/).forEach(line => {
                var data = line.split(",");
                if (data[0] == null || data[0] === "" || data[0].trim() === "") return;
                if (data[0].trim() === String($gameVariables._data[parseInt(args[0])])) {
                    var no = parseInt(data[1]);
                    var val = parseInt(data[2]);
                    if (!$gameVariables._data[no]) {
                        $gameVariables._data[no] = val;
                    } else {
                        $gameVariables._data[no] += val;
                    }
                }
            })
        });
    };
})();

