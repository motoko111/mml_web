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

var DRAW_NOTE_CANVAS_HEIGHT = 400 // ノートを描画するサイズ
var DRAW_KEYBOARD_WIDTH = 100 // キーボードのサイズ
var DRAW_KEYBOARD_HEIGHT = 10 // キーボードのサイズ
var DRAW_NOTE_WIDTH = 20 // ノートのサイズ
var DRAW_NOTE_HEIGHT = 10 // ノートのサイズ
var DefaultNoteNumber = 69 + 12 * 1 // ノートの基準
const NOTE_NUMBER_MAX = 69 + 12 * 8;
const NOTE_NUMBER_MIN = 69 - 12 * 4 - 5 + 12 * 4;
var TRACK_COLORS = []

var TrackVisibleSettings = [true,true,true,true,true,true,true,true,true,true]
var ScetchSettings = {
  "DrawNoteNumberType":"note", // note/number/none
}
var KeyboardStatus = new Map();
var HScroll = null;
var VScroll = null;

function setup() {
  DRAW_NOTE_CANVAS_HEIGHT = windowHeight * 0.4;
  canvas = createCanvas(windowWidth, windowHeight * 0.4);
  TRACK_COLORS = [
    color(0, 155, 255),
    color(255, 155, 0),
    color(155, 255, 0),
    color(255, 45, 45),
    color(255, 255, 255),
    color(255, 255, 255),
    color(255, 255, 255),
    color(255, 255, 255),
    color(255, 255, 255),
    color(255, 255, 255),
  ]

  // gui setup
  var gui = new dat.GUI();
  gui.addFolder("Tracks")
}

//ウィンドウサイズが変更されたときに実行される関数
function windowResized() {
  DRAW_NOTE_CANVAS_HEIGHT = windowHeight * 0.4;
  resizeCanvas(windowWidth, windowHeight * 0.4);
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
  let note_back_color = color(200,200,200)
  let note_back_black_color = color(150,150,150)
  let isBlackKeyboard = false;

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
        rect(side_x,y,note_w*100,h)
        strokeWeight(1)
        side_x += note_w*100
      }
      
      y += add_y;
      note -= 1;
    }
  }

  // ノート描画
  if(G_NoteAnalysis != null){
    // console.log("test" + offsetTime);
    let tracks = G_NoteAnalysis.tracks;
    for(let i = 0; i < tracks.length; ++i){
      if(TrackVisibleSettings[i] == false) continue;
      let notes = tracks[i].notes;
      for(let j = 0; j < notes.length; ++j){
        let note = notes[j];
        let baseTime =  60 / note.tempo * (4 / 8); // 1ノート幅の時間
        let noteTime = note.playbackTime - note.startTime;
        // console.log("test" + note.startTime)
        // let startLen = note.currentLength / 2 / 2 / 2 / 2 ; // 128分刻み⇒8分刻みに変更
        if(noteTime < offsetTime - 2.0) continue;
        let duration = note.duration /* 音符の長さ */ * (note.quantize /* 音の長さ倍率 */ / 100);
        // 音が鳴っているか
        if(noteTime <= offsetTime && offsetTime <= noteTime + duration ) {
          KeyboardStatus[note.noteNumber + note.key] = i
        }
        let right = drawNote(note.trackNumber, offsetTime, noteTime , note.noteNumber + note.key, note.length, baseTime);
        if(right >= windowWidth) break;
      }
    }
  }
  
  // 鍵盤描画
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

      // 鍵盤
      let isEmit = KeyboardStatus[note] != null; // 発火中
      if(isEmit){
        if(isBlackKeyboard) {
          fill(TRACK_COLORS[KeyboardStatus[note]])
          rect(x,y,w,h);
          fill(white)
        }
        else{
          fill(TRACK_COLORS[KeyboardStatus[note]])
          rect(x,y,w,h);
          fill(black)
        }
      }
      else{
        if(isBlackKeyboard) {
          fill(black)
          rect(x,y,w,h);
          fill(white)
        }
        else{
          fill(white);
          rect(x,y,w,h);
          fill(black)
        }
      }
      
      textSize(8)
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
      text(noteStr, x + w - 4, y+h/2);
      
      y += add_y;
      note -= 1;
    }
  }
  
  KeyboardStatus = {};
}

function getNoteX(rate){
  return DRAW_KEYBOARD_WIDTH + rate * DRAW_NOTE_WIDTH
}

function getNoteY(noteNumber){
  return (DefaultNoteNumber - noteNumber) * DRAW_NOTE_HEIGHT
}

function drawNote(trackNumber, offsetTime, noteTime, noteNumber, length, oneNoteTime){
  let startPos = (noteTime - offsetTime) / oneNoteTime;
  let widthRate = (8 / length); // 8/8
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
  // スクロール量を変更
  if(event.delta > 0){
    DefaultNoteNumber -= 4;
    DefaultNoteNumber = Math.max(NOTE_NUMBER_MIN, DefaultNoteNumber);
  }
  else if(event.delta < 0){
    DefaultNoteNumber += 4;
    DefaultNoteNumber = Math.min(NOTE_NUMBER_MAX, DefaultNoteNumber);
  }
}