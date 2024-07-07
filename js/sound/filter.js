/*
class SoundFilter{
    constructor(){
        this.eq3 = new Tone.EQ3();
        this.setFreq(0,440*Math.pow(2,20));
        this.setGain(1,1,1);
    }
    connect(node){
        this.eq3.connect(node);
    }

    disconnect(){
        this.eq3.disconnect();
    }
    getRootNode(){
        return this.eq3;
    }
    setFreq(low,high){
        this.eq3.lowFrequency.value  = low;
        this.eq3.highFrequency.value = high;
    }
    // 0-1.5
    setGain(low, mid,high){
        let rate = 48
        this.eq3.low.value  = rate * Math.min(1.5,low) - rate;
        this.eq3.mid.value  = rate * Math.min(1.5,mid) - rate 
        this.eq3.high.value = rate * Math.min(1.5,high) - rate;
    }
}*/
class SoundFilter{
    constructor(){
        this.lowCut = new Tone.Filter({type:"highpass"});
        this.highCut = new Tone.Filter({type:"lowpass"});
        this.setFreq(0,440*Math.pow(2,20));
        this.setQ(1,1);

        this.lowCut.chain(this.highCut);
    }
    connect(node){
        this.lowCut.chain(this.highCut,node);
    }

    disconnect(){
        this.highCut.disconnect();
        this.lowCut.disconnect();
    }
    getRootNode(){
        return this.lowCut;
    }
    getLastNode(){
        return this.highCut;
    }
    setFreq(low,high){
        this.lowCut.frequency.value  = low;
        this.highCut.frequency.value = high;
    }
    setGain(low, high){

    }
    // 0-1
    setQ(low, high){
        this.lowCut.Q.value = low;
        this.highCut.Q.value = high;
    }
}