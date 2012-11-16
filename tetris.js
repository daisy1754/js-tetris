// workaround for Firefox where DOM do not have 'innerText' property
// by adding innerText property if it is not defined.
// thanks to http://tmlife.net/programming/javascript/firefox-can-use-innertext.html
// FirefoxではinnerTextプロパティが無いので，対応としてinnerTextプロパティが無いときは定義している．
(function(){
  var tmp = document.createElement("div");
  if (tmp.innerText == 'undefined') {
    Object.defineProperty(HTMLElement.prototype, "innerText", {
      get: function() { return this.textContent; },
      set: function(val) { this.textContent = val; }
    });
  }
})();

// ---------------- 変数宣言 ----------------------------------------------------
// ---------------- declaration of variables ----------------------------------
// ブロックの種別を表す定数
// Type of blocks
var BLOCK_TYPE_BOX = 0;
var BLOCK_TYPE_BAR = 1;
var BLOCK_TYPE_L = 2;
var BLOCK_TYPE_T = 3;
var BLOCK_TYPE_L_REVERSE = 4;
var BLOCK_TYPE_Z = 5;
var BLOCK_TYPE_Z_REVERSE = 6;
var NUMBER_OF_BLOCK_TYPES = 7;

// ステージの大きさ(ブロックの数)
// Size of stage represented by number of blocks
var STAGE_WIDTH = 8;
var STAGE_HEIGHT = 12;

// ゲームの状態を表す定数
// Constants that represents game state.
var GAME_STATE_INIT = 0;
var GAME_STATE_PLAYING = 1;
var GAME_STATE_OVER = 2;

// ゲームにまつわる変数を格納するためのオブジェクト(名前空間)
// Object used for store bunch of values in a game (like a namespace).
game = {};
// そのマスにブロックがあるかどうか
// booleans that represent whether block exists or not
game.stage_filled = new Array(STAGE_HEIGHT);
for (var y = 0; y < STAGE_HEIGHT; y++) {
  game.stage_filled[y] = new Array(STAGE_WIDTH);
}
game.score = 0;
game.state = GAME_STATE_INIT;
game.currentBlock = 'undefined';
// ----------------------------------------------------------------------------

// ------------------ テトリスブロックを表すクラスたちの定義 --------------------------------
// ------------------ definitions of classes that represent tetris block -------
// ブロックのうちの正方形の一部品を表すクラス
// class that represents a unit square that consists tetris block
function BlockUnit(x, y) {
  this.x = x;
  this.y = y;
}

function addBlockUnit(blockUnitA, blockUnitB) {
  return new BlockUnit(blockUnitA.x + blockUnitB.x,
    blockUnitA.y + blockUnitB.y);
}

// 同時に落ちるひとまとまりのブロックを表すクラス．4つのBlockUnitが集まってBlockになっている
// Class that represents a block that fall together at one time.
// Block is consists of four BlockUnits.
function Block (units, initialPosition) {
  // ブロックを構成するBlockUnitは，ひとつのUnitの絶対座標と，他の3つのブロックの相対座標で表現されている．
  // BlockUnits consisting Block are represented by absolute position of one unit,
  // and relative positions of other three units.
  this.position = initialPosition;
  this.units = units;
  // 絶対座標として４つの正方形の位置の配列を返す
  // returns array of absolute positions of four block units.
  this.getUnitsPositions = function() {
    var array = new Array(4);
    array[0] = new BlockUnit(this.position.x, this.position.y);
    for (var i = 0; i < 3; i++) {
      array[1 + i] = addBlockUnit(this.position, this.units[i]);
    }
    return array;
  }
  this.fall = function(stage_filled) {
    return this.tryToMove({direction: "down"}, stage_filled);
  }
  // ブロックを指定された方向に動かせようとし，実際に動かせたかどうかを返す
  // try to move the direction specified in aim.direction;
  // return if move success or not.
  this.tryToMove = function(aim, stage_filled) {
    var delta;
    if (aim.direction == "left") {
      delta = {x: -1, y: 0};
    } else if (aim.direction == "right") {
      delta = {x: 1, y: 0};
    } else if (aim.direction == "down") {
      delta = {x: 0, y: -1};
    }
  
    if (this.canExist(stage_filled, this.getUnitsPositions(), delta)) {
      this.position = addBlockUnit(this.position, delta);
      return true;
    } else {
      return false;
    }
  }
  // ブロックを回転させようとし，実際に回転できたかを返す．
  // try to rotate. return if rotation is successed or not.
  this.tryToRotate = function(stage_filled) {
    var rotatedPositions = new Array(4);
    var rotatedUnits = new Array(3);
    rotatedPositions[0] = this.position;
    for (var i = 0; i < 3; i++) {
      rotatedUnits[i] = new BlockUnit(this.units[i].y, -this.units[i].x);
      rotatedPositions[1 + i]
        = new BlockUnit(this.position.x + rotatedUnits[i].x,
          this.position.y + rotatedUnits[i].y);
    }
    if (this.canExist(stage_filled, rotatedPositions, {x: 0, y: 0})) {
      this.units = rotatedUnits;
      return true;
    } else {
      return false;
    }
  }
  this.canExist = function(stage_filled, positions, delta) {
    for (var i = 0; i < 4; i++) {
      var nextX = positions[i].x + delta.x;
      var nextY = positions[i].y + delta.y;
      if (nextY < 0 || nextX < 0 || nextX >= STAGE_WIDTH)
        return false;
      if (stage_filled[nextY][nextX])
        return false;
    }
    return true;
  }
}

// Blockを生成するためのメソッド
// Factory method of Block
function createBlock(blockType, initialPosition) {
  switch (blockType) {
    case BLOCK_TYPE_BOX:
      return new Block([new BlockUnit(0, 1), new BlockUnit(1, 0),
                        new BlockUnit(1, 1)], initialPosition);
    case BLOCK_TYPE_BAR:
      return new Block([new BlockUnit(0, 1), new BlockUnit(0, -1),
                        new BlockUnit(0, -2)], initialPosition);
    case BLOCK_TYPE_L:
      return new Block([new BlockUnit(0, 1), new BlockUnit(0, -1),
                        new BlockUnit(1, -1)], initialPosition);
    case BLOCK_TYPE_T:
      return new Block([new BlockUnit(0, 1), new BlockUnit(1, 0),
                        new BlockUnit(-1, 0)], initialPosition);
    case BLOCK_TYPE_L_REVERSE:
      return new Block([new BlockUnit(0, 1), new BlockUnit(0, -1),
                        new BlockUnit(-1, -1)], initialPosition);
    case BLOCK_TYPE_Z:
      return new Block([new BlockUnit(0, 1), new BlockUnit(-1, 1),
                        new BlockUnit(1, 0)], initialPosition);
    case BLOCK_TYPE_Z_REVERSE:
      return new Block([new BlockUnit(0, 1), new BlockUnit(1, 1),
                        new BlockUnit(-1, 0)], initialPosition);
  }
  return null;
}

function createNewBlock() {
  var blockType = Math.floor(Math.random() * NUMBER_OF_BLOCK_TYPES);
  game.currentBlock = createBlock(blockType, 
    new BlockUnit(STAGE_WIDTH / 2, STAGE_HEIGHT - 2));
}
// ----------------------------------------------------------------------------

// ----------------------- 便利関数達 --------------------------------------------
// ----------------------- utility functions -----------------------------------
// 複数ブラウザに対応するためのイベント追加関数
// event adding class that care for browser dependency.
function appendEventListener(element, type, func, capture) {
  if (element.addEventListener) {
    element.addEventListener(type, func, capture);
  } else if (element.attachEvent) {
    element.attachEvent("on" + type, func);
  }
}

function arrayContains(array, element) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] == element)
      return true;
  }
  return false;
}

function stageUnitId (x, y) {
  return 'stageUnit-' + x + '-' + y;
}

var KEYCODE_SPACE = 32;
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_DOWN = 40;
function onKeyDown(event) {
  switch (event.keyCode) {
    case KEYCODE_LEFT:
      if (game.currentBlock)
        game.currentBlock.tryToMove({direction: "left"}, game.stage_filled);
      break;
    case KEYCODE_RIGHT:
      if (game.currentBlock)
        game.currentBlock.tryToMove({direction: "right"}, game.stage_filled);
      break;
    case KEYCODE_DOWN:
      if (game.currentBlock)
        game.currentBlock.tryToMove({direction: "down"}, game.stage_filled);
      break;
    case KEYCODE_SPACE:
      if (game.currentBlock)
        game.currentBlock.tryToRotate(game.stage_filled);
      break;
  }
}
// ----------------------------------------------------------------------------

// ----------------------- ゲームのロジック -----------------------------------------
// ----------------------- game logic -----------------------------------------
function initGame() {
  for (var y = 0; y < STAGE_HEIGHT; y++) {
    for (var x = 0; x < STAGE_WIDTH; x++) {
      game.stage_filled[y][x] = false;
    }
  }
  game.state = GAME_STATE_PLAYING;
  game.score = 0;
  var scoreBox = document.getElementById('scoreBox');
  scoreBox.innerHTML = 'game start';
  setTimeout(doTurn, 300);
}

function doTurn() {
  if (game.currentBlock) {
    if (!game.currentBlock.fall(game.stage_filled)) {
      // currentBlockが設置した
      // when currentBlock touches ground or other blocks
      evaluate();
    }
  } else {
    createNewBlock();
  }
  drawStage();
  if (game.state == GAME_STATE_PLAYING)
    setTimeout(doTurn, 300);
}

function drawStage() {
  var stageDOM = document.getElementById('tetris-stage');
  for (var y = STAGE_HEIGHT - 1; y >= 0; y--) {
    var row = document.getElementById('tetris-stage-row-' + y);
    for (var x = 0; x < STAGE_WIDTH; x++) {
      var unit = document.getElementById(stageUnitId(x, y));
      var color = game.stage_filled[y][x] ? "black" : "blue";
      unit.style.backgroundColor = color;
    }
  }
  
  if (game.currentBlock) {
    var blockUnits = game.currentBlock.getUnitsPositions();
    for (var i = 0; i < 4; i++) {
      var element = document.getElementById(stageUnitId(
        blockUnits[i].x, blockUnits[i].y));
      element.style.backgroundColor = "red";
    }
  }
  
  var scoreBox = document.getElementById('scoreBox');
  switch (game.state) {
    case GAME_STATE_PLAYING:
      scoreBox.innerHTML = game.score;
      break;
    case GAME_STATE_OVER:
      scoreBox.innerHTML = 'game over';
      break;
  }
}

// 消えた行数に対応するスコアを返す
// returns the score corresponding to # of removed lines.
function getScore(numberOfLines) {
  switch (numberOfLines) {
    case 1:
      return 10;
    case 2:
      return 25;
    case 3:
      return 40;
    case 4: 
      return 70;
    default:
      return 0;
  }
}

function evaluate() {
  var blockUnits = game.currentBlock.getUnitsPositions();
  var lowest = STAGE_HEIGHT;
  var highest = -1;
  var filledRow = [];
  // ブロックが存在する範囲を調べている
  // detect lowest and highest y-value where any block unit exists.
  for (var i = 0; i < 4; i++) {
    game.stage_filled[blockUnits[i].y][blockUnits[i].x] = true;
    if (lowest > blockUnits[i].y)
      lowest = blockUnits[i].y;
    if (highest < blockUnits[i].y)
      highest = blockUnits[i].y;
  }
  // 一列揃っている列を調べている
  // check filled row, where block units are to removed
  for (var y = lowest; y <= highest; y++) {
    var rowIsFilled = true;
    for (var x = 0; x < STAGE_WIDTH; x++) {
      if (!game.stage_filled[y][x]) {
        rowIsFilled = false;
        break;
      }
    }
    if (rowIsFilled)
      filledRow.push(y);
  }
  
  // 揃っている列を削除(実際には他の列をシフト)している
  // removing the block units by shifting block units
  var skipCount = 0;
  for (var y = 0; y < STAGE_HEIGHT; y++) {
    var shouldSkipRow = false;
    if (arrayContains(filledRow, y)) {
      shouldSkipRow = true;
    }
    if (shouldSkipRow) {
      skipCount++;
    } else {
      game.stage_filled[y - skipCount] = game.stage_filled[y];
    }
  }
  for (y = STAGE_HEIGHT - skipCount; y < STAGE_HEIGHT; y++) {
    game.stage_filled[y] = new Array(STAGE_WIDTH);
    for (x = 0; x < STAGE_WIDTH; x++)
      game.stage_filled[y][x] = false;
  }
  
  game.currentBlock = 'undefined';
  game.score += getScore(skipCount);
  
  if (game.stage_filled[STAGE_HEIGHT - 1][STAGE_WIDTH / 2]) {
    game.state = GAME_STATE_OVER;
  }
}

// メイン関数
// main function
function initStage() {
  var stageDOM = document.getElementById('tetris-stage');
  for (var y = STAGE_HEIGHT - 1; y >= 0; y--) {
    var row = document.createElement('div');
    row.className = 'tetris-stage-row';
    row.id = row.className + '-' + y;
    stageDOM.appendChild(row);
    for (var x = 0; x < STAGE_WIDTH; x++) {
      var stageUnit = document.createElement('div');
      stageUnit.className = 'tetris-stage-unit';
      stageUnit.id = stageUnitId(x, y);
      row.appendChild(stageUnit);
    }
  }
  
  appendEventListener(document, 'keydown', onKeyDown);
  
  var startButton = document.createElement('button');
  startButton.innerText = 'start';
  appendEventListener(startButton, 'click', initGame);
  stageDOM.appendChild(startButton);
  var scoreBox = document.createElement('div');
  scoreBox.id = 'scoreBox';
  stageDOM.appendChild(scoreBox);
}