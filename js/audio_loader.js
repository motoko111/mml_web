class AudioSourceLoader {
    constructor(){
        this.buffers = {}
    }
    /**
     * オーディオファイルをAudioBufferに変換し、Audio APIで利用できるようにして返す
     * @param samplePath オーディオファイルのパス
     * @returns AudioBuffer
     */
    async setupSample(samplePath){
        const response = await fetch(samplePath);
        console.log(response)
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
        return audioBuffer;
    }
    async loadAsync(file, onSuccess, onError){
        let regex = new RegExp("^.*/", 'g');
        let fileName = file.replace("\\","/").replace(regex, "");
        let matches = fileName.match(REGEX_AUDIO_HEADER);
        let reqest = {isLoaded:false,source:null,fileName:fileName};
        if(matches){
            let num = parseInt(matches[0]);
            this.buffers[num] = reqest;
            this.buffers[num].source = null;
            const buffer = await this.setupSample(file);
            this.buffers[num].source = new Tone.Buffer(buffer);
            this.buffers[num].isLoaded = true;
            if(onSuccess) onSuccess(this.buffers[num]);
            return;
        }
        if(onError) onError();
    }
    async loadBufferAsync(file, arrayBuffer, onSuccess, onError){
        let regex = new RegExp("^.*/", 'g');
        let fileName = file.replace("\\","/").replace(regex, "");
        let matches = fileName.match(REGEX_AUDIO_HEADER);
        let reqest = {isLoaded:false,source:null,fileName:fileName};
        if(!matches) {
            if(onError) onError();
            return;
        }
        let num = parseInt(matches[0]);
        const buffer = await Tone.context.decodeAudioData(arrayBuffer);
        if(!buffer){
            if(onError) onError();
            return;
        }
        this.buffers[num] = reqest;
        this.buffers[num].source = new Tone.Buffer(buffer);
        this.buffers[num].isLoaded = true;
        if(onSuccess) onSuccess(this.buffers[num]);
    }
    isLoading(){
        for (const info in this.buffers) {
            if (!info.isLoaded) {
                return true;
            }
        }
        return false;
    }
    progress(){
        let max = 0;
        let cnt = 0;
        for (const info in this.buffers) {
            if (!info.isLoaded) {
                cnt ++;
            }
            max++;
        }
        if(max == 0) return 1;
        return cnt/max;
    }
    async waitForFinishLoad(){
        while(this.progress() < 1.0){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    get(number){
        if(this.buffers[number]) return this.buffers[number].source;
        return null;
    }
    clear(){
        this.buffers.forEach((info) => {
            if(info && info.buffer) info.buffer.dispose();
        });
        this.buffers = {}
    }
}
G_AudioSourceLoader = new AudioSourceLoader();

// 共通で読み込む
const createAudioBuffer = async () => {
    let resources = [
        'assets/audio/000_knoc.wav'
        ,'assets/audio/001_critical.wav'
        ,'assets/audio/002_fly.wav'
        ,'assets/audio/003_cancel2.wav'
        ,'assets/audio/004_tam.wav'
        ,'assets/audio/005_A4.mp3'
    ]
    for(let i = 0; i < resources.length; ++i){
        let file = resources[i];
        await G_AudioSourceLoader.loadAsync(file);
    }
    console.log(G_AudioSourceLoader.buffers);
  };