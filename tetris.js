function BlockUnit(x, y) {
  this.x = x;
  this.y = y;
}

function addBlockUnit(blockUnitA, blockUnitB) {
  return new BlockUnit(blockUnitA.x + blockUnitB.x,
    blockUnitA.y + blockUnitB.y);
}

function Block (units, initialPosition) {
  this.position = initialPosition;
  this.units = units;
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

function appendEventListener(element, type, func, capture) {
    var ret = undefined;
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

var BLOCK_TYPE_BOX = 0;
var BLOCK_TYPE_BAR = 1;
var BLOCK_TYPE_L = 2;
var BLOCK_TYPE_T = 3;
var BLOCK_TYPE_L_REVERSE = 4;
var BLOCK_TYPE_Z = 5;
var BLOCK_TYPE_Z_REVERSE = 6;
var NUMBER_OF_BLOCK_TYPES = 7;

var STAGE_WIDTH = 8;
var STAGE_HEIGHT = 12;

var GAME_STATE_INIT = 0;
var GAME_STATE_PLAYING = 1;
var GAME_STATE_OVER = 2;

game = {};
game.stage_filled = new Array(STAGE_HEIGHT);
for (var y = 0; y < STAGE_HEIGHT; y++) {
  game.stage_filled[y] = new Array(STAGE_WIDTH);
}
game.score = 0;
game.state = GAME_STATE_INIT;
game.currentBlock = undefined;

function createBlock(blockType, initialPosition) {
  switch (blockType) {
    case BLOCK_TYPE_BOX:
      return new Block([new BlockUnit(0, 1), new BlockUnit(1, 0), new BlockUnit(1, 1)], initialPosition);
    case BLOCK_TYPE_BAR:
      return new Block([new BlockUnit(0, 1), new BlockUnit(0, -1), new BlockUnit(0, -2)], initialPosition);
    case BLOCK_TYPE_L:
      return new Block([new BlockUnit(0, 1), new BlockUnit(0, -1), new BlockUnit(1, -1)], initialPosition);
    case BLOCK_TYPE_T:
      return new Block([new BlockUnit(0, 1), new BlockUnit(1, 0), new BlockUnit(-1, 0)], initialPosition);
    case BLOCK_TYPE_L_REVERSE:
      return new Block([new BlockUnit(0, 1), new BlockUnit(0, -1), new BlockUnit(-1, -1)], initialPosition);
    case BLOCK_TYPE_Z:
      return new Block([new BlockUnit(0, 1), new BlockUnit(-1, 1), new BlockUnit(1, 0)], initialPosition);
    case BLOCK_TYPE_Z_REVERSE:
      return new Block([new BlockUnit(0, 1), new BlockUnit(1, 1), new BlockUnit(-1, 0)], initialPosition);
  }
  return null;
}

function createNewBlock() {
  var blockType = Math.floor(Math.random() * NUMBER_OF_BLOCK_TYPES);
  game.currentBlock = createBlock(blockType, 
    new BlockUnit(STAGE_WIDTH / 2, STAGE_HEIGHT - 2));
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
      unit.style['background-color'] = color;
    }
  }
  
  if (game.currentBlock) {
    var blockUnits = game.currentBlock.getUnitsPositions();
    for (var i = 0; i < 4; i++) {
      var element = document.getElementById(stageUnitId(
        blockUnits[i].x, blockUnits[i].y));
      element.style['background-color'] = "red";
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
  for (var i = 0; i < 4; i++) {
    game.stage_filled[blockUnits[i].y][blockUnits[i].x] = true;
    if (lowest > blockUnits[i].y)
      lowest = blockUnits[i].y;
    if (highest < blockUnits[i].y)
      highest = blockUnits[i].y;
  }
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
  
  game.currentBlock = undefined;
  game.score += getScore(skipCount);
  
  if (game.stage_filled[STAGE_HEIGHT - 1][STAGE_WIDTH / 2]) {
    game.state = GAME_STATE_OVER;
  }
}