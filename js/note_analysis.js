
class NoteAnalysis {
    constructor(){
      this.tracks = []
    }
    add(startTime, e){
      while(this.tracks.length <= e.trackNumber) this.tracks.push(new NoteAnalysisTrack(e.trackNumber));
      this.tracks[e.trackNumber].add(startTime, e);
    }
    clear(){
      this.tracks.splice(0);
    }
    analysis(mml, config){
      // 時間で動かないようにダミーのタイマーを設定
      config.timerAPI = {
        "setInterval":function(func, interval){
        },
        "clearInterval":function(intervalId){
        },
      }
      // emitterを生成してMMLを事前に解析
      let emitter = new MMLEmitter(mml, config);
      G_NoteAnalysis.clear();
      emitter.on("note", function(e){
        G_NoteAnalysis.add(emitter._startTime, JSON.parse(JSON.stringify(e)));
        // console.log("demo NOTE: " + JSON.stringify(e));
      });
      emitter.on("end:all", function(e) {
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
      this.notes  = []
    }
    add(startTime, e){
      e.startTime = startTime;
      this.notes.push(e)
    }
  }
  var G_NoteAnalysis = new NoteAnalysis();