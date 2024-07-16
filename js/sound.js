const SYNTH_TYPES = ["square","triangle","sine","sawtooth"]
const NOISE_TYPES = ["white", "brown", "pink"]
const PULSE_TYPES = [0.0,-0.5,-0.75,0.5]
const WAIT_SEC = 0
const WAVE_FORM_SIZE = 1024;
const NES_CLOCK_COUNT = 1789772.5; // ファミコンのクロック周波数
const REGEX_AUDIO_HEADER = new RegExp(/^[0-9]+/,'g');
var WHITE_NOISE_BUFFER = null;
var SHORT_NOISE_BUFFER = null;
var LONG_NOISE_BUFFER = null;

class TrackSound 
{
    constructor(data){
        this.data = data;
        this.time = getCurrentTime();
        let _this = this;
        // tick
        setInterval(function(){
            if(_this.data == null) return;
            let dt = getCurrentTime()-_this.time;
            _this.time = getCurrentTime();
            _this.data.tick(dt);
        }, 20);
    }

    // 再生準備が完了しているか
    isLoaded(){
        if(this.data == null) return true;
        return this.data.isLoaded();
    }

    setSoundData(data){
        this.data = data;
    }

    playNote(e){
        try{
            if(this.data == null) return;
            if(e.baseTone !== null && this.data.type !== e.baseTone){
                // 楽器変更
                let createData = (tone) => {
                    if(tone){
                        switch(tone.toLowerCase()){
                            case "pulse": return new TrackSoundPulse();
                            case "wave": return new TrackSoundWave();
                            case "sin": return new TrackSoundSin();
                            case "tri": return new TrackSoundTriangle();
                            case "saw": return new TrackSoundSaw();
                            case "noise": return new TrackSoundNoise();
                            case "sample": return new TrackSoundSource();
                        }
                    }
                }
                let newData = createData(e.baseTone);
                if(newData){
                    if(this.data ){
                        this.data.dispose();
                    }
                    console.log("change base tone " + this.data.type + "=>" + newData.type);
                    this.data = newData;
                }
                
            }
            if(this.data.notPlayMute() && e.mute) {
                // console.log("notPlayMute mute " + mtoco(e.noteNumber));
                return;
            }
            if(e.playbackTime < 0) return;
            this.data.playNote(e);
        }catch(ec){
            console.warn(ec);
        }
    }

    stop(){
        if(this.data == null) return;
        this.data.stopPlayInfoAll();
    }

    reset(){
        if(this.data == null) return;
        this.data.reset();
    }

    isActive(){
        if(this.data == null) return false;
        return this.data.isActive();
    }

    getWaveformValue(){
        if(this.data == null) return null;
        return this.data.getWaveformValue();
    }
}

class TrackSoundData
{
    constructor(){
        this.playInfos = []
        this.isActivePlay = false;
        this.lastPlayInfo = null;
        this.onTick = null;
        this.type = null;

        this.reset();
    }
    
    reset(){
        this.arpeggio = {length:64,values:[]};
        this.vibrato = {frequency:0,depth:0,delay:0,delayDuration:0};
        this.pitch = {pitch:0,delay:0,delayDuration:0};
        this.effectVolume = {volume:15,delay:0,delayDuration:0,applyTime:-9999};
        this.reverb = {decay:0.001,preDelay:0};
        this.filter = {low:{freq:0,gain:1,q:1},mid:{gain:1},high:{freq:440*Math.pow(2,20),gain:1,q:1}};
        this.freqTimeline = [];
        this.volumeTimeline = [];

        let _this = this;
        this.playInfos.forEach((info) => {
            _this.resetPlayInfo(info);
        });
    }

    checkParam(params, index){
        return params != null && params.length > index;
    }

    getParam(params, index, defaultvalue, min, max){
        let val = (params !== null && params.length > index) ? params[index] : defaultvalue;
        if(min){
            val = Math.max(min, val);
        }
        if(max){
            val = Math.min(max, val);
        }
        return val;
    }
    setEnvelope(env, envParams)
    {
        env.attack = this.getParam(envParams, 0, 0.01, 0);
        env.decay = this.getParam(envParams, 1, 0.01, 0.0001);
        env.sustain = this.getParam(envParams, 2, 1.0, 0);
        env.release = this.getParam(envParams, 3, 0.5, 0.0001);
    }

    setSlur(frequency, slur, t0, time, key){
        if(slur == null || slur.length < 1) return 0;
        if(key === undefined) key = 0;
        
        let t = t0 + time;
        let addTime = 0;
        let _this = this;
        slur.forEach(s => {
            t += s.duration;
            addTime += s.duration;
            _this.freqTimeline.push({
                type:"liner",
                value:_this.calcFreq(s.noteNumber + key),
                time:t
            });
        });
        return addTime;
    }
    
    setInstPitch(e, t0, t1, params)
    {
        if(!params) {
            return;
        }
        let len = params.length;
        let maxTime = t1;
        let next = t0;
        let _this = this;
        let n = 0;
        let loopPoint = -1;
        for(let i = 0; i < len; ++i){
            let param = this.getParam(params, i, 0, 0);
            if(param == "L"){
                loopPoint = i;
            }
            else{
                next = (n+1)/60 + t0;
                let isEnd = maxTime <= next;
                next = isEnd ? maxTime : next;
                let pitch = param; // x/127 20で半音変化 -が高く +が低い
                let shift = -pitch / 20;
                _this.freqTimeline.push({
                    type:"liner",
                    value:_this.calcFreq(e.noteNumber + e.key + shift),
                    time:next
                });
                if(isEnd) break;
                n++;
                if(i == len - 1){
                    if(loopPoint >= 0){
                        i = loopPoint;
                    }
                    else{
                        _this.freqTimeline.push({
                            type:"liner",
                            value:_this.calcFreq(e.noteNumber + e.key + shift),
                            time:maxTime
                        });
                    }
                }
            }
        }
    }

    setPitch(t0, params)
    {
        if(!params) return;
        let pitch = params.pitch; // x/127 20で半音変化 -が高く +が低い
        let start = t0 + params.delay;
        let next = start + params.delayDuration;
        let shift = -pitch / 20;
        if(pitch !== 0){
            this.freqTimeline.push({
                type:"multipleSet",
                value:this.calcTransFreqRate(0),
                time:start
            });
            this.freqTimeline.push({
                type:"multipleLiner",
                value:this.calcTransFreqRate(shift),
                start:start,
                time:next
            });
        }
    }

    setInstVolume(e, t0, t1, params)
    {
        if(!params) {
            return;
        }
        let len = params.length;
        let maxTime = t1;
        let next = t0;
        let _this = this;
        let n = 0;
        let loopPoint = -1;
        for(let i = 0; i < len; ++i){
            let param = this.getParam(params, i, 0, 0);
            if(param == "L"){
                loopPoint = i;
            }
            else{
                let rate = param / 15; // x/15
                next = (n+1)/60 + t0;
                let isEnd = maxTime <= next;
                next = isEnd ? maxTime : next;
                rate = Math.min(rate,15*4);
                _this.volumeTimeline.push({
                    type:"liner",
                    value:rate,
                    time:next
                });
                //console.log("rate:" + n + " :" + rate);
                if(isEnd) break;
                n++;
                if(i == len - 1){
                    if(loopPoint >= 0){
                        i = loopPoint;
                    }
                    else{
                        _this.volumeTimeline.push({
                            type:"liner",
                            value:rate,
                            time:maxTime
                        });
                    }
                }
            }
        }
    }

    setEffectVolume(info, gain, t0, params)
    {
        if(!params) return;
        let volume = params.volume;
        let start = t0 + params.delay;
        let next = start + params.delayDuration;
        let rate = volume / 15;
        if(volume >= 0){
            if(info.effectGainUpdateTime < params.applyTime){
                if(params.delayDuration <= 0){
                    gain.gain.setValueAtTime(rate,start);
                }
                else{
                    gain.gain.setValueAtTime(gain.gain.getValueAtTime(start),start);
                    gain.gain.linearRampToValueAtTime(rate, next);
                }
                info.effectGainUpdateTime = t0;
                //console.log("setEffectVolume [" + info.index + "] applyTime:" + this.effectVolume.applyTime + " effectGainUpdateTime:" + info.effectGainUpdateTime);
            }
        }
    }

    applyFreqTimeLine(frequency){
        if(!this.freqTimeline || this.freqTimeline.length < 1) return;
        for(let i = 0; i < this.freqTimeline.length; ++i){
            let freqInfo = this.freqTimeline[i];
            switch(freqInfo.type){
                case "liner":{
                    frequency.linearRampToValueAtTime(freqInfo.value, freqInfo.time);
                }
                break;
                case "set":{
                    frequency.setValueAtTime(freqInfo.value, freqInfo.time);
                }
                break;
                case "multipleLiner":{
                    let freq = frequency.getValueAtTime(freqInfo.start);
                    let next = freq * freqInfo.value;
                    frequency.linearRampToValueAtTime(next, freqInfo.time);
                    //console.log(freqInfo);
                }
                break;
                case "multipleSet":{
                    let freq = frequency.getValueAtTime(freqInfo.time);
                    let next = freq * freqInfo.value;
                    frequency.setValueAtTime(next, freqInfo.time);
                    //console.log(freqInfo);
                }
                break;
            }
            
        }
        this.freqTimeline.splice(0);
    }

    applyVolumeTimeLine(gain){
        if(!this.volumeTimeline || this.volumeTimeline.length < 1) return;
        for(let i = 0; i < this.volumeTimeline.length; ++i){
            let volumeInfo = this.volumeTimeline[i];
            switch(volumeInfo.type){
                case "liner":{
                    gain.linearRampToValueAtTime(volumeInfo.value, volumeInfo.time);
                }
                break;
                case "set":{
                    gain.setValueAtTime(volumeInfo.value, volumeInfo.time);
                }
                break;
                case "multipleLiner":{
                    let vol = gain.getValueAtTime(volumeInfo.start);
                    let next = vol * volumeInfo.value;
                    gain.linearRampToValueAtTime(next, volumeInfo.time);
                    //console.log(freqInfo);
                }
                break;
                case "multipleSet":{
                    let vol = gain.getValueAtTime(volumeInfo.time);
                    let next = vol * volumeInfo.value;
                    gain.setValueAtTime(next, volumeInfo.time);
                    //console.log(freqInfo);
                }
                break;
            }
        }
        this.volumeTimeline.splice(0);
    }

    setArpeggio_bk(e){
        if(!this.arpeggio || !this.arpeggio.values || this.arpeggio.values.length < 1) return false;
        
        let result = false;
        let length = this.arpeggio.length <= 0 ? 64 : this.arpeggio.length;
        let time = 60 /  e.tempo * (4 / length);
        let t = e.playbackTime;
        let maxTime = e.playbackTime + e.duration * e.quantize / 100;
        
        while(t < maxTime){
            this.arpeggio.values.forEach((v) => {
                if(t >= maxTime) return;

                result = true;
                let next = JSON.parse(JSON.stringify(e));
                next.isArpeggio = true;
                next.playbackTime = t;
                next.duration = Math.min(maxTime - t,time);
                next.noteNumber = e.noteNumber + v;
                t = t + time;
                this.playNote(next);
            });
        }

        return result;
    }

    setArpeggio(e){
        if(!this.arpeggio || !this.arpeggio.values || this.arpeggio.values.length < 1) return false;
        
        let result = false;
        let length = this.arpeggio.length <= 0 ? 64 : this.arpeggio.length;
        let time = 60 /  e.tempo * (4 / length);
        let t = e.playbackTime;
        let maxTime = e.playbackTime + e.duration * e.quantize / 100;
        let _this = this;
        
        let bkShift = 0;
        while(t < maxTime){
            this.arpeggio.values.forEach((v) => {
                if(t >= maxTime) return;

                result = true;
                let shift = v;
                // console.log("arpeggio:" + e.noteNumber + " add:" + shift)
                /*
                _this.freqTimeline.push({
                    type:"set",
                    value:_this.calcFreq(e.noteNumber + e.key + shift),
                    time:t
                });
                */
                _this.freqTimeline.push({
                    type:"multipleSet",
                    value:this.calcTransFreqRate(shift - bkShift),
                    time:t
                });
                bkShift = shift;

                t = t + time;
            });
        }

        return result;
    }

    setVibrato(vib, t0, params){
        if(!vib) return;
        if(!params) return;
        if(params.frequency > 0 && params.depth > 0){
            vib.frequency.setValueAtTime(params.frequency,t0 + params.delay);
            vib.depth.setValueAtTime(params.depth,t0 + params.delay);
            if(params.delay > 0 && params.delayDuration > 0){
                vib.wet.cancelScheduledValues(t0);
                vib.wet.setValueAtTime(0.0, t0);
                vib.wet.setValueAtTime(0.0, t0 + params.delay);
                vib.wet.linearRampToValueAtTime(1.0, t0 + params.delay + params.delayDuration);
            }
            else{
                vib.wet.cancelScheduledValues(t0);
                vib.wet.setValueAtTime(0.0, t0);
                vib.wet.setValueAtTime(0.0, t0 + params.delay);
                vib.wet.linearRampToValueAtTime(1.0, t0 + params.delay);
            }
        }
        else{
            vib.wet.setValueAtTime(0.0, t0);
        }
    }

    setReverb(rev, params){
        if(!rev) return;
        if(!params) return;
        //rev.decay = Math.max(0.001, params.decay); // リバーブの減衰時間（秒）
        //rev.preDelay = Math.max(0.001, params.preDelay); // プリディレイ（秒）
    }
    setFilter(filter, params){
        if(!filter) return;
        if(!params) return;
        filter.setFreq(this.filter.low.freq,this.filter.high.freq);
        filter.setQ(this.filter.low.q, this.filter.high.q);
        // console.log(this.filter);
    }
    setPan(panner, t0, pan){
        if(!panner) return;
        panner.pan.setValueAtTime(pan, t0);
    }
    setEffects(info, t0, e){
        this.setArpeggio(e);
        this.setPan(info.panner, t0, e.pan);
        this.setEnvelope(info.env, e.envelope);
        this.setPitch(t0, this.pitch);
        this.setEffectVolume(info, info.effectGain, t0, this.effectVolume);
        this.setVibrato(info.vib, t0, this.vibrato);
        this.setReverb(info.rev, this.reverb);
        this.setFilter(info.filter, this.filter);
    }
    setCommands(info, t0, commands){
        if(!commands) return;
        for(let i = 0; i < commands.length;++i){
            this.setCommand(info, t0, commands[i]);
        }
    }
    setCommand(info, t0, command){
        if(!command) return;
        //console.log(command)
        switch(command.command){
            case "reset":{
                this.reset();
            }break;
            // 音量変更
            case "a":{
                //console.log("this.effectVolume.applyTime=" + this.effectVolume.applyTime);
                this.effectVolume.applyTime = t0;
                this.effectVolume.volume = this.getParam(command.value, 0, 15);
                this.effectVolume.delay = this.getParam(command.value, 1, 0, 0);
                this.effectVolume.delayDuration = this.getParam(command.value, 2, 0, 0);
            }break;
            // 高速アルペジオ
            case "c":{
                this.arpeggio.length = this.getParam(command.value, 0, 8);
                let index = 1;
                let values = [];
                while(true){
                    if(!this.checkParam(command.value, index)) break;
                    values.push(this.getParam(command.value, index, 0));
                    index++;
                }
                this.arpeggio.values = values;
            }break;
            // ビブラート
            case "v":{
                this.vibrato.frequency = this.getParam(command.value, 0, 0);
                this.vibrato.depth = this.getParam(command.value, 1, 0);
                this.vibrato.delay = this.getParam(command.value, 2, 0);
                this.vibrato.delayDuration = this.getParam(command.value, 3, 0);
            }break;
            // ピッチ
            case "p":{
                this.pitch.pitch = this.getParam(command.value, 0, 0);
                this.pitch.delay = this.getParam(command.value, 1, 0, 0);
                this.pitch.delayDuration = this.getParam(command.value, 2, 0, 0);
            }break;
            // リバーブ
            case "r":{
                this.reverb.decay = this.getParam(command.value, 0, 0.001);
                this.reverb.preDelay = this.getParam(command.value, 1, 0);
            }break;
            // フィルター
            case "f":{
                let noteNumber = toNoteNumber(this.getParam(command.value, 0, 0));
                this.filter.low.freq = noteNumber > -1000 ? mtof(noteNumber) : this.getParam(command.value, 2, 0);
                this.filter.low.q = this.getParam(command.value, 1, 0);

                noteNumber = toNoteNumber(this.getParam(command.value, 2, 0));
                this.filter.high.freq = noteNumber > -1000 ? mtof(noteNumber) : this.getParam(command.value, 2, 440 * Math.pow(2,20));
                this.filter.high.q = this.getParam(command.value, 3, 0);
            }break;
        }
    }

    connect(start, next, last){
        if(start,!next) return start;
        if(!start && next) return last ? last : next;
        if(start && next) start.connect(next);
        return last ? last : next;
    }

    disconnect(info){
        if(info.lastNode) info.lastNode.disconnect();
    }

    setConnect(info){
        let node = null;
        node = this.connect(node, info.osc);
        node = this.connect(node, info.bufferSorce);
        let baseNode = node;
        info.baseConnectNode = null;
        node = this.connect(node, info.pitch);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.filter.getRootNode(), info.filter.getLastNode());
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.vib);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        //node = this.connect(node, info.rev);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.env);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.gain);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.effectGain);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.panner);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        node = this.connect(node, info.waveform);
        if(!info.baseConnectNode && baseNode != node) info.baseConnectNode = node;
        if(node) node.toDestination();
        info.lastNode = node;
    }

    createEffects(info){
        info.env = new Tone.AmplitudeEnvelope();
        info.waveform = new Tone.Waveform(WAVE_FORM_SIZE);
        info.vibDelay = new Tone.FeedbackDelay();
        info.vib = new Tone.Vibrato();
        info.rev = new Tone.Reverb();
        info.filter = new SoundFilter();
        info.gain = new Tone.Gain(1);
        info.effectGainUpdateTime = -9999;
        info.effectGain = new Tone.Gain(1);
        info.panner = new Tone.Panner(0);
    }

    calcPlayNoteRate(noteNumber){
        return Math.pow(2,(noteNumber - 69) / 12); // A4からの周波数倍率
    }

    tick(dt){
        this.isActivePlay = false;
        for(let i = 0; i < this.playInfos.length; ++i){
            if(this.playInfos[i].isActive){
                if(this.playInfos[i].inactiveTime + 0.1 < getCurrentTime()){
                    //console.log("stopPlayInfo buffer:" + i + "/" + (this.playInfos.length - 1));
                    if(this.playInfos[i].onended != null) this.playInfos[i].onended();
                    this.stopPlayInfo(this.playInfos[i]);
                }
                else{
                    this.isActivePlay = true;
                }
                if(this.playInfos[i].prevBufferSources && this.playInfos[i].prevBufferSources.length > 0){
                    let prevs = this.playInfos[i].prevBufferSources;
                    for(let j = prevs.length - 1; j >= 0; --j){
                        let prev = prevs[j];
                        if(prev.endTime + 0.1 < getCurrentTime()){
                            prev.source.disconnect();
                            prev.source.dispose();
                            prevs.splice(j,1);
                            //console.log("dispose prev buffer:" + j);
                        }
                    }
                }
            }
        }
        if(this.onTick) this.onTick(this, dt);
    }

    notPlayMute(){
        return true;
    }

    isLoaded(){
        return true;
    }

    isActive(){
        return this.isActivePlay;
    }

    playNote(e){
    }

    startPlay(info, e, t0, time, note, volume){
    }

    createPlayInfo(){
        let info = {}
        return info
    }

    resetPlayInfo(info){
        info.effectGainUpdateTime = -9999;
        if(info.gain) {
            info.gain.gain.cancelScheduledValues(0);
            info.gain.gain.value = 1.0;
        }
        if(info.effectGain) {
            info.effectGain.gain.cancelScheduledValues(0);
            info.effectGain.gain.value = 1.0;
        }
    }

    stopPlayInfo(info){
        //console.log("stopPlayInfo default");
        info.isActive = false;
        info.bufferSorce = null;
        if(info.osc) info.osc.frequency.cancelScheduledValues(0);
        if(info.gain) info.gain.gain.cancelScheduledValues(0);
        //this.disconnect(info);
    }

    stopPlayInfoAll(){
        for(let i = 0; i < this.playInfos.length; ++i){
            if(this.playInfos[i].isActive){
                // console.log("stopPlayInfo=" + i);
                this.stopPlayInfo(this.playInfos[i]);
            }
        }
    }

    setPlayInfoTime(info, start, end){
        info.startActiveTime = start;
        info.inactiveTime = end;

        this.setBufferPlayInfo(info, start, end);
    }

    setPrevBufferInfo(info){
        info.prevBufferSource = info.bufferSorce;
    }

    setBufferPlayInfo(info, start, end){
        if(info.prevBufferSource) {
            info.prevBufferSource.stop(start);
            if(!info.prevBufferSources) info.prevBufferSources = [];
            info.prevBufferSources.push({
                source:info.prevBufferSource,
                endTime:start
            });
        }
    }

    stopBufferPlayInfo(info){
        try{
            if(info.bufferSorce != null){
                //console.log("stopPlayInfo stop info:" + info.index + "/" + (this.playInfos.length - 1) + " prev length:" + (info.prevBufferSources ? info.prevBufferSources.length : ""));
    
                //
                //info.bufferSorce.playbackRate.cancelScheduledValues(0);
                info.bufferSorce.stop();
                info.bufferSorce.disconnect();
                info.bufferSorce.dispose();
            }
            if(info.prevBufferSources !== undefined && info.prevBufferSources !== null && info.prevBufferSources.length > 0) {
                info.prevBufferSources.forEach((prev) => {
                    //console.log("stopPlayInfo stop prev info" + prev)
                    //prev.source.playbackRate.cancelScheduledValues(0);
                    prev.source.stop();
                    prev.source.disconnect();
                    prev.source.dispose();
                });
                info.prevBufferSources.splice(0,info.prevBufferSources.length);
                //console.log("info.prevBufferSources.length:" + info.prevBufferSources.length)
            }
            info.prevBufferSource = null;
        }
        catch(e){
            if(info.bufferSorce != null){
                info.bufferSorce.dispose();
            }
            if(info.prevBufferSources && info.prevBufferSources.length > 0) {
                info.prevBufferSources.splice(0,info.prevBufferSources.length);
            }
            info.prevBufferSource = null;
        }
    }

    getOrCreatePlayInfo(forceGetFirst, startTime){
        let info = null;
        if(forceGetFirst){
            for(let i = 0; i < this.playInfos.length; ++i){
                info = this.playInfos[i];
                break;
            }
        }
        else{
            for(let i = 0; i < this.playInfos.length; ++i){
                //for(let i = 0; i < this.playInfos.length; ++i){
                //    info = this.playInfos[i];
                //    break;
                //}
                if(!this.playInfos[i].isActive || this.playInfos[i].inactiveTime + 0.1 < startTime){
                    info = this.playInfos[i];
                    break;
                }
            }
        }
        if(info == null){
            info = this.createPlayInfo();
            this.addPlayInfo(info);
        }
        info.isActive = true;
        this.lastPlayInfo = info;
        //console.log("playInfos length:" + this.playInfos.length + "force:" + forceGetFirst + " index:" + info.index);
        return info;
    }

    addPlayInfo(info){
        info.index = this.playInfos.length;
        this.playInfos.push(info);
    }

    removePlayInfo(info){
        let index = this.playInfos.indexOf(info);
        if(index != -1){
            this.playInfos.splice(index,1);
        }
    }

    getWaveformValue(){
        if(!this.lastPlayInfo) return null;
        if(!this.lastPlayInfo.isActive || !this.lastPlayInfo.waveform) return null;
        let targetInfo = null;
        let minStartTime = Number. MAX_SAFE_INTEGER;
        for(let i = 0; i < this.playInfos.length; ++i){
            if(this.playInfos[i].isActive && this.playInfos[i].inactiveTime >= getCurrentTime()){
                if(this.playInfos[i].startActiveTime < minStartTime){
                    targetInfo = this.playInfos[i];
                    minStartTime = this.playInfos[i].startActiveTime;
                }
            }
        }
        if(!targetInfo) return null;
        if(!targetInfo.isActive || !targetInfo.waveform) return null;
        return targetInfo.waveform.getValue(); // 最後に再生したデータの波形データを返す
    }

    calcFreq(noteNumber){
        return noteNumber;
    }

    // 周波数を半音上げる/下げるための倍率
    calcTransFreqRate(trans){
        return Math.pow(2, trans/12);
    }

    dispose(){
        this.stopPlayInfoAll();
        this.playInfos = [];
    }
}

class TrackSoundPulse extends TrackSoundData
{
    constructor(){
        super();
        this.type = "pulse";
    }

    createPlayInfo(){
        let info = {}
        info.osc = new Tone.PulseOscillator();
        this.createEffects(info);
        this.setConnect(info);
        let _this = this;
        info.onended = function(){
            _this.stopPlayInfo(info);
        };
        return info;
    }

    notPlayMute(){
        return false; // pulseの場合はmuteでも動かす
    }

    stopPlayInfo(info){
        info.osc.stop();
        super.stopPlayInfo(info);
    }

    calcFreq(noteNumber){
        return mtof(noteNumber);
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time;
        var volume = (e.velocity / 128); // 倍率
        var note = mtoco(e.noteNumber + e.key);

        let info = this.getOrCreatePlayInfo(!e.chord, t0 + WAIT_SEC);

        this.setCommands(info, t0, e.commands);
        if(e.mute){
            info.isActive = false;
            return;
        }

        this.setConnect(info);
        this.setEffects(info, t0, e);

        info.osc.width.setValueAtTime(PULSE_TYPES[e.tone], t0 + WAIT_SEC);
        info.osc.frequency.setValueAtTime(note, t0 + WAIT_SEC);
        let addTime = this.setSlur(info.osc.frequency, e.slur, t0 + WAIT_SEC, time, e.key);
        time += addTime;
        t1 = t0 + time + info.env.release;
        if(e.pitch){
            this.setInstPitch(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.pitch);
        }
        if(e.volume){
            this.setInstVolume(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.volume);
        }
        this.applyFreqTimeLine(info.osc.frequency);
        this.applyVolumeTimeLine(info.gain.gain);
        info.osc.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.osc.stop(t1 + WAIT_SEC);

        this.setPlayInfoTime(info, t0 + WAIT_SEC, t1 + WAIT_SEC);
    }
}

class TrackSoundWave extends TrackSoundData
{
    constructor(){
        super();
        this.defaultWaveSize = 16
        this.waveUpdateTime = 0;
        this.oscWaves = this.createWave();
        this.type = "wave";
        this.defaultHzPlayRate = 0;
    }

    reset(){
        super.reset();
        this.waveUpdateTime = 0;
        this.oscWaves = this.createWave();
    }

    createWaveBuffer(duration) {
        const sampleRate = Tone.context.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = Tone.context.createBuffer(1, bufferSize, sampleRate);
        let data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // -1から1のランダムな値を設定
        }
        return new Tone.Buffer(buffer);
    }

    notPlayMute(){
        return false; // waveの場合はmuteでも動かす
    }

    createPlayInfo(){
        let info = {}
        info.waveUpdateTime = -9999;
        info.waveBuffer = this.createWaveBuffer(1);
        this.createEffects(info);
        // ちょうどよく割り切れる数を探す
        let div = 2;
        for(let i = 2; i <= 20; ++i){
            if(Tone.context.sampleRate % i == 0) div = i;
        }
        // console.log("calc countPerHz div:" + div);
        info.countPerHz = Tone.context.sampleRate / div; // 1Hzあたりのサンプリング数
        let _this = this
        info.onended = function(){
            _this.stopPlayInfo(info);
        }
        return info;
    }

    stopPlayInfo(info){
        this.stopBufferPlayInfo(info);
        super.stopPlayInfo(info);
    }

    getWaveValue(n){
        return n/(this.defaultWaveSize - 1) * 2 - 1;
    }

    getWaveValues(nList){
        let list = []
        for(let i = 0; i < nList.length; ++i)
        {
            list.push(this.getWaveValue(nList[i]));
        }
        return list
    }

    createWave(){
        return this.getWaveValues([2,2,3,4,5,6,7,8,9,10,11,12,13,14,14]);
    }

    setWave(waves){
        //console.log("setWave="+waves);
        this.oscWaves = this.getWaveValues(waves);
    }

    checkAndSetWave(waves){
        if(waves == null || waves.length < 1) return false;
        this.setWave(waves)
        return true
    }

    calcFreq(noteNumber){
        return this.calcPlayNoteRate(noteNumber) * this.defaultHzPlayRate;
    }

    playNote(e){
        var time = e.duration * (e.quantize / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time + 0.5;
        var volume = (e.velocity / 128); // 倍率

        let info = this.getOrCreatePlayInfo(!e.chord, t0 + WAIT_SEC);

        this.setCommands(info, t0, e.commands);

        if(this.checkAndSetWave(e.wave)){
            this.waveUpdateTime = e.playbackTime;
        }
        if(e.mute){
            info.isActive = false;
            return;
        }

        if(Math.abs(this.waveUpdateTime - info.waveUpdateTime) > 0.0001){
            info.waveUpdateTime = this.waveUpdateTime;
            
            let data = info.waveBuffer.getChannelData(0);
            let n = 0;
            while(n < data.length){
                for (let i = 0; i < info.countPerHz; i++) {
                    let rate = ((i + 1) / info.countPerHz);
                    let index = Math.floor(this.oscWaves.length * rate);
                    index = Math.max(0, Math.min(this.oscWaves.length-1, index));
                    data[n] = this.oscWaves[index];
                    n++;
                    if(n >= data.length) break;
                }
            }
            // console.log(info.waveBuffer.getChannelData(0));
        }
        
        // 毎回作る必要があるらしい
        this.setPrevBufferInfo(info);
        info.bufferSorce = new Tone.BufferSource(info.waveBuffer);
        info.bufferSorce.loop = true;
        this.setConnect(info);
        
        this.setEffects(info, t0, e);

        let notePlayRate = this.calcPlayNoteRate(e.noteNumber + e.key); // A4からの周波数倍率
        // samplerate / 1Hzのサンプル数 = デフォルトの周波数
        // これを440Hzにしたい デフォルトの周波数 * x = 440; x = デフォルトの周波数 / 440
        let defaultHz = Tone.context.sampleRate / info.countPerHz;
        let defaultHzPlayRate = 440.0 / defaultHz;
        let playbackRate = 1.0 * notePlayRate * defaultHzPlayRate;
        this.defaultHzPlayRate = defaultHzPlayRate;
        // console.log(' defaultHz:' + defaultHz + " defaultHzPlayRate:" + defaultHzPlayRate + " playbackRate:" + playbackRate + " notePlayRate:" + notePlayRate)
        info.bufferSorce.playbackRate.setValueAtTime(playbackRate, t0 + WAIT_SEC);
        if(e.slur){
            let addTime = this.setSlur(info.bufferSorce.playbackRate, e.slur, t0 + WAIT_SEC, time, e.key);
            time += addTime;
        }
        t1 = t0 + time + info.env.release;
        if(e.pitch){
            this.setInstPitch(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.pitch);
        }
        if(e.volume){
            this.setInstVolume(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.volume);
        }
        this.applyFreqTimeLine(info.bufferSorce.playbackRate);
        this.applyVolumeTimeLine(info.gain.gain);
        info.bufferSorce.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.bufferSorce.stop(t1 + WAIT_SEC);

        this.setPlayInfoTime(info, t0 + WAIT_SEC, t1 + WAIT_SEC);
    }
}

class TrackSoundSaw extends TrackSoundWave
{
    constructor(){
        super();
        this.type = "saw";
    }
    createWave(){
        return this.getWaveValues([15,15,15,14,14,14,13,13,12,12,11,11,10,10,9,9,8,8,7,7,6,6,5,5,4,4,3,3,2,2,1,1]);
    }
}

class TrackSoundTriangle extends TrackSoundWave
{
    constructor(){
        super();
        this.type = "tri";
    }
    createWave(){
        return this.getWaveValues([8,8,7,6,5,4,3,2,1,1,1,2,3,4,5,6, 7,8,9,10,11,12,13,14,15,15,14,13,12,11,10,9]);
    }
}

class TrackSoundSin extends TrackSoundWave
{
    constructor(){
        super();
        this.type = "sin";
    }
    createWave(){
        let w = (t) => {
            return Math.round(Math.sin(Math.PI * 2 * t/(32 - 1)) * 7) + 8;
        }
        let list = []
        for(let i = 0; i < 32; ++i){
            list.push(w(i));
        }
        console.log(list);
        return this.getWaveValues(list);
    }
}

// whiteノイズ
function createWhiteNoise(duration) {
    const sampleRate = Tone.context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = Tone.context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // -1から1のランダムな値を設定
    }

    return buffer;
}

// 8bitノイズ
function createBitNoise(duration, isShort){
    const sampleRate = Tone.context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = Tone.context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    var short_flag = isShort ? 1 : 0 // 短周期フラグ。1にすると有効になる
    var reg = 0x8000;
    for (let i = 0; i < bufferSize; i++) {
        reg >>= 1;
        reg |= ((reg ^ (reg >> (short_flag ? 6 : 1))) & 1) << 15;
        data[i] = ( reg & 1 ) * 2 - 1;
    }
    return buffer;
}

// 短周期ノイズ
function createShortBitNoise(duration){
    return createBitNoise(duration, true);
}

// 長周期ノイズ
function createLongBitNoise(duration){
    return createBitNoise(duration, false);
}

// ノイズバッファの作成
function createNoiseBuffer(){

    // https://stackoverflow.com/questions/53186139/tone-js-tone-buffersource-buffer-is-either-not-set-or-not-loaded
    SHORT_NOISE_BUFFER = this.createShortBitNoise(1); // 1秒間のノイズ 
    LONG_NOISE_BUFFER = this.createLongBitNoise(1); // 1秒間のノイズ 
    WHITE_NOISE_BUFFER = this.createWhiteNoise(1);
}

class TrackSoundNoise extends TrackSoundData
{
    constructor(){
        super();
        this.longBuffer = new Tone.Buffer(LONG_NOISE_BUFFER);
        this.shortBuffer = new Tone.Buffer(SHORT_NOISE_BUFFER);
        this.type = "noise";
    }

    reset(){
        super.reset();
    }

    createPlayInfo(){
        let info = {}
        info.bufferSorce = null;
        this.createEffects(info);
        let _this = this
        info.onended = function(){
            _this.stopPlayInfo(info);
        }
        return info;
    }

    stopPlayInfo(info){
        this.stopBufferPlayInfo(info);
        super.stopPlayInfo(info);
    }

    calcFreq(noteNumber){
        return this.calcPlayNoteRate(noteNumber) * ((NES_CLOCK_COUNT / 202) / Tone.context.sampleRate);
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time + 0.5;
        var volume = (e.velocity / 128); // 倍率

        let info = this.getOrCreatePlayInfo(!e.chord, t0 + WAIT_SEC);

        this.setCommands(info, t0, e.commands);
        if(e.mute){
            info.isActive = false;
            return;
        }

        // 毎回作る必要があるらしい
        this.setPrevBufferInfo(info);
        if(e.tone == 0){
            info.bufferSorce = new Tone.BufferSource(this.shortBuffer);
        }
        else{
            info.bufferSorce = new Tone.BufferSource(this.longBuffer);
        }
        info.bufferSorce.loop = true;
        this.setConnect(info);

        this.setEffects(info, t0, e);

        let notePlayRate = Math.pow(2,(e.noteNumber - 69 + e.key) / 12); // A4からの周波数倍率
        const sampleRate = Tone.context.sampleRate;
        // FCのクロック周波数を4から4068(202が中央?)で割りサンプリングレートで割ることで再生倍率を決定する
        let playbackRate = 1.0 * ((NES_CLOCK_COUNT / 202) / sampleRate) * notePlayRate;
        //let min = 1.0 * ((NES_CLOCK_COUNT / 4068) / sampleRate);
        //let max = 1.0 * ((NES_CLOCK_COUNT / 4) / sampleRate);
        //console.log("noise: playbackRate = " + playbackRate + " ,notePlayRate=" + notePlayRate + " ,min=" + min + " ,max=" + max);
        info.bufferSorce.playbackRate.setValueAtTime(playbackRate, t0 + WAIT_SEC);
        if(e.slur){
            let addTime = this.setSlur(info.bufferSorce.playbackRate, e.slur, t0 + WAIT_SEC, time, e.key);
            time += addTime;
        }
        t1 = t0 + time + info.env.release;
        if(e.pitch){
            this.setInstPitch(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.pitch);
        }
        if(e.volume){
            this.setInstVolume(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.volume);
        }
        this.applyFreqTimeLine(info.bufferSorce.playbackRate);
        this.applyVolumeTimeLine(info.gain.gain);
        info.bufferSorce.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.bufferSorce.stop(t1 + WAIT_SEC);

        this.setPlayInfoTime(info, t0 + WAIT_SEC, t1 + WAIT_SEC);
    }
}

class TrackSoundSource extends TrackSoundData
{
    constructor(){
        super();
        this.type = "sample";
    }

    reset(){
        super.reset();
    }

    createPlayInfo(){
        let info = {}
        info.bufferSorce = null;
        this.createEffects(info);
        let _this = this
        info.onended = function(){
            _this.stopPlayInfo(info);
        }
        return info;
    }

    stopPlayInfo(info){
        this.stopBufferPlayInfo(info);
        super.stopPlayInfo(info);
    }

    calcFreq(noteNumber){
        return this.calcPlayNoteRate(noteNumber);
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time + 0.5;
        var volume = (e.velocity / 128); // 倍率

        let info = this.getOrCreatePlayInfo(!e.chord, t0 + WAIT_SEC);

        this.setCommands(info, t0, e.commands);
        if(e.mute){
            info.isActive = false;
            return;
        }

        // 毎回作る必要があるらしい
        if(G_AudioSourceLoader.get(e.tone)) {
            this.setPrevBufferInfo(info);
            info.bufferSorce = new Tone.BufferSource(G_AudioSourceLoader.get(e.tone));
        }
        else{
            return;
        }

        info.bufferSorce.loop = false;
        this.setConnect(info);

        this.setEffects(info, t0, e);

        let notePlayRate = Math.pow(2,(e.noteNumber - 69 + e.key) / 12); // A4からの周波数倍率
        let playbackRate = 1.0 * notePlayRate;
        info.bufferSorce.playbackRate.setValueAtTime(playbackRate, t0 + WAIT_SEC);
        if(e.slur){
            let addTime = this.setSlur(info.bufferSorce.playbackRate, e.slur, t0 + WAIT_SEC, time, e.key);
            time += addTime;
        }
        t1 = t0 + time + info.env.release;
        if(e.pitch){
            this.setInstPitch(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.pitch);
        }
        if(e.volume){
            this.setInstVolume(e, t0 + WAIT_SEC,  t1 + WAIT_SEC, e.volume);
        }
        this.applyFreqTimeLine(info.bufferSorce.playbackRate);
        this.applyVolumeTimeLine(info.gain.gain);
        // e.playbackTime + e.duration + e.slurDuration
        let offset = getCurrentTime() - t0;
        offset = Math.max(offset, 0);
        info.bufferSorce.start(t0 + WAIT_SEC, offset);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.bufferSorce.stop(t1 + WAIT_SEC);

        this.setPlayInfoTime(info, t0 + WAIT_SEC, t1 + WAIT_SEC);
    }
}