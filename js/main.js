
var audioContext = null;
var mmlEmitter = null;
var mmlEditEmitter = null;
var lastEditNote = null;

var mmlFilePath = null;

var mmlEditor = new MMLEditor();
var midiKeyboard = new MidiKeyboard();

var finishedInitAudio = false;

var playEmitterStartTime = 0;
var playEditEmitterStartTime = 0;

var tracks = [];
var editTracks = [];
var waveDrawers = [];

var playButton = null;
var stopButton = null;
var prevPlayMainEmitter = undefined;

function getEmitterCurrentPlayTime(){
  let time = getEmitterCurrentTime();
  if(time < 0){
    // スライダーの位置を優先する
    let timeRate = getTimeSliderValue();
    return G_NoteAnalysis.getDuration() * timeRate;
  }
  return time - WAIT_SEC;
}

function getEmitterCurrentTime(){
  if(mmlEmitter != null && mmlEmitter.scheduler != null) return mmlEmitter.scheduler.currentTime - playEmitterStartTime;
  if(isActiveTracks(editTracks)){
    return getCurrentTime() - playEditEmitterStartTime;
  }
  return -1;
}

function getEmitterCurrentLength(){
  if(mmlEmitter == null) return 0;
  return mmlEmitter.currentLength;
}

function getEmitterPlayTimeRate(){
  if(isPlayMainEmitter()){
    return getEmitterCurrentTime() / G_NoteAnalysis.getDuration();
  }
  return 0;
}

function isPlayMainEmitter(){
  return mmlEmitter != null && mmlEmitter.scheduler != null;
}

function isPlayEditEmitter(){
  return isActiveTracks(editTracks);
}

function restart(){
  drawUpdate();
  start();
}

function reset(){
  resetViewValue(); 
}

var newFile = async () => {
  let result = window.confirm('新規作成\n現在編集中のデータは削除されます。よろしいですか？');
  if(!result){
    return;
  }

  stop();
  mmlEditor.clear();
  G_NoteAnalysis.clear();
  reset();
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
  popup("ローカルストレージにデータを保存しました。");
  return true;
}

function deleteLocalStorage(){
  let result = window.confirm('データ削除\nローカルストレージに保存されている作業データを削除します。よろしいですか？');
  if(result){
    mmlEditor.editor.setValue("");
    localStorage.removeItem("work.mml");
    reset();
    drawUpdate();
    popup("ローカルストレージのデータを削除しました。");
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
      analysisMML(content);
      reset();
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
  exportFileAsync();
}

const exportFileAsync = async () => {
  try{
  // ファイル保存ダイアログを表示して FileSystemFileHandle オブジェクトを取得
  const fh = await window.showSaveFilePicker({ suggestedName: mmlFilePath == null ? "export.mml" : mmlFilePath });

  // FileSystemWritableFileStream オブジェクトを取得
  const stream = await fh.createWritable();
  
  saveLocalStorage();
  
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
  catch(e){
  }
}

function loadFile(txt){
  mmlEditor.editor.setValue(txt, -1);  // -1はカーソルをファイルの先頭に戻す
  analysisMML(txt);
  drawUpdate();
}

function start(){
  stop();
  play(mmlEditor.editor.getValue(), getTimeSliderValue());
  updateIcon();
}

function rewind(forcePlay){
  if(isEnableRepeat()){
    repeatRewind(forcePlay);
  }
  else{
    let isPlay = isPlayMainEmitter();
    stop();
    setTimeSliderValue(0);
    if(forcePlay || isPlay) start();
    updateIcon();
  }
}

function repeatRewind(forcePlay){
  let isPlay = isPlayMainEmitter();
  stop();
  setTimeSliderValue(getRepeatStartTime() / G_NoteAnalysis.getDuration());
  if(forcePlay || isPlay) start();
  updateIcon();
}

function stop(){
  
  stopTracks(editTracks);

  if(mmlEmitter) {
    mmlEditor.resetLogAll();
    stopTracks(tracks);
    if(mmlEmitter != null){
      mmlEmitter.stop();
    }
    mmlEmitter = null;
    return;
  }
  updateIcon();
}

function setRepeatStart(){
  if(G_NoteAnalysis){
    setRepeatStartTime(G_NoteAnalysis.getDuration() * getTimeSliderValue());
    if(getRepeatEndTime() >= 0 && getRepeatStartTime() > getRepeatEndTime()){
      setRepeatEnd();
    }
    setEnableRepeatMode(true);
  }
}

function setRepeatEnd(){
  if(G_NoteAnalysis){
    setRepeatEndTime(G_NoteAnalysis.getDuration() * getTimeSliderValue());
    if(getRepeatStartTime() >= 0 && getRepeatEndTime() < getRepeatStartTime()){
      setRepeatStart();
    }
    setEnableRepeatMode(true);
  }
}

function resetRepeat(){
  setRepeatStartTime(-1);
  setRepeatEndTime(-1);
}

function setEnableRepeatMode(flag){

  setEnableRepeat(flag);

  enableButton = document.getElementById("repeatEnableButton");
  disableButton = document.getElementById("repeatDisableButton");
  if(flag){
    enableButton.classList.remove('hidden');
    disableButton.classList.add('hidden');
  }
  else{
    enableButton.classList.add('hidden');
    disableButton.classList.remove('hidden');
  }
}

function updateIcon(){
  
  playButton = document.getElementById("playButton");
  stopButton = document.getElementById("stopButton");
  if(prevPlayMainEmitter == undefined || isPlayMainEmitter() != prevPlayMainEmitter){
    if(isPlayMainEmitter()){
      playButton.classList.add('hidden');
      stopButton.classList.remove('hidden');
    }
    else{
      playButton.classList.remove('hidden');
      stopButton.classList.add('hidden');
    }
  }
  prevPlayMainEmitter = isPlayMainEmitter();
}

function mutePlay(mml, startTime){
  var config = { context: Tone.context };
  config.timerAPI = {
    "setInterval":function(func, interval){
    },
    "clearInterval":function(intervalId){
    },
  }

  let emitter = new MMLEmitter(mml, config);
  
  emitter.on("note", function(e) {
    e.mute = true;
    // console.log("mutePlay:" + e)
    playNote(e);
  });
  emitter.on("end:all", function(e) {
    emitter.stop();
  });

  emitter.start();
  emitter.scheduler.demo(emitter._startTime, emitter._startTime + startTime);
  emitter = null;
}

function play(mml, startTimeRate) {

  setupAudioAsync(() => {
    try{
      resetTracks(tracks);

      var config = { context: Tone.context };
      mmlEmitter = new MMLEmitter(mml, config);
      //console.log(new MMLParser(mml).getJSON());
      G_NoteAnalysis.analysis(mml, config);
    
      mmlEmitter.on("note", function(e) {
        if(e.playbackTime + e.duration + e.slurDuration < getCurrentTime()){
          // console.log("cut NOTE: " + JSON.stringify(e));
          return;
        }
        if(!isVisibleTrack(e.trackNumber)){
          return;
        }
        mmlEditor.soundLog(e.trackNumber, mtoco(e.noteNumber + e.key) + " ");
        //console.log("NOTE: " + JSON.stringify(e));
        playNote(e);
      });
      mmlEmitter.on("end:all", function(e) {
        //console.log("END : " + JSON.stringify(e));
        mmlEmitter.stop();
        updateIcon();
      });
    
      let startTime = G_NoteAnalysis.getDuration() * startTimeRate;
      if(isEnableRepeat() && startTime >= getRepeatEndTime()){
        rewind();
        return;
      }

      this.mutePlay(mml, startTime);

      mmlEmitter.start(getCurrentTime() - startTime);
      playEmitterStartTime = mmlEmitter._startTime;
    
      drawUpdate();
    }catch(e){
      popupError(e);
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
      resetTracks(editTracks);

      if(mmlEditEmitter != null){
        mmlEditEmitter.stop();
      }
      mmlEditEmitter = null;
  
      var config = { context: Tone.context };
      let lastNote = null;
      let notes = []
      mmlEditEmitter = new MMLEmitter(mml, config);
      mmlEditEmitter.on("note", function(e) {
        notes.push(JSON.parse(JSON.stringify(e)))
        lastNote = JSON.parse(JSON.stringify(e))
      });
      mmlEditEmitter.on("end:all", function(e) {
        mmlEditEmitter.stop();
        if(playLine){
          G_EditNoteAnalysis.clear();
          let firstPlaybackTime = -1;
          let firstLength = -1;
          let lag = 0.1;
          playEditEmitterStartTime = Tone.context.currentTime
          notes.forEach(note => {
            if(note.mute){
              playEditNote(note);
              return;
            }
            if(firstPlaybackTime == -1){
              firstPlaybackTime = note.playbackTime;
              firstLength = note.currentLength;
              // lag = 60 / note.tempo * (4 / 8);
            }
            note.mute = false;
            let dt = (note.playbackTime - firstPlaybackTime);
            note.playbackTime = Tone.context.currentTime + dt + lag;
            note.currentLength = note.currentLength - firstLength;
            //note.chord = true;
            //console.log(note)
            G_EditNoteAnalysis.add(playEditEmitterStartTime, JSON.parse(JSON.stringify(note)));
            mmlEditor.setLastEditorPlayNote(JSON.parse(JSON.stringify(note)));
            playEditNote(note);
          });
          lastEditNote = JSON.parse(JSON.stringify(lastNote));
        }
        else{
          if(lastNote != null){
            G_EditNoteAnalysis.clear();
            let lag = 0.1;

            for(let i = 0; i < notes.length - 1; ++i){
              let note = notes[i];
              //console.log(JSON.stringify(note));
              note.mute = true;
              playEditNote(note);
            }

            playEditEmitterStartTime = Tone.context.currentTime
            lastNote.mute = false;
            lastNote.playbackTime = Tone.context.currentTime + lag;
            lastNote.currentLength = 0;
            //lastNote.chord = true;
            //console.log(lastNote)
            G_EditNoteAnalysis.add(playEditEmitterStartTime, JSON.parse(JSON.stringify(lastNote)));
            mmlEditor.setLastEditorPlayNote(JSON.parse(JSON.stringify(lastNote)));
            playEditNote(lastNote);

            lastEditNote = JSON.parse(JSON.stringify(lastNote));
          }
        }

        // メインの情報を更新する
        analysisMML(mmlEditor.editor.getValue());
      });
    
      mmlEditEmitter.start();
      mmlEditEmitter.scheduler.demo(mmlEditEmitter._startTime, mmlEditEmitter._startTime + 60*10);
      mmlEditEmitter = null
    }catch(e){
      popupError(e);
      console.log(e);
      return;
    }
  });
}

function analysisMML(mml){
  G_NoteAnalysis.analysis(mml, { context: Tone.context });
  return G_NoteAnalysis;
}

function analysisEditMML(mml){
  G_EditNoteAnalysis.analysis(mml, { context: Tone.context });
  return G_EditNoteAnalysis;
}

function getNoteAnalysis(){
  return G_NoteAnalysis;
}

function resetTracks(_tracks){
  if(!_tracks || _tracks.length < 1) return;
  for(let i = 0; i < _tracks.length; ++i){
    _tracks[i].reset();
  }
}

function stopTracks(_tracks){
  if(!_tracks || _tracks.length < 1) return;
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

function isLoadedTracks(_tracks){
  for(let i = 0; i < _tracks.length; ++i){
    if(!_tracks[i].isLoaded()) return false;
  }
  return true;
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
    new TrackSound(new TrackSoundSource()),
    new TrackSound(new TrackSoundSource()),
  ]
}

function createWaveDrawers(){
  let drawers = []
  for(let i = 0; i < tracks.length; ++i){
    let canvas = document.getElementById("wave_" + i);
    if(canvas){
      let drawer = new WaveDrawer(canvas);
      drawers.push(drawer);
    }
  }
  return drawers;
}

function updateWaveDrawers(){
  if(isActiveTracks(editTracks)){
    for(let i = 0; i < waveDrawers.length; ++i){
      let drawer = waveDrawers[i];
      let track = editTracks[i];
      drawer.setWaveData(track.getWaveformValue());
      drawer.setColor(red(TRACK_COLORS[i]),green(TRACK_COLORS[i]),blue(TRACK_COLORS[i]));
      drawer.draw();
    }
  }else{
    for(let i = 0; i < waveDrawers.length; ++i){
      let drawer = waveDrawers[i];
      let track = tracks[i];
      drawer.setWaveData(track.getWaveformValue());
      drawer.setColor(red(TRACK_COLORS[i]),green(TRACK_COLORS[i]),blue(TRACK_COLORS[i]));
      drawer.draw();
    }
  }
}

function playNote(e){
  var track = tracks[e.trackNumber];
  track.playNote(e);
}

function playEditNote(e){
  var track = editTracks[e.trackNumber];
  track.playNote(e);
}

function getLastEditNote(){
  return lastEditNote;
}

function setInputMidi(flag){
  if(flag){
    midiKeyboard.onNoteAttackEvent = (noteNumber) => {
      if(mmlEditor) {
        mmlEditor.insertNoteNumber(noteNumber);
      }
    };
    midiKeyboard.onNoteReleaseEvent = (noteNumber, time) => {
    };
    
    midiKeyboard.setEnablePlay(false);
  }
  else{
    midiKeyboard.onNoteAttackEvent = null;
    midiKeyboard.onNoteReleaseEvent = null;

    midiKeyboard.setEnablePlay(true);
  }
  
}

function addFontSize(dir){
  if(dir > 0){
    mmlEditor.setFontSize(Math.min(64,mmlEditor.getFontSize() + 2));
  }
  else{
    mmlEditor.setFontSize(Math.max(8,mmlEditor.getFontSize() - 2));
  }
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
  let audioSourceInput = document.getElementById('audioSourceInput');
  audioSourceInput.addEventListener('change', function() {
    const files = Array.from(audioSourceInput.files);
    const regex = new RegExp("^[0-9]+_.*\.(wav|mp3|ogg)$", 'g');
    files.forEach(file => {
      if(file.name.match(regex)){
        var reader = new FileReader();
        reader.onload = function(e) {
            var content = e.target.result;
            G_AudioSourceLoader.loadBufferAsync(file.name, content,(info) => {
              console.log("success:" + info.fileName);
            },() => {
              console.log("error:" + file.name);
            });
        };
        reader.readAsArrayBuffer(file);
      }
    });
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

function setupMidiKeyboard(){
  if(!midiKeyboard.isActive()){
    midiKeyboard.requestMidiAccess();
  }
}

// 初期化操作
var setupAudioAsync = async (callback) => {

  //console.log("setupAudioAsync check");

  await G_AudioSourceLoader.waitForFinishLoad();

  if(finishedInitAudio) {
    while(!isLoadedTracks(tracks) || !isLoadedTracks(editTracks)){
      await new Promise(resolve => setTimeout(resolve, 100))
    }
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

  waveDrawers = createWaveDrawers();

  while(!isLoadedTracks(tracks) || !isLoadedTracks(editTracks)){
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  finishedInitAudio = true;

  if(callback != null) callback();
}

function setupMainTick(){
  let handler = {};
  let tickFunc = () => {
    updateIcon();
    if(isPlayMainEmitter() ){
      if(isEnableRepeat() && getEmitterCurrentPlayTime() > getRepeatEndTime()){
        repeatRewind();
      } else if(getEmitterCurrentPlayTime() > G_NoteAnalysis.getDuration()){
        if(isEnableRepeat()){
          repeatRewind();
        }
        else{
          stop();
          rewind();
        }
      }
    }
  };
  let loop = function(){
    tickFunc();
    handler.id = requestAnimationFrame(loop);
  };
  handler.id = requestAnimationFrame(loop);
}

var initPage = async () => {

  await new Promise(resolve => setTimeout(resolve, 100))

  mmlEditor.initEditor();
  mmlEditor.setPlayEditNoteFunc(editPlay);
  mmlEditor.setDeleteEditNoteFunc(() => {
    //console.log("setDeleteEditNoteFunc");
    analysisMML(mmlEditor.editor.getValue());
  });
  mmlEditor.setNormalEditNoteFunc(() => {
    //console.log("setNormalEditNoteFunc");
    analysisMML(mmlEditor.editor.getValue());
  });

  if(!loadLocalStorage()){
    await loadFileAsync('mml/template.mml', (txt) => {
      mmlEditor.editor.setValue(txt, -1);
      analysisMML(txt);
      console.log(txt);
    });
  }

  initDocument();

  setupMainTick();

  mmlEditor.setEnableEditPlay(true);

};
initPage();