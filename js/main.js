
var audioContext = null;
var mmlEmitter = null;
var mmlEditEmitter = null
var lastEditNote = null

var mmlFilePath = null;

var mmlEditor = new MMLEditor();

var finishedInitAudio = false;

var playEmitterStartTime = 0;

var tracks = []
var editTracks = []

function getEmitterCurrentPlayTime(){
  return getEmitterCurrentTime() - WAIT_SEC;
}

function getEmitterCurrentTime(){
  if(mmlEmitter != null && mmlEmitter.scheduler != null) return mmlEmitter.scheduler.currentTime - playEmitterStartTime;
  if(isActiveTracks(editTracks)){
    return Tone.now() - playEmitterStartTime;
  }
  return 0;
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
  let result = window.confirm('新規作成\n現在編集中のデータは削除されます。よろしいですか？');
  if(!result){
    return;
  }

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

function deleteLocalStorage(){
  let result = window.confirm('データ削除\nローカルストレージに保存されている作業データを削除します。よろしいですか？');
  if(result){
    mmlEditor.editor.setValue("");
    localStorage.removeItem("work.mml");
    drawUpdate();
    return true;
  }
  else{
  }
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
  if(mmlEmitter != null) {
    mmlEditor.resetLogAll();
    stopTracks(tracks);
    stopTracks(editTracks);
    if(mmlEmitter != null && mmlEmitter.state == "running"){
      mmlEmitter.stop();
    }
    mmlEmitter = null;
    return;
  }
}

function play(mml) {

  setupAudioAsync(() => {
    try{
      var config = { context: Tone.context };
      mmlEmitter = new MMLEmitter(mml, config);
      G_NoteAnalysis.analysis(mml, config);
    
      mmlEmitter.on("note", function(e) {
        mmlEditor.soundLog(e.trackNumber, mtoco(e.noteNumber + e.key) + " ")
        //console.log("NOTE: " + JSON.stringify(e));
        playNote(e);
      });
      mmlEmitter.on("end:all", function(e) {
        //console.log("END : " + JSON.stringify(e));
        mmlEmitter.stop();
      });
    
      mmlEmitter.start();
      playEmitterStartTime = mmlEmitter._startTime;
    
      drawUpdate();
    }catch(e){
      console.log(e);
      return;
    }
  });
}

// 一時的に鳴らす用
function editPlay(mml, playLine){

  setupAudioAsync(() => {
    try{
      stopTracks(editTracks);
  
      var config = { context: Tone.context };
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
          playEmitterStartTime = Tone.context.currentTime
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
            G_NoteAnalysis.add(playEmitterStartTime, JSON.parse(JSON.stringify(note)));
            playEditNote(note);
          });
        }
        else{
          if(lastNote != null){
            G_NoteAnalysis.clear();
            playEmitterStartTime = Tone.context.currentTime
            lastNote.mute = false;
            lastNote.playbackTime = Tone.context.currentTime;
            lastNote.currentLength = 0;
            //console.log(lastNote)
            G_NoteAnalysis.add(playEmitterStartTime, JSON.parse(JSON.stringify(lastNote)));
            playEditNote(lastNote);
          }
        }
      });
    
      mmlEditEmitter.start();
      mmlEditEmitter.scheduler.demo(mmlEditEmitter._startTime, mmlEditEmitter._startTime + 60*10);
      mmlEditEmitter = null
    }catch(e){
      console.log(e);
      return;
    }
  });
}


function stopTracks(_tracks){
  for(let i = 0; i < _tracks.length; ++i){
    _tracks[i].stop();
  }
}

function isActiveTracks(_tracks){
  for(let i = 0; i < _tracks.length; ++i){
    if(_tracks[i].isActive()) return true;
  }
  return false;
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

function playNote(e){
  var track = tracks[e.trackNumber];
  track.playNote(e);
}

function playEditNote(e){
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

// 初期化操作
var setupAudioAsync = async (callback) => {

  //console.log("setupAudioAsync check");

  if(finishedInitAudio) {
    if(callback != null) callback();
    return;
  }

  //console.log("setupAudioAsync");

  //if(audioContext == null) audioContext = new AudioContext();

  await Tone.start(); // Tone.jsが使用できるようになるまで待機
  
  await createAudioBuffer();
  createNoiseBuffer(); // noise生成
  
  tracks = createTrackSounds();
  editTracks = createTrackSounds();

  finishedInitAudio = true;

  if(callback != null) callback();
}

var initPage = async () => {

  await new Promise(resolve => setTimeout(resolve, 100))

  mmlEditor.initEditor();
  mmlEditor.setPlayEditNoteFunc(editPlay);

  if(!loadLocalStorage()){
    await loadFileAsync('mml/template.mml', (txt) => {
      mmlEditor.editor.setValue(txt, -1);
      console.log(txt);
    });
  }

  initDocument();

  mmlEditor.setEnableEditPlay(true);

  // start();
};
initPage();