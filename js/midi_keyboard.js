class MidiKeyboard {
    constructor(){
        this.synths = []
        this.synthMap = {}
        this.inputs = []
        this.onNoteAttackEvent = null;
        this.onNoteReleaseEvent = null;
        this.isEnablePlay = true;
    }
    requestMidiAccess(){
        var _this = this;
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then((midiAccess) => {

                const inputs = midiAccess.inputs;

                this.inputs.forEach(input => {
                    input.onmidimessage = null;
                });

                this.initSynths();

                inputs.forEach(input => {
                    console.log("" + input);
                    input.onmidimessage = (event) => {
                        _this.handleMidiMessage(event);
                    };
                    this.inputs.push(input);
                });

                console.log("MIDI接続成功:", midiAccess);
            }, () => {
                console.error("MIDI接続失敗");
            });
        } else {
            console.warn("このブラウザはWeb MIDI APIをサポートしていません。");
        }
    }
    handleMidiMessage(event){
        const [status, data1, data2] = event.data;
        const command = status & 0xf0;
        const channel = status & 0x0f;
        const note = data1;
        const velocity = data2;

        switch (command) {
            case 0x90: // Note On
            if (velocity > 0) {
                this.onNoteAttack(note, velocity);
            } else {
                this.onNoteRelease(note);
            }
            break;
            case 0x80: // Note Off
            this.onNoteRelease(note);
            break;
        }
    }
    onNoteAttack(note, velocity){
        let info = this.getSynth();
        if(!info.isLoaded) {
            console.log(`Note On: ${note} not loaded.)`);
            return;
        }
        if(info.isActive){
            console.log(`Note On: ${note} aleady used.)`);
            return;
        }
        this.synthMap[note] = info;
        info.isActive = true;
        info.startTime = getCurrentTime();
        const frequency = Tone.Frequency(note, "midi").toFrequency();
        if(this.isEnablePlay) info.synth.triggerAttack(frequency, 0, 0.5 + velocity * 0.01 * 0.5);
        console.log(`Note On: ${note} (velocity: ${velocity})`);
        if(this.onNoteAttackEvent) this.onNoteAttackEvent(note);
    }
    onNoteRelease(note){
        let info = this.synthMap[note];
        if(info == null) {
            console.log(`Note Off: ${note} is null.)`);
            return;
        }
        if(!info.isLoaded || !info.isActive) {
            console.log(`Note Off: ${note} not loaded.)`);
            return;
        }
        this.synthMap[note] = null;
        info.isActive = false;
        info.synth.triggerRelease();
        console.log(`Note Off: ${note}`);
        if(this.onNoteAttackEvent) this.onNoteReleaseEvent(note, getCurrentTime() - info.startTime);
    }
    isActive(){
        return false;
    }
    createSynth(onload){
        onload();
        return new Tone.Synth().toDestination();
        /*
        return  new Tone.Sampler({
            urls: {
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
            },
            attack: 0.1,
            release: 1.0,
            onload: onload,
            baseUrl: "/assets/audio/piano/",
        }).toDestination();
        */
    }
    initSynths(){
        for(let i = this.synths.length-1;i<20;++i){
            let info = {}
            info.isActive = false,
            info.isLoaded = false,
            info.startTime = 0,
            info.synth = this.createSynth(() => {
                info.isLoaded = true;
            }),
            this.synths.push(info);
        }
    }
    getSynth(){
        for(let i = 0; i < this.synths.length; ++i){
            if(!this.synths[i].isActive && this.synths[i].isLoaded){
                return this.synths[i];
            }
        }
        let info = {}
            info.isActive = false,
            info.isLoaded = false,
            info.startTime = 0,
            info.synth = this.createSynth(() => {
                info.isLoaded = true;
            }),
        this.synths.push(info);
        return this.synths[this.synths.length-1];
    }
    setEnablePlay(flag){
        this.isEnablePlay = flag;
    }
}
