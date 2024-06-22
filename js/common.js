
const SOUND_MAP = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
const SOUND_MAP_LOWER = ['a','a+','b','c','c+','d','d+','e','f','f+','g','g+'];

function mtof(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }
  
function mtoco(noteNumber, isLower){
    return mtoc(noteNumber,isLower) + "" + mtoo(noteNumber);
}

function toNoteIndex(noteNumber){
    let a4_diff = (noteNumber - 69);
    return (a4_diff + 1200) % 12;
}

function isBlackKeyFromNoteNumber(noteNumber){
    switch(toNoteIndex(noteNumber)){
        case 1:
        case 4:
        case 6:
        case 9:
        case 11:
        {
            return true;
        }
        break;
        default:
        {
            return false;
        }
        break;
    }
}

function mtoc(noteNumber, isLower){
    let a4_diff = (noteNumber - 69);
    let sound_index = (a4_diff + 1200) % 12
    return isLower ? SOUND_MAP_LOWER[sound_index] : SOUND_MAP[sound_index]
}

function mtoo(noteNumber){
    let a4_diff = (noteNumber - 69);
    let c4_diff = a4_diff+9
    let octave = 0 // C4から12増えるごとにオクターブ+1 C4から
    if(c4_diff > 0){
        octave = 4 + Math.floor(c4_diff / 12);
    }
    else{
        octave = 4 - Math.floor(Math.abs(c4_diff) / 12) + (Math.abs(c4_diff) % 12 > 0 ? -1 : 0);
    }
    return octave
}

function getCurrentTime(){
    return Tone.context.currentTime;
}