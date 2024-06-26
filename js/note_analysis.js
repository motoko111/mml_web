
class NoteAnalysis {
    constructor(){
      this.tracks = []
      this.lastNote = null;
      this.lastInfo = null;
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
        // 1つもノートがなかったとき
        if(!_this.lastNote){
          // todo: 
        }
        console.log("demo END : " + JSON.stringify(e));
      });
      emitter.start();
      emitter.scheduler.demo(emitter._startTime, emitter._startTime + 60*10);
      emitter = null
      // console.log(G_NoteAnalysis)
    }
  }
  class NoteAnalysisTrack {
    constructor(trackNumber){
      this.trackNumber = trackNumber
      this.startTime = 0;
      this.lastTime = 0;
      this.notes  = []
    }
    getDuration(){
      return this.lastTime - this.startTime;
    }
    add(startTime, e){
      e.startTime = startTime;
      e.lastTime = Math.max(this.lastTime, e.playbackTime + e.duration + e.slurDuration);
      this.startTime = startTime;
      this.lastTime = e.lastTime;
      this.notes.push(e)
    }
  }
  var G_NoteAnalysis = new NoteAnalysis();
  var G_EditNoteAnalysis = new NoteAnalysis();