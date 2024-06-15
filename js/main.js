
const audioContext = new AudioContext();
var mmlEmitter = null;
var mmlEditEmitter = null
var lastEditNote = null

var mmlFilePath = null;

var mmlEditor = new MMLEditor();

function getEmitterCurrentPlayTime(){
  if(mmlEmitter == null || mmlEmitter.scheduler == null) return 0;
  return getEmitterCurrentTime() - WAIT_SEC;
}

function getEmitterCurrentTime(){
  if(mmlEmitter == null || mmlEmitter.scheduler == null) return 0;
  return mmlEmitter.scheduler.currentTime - mmlEmitter._startTime;
}

function getEmitterCurrentLength(){
  if(mmlEmitter == null) return 0;
  return mmlEmitter.currentLength;
}

function restart(){
  drawUpdate();
  start();
}

var newFile = async () => {

  stop();
  mmlEditor.clear();
  G_NoteAnalysis.clear();
  drawUpdate();

  await loadFileAsync('mml/template.mml', (txt) => {
    mmlEditor.initEditor();
    mmlEditor.editor.setValue(txt);
    console.log(txt);
  });
};

function saveLocalStorage(){
  let content = mmlEditor.editor.getValue();
  localStorage.setItem("work.mml", content);
  drawUpdate();
  return true;
}

function loadLocalStorage(){
  if(localStorage.getItem("work.mml")){
    let content = localStorage.getItem("work.mml")
    if(content != null){
      mmlEditor.editor.setValue(content, -1);  // -1はカーソルをファイルの先頭に戻す
      drawUpdate();
      return true;
    }
  }
  return false;
}

function download(){
  var content = mmlEditor.editor.getValue();
  var blob = new Blob([content], { type: 'text/plain' });
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'file.mml';
  link.click();
  
  drawUpdate();
}

function exportFile(){
  const constgetNewFileHandle = async () => {
      // ファイル保存ダイアログを表示して FileSystemFileHandle オブジェクトを取得
    const fh = await window.showSaveFilePicker({ suggestedName: mmlFilePath == null ? "export.mml" : mmlFilePath });
    
    // FileSystemWritableFileStream オブジェクトを取得
    const stream = await fh.createWritable();
  
    // テキストデータの Blob オブジェクトを生成
    const content = mmlEditor.editor.getValue();
    const blob = new Blob([content], { type: 'text/plain' });
  
    // テキストデータをファイルに書き込む
    await stream.write(blob);
  
    // ファイルを閉じる
    await stream.close();
  
    // 保存されたファイルのファイル名をコンソールに出力
    console.log(fh.name);
  }
  constgetNewFileHandle();
}

function loadFile(txt){
  var mmlFilePath = txt;
  mmlEditor.editor.setValue(txt, -1);  // -1はカーソルをファイルの先頭に戻す
  drawUpdate();
  start();
}

function start(){
  stop();
  play(mmlEditor.editor.getValue());
}

function stop(){
  if(mmlEmitter == null) return;
  mmlEditor.resetLogAll();
  stopTracks(tracks);
  stopTracks(editTracks);
  if(mmlEmitter != null && mmlEmitter.state == "running"){
    mmlEmitter.stop();
  }
  mmlEmitter = null;
}

function play(mml) {

  try{
    var config = { context: audioContext };
    mmlEmitter = new MMLEmitter(mml, config);
    G_NoteAnalysis.analysis(mml, config);
  
    mmlEmitter.on("note", function(e) {
      mmlEditor.soundLog(e.trackNumber, mtoco(e.noteNumber + e.key) + " ")
      //console.log("NOTE: " + JSON.stringify(e));
      playNoteTone(e);
    });
    mmlEmitter.on("end:all", function(e) {
      //console.log("END : " + JSON.stringify(e));
      mmlEmitter.stop();
    });
  
    mmlEmitter.start();
  
    drawUpdate();
  }catch(e){
    return;
  }
}

// 一時的に鳴らす用
function editPlay(mml, playLine){

  try{
    stopTracks(editTracks);

    var config = { context: audioContext };
    let lastNote = null;
    let notMuteNotes = []
    mmlEditEmitter = new MMLEmitter(mml, config);
    mmlEditEmitter.on("note", function(e) {
      if(!e.mute){
        notMuteNotes.push(JSON.parse(JSON.stringify(e)))
      }
      lastNote = JSON.parse(JSON.stringify(e))
    });
    mmlEditEmitter.on("end:all", function(e) {
      mmlEditEmitter.stop();
      if(playLine){
        G_NoteAnalysis.clear();
        let firstPlaybackTime = -1;
        let firstLength = -1;
        notMuteNotes.forEach(note => {
          if(firstPlaybackTime == -1){
            firstPlaybackTime = note.playbackTime;
            firstLength = note.currentLength;
          }
          note.mute = false;
          let dt = (note.playbackTime - firstPlaybackTime);
          note.playbackTime = Tone.context.currentTime + dt;
          note.currentLength = note.currentLength - firstLength;
          //console.log(note)
          G_NoteAnalysis.add(firstPlaybackTime, JSON.parse(JSON.stringify(note)));
          playEditNoteTone(note);
        });
      }
      else{
        if(lastNote != null){
          lastNote.mute = false;
          lastNote.playbackTime = Tone.context.currentTime;
          lastNote.currentLength = 0;
          //console.log(lastNote)
          playEditNoteTone(lastNote);
        }
      }
    });
  
    mmlEditEmitter.start();
    mmlEditEmitter.scheduler.demo(mmlEditEmitter._startTime, mmlEditEmitter._startTime + 60*10);
    mmlEditEmitter = null
  }catch(e){
    return;
  }
}

var tracks = []
var editTracks = []

function stopTracks(_tracks){
  for(let i = 0; i < _tracks.length; ++i){
    _tracks[i].stop();
  }
}

function createTrackSounds(){
  return [
    new TrackSound(new TrackSoundPulse()),
    new TrackSound(new TrackSoundPulse()),
    new TrackSound(new TrackSoundWave()),
    new TrackSound(new TrackSoundNoise()),
    new TrackSound(new TrackSoundSource()),
    new TrackSound(new TrackSoundSource()),
    new TrackSound(new TrackSoundSource()),
    new TrackSound(new TrackSoundSource()),
  ]
}

function playNoteTone(e){
  var track = tracks[e.trackNumber];
  track.playNote(e);
}

function playEditNoteTone(e){
  var track = editTracks[e.trackNumber];
  track.playNote(e);
}

function initDocument(){
  document.getElementById('fileInput').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var content = e.target.result;
            loadFile(content);
        };
        reader.readAsText(file);
    }
  });
}

function setVisibleTrack(index, flag){
}

function waitForCondition(conditionFunction, interval = 1000) {
  return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
          if (conditionFunction()) {
              clearInterval(intervalId);
              resolve(true);
          }
      }, interval);
  });
}
var autoPlay = async () => {
  await Tone.start(); // Tone.jsが使用できるようになるまで待機
  
  await createAudioBuffer();
  createNoiseBuffer(); // noise生成
  tracks = createTrackSounds();
  editTracks = createTrackSounds();

  await new Promise(resolve => setTimeout(resolve, 100))

  mmlEditor.initEditor();
  mmlEditor.setPlayEditNoteFunc(editPlay);

  if(!loadLocalStorage()){
    await loadFileAsync('mml/test.mml', (txt) => {
      editor.insert(txt);
      console.log(txt);
    });
  }

  initDocument();

  start();
};
autoPlay();