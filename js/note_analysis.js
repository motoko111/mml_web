
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
    toMidi(){
      let parser = new MidiParser();
      let header = new MidiHeader();
      let tracks = [];
      let measure = 480;
      header.setTimeMeasure(measure);

      let firstBPM = this.getFirstTempo();
      for(let i = 0; i < this.tracks.length; ++i){
        let analysisTrack = this.tracks[i];
        let midiTrack = new MidiTrack();
        let tempo = firstBPM;
        let ch = i;
        midiTrack.add(0, MidiEventTempo.createFromBPM(firstBPM));
        midiTrack.add(0, new MidiKeyProgramChange(ch, 6));

        let prevTime = 0;
        for(let j = 0; j < analysisTrack.notes.length; ++j){
          let e = analysisTrack.notes[j];

          if(e.mute) continue;
          if(e.tempo != tempo){
            tempo = e.tempo;
            midiTrack.add(0, MidiEventTempo.createFromBPM(tempo));
          }
          let oneNoteTime = 60 / tempo;

          let noteNumber = e.noteNumber + e.key;
          let time = e.duration;
          let t0 = e.playbackTime - e.startTime - prevTime;// 再生開始時間
          let t1 = time;
          let t0_time = Math.round((t0 / oneNoteTime) * measure);
          let t1_time = Math.round((t1 / oneNoteTime) * measure);

          midiTrack.add(t0_time, new MidiNote(ch,true,noteNumber,127));
          midiTrack.add(t1_time, new MidiNote(ch,false,noteNumber,127));
          prevTime = e.playbackTime - e.startTime + time;

          if(e.slur){
            e.slur.forEach(s => {
              let slurNoteNumber = s.noteNumber + e.key;
              let slur_time = Math.round((s.duration / oneNoteTime) * measure);
              midiTrack.add(0, new MidiNote(ch,true,slurNoteNumber,127));
              midiTrack.add(slur_time, new MidiNote(ch,false,slurNoteNumber,127));
              prevTime += s.duration;
            });
          }
        }
        midiTrack.add(0, new MidiEventTrackEnd());
        midiTrack.sort();
        tracks.push(midiTrack);
      }
      parser.header = header;
      parser.tracks = tracks;
      console.log(parser);
      return parser;
    }
    fromMidi(bytes){
      let parser = new MidiParser();
      parser.parse(bytes);

      let header = parser.header;
      let tracks = parser.tracks;

      for(let i = 0; i < tracks.length; ++i){

      }
    }
    toFamiTrackerText(){
      let parser = new FamiTrackerParser();

      let measure = 4;
      let firstBPM = this.getFirstTempo();
      
      parser.tempo = firstBPM; // 1番始めのBPMで固定
      parser.setTimeMeasure(measure);

      for(let i = 0; i < this.tracks.length; ++i){
        let analysisTrack = this.tracks[i];
        let tempo = firstBPM;
        let ch = i;
        let lastTime = 0;

        for(let j = 0; j < analysisTrack.notes.length; ++j){
          let e = analysisTrack.notes[j];

          if(e.mute) continue;
          if(e.tempo != tempo){
            tempo = e.tempo;
          }
          let oneNoteTime = 60 / tempo;

          let noteNumber = e.noteNumber + e.key;
          let time = e.duration;
          let t0 = e.playbackTime - e.startTime;// 再生開始時間
          let t1 = t0 + time;
          let t0_time = Math.round((t0 / oneNoteTime) * measure);
          let t1_time = Math.round((t1 / oneNoteTime) * measure);

          parser.add(0, ch, t0_time, new FamiTrackerCell(noteNumber,0,15,null));
          parser.add(0, ch, t1_time, new FamiTrackerCell(noteNumber,0,0,null));
          lastTime = t1_time;

          if(e.slur){
            let slurTime = t1;
            e.slur.forEach(s => {
              let slurNoteNumber = s.noteNumber + e.key;
              let slur_start = slurTime;
              let slur_end = slurTime + s.duration;
              let slur_start_time = Math.round((slur_start / oneNoteTime) * measure);
              let slur_end_time = Math.round((slur_end / oneNoteTime) * measure);
              parser.add(0, ch, slur_start_time, new FamiTrackerCell(slurNoteNumber,0,15,null));
              parser.add(0, ch, slur_end_time, new FamiTrackerCell(slurNoteNumber,0,0,null));
              slurTime = slur_end;
              lastTime = slur_end_time;
            });
          }
        }
      }
      parser.setSplitPattern();
      parser.setOrderFromPattern();
      console.log(parser);
      return parser;
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