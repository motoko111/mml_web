const SYNTH_TYPES = ["square","triangle","sine","sawtooth"]
const NOISE_TYPES = ["white", "brown", "pink"]
const PULSE_TYPES = [0.5,0.25,0.125,0.75]
const WAIT_SEC = 0
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
        }, 100);
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
        if(this.data == null) return;
        if(e.mute) return;
        if(e.playbackTime < 0) return;
        this.data.playNote(e);
    }

    stop(){
        if(this.data == null) return;
        this.data.stopPlayInfoAll();
    }

    isActive(){
        if(this.data == null) return false;
        return this.data.isActive();
    }
}

class TrackSoundData
{
    constructor(){
        this.playInfos = []
        this.isActivePlay = false;
    }

    setEnvelope(env, envParams)
    {
        env.attack = (envParams != null && envParams.length > 0) ? envParams[0] : 0.01
        env.decay = (envParams != null && envParams.length > 1) ? envParams[1] : 0.01
        env.sustain = (envParams != null && envParams.length > 2) ? envParams[2] : 1.0
        env.release = (envParams != null && envParams.length > 3) ? envParams[3] : 0.5
    }

    setSlur(frequency, slur, t0, time){
        if(slur == null || slur.length < 1) return 0;
        
        let t = t0 + time;
        let addTime = 0;
        slur.forEach(s => {
            t += s.duration;
            addTime += s.duration;
            console.log("slur:" + s.duration + "," + s.noteNumber);
            frequency.linearRampToValueAtTime(mtoco(s.noteNumber), t);
        });
        return addTime;
    }

    tick(dt){
        this.isActivePlay = false;
        for(let i = 0; i < this.playInfos.length; ++i){
            if(this.playInfos[i].isActive){
                if(this.playInfos[i].inactiveTime < getCurrentTime()){
                    if(this.playInfos[i].onended != null) this.playInfos[i].onended();
                    this.playInfos[i].isActive = false;
                }
                else{
                    this.isActivePlay = true;
                }
            }
        }
    }

    isLoaded(){
        return true;
    }

    isActive(){
        return this.isActivePlay;
    }

    playNote(e){
    }

    createPlayInfo(){
        let info = {}
        return info
    }

    stopPlayInfo(info){
        info.isActive = false;
    }

    stopPlayInfoAll(){
        for(let i = 0; i < this.playInfos.length; ++i){
            if(this.playInfos[i].isActive){
                this.stopPlayInfo(this.playInfos[i])
            }
        }
    }

    setStopPlayInfoTime(info, time){
        info.inactiveTime = time;
    }

    getOrCreatePlayInfo(){
        let info = null;
        for(let i = 0; i < this.playInfos.length; ++i){
            if(!this.playInfos[i].isActive){
                info = this.playInfos[i];
                break;
            }
        }
        if(info == null){
            info = this.createPlayInfo();
            this.addPlayInfo(info);
        }
        info.isActive = true;
        //console.log("playInfos length:" + this.playInfos.length);
        return info;
    }

    addPlayInfo(info){
        this.playInfos.push(info);
    }

    removePlayInfo(info){
        let index = this.playInfos.indexOf(info);
        if(index != -1){
            this.playInfos.splice(index,1);
        }
    }
}

class TrackSoundSynth extends TrackSoundData
{
    constructor(){
        super();
        this.synth = new Tone.Synth();
    }

    playNote(e){
        var synth = this.synth;
        synth.toDestination();
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time;
        var volume = (e.velocity / 128); // 倍率
        var envelope = e.envelope; // エンベロープ

        this.setEnvelope(synth.envelope, envelope);

        var type = SYNTH_TYPES[e.tone];
        synth.oscillator.type = type;
        synth.volume.value = -24 + 18 * volume; // decibel単位
        synth.triggerAttackRelease(mtoco(e.noteNumber + e.key), time, t0 + WAIT_SEC);
    }
}

class TrackSoundPulse extends TrackSoundData
{
    constructor(){
        super();
    }

    createPlayInfo(){
        let info = {}
        info.osc = new Tone.PulseOscillator();
        info.env = new Tone.AmplitudeEnvelope();
        info.osc.connect(info.env);
        info.env.toDestination();
        info.onended = function(){
            info.isActive = false;
        };
        return info;
    }

    stopPlayInfo(info){
        info.isActive = false;
        info.osc.stop();
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time;
        var volume = (e.velocity / 128); // 倍率
        var envelope = e.envelope; // エンベロープ
        var note = mtoco(e.noteNumber + e.key - 1);

        let info = this.getOrCreatePlayInfo();

        this.setEnvelope(info.env, envelope);

        info.osc.width.setValueAtTime(PULSE_TYPES[e.tone], t0 + WAIT_SEC);
        info.osc.frequency.setValueAtTime(note, t0 + WAIT_SEC);
        let addTime = this.setSlur(info.osc.frequency, e.slur, t0 + WAIT_SEC, time);
        time += addTime;
        t1 = t0 + time;
        info.osc.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.osc.stop(t1 + WAIT_SEC);

        this.setStopPlayInfoTime(info, t1 + WAIT_SEC + 0.5);
    }
}

class TrackSoundWave extends TrackSoundData
{
    constructor(){
        super();
        this.defaultWaveSize = 16
        this.oscWaves = this.createWave();
    }

    createPlayInfo(){
        let info = {}
        info.osc = new Tone.Oscillator({
            type:"custom",
            partials:this.oscWaves
        });
        info.env = new Tone.AmplitudeEnvelope();
        // osc -> env => output
        info.osc.connect(info.env);
        info.env.toDestination();
        info.onended = function(){
            info.isActive = false;
        };
        return info;
    }

    stopPlayInfo(info){
        info.isActive = false;
        info.osc.stop();
    }

    getWaveValue(n){
        return n/(this.defaultWaveSize - 1) - 8;
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
        console.log("setWave="+waves);
        this.oscWaves = this.getWaveValues(waves);
    }

    checkAndSetWave(waves){
        if(waves == null || waves.length < 1) return false;
        this.setWave(waves)
        return true
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time + 0.5;
        var volume = (e.velocity / 128); // 倍率
        var envelope = e.envelope; // エンベロープ
        var note = mtoco(e.noteNumber + e.key);

        let info = this.getOrCreatePlayInfo();

        if(this.checkAndSetWave(e.wave)){
            info.osc = new Tone.Oscillator({
                type:"custom",
                partials:this.oscWaves
            });
            info.osc.connect(info.env);
            info.env.toDestination();
            info.osc.ended = function(){
                info.isActive = false;
            };
        }

        this.setEnvelope(info.env, envelope);

        info.osc.frequency.setValueAtTime(note, t0 + WAIT_SEC);
        info.osc.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.osc.stop(t1 + WAIT_SEC);

        this.setStopPlayInfoTime(info, t1 + WAIT_SEC + 0.5);

        //console.log(this.osc.get())
    }
}

class TrackSoundTriangle extends TrackSoundWave
{
    createWave(){
        return this.getWaveValues([14,14,13,12,11,10,9,8,7,6,5,4,3,2,2]);
    }
}

class TrackSoundSin extends TrackSoundWave
{
    createWave(){
        let w = (t) => {
            return Math.round(Math.sin(t/(this.defaultWaveSize - 1)) * 7);
        }
        let list = []
        for(let i = 0; i < this.defaultWaveSize; ++i){
            list.push(w(i));
        }
        return this.getWaveValues(list);
    }
}

// whiteノイズ
function createWhiteNoise(duration) {
    const sampleRate = Tone.context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = Tone.context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    //console.log("bufferSize=" + bufferSize)
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
    }

    createPlayInfo(){
        let info = {}
        info.bufferSorce = null;
        info.env = new Tone.AmplitudeEnvelope();
        info.filter = new Tone.Filter(440, "bandpass");
        let _this = this
        info.onended = function(){
            _this.stopPlayInfo(info);
        }
        return info;
    }

    stopPlayInfo(info){
        info.isActive = false;
        if(info.bufferSorce != null){
            info.bufferSorce.disconnect(info.env);
            info.bufferSorce.stop();
        }
        info.bufferSorce = null;
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time + 0.5;
        var volume = (e.velocity / 128); // 倍率
        var envelope = e.envelope; // エンベロープ
        var note = mtoco(e.noteNumber + e.key);

        let info = this.getOrCreatePlayInfo();

        this.setEnvelope(info.env, envelope);

        // 毎回作る必要があるらしい
        if(e.tone == 0){
            info.bufferSorce = new Tone.BufferSource(this.shortBuffer);
        }
        else{
            info.bufferSorce = new Tone.BufferSource(this.longBuffer);
        }
        info.bufferSorce.loop = true;
        info.bufferSorce.connect(info.env)
        info.env.connect(info.filter);
        info.filter.toDestination();

        info.filter.frequency.setValueAtTime(note, t0 + WAIT_SEC);
        let playbackRate = 1.0 * mtof(e.noteNumber + e.key) / 440.0;
        info.bufferSorce.playbackRate.setValueAtTime(playbackRate, t0 + WAIT_SEC);
        info.bufferSorce.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.bufferSorce.stop(t1 + WAIT_SEC);

        this.setStopPlayInfoTime(info, t1 + WAIT_SEC + 0.5);
    }
}

/**
 * オーディオファイルをAudioBufferに変換し、Audio APIで利用できるようにして返す
 * @param samplePath オーディオファイルのパス
 * @returns AudioBuffer
 */
const setupSample = async (samplePath) => {
    const response = await fetch(samplePath);
    console.log(response)
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
    return audioBuffer;
  };
  var SourceBuffers = [];
const createAudioBuffer = async () => {
    let resources = [
        'assets/audio/knoc.wav'
        ,'assets/audio/critical.wav'
        ,'assets/audio/fly.wav'
        ,'assets/audio/cancel2.wav'
        ,'assets/audio/tam.wav'
        //,'assets/audio/8bit_wav/KK1.wav'
        //,'assets/audio/8bit_wav/KK2.wav'
    ]
    for(let i = 0; i < resources.length; ++i){
        const buffer = await setupSample(resources[i]);
        SourceBuffers.push(new Tone.Buffer(buffer));
    }
    console.log(SourceBuffers)
  };
class TrackSoundSource extends TrackSoundData
{
    constructor(){
        super();
    }

    createPlayInfo(){
        let info = {}
        info.bufferSorce = null;
        info.env = new Tone.AmplitudeEnvelope();
        info.filter = new Tone.Filter(440, "bandpass");
        let _this = this
        info.onended = function(){
            _this.stopPlayInfo(info);
        }
        return info;
    }

    stopPlayInfo(info){
        info.isActive = false;
        if(info.bufferSorce != null){
            info.bufferSorce.disconnect(info.env);
            info.bufferSorce.stop();
        }
        info.bufferSorce = null;
    }

    playNote(e){
        var time = e.duration /* 音符の長さ */ * (e.quantize /* 音の長さ倍率 */ / 100);
        var t0 = e.playbackTime;// 再生開始時間
        var t1 = t0 + time + 0.5;
        var volume = (e.velocity / 128); // 倍率
        var envelope = e.envelope; // エンベロープ
        var note = mtoco(e.noteNumber + e.key);

        let info = this.getOrCreatePlayInfo();

        this.setEnvelope(info.env, envelope);

        // 毎回作る必要があるらしい
        if(SourceBuffers.length > e.tone) {
            info.bufferSorce = new Tone.BufferSource(SourceBuffers[e.tone]);
        }
        else{
            return;
        }

        info.bufferSorce.loop = false;
        info.bufferSorce.connect(info.env)
        info.env.connect(info.filter);
        info.filter.toDestination();

        //this.filter.frequency.setValueAtTime(note, t0 + WAIT_SEC);
        let playbackRate = 1.0 * mtof(e.noteNumber + e.key) / 440.0;
        info.bufferSorce.playbackRate.setValueAtTime(playbackRate, t0 + WAIT_SEC);
        info.bufferSorce.start(t0 + WAIT_SEC);
        info.env.triggerAttackRelease(time, t0 + WAIT_SEC, volume);
        info.bufferSorce.stop(t1 + WAIT_SEC);

        this.setStopPlayInfoTime(info, t1 + WAIT_SEC + 0.5);
    }
}

class TrackSoundPlayer extends TrackSoundData
{
    constructor(){
        super();
        let info = this.getOrCreatePlayInfo();
        info.isActive = false;
        this.playerInfo = info;
    }

    isLoaded(){
        if(this.playerInfo) return this.playerInfo.player.loaded;
        return false;
    }

    createPlayInfo(){
        let info = {}
        info.player = new Tone.Player({
            url:"/assets/audio/saigetsu_lsdj.mp3",
            autostart:false,
            onload: function(){
                info.duration = info.player.buffer.duration; // 曲の長さ
            }
        });
        info.filter = new Tone.Filter(440, "bandpass");
        let _this = this
        info.onended = function(){
            _this.stopPlayInfo(info);
        }
        return info;
    }

    stopPlayInfo(info){
        info.isActive = false;
        if (info.player && info.player.state === 'started') {
            info.player.stop();
        }
    }

    playNote(e){
        var t0 = e.playbackTime;// 再生開始時間
        let info = this.getOrCreatePlayInfo();
        var t1 = info.duration + e.playbackTime;
        var volume = (e.velocity / 128); // 倍率 // db -60:ほぼ無音 0:最大音量

        if(info.player.loaded){
            info.player.toDestination();
            info.player.start(t0 + WAIT_SEC, Math.min(info.duration, Math.max(0, getCurrentTime() - t0)));
            info.player.volume.setValueAtTime(-16 + volume * 16, t0);
    
            this.setStopPlayInfoTime(info, t1 + WAIT_SEC + 0.5);
        }
    }
}