const FAMI_SPLIT_STR = " : ";
const FAMI_CELL_FORMAT = "{0} {1} {2} {3}";
const FAMI_SOUND_MAP = ["A-","A#","B-","C-","C#","D-","D#","E-","F-","F#","G-","G#"];
const FAMI_HEADER = `# FamiTracker text export 0.4.2

# Song information
TITLE           ""
AUTHOR          ""
COPYRIGHT       ""

# Song comment
COMMENT ""

# Global settings
MACHINE         0
FRAMERATE       0
EXPANSION       0
VIBRATO         1
SPLIT           32

# Macros

# DPCM samples

# Instruments
INST2A03   0    -1  -1  -1  -1  -1 "New instrument"

# Tracks

TRACK  {Rows}   {Speed} {Tempo} "New song"
COLUMNS : 1 1 1 1 1

`;
const FAMI_FOOTER = `# End of export`;

let toFamiNote = (noteNumber) => {
    let a4_diff = (noteNumber - 69);
    let sound_index = (a4_diff + 1200) % 12
    let oct = Math.floor(noteNumber / 12) - 1;
    return FAMI_SOUND_MAP[sound_index] + oct;
}

class FamiTrackerCell{
    constructor(noteNumber, inst, volume, commands){
        this.noteNumber = noteNumber;
        this.inst = inst;
        this.volume = volume;
        this.commands = commands;
    }
    parse(txt){
    }
    toText(){
        let noteNumberStr = this.noteNumber !== null ?  toFamiNote(this.noteNumber) : "...";
        let inst = this.inst !== null ?  this.inst.toString(16).padStart(2,'0').toUpperCase() : "..";
        let volume = this.volume !== null ?  this.volume.toString(16).padStart(1,'0').toUpperCase() : ".";
        let command = "";
        if(this.commands){
            for(let i = 0; i < this.commands.length; ++i){
                command += (i > 0 ? " " : "" ) + this.commands[i] ? this.commands[i] : "...";
            }
        }
        if(!this.commands || this.commands.length < 1){
            command = "...";
        }
        return noteNumberStr + " " + inst + " " + volume + " " + command;
    }
}

class FamiTrackerRow {
    constructor(no){
        this.no = no;
        this.cells = [];
    }
    parse(txt){
    }
    toText(max){
        let txt = "ROW " + this.no.toString(16).padStart(2,'0').toUpperCase();
        for(let i = 0; i < max; ++i){
            if(i < this.cells.length && this.cells[i]){
                txt += FAMI_SPLIT_STR + this.cells[i].toText();
            }
            else{
                txt += FAMI_SPLIT_STR + "... .. . ...";
            }
        }
        return txt;
    }
    add(ch,cell){
        for(let i = this.cells.length; i < ch; ++i){
            this.cells.push(null);
        }
        this.cells[ch] = cell;
    }
}

class FamiTrackerPattern{
    constructor(pattern){
        this.pattern = pattern;
        this.rows = [];
    }
    parse(txt){

    }
    toText(max){
        let txt = "PATTERN " + this.pattern.toString(16).padStart(2,'0').toUpperCase() + "\r\n";
        for(let i = 0; i < this.rows.length; ++i){
            txt += this.rows[i].toText(max) + "\r\n";
        }
        return txt;
    }
    getCellCount(){
        let max = 5; // 最低5個
        for(let i = 0; i < this.rows.length; ++i){
            max = Math.max(this.rows[i].cells.length, max);
        }
        return max;
    }
    add(ch,row,cell){
        for(let i = this.rows.length; i <= row; ++i){
            this.rows.push(new FamiTrackerRow(i));
        }
        this.rows[row].add(ch, cell);
    }
}

class FamiOrder{
    constructor(order){
        this.order = order;
        this.patterns = [];
    }
    toText(max){
        let txt = "ORDER " + this.order.toString(16).padStart(2,'0').toUpperCase() + " :";
        for(let i = 0; i < max; ++i){
            let p = 0;
            if(i < this.patterns.length) p = this.patterns[i];
            txt += " " + p.toString(16).padStart(2,'0').toUpperCase();
        }
        return txt;
    }
}

class FamiTrackerParser{
    constructor(){
        this.order = [];
        this.patterns = [];
        // Speed=6の時1ラインは16分音符相当 32分音符の場合は3
        this.speed = 6;
        this.tempo = 150;
        // 1パターンのライン数 Speed6のときRows=64で4小節となる
        this.settingRows = 64; 
    }
    // 4分音符の長さ
    setTimeMeasure(mesure = 4){
        this.speed = Math.round(6 * 4/mesure);
        this.settingRows = 64 * Math.round(6/this.speed);
    }
    parse(txt)
    {
    }
    toText(){
        let txt = FAMI_HEADER.replace(/\n/g,"\r\n");

        let max = 5; // 最低5個
        for(let i = 0; i < this.patterns.length; ++i){
            max = Math.max(this.patterns[i].getCellCount(), max);
        }

        // order
        for(let i = 0; i < this.order.length; ++i){
            txt += this.order[i].toText(max) + "\r\n";
        }

        // pattern
        for(let i = 0; i < this.patterns.length; ++i){
            txt += this.patterns[i].toText(max) + "\r\n";
        }

        txt += FAMI_FOOTER.replace(/\n/g,"\r\n");

        txt = txt.replace("{Tempo}",this.tempo);
        txt = txt.replace("{Speed}",this.speed);
        txt = txt.replace("{Rows}",this.settingRows);

        return txt;
    }
    setOrderFromPattern(){
        this.order = [];
        let max = 5;
        for(let i = 0; i < this.patterns.length; ++i){
            max = Math.max(this.patterns[i].getCellCount(), max);
        }
        for(let i = 0; i < this.patterns.length; ++i){
            let order = new FamiOrder(i);
            for(let j = 0; j < max; ++j) order.patterns.push(i);
            this.order.push(order);
        }
    }
    setSplitPattern(){
        while(this.settingRows < this.patterns[this.patterns.length - 1].rows.length){
            let p = this.patterns[this.patterns.length - 1];
            let pushRows = p.rows.splice(this.settingRows, p.rows.length - this.settingRows);
            for(let i = 0; i < pushRows.length; ++i){
                pushRows[i].no = pushRows[i].no - this.settingRows;
            }
            this.patterns.push(new FamiTrackerPattern(this.patterns.length));
            this.patterns[this.patterns.length - 1].rows = pushRows;
        }
    }
    add(pattern, ch, row, cell){
        for(let i = this.patterns.length; i <= pattern; ++i){
            this.patterns.push(new FamiTrackerPattern(i));
        }
        this.patterns[pattern].add(ch,row,cell);
    }
}