var SketchAccess = {
  "callbacks":{},
  "on":function(event,callback){
    let events = SketchAccess.callbacks[event]
    if(events == null){
      SketchAccess.callbacks[event] = []
      events = SketchAccess.callbacks[event]
    }
    events.push(callback)
  },
  "emit":function(event, ...args){
    let events = SketchAccess.callbacks[event]
    if(events == null || events.length < 1) return;
    for(let i = 0; i < events.length; ++i){
      return events[i](...args);
    }
  },
}

let DRAW_NOTE_CANVAS_HEIGHT = 400 // ノートを描画するサイズ
let DRAW_SCROLL_VIEW_Y = DRAW_NOTE_CANVAS_HEIGHT;
let DRAW_KEYBOARD_WIDTH = 100 // キーボードのサイズ
let DRAW_KEYBOARD_HEIGHT = 10 // キーボードのサイズ(白鍵)
let DRAW_KEYBOARD_BLACK_HEIGHT = 10 // キーボードのサイズ(黒鍵)
let DRAW_NOTE_WIDTH = 20 // ノートのサイズ
let DRAW_NOTE_HEIGHT = 10 // ノートのサイズ
let DRAW_SCROLL_HEIGHT = 12; // スクロール縦幅
let DRAW_RIGHT_SCROLL_WIDTH = 12; // 右スクロール横幅
let DefaultNoteNumber = 69 + 12 * 1 + 6 // ノートの基準
const NOTE_NUMBER_MAX = 69 + 12 * 8;
const NOTE_NUMBER_MIN = 69 - 12 * 5 - 5 + 12 * 4;
var TRACK_COLORS = []

var TrackVisibleSettings = [true,true,true,true,true,true,true,true,true,true]
var ScetchSettings = {
  "DrawNoteNumberType":"note", // note/number/none
}
var KeyboardStatus = new Map();
let scrollView = null;
let scrollViewValue = 0.0;
let rightScrollView = null;
let rightScrollViewValue = 0.0;
let playLineView = null;
let splitLineViews = [];
let repeatStartLineView = null;
let repeatEndLineView = null;
let repeatStartTime = -1;
let repeatEndTime = -1;
let enableRepeat = false;
let drawNoteWidthRate = 1.0;

let postProcess;
let bitFont;
let pg;
let gl;

function preload() {
  // トゥルータイプフォントを読み込む
  // https://fonts.google.com/specimen/Trade+Winds
  // WEBGL: you must load and set a font before drawing text.
  bitFont = loadFont('assets/font/8bitoperator_jve.ttf');
}

function setup() {
  DRAW_NOTE_CANVAS_HEIGHT = windowHeight * 0.4 - DRAW_SCROLL_HEIGHT;
  DRAW_SCROLL_VIEW_Y = DRAW_NOTE_CANVAS_HEIGHT;
  canvas = createCanvas(windowWidth - 20, windowHeight * 0.4, WEBGL);
  gl = canvas.elt.getContext('webgl2');
  pg = createGraphics(canvas.width, canvas.height);
  TRACK_COLORS = [
    color(0, 160, 255),
    color(91, 130, 194),
    color(0, 255, 110),
    color(255, 60, 60),
    color(255, 167, 237),
    color(201, 133, 93),
    color(196, 165, 92),
    color(163, 196, 92),
    color(94, 196, 92),
    color(91, 194, 160),
  ]

  initScrollView();
  initNoteLineView();

  postProcess = new Material(canvas, './shader/vert.glsl', './shader/frag.glsl');

  // gui setup
  // var gui = new dat.GUI();
  // gui.addFolder("Tracks");
}

//ウィンドウサイズが変更されたときに実行される関数
function windowResized() {
  DRAW_NOTE_CANVAS_HEIGHT = windowHeight * 0.4 - DRAW_SCROLL_HEIGHT;
  DRAW_SCROLL_VIEW_Y = DRAW_NOTE_CANVAS_HEIGHT;
  resizeCanvas(windowWidth - 20, windowHeight * 0.4);
  pg = createGraphics(canvas.width, canvas.height);

  initScrollView();
  initNoteLineView();
}

function draw() {

  background(220);
  translate(-canvas.width / 2,-canvas.height / 2);

  pg.push();
  pg.clear();

  let offsetTime = getEmitterCurrentPlayTime();
  let offsetLag = isPlayEditEmitter() ? 0.1 : 0;

  setDrawNoteWidthRate(1);
  if(G_NoteAnalysis){
    if(G_NoteAnalysis.getFirstTempo() >= 300){
      setDrawNoteWidthRate(0.5);
    }
    else if(G_NoteAnalysis.getFirstTempo() >= 200){
      setDrawNoteWidthRate(0.75);
    }
  }
  
  let w = DRAW_KEYBOARD_WIDTH;
  let h = DRAW_NOTE_HEIGHT;
  let x = 0;
  let y = 0;
  let note_w = getOneNoteWidth();
  let add_y = 0;
  let note = DefaultNoteNumber;
  let note_types = [0,1,0,1,0,0,1,0,1,0,1,0];
  let white = color(255, 255, 255);
  let black = color(0,0,0);
  let emit = color(0,0,255);
  let note_back_color = color(100,100,100)
  let note_back_black_color = color(50,50,50)
  let isBlackKeyboard = false;

  pg.stroke(1);
  note = DefaultNoteNumber;
  y = 0;
  for(let o = 0; o < 4; ++o){
    for(let i = 0; i < 12; ++i){
      if(!isBlackKeyFromNoteNumber(note)){
        // 白
        add_y = h;
        isBlackKeyboard = false;
      }
      else{
        // 黒
        add_y = h;
        isBlackKeyboard = true;
      }
      
      // 横
      let side_x = x + w
      if(isBlackKeyboard){
        pg.fill(note_back_black_color)
      }
      else{
        pg.fill(note_back_color)
      }
      for(let n = 0; n < 1; ++n){
        pg.strokeWeight(0.2)
        let draw_note_w = Math.min(canvas.width - DRAW_KEYBOARD_WIDTH,note_w*100*getDrawNoteWidthRateReverse());
        pg.rect(side_x,y,draw_note_w,h)
        pg.strokeWeight(1)
        side_x += note_w*100*getDrawNoteWidthRateReverse();
      }
      
      y += add_y;
      note -= 1;
    }
  }

  // ノート描画
  let isDrawAnalysis = true;
  if(isPlayEditEmitter()){
    isDrawAnalysis = !drawAnalysis(G_EditNoteAnalysis, offsetTime);
  }
  if(isDrawAnalysis){
    drawAnalysis(G_NoteAnalysis, offsetTime);
  }

  // リピート位置描画
  drawNoteLineView(isDrawAnalysis ? G_NoteAnalysis : G_EditNoteAnalysis, offsetTime - offsetLag);
  
  // 鍵盤描画
  pg.stroke(1);
  note = DefaultNoteNumber;
  y = 0;
  let key_h = DRAW_KEYBOARD_HEIGHT;
  for(let o = 0; o < 4; ++o){
    for(let i = 0; i < 12; ++i){

      if(!isBlackKeyFromNoteNumber(note)){
        // 白
        add_y = isBlackKeyFromNoteNumber(note - 1) ? DRAW_KEYBOARD_BLACK_HEIGHT : DRAW_KEYBOARD_HEIGHT;
        isBlackKeyboard = false;
        key_h = DRAW_KEYBOARD_HEIGHT;
      }
      else{
        // 黒
        add_y = isBlackKeyFromNoteNumber(note - 1) ? DRAW_KEYBOARD_BLACK_HEIGHT : DRAW_KEYBOARD_HEIGHT;
        isBlackKeyboard = true;
        key_h = DRAW_KEYBOARD_BLACK_HEIGHT;
      }

      // 鍵盤
      let isEmit = KeyboardStatus[note] != null; // 発火中
      if(isEmit){
        if(isBlackKeyboard) {
          pg.fill(TRACK_COLORS[KeyboardStatus[note]])
          pg.rect(x,y,w,key_h);
          pg.fill(white)
        }
        else{
          pg.fill(TRACK_COLORS[KeyboardStatus[note]])
          pg.rect(x,y,w,key_h);
          pg.fill(black)
        }
      }
      else{
        if(isBlackKeyboard) {
          pg.fill(black)
          pg.rect(x,y,w,key_h);
          pg.fill(white)
        }
        else{
          pg.fill(white);
          pg.rect(x,y,w,key_h);
          pg.fill(black)
        }
      }
      
      drawNoteLabel(note, x + w - 4, y+key_h/2, true);
      
      y += add_y;
      note -= 1;
    }
  }

  // メイン演奏中はスクロール自動移動
  if(isPlayMainEmitter() && !scrollView.isControll()){
    // console.log("scrollView.isControll() = " + scrollView.isControll());
    setTimeSliderValue(getEmitterPlayTimeRate());
  }
  
  KeyboardStatus = {};

  scrollView.draw();
  rightScrollView.draw();

  updateWaveDrawers();

  pg.pop();

  postProcess.draw();

}

function drawAnalysis(analysis, offsetTime){
  if(!analysis) return false;
  let tracks = analysis.tracks;
  if(tracks.length == 0) return false;
  for(let i = 0; i < tracks.length; ++i){
    if(TrackVisibleSettings[i] == false) continue;
    let notes = tracks[i].notes;
    for(let j = 0; j < notes.length; ++j){
      let rangeIn = false;
      let note = notes[j];
      let baseTime =  analysis.getOneNoteTime(); // 1ノート幅の時間
      let noteTime = note.playbackTime - note.startTime;
      let duration = note.duration /* 音符の長さ */ * (note.quantize /* 音の長さ倍率 */ / 100);
      let noteLength = note.length;
      let length8 = noteLength * 2; // 8分音符が1マスの大きさ
      // 音が鳴っているか
      if(noteTime <= offsetTime && offsetTime <= noteTime + duration ) {
        rangeIn = true;
      }
      if(rangeIn){
        KeyboardStatus[note.noteNumber + note.key] = i
      }
      else{
        if(getNoteX(((noteTime + duration) - offsetTime) / baseTime) < 0) continue;
      }
      let right = 0;
      right = drawNote(note.trackNumber, offsetTime, noteTime , note.noteNumber + note.key, length8, baseTime, rangeIn);
      drawNoteLabel(note.noteNumber + note.key, getNoteX((noteTime - offsetTime) / baseTime) + 2, getNoteY(note.noteNumber + note.key) + DRAW_KEYBOARD_HEIGHT / 2, false, LEFT, color(0,0,0));
      if(right >= canvas.width) break;
      
      if(note.slur){
        let slurTime = noteTime + duration
        let prevX = getNoteX((noteTime - offsetTime) / baseTime);
        let prevY = getNoteY(note.noteNumber + note.key);
        note.slur.forEach(s => {
          duration += s.duration;
          right = drawNote(note.trackNumber, offsetTime, slurTime , s.noteNumber + note.key, (s.duration / baseTime), baseTime, rangeIn);
          drawNoteLabel(s.noteNumber + note.key, getNoteX((slurTime - offsetTime) / baseTime) + 2, getNoteY(s.noteNumber + note.key) + DRAW_KEYBOARD_HEIGHT / 2, false, LEFT, color(0,0,0));
          /*
          fill(TRACK_COLORS[note.trackNumber])
          let nextX = getNoteX((slurTime - offsetTime) / baseTime)
          let nextY = getNoteY(s.noteNumber + note.key)
          line(prevX, prevY, nextX, nextY)
          prevX = nextX
          prevY = nextY
          */
          slurTime += s.duration
        });
      }

    }
  }
  return true;
}

function getOneNoteWidth(){
  return DRAW_NOTE_WIDTH * getDrawNoteWidthRate();
}

function setDrawNoteWidthRate(rate){
  drawNoteWidthRate = rate;
}

function getDrawNoteWidthRate(){
  return drawNoteWidthRate;
}

function getDrawNoteWidthRateReverse(){
  return 1/drawNoteWidthRate;
}

function getNoteX(rate){
  return canvas.width / 2 + rate * getOneNoteWidth();
}

function getNoteY(noteNumber){
  return (DefaultNoteNumber - noteNumber) * DRAW_NOTE_HEIGHT
}

function drawNote(trackNumber, offsetTime, noteTime, noteNumber, length, oneNoteTime, rangeIn){
  let startPos = (noteTime - offsetTime) / oneNoteTime;
  let widthRate = length; // 8/8
  let noteColor = TRACK_COLORS[trackNumber];
  if(rangeIn) noteColor = color(red(noteColor) + 75,green(noteColor) + 75,blue(noteColor) + 75);
  let w = getOneNoteWidth() * widthRate;
  let h = DRAW_NOTE_HEIGHT;
  let x = getNoteX(startPos);
  let y = getNoteY(noteNumber);
  pg.fill(noteColor)
  pg.rect(x,y,w,h)
  //console.log("drawNote:" + x+","+y+","+w+","+h)
  return x + w // 右端の座標を返す
}

function drawNoteLabel(note, x,y, isOnlyC, align, col){
  if(!col) col = color(20,20,120);
  if(!align) align = RIGHT;
  pg.noStroke();
  //pg.textStyle(BOLD);
  pg.textSize(12);
  pg.textFont(bitFont);
  pg.fill(col);
  pg.textAlign(align,CENTER);
  let noteStr = ""
  switch(ScetchSettings.DrawNoteNumberType){
    case "note":{
      noteStr = mtoco(note);
    }break;
    case "number":{
      noteStr = "" + note;
    }break;
    default:{
      
    }
  }
  if(isOnlyC && mtoc(note) !== "C") noteStr = "";
  pg.text(noteStr, x, y-1);
  // text(noteStr, x + w - 4, y+key_h/2);
  pg.stroke(1);
}

function drawUpdate(){
  // loop();
}

function setVisibleTrack(index,flag){
  TrackVisibleSettings[index] = flag;
}

function mouseWheel(event) {
  // canvas外は操作を受け付けない
  if(0 <= mouseX && mouseX <= canvas.width && 0 <= mouseY && mouseY <= canvas.height){
    // スクロール量を変更
    if(event.delta > 0){
      DefaultNoteNumber -= 4;
      DefaultNoteNumber = Math.max(NOTE_NUMBER_MIN, DefaultNoteNumber);
      updateRightScroll();
    }
    else if(event.delta < 0){
      DefaultNoteNumber += 4;
      DefaultNoteNumber = Math.min(NOTE_NUMBER_MAX, DefaultNoteNumber);
      updateRightScroll();
    }
  }
}

function keyPressed(){
  // canvas外は操作を受け付けない
  if(0 <= mouseX && mouseX <= canvas.width && 0 <= mouseY && mouseY <= canvas.height + 20){
    let analysis = G_NoteAnalysis;
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
      let offsetTime = getEmitterCurrentPlayTime();
      let oneNoteTime = analysis.getOneNoteTime();
      let rate = oneNoteTime/getEndTime();
      let offset = (offsetTime%oneNoteTime);
      let way = keyCode === LEFT_ARROW ? -1 : 1
      if(Math.abs(offset) < oneNoteTime * 0.1){
        scrollViewValue += rate * way;
      }
      else{
        if(way < 0) scrollViewValue -= offset/getEndTime();
        else scrollViewValue += (oneNoteTime-offset)/getEndTime();
      }
      updateBottomtScroll();
    }

    if (keyCode === UP_ARROW) {
      DefaultNoteNumber -= 1;
      DefaultNoteNumber = Math.max(NOTE_NUMBER_MIN, DefaultNoteNumber);
      updateRightScroll();
    }

    if (keyCode === DOWN_ARROW) {
      DefaultNoteNumber += 1;
      DefaultNoteNumber = Math.min(NOTE_NUMBER_MAX, DefaultNoteNumber);
      updateRightScroll();
    }
  }
}

function resetViewValue(){
  if(!scrollView){
    return;
  }
  setTimeSliderValue(0);
  setRepeatStartTime(-1);
  setRepeatEndTime(-1);
  setEnableRepeat(false);
}

function initScrollView(){
  scrollView = new ScrollHelper(0, DRAW_SCROLL_VIEW_Y, canvas.width, DRAW_SCROLL_HEIGHT, false, onChangeTimeRateScroll, onChangeTimeRateScrollEnded);
  rightScrollView = new ScrollHelper(canvas.width - DRAW_RIGHT_SCROLL_WIDTH, 0, DRAW_RIGHT_SCROLL_WIDTH, DRAW_NOTE_CANVAS_HEIGHT, true, onChangeNoteScroll, onChangeNoteScrollEnded);
  updateRightScroll();

  let isRunning = false;
  scrollView.on("press", () => {
    isRunning = isPlayMainEmitter();
    stop();
  });
  scrollView.on("scrollEnded", (x,y)=>{
    if(isRunning) start();
    isRunning = false;
  });
}

function initNoteLineView(){
  repeatStartLineView = new NoteLine(2,DRAW_NOTE_CANVAS_HEIGHT, color(255,255,255));
  repeatEndLineView = new NoteLine(2,DRAW_NOTE_CANVAS_HEIGHT, color(255,255,255));
  playLineView = new NoteLine(1, DRAW_NOTE_CANVAS_HEIGHT, color(255,255,255));
  splitLineViews = [];
  for(let i = 0; i < 200; ++i){
    splitLineViews.push(new NoteLine(1, DRAW_NOTE_CANVAS_HEIGHT, color(255,255,255,60)));
  }
}
function drawNoteLineView(analysis, offsetTime){
  let start = getRepeatStartTime();
  let end = getRepeatEndTime();
  let oneNoteTime = analysis.getOneNoteTime();
  repeatStartLineView.visible = start >= 0;
  repeatEndLineView.visible = end >= 0;
  
  let start_x = getNoteX((start - offsetTime) / oneNoteTime);
  let end_x = getNoteX((end - offsetTime) / oneNoteTime);
  repeatStartLineView.x = start_x;
  repeatEndLineView.x = end_x;

  repeatStartLineView.draw();
  repeatEndLineView.draw();

  
  // 再生範囲だけを明るくする
  {
    pg.fill(0,0,0,64)
    if(start_x > 0){
      pg.rect(DRAW_KEYBOARD_WIDTH,0,start_x-DRAW_KEYBOARD_WIDTH,DRAW_NOTE_CANVAS_HEIGHT);
    }
    if(end_x+2 < canvas.width){
      pg.rect(end_x+2,0,canvas.width - end_x,DRAW_NOTE_CANVAS_HEIGHT);
    }
  }

  drawNoteSplitLineView(analysis, offsetTime);

  playLineView.x = canvas.width / 2;
  playLineView.draw();

}
function drawNoteSplitLineView(analysis, offsetTime){
  let start = 0;
  let end = getRepeatEndTime();
  let last = getEndTime();
  let oneNoteTime = analysis.getOneNoteTime();

  let start_x = getNoteX((start - offsetTime) / oneNoteTime);
  let end_x = getNoteX((end - offsetTime) / oneNoteTime);
  let last_x = getNoteX((last - offsetTime) / oneNoteTime);

  repeatStartLineView.draw();
  repeatEndLineView.draw();

  let now_x = start_x;
  let index = 0;
  let sumIndex = 0;
  while(now_x <= last_x && now_x <= canvas.width && index < splitLineViews.length){
    
    // 細かい線を描画
    for(let i = 0; i < 4; ++i){
      if(now_x >= 0 && index < splitLineViews.length){
        let view = splitLineViews[index];
        view.visible = true;
        view.x = now_x;
        view.color = i == 0 ? color(0,0,0,120) : color(0,0,0,30);
        view.draw();
        index++;
        // 区切りの太い線
        if(i == 0){
          drawLineLabel("" +  Math.floor(sumIndex / 4 + 0.2) ,now_x + 4, -2);
        }
      }
      sumIndex++;
      now_x += getOneNoteWidth();
    }
  }

  // 細かい線
  for(let i = index; i < splitLineViews.length; ++i){
    let view = splitLineViews[index];
    view.visible = false;
    view.draw();
  }

}
function drawLineLabel(str, x,y, col){
  if(!col) col = color(255,255,255,120);
  pg.noStroke();
  pg.textSize(12);
  pg.textFont(bitFont);
  pg.fill(col);
  pg.textAlign(LEFT,TOP);
  pg.text(str, x, y);
  pg.stroke(1);
}

function setRepeatStartTime(time){
  repeatStartTime = time;
}
function setRepeatEndTime(time){
  repeatEndTime = time;
}
function getRepeatStartTime(){
  if(!G_NoteAnalysis) return 0;
  if(!isEnableRepeat()){
    return 0;
  }
  return repeatStartTime < 0 ? 0 : repeatStartTime;
}
function getRepeatEndTime(){
  if(!G_NoteAnalysis) return -1;
  if(!isEnableRepeat()){
    return G_NoteAnalysis.getDuration();
  }
  return repeatEndTime < 0 ? G_NoteAnalysis.getDuration() : repeatEndTime;
}
function getEndTime(){
  if(!G_NoteAnalysis) return -1;
  return G_NoteAnalysis.getDuration();
}
function isSetRepeatStartTime(){
  return repeatStartTime > 0;
}
function isSetRepeatEndTime(){
  return repeatEndTime >= 0;
}
function setEnableRepeat(flag){
  enableRepeat = flag;
}
function isEnableRepeat(){
  return enableRepeat;
}

function onChangeTimeRateScroll(x,y){
  scrollViewValue = x;
}
function onChangeTimeRateScrollEnded(x,y){
  scrollViewValue = x;
}
function getTimeSliderValue(){
  return scrollViewValue;
}
function setTimeSliderValue(value){
  scrollViewValue = value;
  scrollView.setScrollRate(scrollViewValue, 0);
}
function updateBottomtScroll(){
  scrollViewValue = Math.max(0.0, Math.min(1.0, scrollViewValue));
  scrollView.setScrollRate(scrollViewValue,0);
}

function onChangeNoteScroll(x,y){
  rightScrollViewValue = y;
  DefaultNoteNumber = Math.floor((NOTE_NUMBER_MAX - NOTE_NUMBER_MIN) * (1.0 - rightScrollViewValue)) + NOTE_NUMBER_MIN;
  DefaultNoteNumber = Math.max(NOTE_NUMBER_MIN, DefaultNoteNumber);
  DefaultNoteNumber = Math.min(NOTE_NUMBER_MAX, DefaultNoteNumber);
}
function updateRightScroll(){
  rightScrollViewValue = 1.0 - (DefaultNoteNumber - NOTE_NUMBER_MIN) / (NOTE_NUMBER_MAX - NOTE_NUMBER_MIN);
  rightScrollView.setScrollRate(0,rightScrollViewValue);
}
function onChangeNoteScrollEnded(x,y){
  rightScrollViewValue = y;
}
function getNoteSliderValue(){
  return rightScrollViewValue;
}
function isVisibleTrack(trackNumber){
  if(trackNumber<TrackVisibleSettings.length) return TrackVisibleSettings[trackNumber];
  return false;
}