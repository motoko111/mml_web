
class NoteAnalysis {
    constructor(isEditMode){
      this.tracks = []
      this.lastNote = null;
      this.lastInfo = null;
      this.isEditMode = isEditMode == true ? true : false;
    }
    add(startTime, e){
      while(this.tracks.length <= e.trackNumber) this.tracks.push(new NoteAnalysisTrack(e.trackNumber));
      this.tracks[e.trackNumber].add(startTime, e);
    }
    clear(){
      this.tracks.splice(0);
      this.lastNote = null;
      this.lastInfo = null;
    }
    getDuration(){
      let val = 0;
      for(let i = 0; i < this.tracks.length; ++i){
        val = Math.max(val, this.tracks[i].getDuration());
      }
      return val;
    }
    getFirstTempo(){
      for(let i = 0; i < this.tracks.length; ++i){
        if(this.tracks[i].firstTempo > 0){
          return this.tracks[i].firstTempo;
        }
      }
      return 120;
    }
    getOneNoteTime(){
      return 60 / this.getFirstTempo() * (4 / 8); // 1ノート幅の時間
    }
    getLastNote(){
      return this.lastNote;
    }
    getLastOctave(){
      if(this.lastNote){
        return mtoo(this.lastNote.noteNumber);
      }
      if(this.lastInfo){
        return this.lastInfo.octave ? this.lastInfo.octave : 0;
      }
      return 0;
    }
    isEdit(){
      return this.isEditMode;
    }
    textIndexToTime(index){
      for(let i = 0; i < this.tracks.length; ++i){
        console.log(this.tracks[i]);
        if(this.tracks[i].startTextIndex <= index && index <= this.tracks[i].endTextIndex){
            let track = this.tracks[i];
            let notes = track.notes;
            for(let iNote = 0; iNote < notes.length; ++iNote){
              if(notes[iNote].textIndex >= index){
                return notes[iNote].playbackTime - notes[iNote].startTime;
              }
            }
        }
      }
      return 0;
    }
    analysis(mml, config){
      let _this = this;
      // 時間で動かないようにダミーのタイマーを設定
      config.timerAPI = {
        "setInterval":function(func, interval){
        },
        "clearInterval":function(intervalId){
        },
      }
      // emitterを生成してMMLを事前に解析
      let emitter = new MMLEmitter(mml, config);
      _this.clear();
      _this.lastNote = null;
      emitter.on("note", function(e){
        _this.add(emitter._startTime, JSON.parse(JSON.stringify(e)));
        _this.lastNote = JSON.parse(JSON.stringify(e));
        // console.log("demo NOTE: " + JSON.stringify(e));
      });
      emitter.on("end:all", function(e) {
        // console.log("demo END : " + JSON.stringify(e));
      });
      emitter.start();
      emitter.scheduler.demo(emitter._startTime, emitter._startTime + 60*10);
      emitter = null
      // console.log(G_NoteAnalysis)
    }
  }
  class NoteAnalysisTrack {
    constructor(trackNumber){
      this.isEnable = false;
      this.trackNumber = trackNumber
      this.startTime = 0;
      this.lastTime = 0;
      this.startTextIndex = 0;
      this.endTextIndex = 0;
      this.firstTempo = 0;
      this.notes  = []
    }
    getDuration(){
      return this.lastTime - this.startTime;
    }
    add(startTime, e){
      if(!this.isEnable){
        this.isEnable = true;
        this.firstTempo = e.tempo;
        this.startTextIndex = e.textIndex;
      }
      this.endTextIndex = Math.max(this.endTextIndex, e.textIndex);
      e.startTime = startTime;
      e.lastTime = Math.max(this.lastTime, e.playbackTime + e.duration + e.slurDuration);
      this.startTime = startTime;
      this.lastTime = e.lastTime;
      this.notes.push(e)
    }
  }
  var G_NoteAnalysis = new NoteAnalysis(false);
  var G_EditNoteAnalysis = new NoteAnalysis(true);