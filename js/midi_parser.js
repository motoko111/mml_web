// 参考
// https://maruyama.breadfish.jp/tech/smf/

// 10CHパーカッションマップ
// https://akiyoshiogata.com/midi/gm/C17.html

let byteArrayToInt = (arr) => {
    let value = 0;
    for (let i = 0; i < arr.byteLength; i++) {
        value = (value << 8) | arr[i];
    }
    return value;
}

let byteSliceToInt = (bytes, start, end) => {
    return byteArrayToInt(bytes.slice(start,end));
}

let intToBytes = (val, byteLength = 4, littleEndian = false) => {
    const byteArray = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
        const byte = (val >> (8 * (littleEndian ? i : byteLength - 1 - i))) & 0xFF;
        byteArray[i] = byte;
    }
    return byteArray;
}

// バイト配列に含まれる可変長のデータ長を取得する
let variableLengthToInt = (bytes, start ,end) => {
    let value = 0;
    let index = start;
    let count = 0;
    if(!end) end = Number.MAX_SAFE_INTEGER;
    // 最上位ビット(8bit目)が1なら有効データ
    while((index < end - 1) && bytes[index]>=0x80){
        //1.最上位ビットのみ反転(例：1000 0001 => 0000 0001にする)
        var a = bytes[index] ^ (1<<7);
        //2.valueに反転した値を保持しておく
        value = value<<7 | a;
        index++;
        count++;
    }
    if(count > 0) value = value<<7;
    //最後の値を連結
    value = value | bytes[index];
    index++;
    // console.log(bytes + "=>" + value)
    return [value,index];
}

// 可変長のデータ長をバイト配列に変換する
let intToVariableLengthBytes = (val) => {
    let bytes = []
    let count = 0;
    while(true){
        // 下位7ビットを取得
        let bit = val & 0b01111111;
        // 右シフトして下位ビットを消す
        val = val >> 7;
        if(count > 0){
            bit |= 0b10000000;
        }
        // 下位7bitを先頭に格納
        bytes.unshift(bit);
        // データが残っていれば継続
        if(val <= 0){
            break;
        }
        count++;
    }
    return new Uint8Array(bytes);
}

// 配列を結合する
let concatBytes = (bytes1, bytes2) => {
    if(bytes2 === undefined) return bytes1;
    if(typeof bytes2 == "number") bytes2 = new Uint8Array([bytes2]);
    //console.log("bytes1 " + bytes1.byteLength);
    //console.log("bytes2 " + bytes2.byteLength);
    //console.log(bytes2);
    let arrays = [bytes1, bytes2];
    let totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
 }

class MidiEvent {
    constructor(){
        this.status = 0;
        this.type = "";
        this.eventType = 0;
        this.size = 0;
    }
    static parse(status,bytes,index,refData){
        let data = null;

        // ステータスバイトを解析
        const eventType = status >> 4;
        const channel = status & 0x0F;

        if(MidiEvent.isMetaStatus(status)){
            //イベントタイプ
            let metaEventType = byteSliceToInt(bytes, index, index+1);
            index+=1;

            //メタイベントのデータ量は3バイト目に保持されている
            let size = byteSliceToInt(bytes, index, index+1);
            index+=1;

            //データ
            let metadata = bytes.slice(index,index+size);
            index+= size;

            // メタイベントタイプに基づいてデータを解析
            data = MidiMetaEvent.parse(metaEventType, size, metadata);
        }
        else if(MidiEvent.isMidiStatus(status)){
            let result = MidiMidiEvent.parse(eventType, channel, bytes, index);
            data = result[0];
            index = result[1] + index;
        }
        else if(MidiEvent.isSysExStatus(status)){
            let result = MidiSysEx.parse(status, bytes, index);
            data = result[0];
            index = result[1] + index;
        }
        return [data, index];
    }
    toBytes(){
        return new Uint8Array();
    }

    static isMidiStatus(status){
        return status >=0x80 && status <=0xEF;
    }

    static isSysExStatus(status){
        return status >= 0xF0 && status <= 0xFE;
    }

    static isMetaStatus(status){
        return status === 0xFF;
    }
}
class MidiMetaEvent extends MidiEvent{
    constructor(eventType, size){
        super();
        this.status = 0xFF;
        this.size = size;
        this.eventType = eventType;
    }
    static parse(eventType, size, bytes){
        switch(eventType){
            case 0x51: return MidiEventTempo.parse(eventType, size, bytes);
            case 0x01: 
            case 0x02: 
            case 0x03: 
            case 0x04: 
            case 0x05: 
            case 0x06: 
            case 0x07: 
                return MidiEventText.parse(eventType, size, bytes);
            case 0x20: return MidiEventChannelPrefix.parse(eventType, size, bytes);
            case 0x00: return MidiEventSequenceNumber.parse(eventType, size, bytes);
            case 0x2F: return MidiEventTrackEnd.parse(eventType, size, bytes);
            case 0x54: return MidiEventSMPTEOffset.parse(eventType, size, bytes);
            case 0x58: return MidiEventTimeSignature.parse(eventType, size, bytes);
            case 0x59: return MidiEventKeySignature.parse(eventType, size, bytes);
            case 0x7F: return MidiEventSequencerSpecific.parse(eventType, size, bytes);
            default: return MidiEventUnknown.parse(eventType, size, bytes); 
        }
        return null;
    }
    toBytes(bytes){
        let arr = new Uint8Array([this.eventType, this.size]);
        arr = concatBytes(arr,bytes);
        return arr;
    }
}
class MidiEventTempo extends MidiMetaEvent {
    constructor(tempo){
        super(0x51, 3);
        this.tempo = tempo;
        this.bpm = Math.round(60000000 / this.tempo);
    }
    static createFromBPM(bpm){
        return new MidiEventTempo(Math.round(60000000 / bpm));
    }
    static parse(eventType, size, bytes){
        //console.log("tempo1:" + bytes[0])
        //console.log("tempo2:" + bytes[1])
        //console.log("tempo3:" + bytes[2])
        return new MidiEventTempo((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]);
    }
    toBytes(){
        let val0 = this.tempo >> 16;
        let val1 = (this.tempo - (val0 << 16) ) >> 8;
        let val2 = (this.tempo - (val0 << 16) - (val1 << 8));
        return super.toBytes(new Uint8Array([val0, val1, val2]));
    }
}
class MidiEventText extends MidiMetaEvent {
    constructor(eventType, text){
        let encoder = new TextEncoder();
        let byteArray = encoder.encode(text);
        super(eventType, byteArray.length);
        this.text = text;
    }
    static parse(eventType, size, bytes){
        let decorder = new TextDecoder();
        let byteArray = bytes.slice(0, bytes.size);
        let text = decorder.decode(byteArray);
        return new MidiEventText(eventType, text);
    }
    toBytes(){
        let encoder = new TextEncoder();
        let byteArray = encoder.encode(this.text);
        return super.toBytes(new Uint8Array(byteArray));
    }
}
class MidiEventChannelPrefix extends MidiMetaEvent {
    constructor(channel){
        super(0x20,1);
        this.channel = channel;
    }
    static parse(eventType, size, bytes){
        return new MidiEventChannelPrefix(bytes[0]);
    }
    toBytes(){
        return super.toBytes(new Uint8Array([this.channel]));
    }
}
class MidiEventSequenceNumber extends MidiMetaEvent {
    constructor(number){
        super(0x00,1);
        this.number = number;
    }
    static parse(eventType, size, bytes){
        return new MidiEventSequenceNumber(bytes[0]);
    }
    toBytes(){
        return super.toBytes(new Uint8Array([this.number]));
    }
}
class MidiEventTrackEnd extends MidiMetaEvent {
    constructor(){
        super(0x2F,0);
    }
    static parse(eventType, size, bytes){
        return new MidiEventTrackEnd();
    }
    toBytes(){
        return super.toBytes(new Uint8Array([]));
    }
}
class MidiEventSMPTEOffset extends MidiMetaEvent {
    constructor(hour,min,sec,frame,subframe){
        super(0x54,5);
        this.hour = hour;
        this.min = min;
        this.sec = sec;
        this.frame = frame;
        this.subframe = subframe;
    }
    static parse(eventType, size, bytes){
        return new MidiEventSMPTEOffset(bytes[0],bytes[1],bytes[2],bytes[3],bytes[4]);
    }
    toBytes(){
        return super.toBytes(new Uint8Array([this.hour,this.min,this.sec,this.frame,this.subframe]));
    }
}
class MidiEventTimeSignature extends MidiMetaEvent {
    constructor(numerator,denominator,metronome,thirtySeconds){
        super(0x58,4);
        this.numerator = numerator;
        this.denominatorPlane = denominator;
        this.denominator = Math.pow(2, denominator);
        this.metronome = metronome;
        this.thirtySeconds = thirtySeconds;
    }
    static parse(eventType, size, bytes){
        return new MidiEventTimeSignature(bytes[0],bytes[1],bytes[2],bytes[3]);
    }
    toBytes(){
        return super.toBytes(new Uint8Array([this.numerator,this.denominatorPlane,this.metronome,this.thirtySeconds]));
    }
}
class MidiEventKeySignature extends MidiMetaEvent {
    constructor(key,scale){
        super(0x59,2);
        this.key = key;
        this.scale = scale;
    }
    static parse(eventType, size, bytes){
        return new MidiEventKeySignature(bytes[0],bytes[1]);
    }
    toBytes(){
        return super.toBytes(new Uint8Array([this.key,this.scale]));
    }
}
class MidiEventSequencerSpecific extends MidiMetaEvent {
    constructor(){
        super(0x7F,0);
    }
    static parse(eventType, size, bytes){
        return new MidiEventSequencerSpecific();
    }
    toBytes(){
        return super.toBytes(new Uint8Array([]));
    }
}
class MidiEventUnknown extends MidiMetaEvent {
    constructor(eventType){
        super(eventType, 0);
    }
    static parse(eventType, size, bytes){
        return new MidiEventUnknown(eventType);
    }
    toBytes(){
        return super.toBytes(new Uint8Array([]));
    }
}

class MidiMidiEvent extends MidiEvent {
    constructor(eventType, channel){
        super();
        this.eventType = eventType;
        this.channel = channel;
        this.status = this.eventType << 4 | channel;
    }
    static parse(eventType, channel, bytes, index){
        let ret = [null,0];
        switch(eventType){
            case 0x8:
            case 0x9:
                ret = MidiNote.parse(eventType, channel, bytes, index); break;
            case 0xA:
                ret = MidiKeyPressure.parse(eventType, channel, bytes, index); break;
            case 0xB:
                ret = MidiKeyControl.parse(eventType, channel, bytes, index); break;
            case 0xC:
                ret = MidiKeyProgramChange.parse(eventType, channel, bytes, index); break;
            case 0xD:
                ret = MidiKeyChannelPressure.parse(eventType, channel, bytes, index); break;
            case 0xE:
                ret = MidiKeyPitchBend.parse(eventType, channel, bytes, index); break;
            default:
                break;
        }
        return ret;
    }
    toBytes(){
    }
}
class MidiNote extends MidiMidiEvent{
    constructor(channel, isOn, note, velocity){
        super(isOn ? 0x9 : 0x8, channel);
        this.note = note;
        this.velocity = velocity;
    }
    static parse(eventType, channel, bytes, index){
        return [new MidiNote(channel, eventType === 0x9, byteSliceToInt(bytes, index, index+1), byteSliceToInt(bytes, index+1, index+2)), 2];
    }
    toBytes(){
        return new Uint8Array([intToBytes(this.note, 1), intToBytes(this.velocity, 1)]);
    }
}
class MidiKeyPressure extends MidiMidiEvent{
    constructor(channel, note, pressure){
        super(0xA, channel);
        this.note = note;
        this.pressure = pressure;
    }
    static parse(eventType, channel, bytes, index){
        return [new MidiKeyPressure(channel, byteSliceToInt(bytes, index, index+1), byteSliceToInt(bytes, index+1, index+2)), 2];
    }
    toBytes(){
        return new Uint8Array([intToBytes(this.note, 1), intToBytes(this.pressure, 1)]);
    }
}
class MidiKeyControl extends MidiMidiEvent{
    constructor(channel, controlNumber, controlValue){
        super(0xB, channel);
        this.controlNumber = controlNumber;
        this.controlValue = controlValue;
    }
    static parse(eventType, channel, bytes, index){
        return [new MidiKeyControl(channel, byteSliceToInt(bytes, index, index+1), byteSliceToInt(bytes, index+1, index+2)),2];
    }
    toBytes(){
        return new Uint8Array([intToBytes(this.controlNumber, 1), intToBytes(this.controlValue, 1)]);
    }
}
// midi音源変更
// 参考
// https://akiyoshiogata.com/midi/gm/0002.html
class MidiKeyProgramChange extends MidiMidiEvent{
    constructor(channel, programNumber){
        super(0xC, channel);
        this.programNumber = programNumber;
    }
    static parse(eventType, channel, bytes, index){
        return [new MidiKeyProgramChange(channel, byteSliceToInt(bytes, index, index+1)),1];
    }
    toBytes(){
        return new Uint8Array([intToBytes(this.programNumber, 1)]);
    }
}
class MidiKeyChannelPressure extends MidiMidiEvent{
    constructor(channel, pressure){
        super(0xD, channel);
        this.pressure = pressure;
    }
    static parse(eventType, channel, bytes, index){
        return [new MidiKeyChannelPressure(channel, byteSliceToInt(bytes, index, index+1)),1];
    }
    toBytes(){
        return new Uint8Array([intToBytes(this.pressure, 1)]);
    }
}
class MidiKeyPitchBend extends MidiMidiEvent{
    constructor(channel, lsb, msb){
        super(0xE, channel);
        this.msb = msb;
        this.lsb = lsb;
        this.value = ((msb << 7) | lsb) - 8192;
    }
    static parse(eventType, channel, bytes, index){
        return [new MidiKeyPitchBend(channel, byteSliceToInt(bytes, index, index+1), byteSliceToInt(bytes, index+1, index+2)),2];
    }
    toBytes(){
        return new Uint8Array([intToBytes(this.msb, 1), intToBytes(this.lsb, 1)]);
    }
}
class MidiSysEx extends MidiEvent{
    constructor(status, size, sizeLength, data){
        super();
        this.size = size;
        this.sizeLength = sizeLength;
        this.data = data;
        this.status = status;
    }
    static parse(status, bytes, index){
        // サイズ
        let prevIndex = index;
        let result = variableLengthToInt(bytes, index, bytes.byteLength - index);
        let size = result[0];
        index = result[1];
        let sizeLength = index - prevIndex;

        //データ
        let data = bytes.slice(index,index+data.size);
        index+= data.size;

        return [new MidiSysEx(status, size, sizeLength, data), sizeLength + size];
    }
    toBytes(){
        let bytes = intToVariableLengthBytes(this.size);
        bytes = concatBytes(bytes, this.data);
        return new Uint8Array(bytes);
    }
}

class MidiHeader{
    constructor(){
        this.chankType = [0x4d,0x54,0x68,0x64];
        this.size = 0;
        this.format = 1; // マルチトラックなら1
        this.trackCount = 0;
        this.resolution = 480;
    }
    setTime(time){
        this.timeManage = 1 << 7; // 何分何秒何フレーム 最上位ビットが1なら何分何秒何フレーム 0なら何小節何拍
        let t = (this.timeManage << 8) | time;
        this.resolution = t;
    }
    // 4分音符をmesure個に分解した値を時間の最小単位とする
    // 全音符の分解能が1920だったなら、 ここに入るデータは 1920÷4 = 480 = 0x01E0 となる。
    setTimeMeasure(mesure){
        this.timeManage = 0 << 7; // 何小節何拍 最上位ビットが1なら何分何秒何フレーム 0なら何小節何拍
        let t = (this.timeManage << 8) | mesure;
        this.resolution = t;
    }
    parse(bytes){
        let index = 0;
        
        this.chankType = bytes.slice(index,index+4);
        index+=4;

        this.size = byteSliceToInt(bytes, index,index+4);
        index+=4;

        this.format = byteSliceToInt(bytes, index,index+2);
        index+=2;

        this.trackCount = byteSliceToInt(bytes, index,index+2);
        index+=2;

        this.timeManage = bytes.slice(index,index+1);
        this.resolution = byteSliceToInt(bytes, index,index+2);
        index+=2;

        return index;
    }

    toBytes(bytes){
        bytes = concatBytes(bytes, this.chankType);
        let dataSizeStartIndex = bytes.length;
        bytes = concatBytes(bytes, intToBytes(this.size,4));
        let dataStartIndex = bytes.length;
        bytes = concatBytes(bytes, intToBytes(this.format,2));
        bytes = concatBytes(bytes, intToBytes(this.trackCount,2));
        bytes = concatBytes(bytes, intToBytes(this.resolution,2));
        // データサイズを更新
        let dataSize = bytes.length - dataStartIndex;
        let dataSizeData = intToBytes(dataSize, 4);
        for(let i = 0; i < 4; ++i){
            bytes[dataSizeStartIndex + i] = dataSizeData[i];
        }
        this.size = dataSize;
        return bytes;
    }
}

class MidiTrack{
    constructor(){
        this.chankType = [0x4d,0x54,0x72,0x6b];
        this.trackData = [];
    }

    add(deltaTime, eventData){
        this.trackData.push({deltaTime:deltaTime,status:eventData.status,eventData:eventData});
    }

    clear(){
        this.trackData.splice(0);
    }

    parse(startIndex,bytes){
        let index = startIndex;

        this.chankType = bytes.slice(index,index+4);
        index+=4;

        this.size = byteSliceToInt(bytes, index,index+4);
        index+=4;

        let dataStartIndex = index;
        this.trackData = [];
        while(index < dataStartIndex + this.size)
        {
            let refData = {}
            index = this.parseData(index, bytes, refData);
            this.trackData.push(refData);
        }

        return index;
    }
    
    toBytes(bytes){
        //console.log("chankType:" + bytes.length);
        bytes = concatBytes(bytes, this.chankType);
        //console.log("size:" + bytes.length);
        let dataSizeStartIndex = bytes.length;
        bytes = concatBytes(bytes, intToBytes(this.size,4));
        //console.log("format:" + bytes.length);
        //bytes = concatBytes(bytes, intToBytes(this.format,2));
        let dataStartIndex = bytes.length;
        for(let i = 0; i < this.trackData.length; ++i){
            bytes = this.dataToBytes(bytes,this.trackData[i]);
        }
        // データサイズを更新
        let dataSize = bytes.length - dataStartIndex;
        let dataSizeData = intToBytes(dataSize, 4);
        for(let i = 0; i < 4; ++i){
            bytes[dataSizeStartIndex + i] = dataSizeData[i];
        }
        this.size = dataSize;
        return bytes;
    }

    dataToBytes(bytes, data){
        //console.log("deltaTime:" + bytes.length);
        bytes = concatBytes(bytes, intToVariableLengthBytes(data.deltaTime));
        //console.log("eventDataToBytes:" + bytes.length);
        bytes = this.eventDataToBytes(bytes, data);
        return bytes;
    }

    eventDataToBytes(bytes, data)
    {
        //console.log("status:" + bytes.length);
        bytes = concatBytes(bytes, intToBytes(data.status,1));
        //console.log("eventData:" + bytes.length);
        bytes = concatBytes(bytes, data.eventData.toBytes());
        return bytes;
    }

    parseData(startIndex, bytes, refData){
        let index = startIndex;
        //デルタタイムを取得
        index = this.getDeltaTime(index, bytes, refData);
        //イベントを取得
        index = this.getEvent(index, bytes, refData);
        return index;
    }

    getDeltaTime(startIndex, bytes, refData){
        let index = startIndex;
        let result = variableLengthToInt(bytes, index);
        let value = result[0];
        index = result[1];
        //計算したデルタタイムと配列の残りをリターン
        refData.deltaTime = value;
        return index;
    }

    getEvent(startIndex, bytes, refData){
        let index = startIndex;
        var data={};
        
        //ステータスバイトを取得
        let status = byteSliceToInt(bytes, index, index+1);
        index+=1;

        // イベントデータをパース
        let result = MidiEvent.parse(status, bytes, index);
        data = result[0];
        index = result[1];

        // イベントデータを格納
        refData.status = status;
        refData.eventData = data;

        return index;
    }   

    // データを時間順に並べ替える
    sort(){
        let time = 0;
        this.trackData.forEach((data) => {
            time += data.deltaTime;
            data.time = time;
        });
        this.trackData = this.trackData.sort((a,b)=>{
            return a.time - b.time;
        });
        let prev = 0;
        this.trackData.forEach((data) => {
            let now = data.time;
            data.deltaTime = now - prev;
            prev = now;
        });
    }
    
}

class MidiParser{
    constructor(){
        this.init();
    }

    init(){
        this.header = new MidiHeader();
        this.tracks = [];
    }

    async parseAsync(filepath){
        var result = await fetch(filepath);
        const arrayBuffer = await result.arrayBuffer();

        this.parse(arrayBuffer);
    }

    parse(inputArray){
        const bytes = new Uint8Array(inputArray);
        
        this.init();
        let index = this.header.parse(bytes);
        for(let i = 0; i < this.header.trackCount; ++i)
        {
            let track = new MidiTrack();
            index = track.parse(index, bytes);
            this.tracks.push(track);
        }
    }

    toBytes(){
        let bytes = new Uint8Array();
        let prevSize = bytes.byteLength;
        this.header.format = 1;
        this.header.trackCount = this.tracks.length;
        bytes = this.header.toBytes(bytes);
        console.log("header size=" + (bytes.byteLength - prevSize));
        for(let i = 0; i < this.tracks.length; ++i)
            {
                let track = this.tracks[i];
                prevSize = bytes.byteLength;
                bytes = track.toBytes(bytes);
                console.log("track[" + i + "] size=" + (bytes.byteLength - prevSize));
            }
        return bytes;
    }
}

let test = async () => {
    let filepath = "/assets/midi/music.mid";
    var result = await fetch(filepath);
    const arrayBuffer = await result.arrayBuffer();

    let parser = new MidiParser();
    parser.parse(arrayBuffer);

    console.log(parser);

    const prevBytes = new Uint8Array(arrayBuffer);
    let bytes = parser.toBytes();
    for(let i = 0; i < bytes.length; ++i){
        if(prevBytes[i] != bytes[i]){
            console.error("not equals array buffer. index:" + i + " " + prevBytes[i] + " != " + bytes[i]);
        }
    }
    console.log(arrayBuffer);
    console.log(bytes);
}
let test2 = async() => {
    let parser = new MidiParser();
    let header = new MidiHeader();
    let tracks = [];
    let track = new MidiTrack();
    let ch = 0;
    track.add(0, MidiEventTempo.createFromBPM(150));
    track.add(0, new MidiKeyProgramChange(ch, 6));
    track.add(0, new MidiNote(ch,true,69,127));
    track.add(480, new MidiNote(ch,false,69,127));
    track.add(0, new MidiNote(ch,true,70,127));
    track.add(960, new MidiNote(ch,false,70,127));
    track.add(0, new MidiNote(ch,true,71,127));
    track.add(240, new MidiNote(ch,false,71,127));
    track.add(0, new MidiNote(ch,true,72,127));
    track.add(60, new MidiNote(ch,false,72,127));
    track.add(0, new MidiEventTrackEnd());
    header.setTimeMeasure(480);
    tracks.push(track);
    parser.header = header;
    parser.tracks = tracks;
    let bytes = parser.toBytes();

    console.log(parser);

    let parser2 = new MidiParser();

    parser2.parse(bytes);

    let bytes2 = parser2.toBytes();
    for(let i = 0; i < bytes2.length; ++i){
        if(bytes[i] != bytes2[i]){
            console.error("not equals array buffer. index:" + i + " " + bytes[i] + " != " + parser2[i]);
        }
    }

    var blob = new Blob([bytes], { type: 'audio/midi' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'out.mid';
    link.click();
}
//test();
//test2();