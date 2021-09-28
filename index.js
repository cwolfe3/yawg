import { dict } from './anagrams.js';
let primaryColor = '#2d3047';
let secondaryColor = '#88958d';
let tertiaryColor = '#fff07c';
let color4 = '#99582A';
let color5 = '#E5D352';//'#ffc914';//'#fce762';
let textColor = primaryColor;

let smallFont = 'bold 3px sans-serif';
let largeFont = 'bold 15px sans-serif';

let mouseDown = false;
let mouseLocation = new Point(0, 0);

let scale = 1;

let entryWheel, targetWordsPanel, shuffleButton, allLetters, targetWords;

window.onload = loadDictionary();

function loadDictionary() {

  let params = new URLSearchParams(window.location.search);
  if (params.has('letters')) {
    allLetters = params.get('letters').split('').sort().join('');
  } else {
    let r = Math.floor(Math.random() * Object.keys(dict['ii']).length); //Fix this, ii keys should be easier to get
    allLetters = Object.keys(dict['ii'])[r];
  }

  targetWords = loadSubgrams(dict, allLetters);
  allLetters = allLetters.toUpperCase();

  init();
}

function loadSubgrams(dict, letters) {
  let toSearch = [letters];
  let visited = [];
  let subgrams = [];
  while (toSearch.length) {
    let current = toSearch.pop();
    for (let i = 0; i < dict['ii'][current].length; i++) {
      if (subgrams.indexOf(dict['ii'][current][i]) == -1) {
        subgrams.push(dict['ii'][current][i].toUpperCase());
      }
    }
    for (let i = 0; i < dict['subgrams'][current].length; i++) {
      if (visited.indexOf(dict['subgrams'][current][i]) == -1) {
        toSearch.push(dict['subgrams'][current][i]);
      }
    }
    visited.push(current);
  }
  return subgrams;
}

function TargetWordsPanel(targetWords) {
  this.x = 0;
  this.y = 0;
  this.width = 0;
  this.height = 0;
  this.targetButtons = [];
  this.map = [];
  this.targetWords = targetWords.sort(wordCompare);
  this.pageWidths = [];
  this.currentPage = 0;
  this.wordsPerPage = 0;
  this.buttonRadius = 2;
  this.pagerWidth = 4;
  this.paddingX = this.buttonRadius * 0.1;
  this.paddingY = this.buttonRadius * 0.2;

  //Set up word panel
  let index = 0;
  let pageWidth = 0;
  for (let i = 0; i < this.targetWords.length; i++) {
    this.map[i] = [];
    for (let j = 0; j < this.targetWords[i].length; j++) {
      let button = new Button(new Point(0, 0), this.buttonRadius, this.targetWords[i][j]);
      this.targetButtons.push(button);
      button.hidden = true;
      this.map[i][j] = this.targetButtons[index];
      index += 1;
    }
  }

  this.resize = function(width, height) {
    this.width = width;
    this.height = height;
    this.pageWidths = [];
    let pageWidth = 0;
    let heightPerButton = this.paddingY + this.buttonRadius * 2;
    this.wordsPerPage = Math.floor((this.height - this.paddingY) / heightPerButton);
    for (let i = 0; i < this.targetWords.length; i++) {
      pageWidth = Math.max(pageWidth, this.targetWords[i].length);
      if (i % this.wordsPerPage == (this.wordsPerPage - 1) || i == this.targetWords.length - 1) {
        this.pageWidths.push(pageWidth);
        pageWidth = 0;
      }
    }
  }

  this.alignButtons = function() {
    let firstVisibleIndex = this.wordsPerPage * this.currentPage;
    for (let i = firstVisibleIndex; i < Math.min(firstVisibleIndex + this.wordsPerPage, targetWords.length); i++) {
      for (let j = 0; j < targetWords[i].length; j++) {
        let x = this.x + j * (2 * this.buttonRadius + this.paddingX) + this.buttonRadius + this.paddingX + this.pagerWidth;
        let y = this.y + (this.buttonRadius + this.paddingY) * 2 * (i - firstVisibleIndex) + this.buttonRadius + this.paddingY;
        this.map[i][j].loc = new Point(x + this.pagerWidth, y);
        this.map[i][j].radius = this.buttonRadius;
      }
    }
  }

  this.draw = function(gl) {
    let firstVisibleIndex = this.wordsPerPage * this.currentPage;
    gl.save();
    gl.font = smallFont;
    gl.strokeStyle = secondaryColor;
    //gl.strokeRect(this.x, this.y, this.width, this.height);
    for (let i = firstVisibleIndex; i < Math.min(firstVisibleIndex + this.wordsPerPage, targetWords.length); i++) {
      for (let j = 0; j < this.map[i].length; j++) {
        this.map[i][j].draw(gl);
      }
    }

    if (this.currentPage > 0) {
      gl.fillRect(this.x, this.y, this.pagerWidth, this.height);
    }
    if (this.currentPage < this.pageWidths.length - 1) {
      gl.fillRect(this.x + this.width - this.pagerWidth, this.y, this.pagerWidth, this.height);
    }

    gl.restore();
  }

  this.pageRight = function() {
    this.currentPage = Math.min(this.currentPage + 1, this.pageWidths.length - 1);
    this.alignButtons();
  }

  this.pageLeft = function() {
    this.currentPage = Math.max(this.currentPage - 1, 0);
    this.alignButtons();
  }

  this.contains = function(point) {
    return rectContains(new Point(this.x, this.y), new Point(this.width, this.height), point);
  }

  this.down = function(point) {
    if (rectContains(new Point(this.x, this.y), new Point(this.pagerWidth, this.height), point)) {
      this.pageLeft();
    } else if (rectContains(new Point(this.x + this.width - this.pagerWidth, this.y), new Point(this.pagerWidth, this.height), point)) {
      console.log('sdfsdf');
      this.pageRight();
    }
  }
}

function EntryWheel(allLetters) {
  this.loc = new Point(0, 0);
  this.radius = 0;
  this.buttonOffset = 0;
  this.buttonScale;
  this.buttons = [];
  this.entry = '';
  this.entryButtons = [];
  this.selectedLetters = [];
  this.allLetters = allLetters;

  for (let i = 0; i < allLetters.length; i++) {
    this.buttons.push(new Button(new Point(0, 0), 0, allLetters[i]));
  }

  this.draw = function(gl) {
    gl.fillStyle = secondaryColor;
    gl.beginPath();
    gl.arc(this.loc.x, this.loc.y, this.radius, 0, 2 * Math.PI, true);
    gl.fill();

    this.drawEntry(gl);
    this.drawButtons(gl, false);
    this.drawConnectingLines(gl);
    this.drawButtons(gl, true);
  }

  this.drawConnectingLines = function(gl) {
    if (this.selectedLetters.length > 0) {
      gl.beginPath();
      gl.strokeStyle = color4;
      gl.lineWidth = 2;
      for (let i = 0; i < this.selectedLetters.length; i++) {
        let buttonLocation = this.selectedLetters[i].loc;
        if (i == 0) {
          gl.moveTo(this.loc.x + buttonLocation.x, this.loc.y + buttonLocation.y);
        } else {
          gl.lineTo(this.loc.x + buttonLocation.x, this.loc.y + buttonLocation.y);
        }
      }
      gl.lineTo(mouseLocation.x, mouseLocation.y);

      gl.stroke();
    }
  }

  this.drawEntry = function(gl) {
    let scaleFactor = 0.4;
    gl.save();
    gl.translate(this.loc.x, this.loc.y - this.radius - this.buttonRadius * 0.4);
    gl.scale(scaleFactor, scaleFactor);
    for (let i = 0; i < this.entryButtons.length; i++) {
      this.entryButtons[i].draw(gl);
    }
    gl.restore();
  }

  this.drawButtons = function(gl, highlighted) {
    gl.save();
    gl.translate(this.loc.x, this.loc.y);
    for (let i = 0; i < this.buttons.length; i++) {
      let button = this.buttons[i];
      if (button.highlighted == highlighted) {
        button.draw(gl);
      }
    }
    gl.restore();
  }

  this.addEntryLetter = function(char) {
    this.entry = this.entry + char;
    let button = new Button(new Point(0, 0), 0, char);
    this.entryButtons.push(button);
    button.highlighted = true;
  }

  this.removeLetter = function() {
    this.entry = this.entry.substr(0, this.entry.length)
    this.entryButtons.pop();
  }

  //TODO Buttons should be added in the proper place immediately
  this.alignButtons = function() {
    //wheel buttons
    for (let i = 0; i < this.buttons.length; i++) {
      let angle = i * 2 * Math.PI / this.buttons.length;
      let buttonLocation = new Point(
        this.buttonOffset * Math.sin(angle), 
        this.buttonOffset * -Math.cos(angle)
      );
      this.buttons[i].loc = buttonLocation;
      this.buttons[i].desiredLoc = buttonLocation;
      this.buttons[i].radius = this.buttonRadius;
    }

    //entry buttons
    let x = - this.buttonRadius * (this.entryButtons.length - 1);
    for (let i = 0; i < this.entryButtons.length; i++) {
      let button = this.entryButtons[i];
      button.loc = new Point(x, button.loc.y);
      button.desiredLoc = button.loc;
      this.entryButtons[i].radius = this.buttonRadius;
      x += 2 * this.buttonRadius;
    }
  }

  this.addButton = function(letter) {
    this.buttons.push(new Button(new Point(0, 0), 0, letter));
    this.alignButtons();
  }

  this.down = function(loc) {
    for (let i = 0; i < this.buttons.length; i++) {
      let button = this.buttons[i];
      if (button.contains(mouseLocation.sub(this.loc))) {
        button.highlighted = true;
        mouseDown = true;
        this.selectedLetters.push(button);
        this.addEntryLetter(button.label);
      } else {
        button.highlighted = false;
      }
    }
  }

  this.move = function(loc) {
    for (let i = 0; i < this.buttons.length; i++) {
      let button = this.buttons[i];
      if (button.contains(mouseLocation.sub(this.loc))) {
        if (this.selectedLetters.indexOf(button) == -1) {
          button.highlighted = true;
          this.selectedLetters.push(button);
          this.addEntryLetter(button.label);
        } else if (this.selectedLetters.length >= 2 && this.selectedLetters[this.selectedLetters.length - 2] == button) {
          //button.highlighted = false;
          //this.selectedLetters.pop();
          //this.removeLetter();
        }
      }
    }
  }

  this.up = function() {
    for (let i = 0; i < this.buttons.length; i++) {
      let button = this.buttons[i];
      button.highlighted = false;
    }
    this.entryButtons = [];
    this.selectedLetters = [];
    submitEntry();
  }
}

function Button(loc, radius, label='?') {
  this.loc = loc;
  this.desiredLoc = loc;
  this.velocity = new Point(0, 0);
  this.radius = radius;
  this.highlighted = false;
  this.speed = 4;
  this.label = label;
  this.hidden = false;

  this.draw = function(gl) {
    let outlineScale = 0.1;

    gl.save();
    gl.fillStyle = this.bgColor();
    gl.strokeStyle = this.outlineColor();
    gl.lineWidth = this.radius * outlineScale;
    gl.beginPath();
    gl.arc(
      this.loc.x,
      this.loc.y,
      this.radius * (1 - outlineScale),
      0,
      2 * Math.PI,
      true
    );
    gl.fill();
    gl.stroke();

    if (!this.hidden) {
      let textMetric = gl.measureText(this.label);
      gl.fillStyle = this.outlineColor();
      gl.fillText(
        this.label,
        this.loc.x - (textMetric.actualBoundingBoxRight + textMetric.actualBoundingBoxLeft) / 2,
        this.loc.y + (textMetric.actualBoundingBoxAscent - textMetric.actualBoundingBoxDescent) / 2
      );
      //gl.fillStyle = 'black';
      //gl.fillRect(textMetric.actualBoundingBoxLeft, textMetric.actualBoundingBoxRight, (textMetric.actualBoundingBoxRight + textMetric.actualBoundingBoxLeft) / 2, (textMetric.actualBoundingBoxAscent - textMetric.actualBoundingBoxDescent) / 2);
    }
    gl.restore();
  };

  this.tick = function(time) {
    if (this.loc.dist2(this.desiredLoc) < 4) { // TODO if button goes too fast, it keeps going
      this.loc = this.desiredLoc;
    } else {
      this.loc = this.loc.add(this.velocity.scale(time));
    }
  };

  this.contains = function(point) {
    return this.loc.dist(point) <= this.radius;
  };

  this.outlineColor = function() {
    return this.hidden?secondaryColor:(this.highlighted?color4:primaryColor);
  }

  this.bgColor = function() {
    return this.hidden?secondaryColor:(this.highlighted?tertiaryColor:color5);
  }

  this.setTarget = function(target) {
    this.desiredLoc = target;
    this.velocity = target.sub(this.loc).scale(6);
  }
}

function init() {
  window.addEventListener('resize', resize, false);
  let canvas = document.getElementById('gameScreen');
  canvas.addEventListener('mousedown', mousedown);
  canvas.addEventListener('mousemove', mousemove);
  canvas.addEventListener('mouseup', mouseup);
  canvas.addEventListener('touchstart', touchstart);
  canvas.addEventListener('touchmove', touchmove);
  canvas.addEventListener('touchend', touchend);
  canvas.addEventListener('touchcancel', touchend);

  allLetters = shuffleWord(allLetters);
  entryWheel = new EntryWheel(allLetters);
  targetWordsPanel = new TargetWordsPanel(targetWords);
  shuffleButton = new Button(new Point(0, 0), entryWheel.buttonRadius, '↺');

  resize();
  draw();

  window.requestAnimationFrame(tick);
}

function tick() {
  for (let i = 0; i < entryWheel.buttons.length; i++) {
    let button = entryWheel.buttons[i];
    button.tick(0.01);
  }
  draw();
  window.requestAnimationFrame(tick);
}

function draw() {
  let canvas = document.getElementById('gameScreen');
  let gl = canvas.getContext('2d');
  gl.font = largeFont;
  gl.lineJoin = 'bevel';
  gl.lineCap = 'round';

  gl.fillStyle = primaryColor;
  gl.fillRect(0, 0, canvas.width, canvas.height);

  gl.scale(scale, scale);

  entryWheel.draw(gl);
  targetWordsPanel.draw(gl);
  shuffleButton.draw(gl);

  gl.scale(1 / scale, 1 / scale);

}

function resize() {
  let canvas = document.getElementById('gameScreen');

  // Screen is 200 by 100 or 100 by 150. This is dumb
  let hAspectRatio = 2;
  let vAspectRatio = 1.5;
  let padding = 8;
  entryWheel.radius = Math.min(canvas);
  if (window.innerWidth < window.innerHeight) { //Vertically oriented
    scale = Math.min(window.innerWidth, window.innerHeight / vAspectRatio) / 100;
    canvas.width = scale * 100;
    canvas.height = scale * vAspectRatio * 100;
    entryWheel.radius = (100 - 2 * padding) / 2;
    entryWheel.loc.x = 50;
    entryWheel.loc.y = 100 * vAspectRatio - entryWheel.radius - padding;
    entryWheel.buttonOffset = 0.68 * entryWheel.radius;
    entryWheel.buttonRadius = 0.25 * entryWheel.radius;
    targetWordsPanel.resize(100 - 2 * padding, 100 * vAspectRatio - 3 * padding - 2 * entryWheel.radius);
    targetWordsPanel.x = padding;
    targetWordsPanel.y = padding;
    shuffleButton.radius = entryWheel.buttonRadius;
    shuffleButton.loc = new Point(100 - shuffleButton.radius - padding / 2, 100 * vAspectRatio - shuffleButton.radius - padding / 2);
  } else { //Horizontally oriented
    scale = Math.min(window.innerHeight, window.innerWidth / hAspectRatio) / 100;
    canvas.width = scale * hAspectRatio * 100;
    canvas.height = scale * 100;
    entryWheel.radius = (100 - 2 * padding) / 2;
    entryWheel.loc.x = entryWheel.radius + padding;
    entryWheel.loc.y = 50;
    entryWheel.buttonOffset = 0.68 * entryWheel.radius;
    entryWheel.buttonRadius = 0.25 * entryWheel.radius;
    targetWordsPanel.resize(80, 100 - padding * 2);
    targetWordsPanel.x = 200 - targetWordsPanel.width - padding;
    targetWordsPanel.y = padding;
    shuffleButton.loc = new Point(entryWheel.loc.x + entryWheel.radius * 0.95, entryWheel.loc.y + entryWheel.radius * 0.9);
    shuffleButton.radius = entryWheel.buttonRadius;
  }
  entryWheel.alignButtons();
  targetWordsPanel.alignButtons();
  draw();
}

function shuffleWheel() {
  let indices = [];
  let buttons = entryWheel.buttons;
  let desiredLocs = []
  for (let i = 0; i < buttons.length; i++) {
    indices.push(i);
    desiredLocs.push(buttons[i].desiredLoc);
  }
  shuffleArray(indices);
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setTarget(desiredLocs[indices[i]]);
  }
}

function shuffleWord(arr) {
  let word = arr.split('');
  shuffleArray(word);
  return word;
}

function shuffleArray(arr) {
  for (let i = 0; i < arr.length; i++) {
    let r = Math.floor(Math.random() * (arr.length - i) + i);
    let tmp = arr[r];
    arr[r] = arr[i];
    arr[i] = tmp;
  }
}


function submitEntry() {
  let index = targetWords.indexOf(entryWheel.entry);
  if (index != -1) {
    for (let i = 0; i < entryWheel.entry.length; i++) {
      targetWordsPanel.map[index][i].hidden = false;
    }
  }

  entryWheel.entry = '';
  entryWheel.entryButtons = [];
}

function down(loc) {
  mouseLocation = loc;
  if (loc.dist(entryWheel.loc) <= entryWheel.radius) {
    entryWheel.down(loc);
  } else if (loc.dist(shuffleButton.loc) <= shuffleButton.radius) {
    shuffleWheel();
  } else if (targetWordsPanel.contains(loc)) {
    targetWordsPanel.down(loc);
  }
}

function move(loc) {
  mouseLocation = loc;
  if (mouseDown && loc.dist(entryWheel.loc) <= entryWheel.radius) {
    entryWheel.move(loc);
  }
}

function up() {
  entryWheel.up();
  mouseDown = false;
}


/* INPUT HANDLERS */

function mousedown(event) {
  down(new Point(event.offsetX, event.offsetY).scale(1 / scale));
}

function mousemove(event) {
  move(new Point(event.offsetX, event.offsetY).scale(1 / scale));
}

function mouseup(event) {
  up(new Point(event.offsetX, event.offsetY).scale(1 / scale));
}

function touchToLocation(touch) {
  rect = touch.target.getBoundingClientRect();
  loc = new Point(touch.clientX, touch.clientY);
  loc = loc.sub(new Point(rect.left, rect.top));
  loc = loc.scale(1 / scale);
  return loc;
}

function touchstart(event) {
  if (!mouseDown) {
    event.preventDefault();
    down(touchToLocation(event.touches[0]));
  }
}

function touchmove(event) {
  event.preventDefault();
  move(touchToLocation(event.touches[0]));
}

function touchend(event) {
  event.preventDefault();
  up();
}

function wordCompare(word1, word2) {
  if (word1.length != word2.length) {
    return word1.length - word2.length;
  } else {
    return word1<word2?-1:(word2<word1?1:0);
  }
}

function Node(object) {
  this.object
}

function rectContains(pos, dim, point) {
  return point.x > pos.x && point.x < pos.x + dim.x
    && point.y > pos.y && point.y < pos.y + dim.y;
}

function Point(x, y) {
  this.x = x;
  this.y = y;

  this.add = function(point) {
    return new Point(this.x + point.x, this.y + point.y);
  }

  this.scale = function(s) {
    return new Point(this.x * s, this.y * s);
  }

  this.sub = function(point) {
    return this.add(point.scale(-1));
  }

  this.mag2 = function() {
    return this.x * this.x + this.y * this.y;
  }

  this.dist2 = function(point) {
    return this.sub(point).mag2();
  }

  this.dist = function(point) {
    return Math.sqrt(this.dist2(point));
  }

  this.normalize = function() {
    return this.scale(1 / Math.sqrt(this.mag2()));
  }

  this.clamp = function(lower, upper) {
    if (this.mag2() < lower * lower) {
      return this.normalize().scale(lower);
    } else if (this.mag2() > upper * upper) {
      return this.normalize().scale(upper);
    } else {
      return this.copy();
    }
  }

  this.copy = function() {
    return new Point(this.x, this.y);
  }
}
