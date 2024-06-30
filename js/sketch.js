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
let TRACK_COLORS = []

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
let repeatStartLineView = null;
let repeatEndLineView = null;
let repeatStartTime = -1;
let repeatEndTime = -1;

function setup() {
  DRAW_NOTE_CANVAS_HEIGHT = windowHeight * 0.4 - DRAW_SCROLL_HEIGHT;
  DRAW_SCROLL_VIEW_Y = DRAW_NOTE_CANVAS_HEIGHT;
  canvas = createCanvas(windowWidth - 20, windowHeight * 0.4);
  TRACK_COLORS = [
    color(0, 155, 255),
    color(255, 155, 0),
    color(155, 255, 0),
    color(255, 45, 45),
    color(102, 134, 166),
    color(237, 100, 71),
    color(255, 255, 255),
    color(255, 255, 255),
    color(255, 255, 255),
    color(255, 255, 255),
  ]

  initScrollView();
  initNoteLineView();

  // gui setup
  // var gui = new dat.GUI();
  // gui.addFolder("Tracks");
}

//ウィンドウサイズが変更されたときに実行される関数
function windowResized() {
  DRAW_NOTE_CANVAS_HEIGHT = windowHeight * 0.4 - DRAW_SCROLL_HEIGHT;
  DRAW_SCROLL_VIEW_Y = DRAW_NOTE_CANVAS_HEIGHT;
  resizeCanvas(windowWidth - 20, windowHeight * 0.4);

  initScrollView();
  initNoteLineView();
}

function draw() {
  background(220);

  let offsetTime = getEmitterCurrentPlayTime();
  
  let w = DRAW_KEYBOARD_WIDTH;
  let h = DRAW_NOTE_HEIGHT;
  let x = 0;
  let y = 0;
  let note_w = DRAW_NOTE_WIDTH;
  let add_y = 0;
  let note = DefaultNoteNumber;
  let note_types = [0,1,0,1,0,0,1,0,1,0,1,0];
  let white = color(255, 255, 255);
  let black = color(0,0,0);
  let emit = color(0,0,255);
  let note_back_color = color(100,100,100)
  let note_back_black_color = color(50,50,50)
  let isBlackKeyboard = false;

  stroke(1);
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
        fill(note_back_black_color)
      }
      else{
        fill(note_back_color)
      }
      for(let n = 0; n < 1; ++n){
        strokeWeight(0.2)
        let draw_note_w = Math.min(canvas.width - DRAW_KEYBOARD_WIDTH,note_w*100);
        rect(side_x,y,draw_note_w,h)
        strokeWeight(1)
        side_x += note_w*100
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
  drawNoteLineView(G_NoteAnalysis, offsetTime);
  
  // 鍵盤描画
  stroke(1);
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
          fill(TRACK_COLORS[KeyboardStatus[note]])
          rect(x,y,w,key_h);
          fill(white)
        }
        else{
          fill(TRACK_COLORS[KeyboardStatus[note]])
          rect(x,y,w,key_h);
          fill(black)
        }
      }
      else{
        if(isBlackKeyboard) {
          fill(black)
          rect(x,y,w,key_h);
          fill(white)
        }
        else{
          fill(white);
          rect(x,y,w,key_h);
          fill(black)
        }
      }
      
      noStroke();
      textStyle(BOLD);
      textSize(10);
      fill(color(20,20,120));
      textAlign(RIGHT,CENTER);
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
      if(mtoc(note) !== "C") noteStr = "";
      text(noteStr, x + w - 4, y+key_h/2);
      stroke(1);
      
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
      if(note.slur){
        note.slur.forEach(s => {
          duration += s.duration;
          length8 += (s.duration / baseTime);
        });
      }
      // 音が鳴っているか
      if(noteTime <= offsetTime && offsetTime <= noteTime + duration ) {
        rangeIn = true;
      }
      if(rangeIn){
        KeyboardStatus[note.noteNumber + note.key] = i
      }
      else{
        if(getNoteX((noteTime - offsetTime) / baseTime) < 0) continue;
      }
      let right = drawNote(note.trackNumber, offsetTime, noteTime , note.noteNumber + note.key, length8, baseTime);
      if(right >= canvas.width) break;
    }
  }
  return true;
}

function getNoteX(rate){
  return canvas.width / 2 + rate * DRAW_NOTE_WIDTH
}

function getNoteY(noteNumber){
  return (DefaultNoteNumber - noteNumber) * DRAW_NOTE_HEIGHT
}

function drawNote(trackNumber, offsetTime, noteTime, noteNumber, length, oneNoteTime){
  let startPos = (noteTime - offsetTime) / oneNoteTime;
  let widthRate = length; // 8/8
  let noteColor = TRACK_COLORS[trackNumber];
  let w = DRAW_NOTE_WIDTH * widthRate;
  let h = DRAW_NOTE_HEIGHT;
  let x = getNoteX(startPos);
  let y = getNoteY(noteNumber);
  fill(noteColor)
  rect(x,y,w,h)
  //console.log("drawNote:" + x+","+y+","+w+","+h)
  return x + w // 右端の座標を返す
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

function resetViewValue(){
  setTimeSliderValue(0);
  setRepeatStartTime(-1);
  setRepeatEndTime(-1);
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
    fill(0,0,0,64)
    if(start_x > 0){
      rect(DRAW_KEYBOARD_WIDTH,0,start_x-DRAW_KEYBOARD_WIDTH,DRAW_NOTE_CANVAS_HEIGHT);
    }
    if(end_x+2 < canvas.width){
      rect(end_x+2,0,canvas.width - end_x,DRAW_NOTE_CANVAS_HEIGHT);
    }
  }

  playLineView.x = canvas.width / 2;
  playLineView.draw();

}
function setRepeatStartTime(time){
  repeatStartTime = time;
}
function setRepeatEndTime(time){
  repeatEndTime = time;
}
function getRepeatStartTime(){
  if(!G_NoteAnalysis) return 0;
  return repeatStartTime < 0 ? 0 : repeatStartTime;
}
function getRepeatEndTime(){
  if(!G_NoteAnalysis) return -1;
  return repeatEndTime < 0 ? G_NoteAnalysis.getDuration() : repeatEndTime;
}
function isSetRepeatStartTime(){
  return repeatStartTime > 0;
}
function isSetRepeatEndTime(){
  return repeatEndTime >= 0;
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