class MMLParser {
    constructor(text) {
      this.text = text;
      this.result = {
        commands: []
      };
      this.trackNumber = 0;
      this.reset();
      this.createRegex();
      this.parse();
    }

    reset(){
        this.currentOctave = 4;
        this.currentTempo = 120;
        this.currentPosition = 0;
        this.currentTime = 0;
        this.currentKey = 0;
        this.defaultLength = 4;
        this.chordStartTime = null;
        this.chordDuration = null;
        this.inChord = false;
        this.isSlur = false;
        this.chordNotes = [];
        this.repeatStack = [];
        this.variables = [];
    }

    createRegex(){
        this.regexs = {
            note:/[a-g][\+\-]?(\d*)\.*\^*/g,
            command_simple:/([o|k|v|t|@|l|q]\d+)/g,
            command_values:/@[we]\[(\s*\d+\.?\d*\s*,?)*\]/g,
            command_common:/(@c\[[^\]]+\])/g,
            rest:/([r]\.?\^?)(\d*)/g,
            octave:/([<>])/g,
            slur:/(\&)/g,
            chord:/(\[)|(\])/g,
            repeat:/(\/:)|(:\/)(\d*)/g,
            comment_line:/(\/\/.*([\r\n]*))/g,
            comment:/(\/\*[\s\S]*?\*\/)/g,
            track:/(;)/g,
            variable_start:/(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*/g,
        }
        let regex = "(";
        let addPipe = false;
        for (let key in this.regexs) {
            let val = this.regexs[key].source;
            regex += ( addPipe ? "|" : "" ) + val;
            addPipe = true;
          }
          regex += ")";
        this.tokenRegex = RegExp(regex, 'g');
    }
  
    parse() {
      // const tokenRegex = /([a-g][\+\-]?\.?\^?)(\d*)|([o|v|t|@|l]\d+)|(@e\[\d+,\d+,\d+,\d+\])|(q\d+)|([r]\.?\^?)(\d*)|([<>])|(\[)|(\])|(@w\[[\d,]+\])|(@c\[[^\]]+\])|(\/:)|(:\/)(\d*)|(\.)|(^)/g;
      // const tokenRegex = RegExp(/([a-g][\+\-]?\.?\^?(\d*)\&?|([o|v|t|@|l|q]\d+)|(@e\[(\s*\d+\.?\d*\s*,?)*\])|([r]\.?\^?)(\d*)|([<>])|(\[)|(\])|(@w\[(\s*\d+\.?\d*\s*,?)*\])|(@c\[[^\]]+\])|(\/:)|(:\/)(\d*))/, 'g');
      let match;
      console.log(this.tokenRegex);
      while ((match = this.tokenRegex.exec(this.text)) !== null) {
        let token = match[0];
        const startPosition = match.index;
        const endPosition = startPosition + token.length;

        if(startPosition < this.currentPosition) continue;
        token = this.checkVariable(token, startPosition, endPosition);
        
        console.log(startPosition);
        console.log(endPosition);
        console.log(token);
  
        if(token.startsWith('//')){
        } else if(token.startsWith('/*')){
        } else if(token.includes('=')){
            this.registerVariable(token, startPosition, endPosition);
            continue;
        } else if (/[a-g]/.test(token)) {
          this.parseNote(token, startPosition, endPosition);
        } else if (token.startsWith('r')) {
          this.parseRest(token, startPosition, endPosition);
        } else if (token === '<') {
          this.parseOctaveChange(-1, startPosition, endPosition);
        } else if (token === '>') {
          this.parseOctaveChange(1, startPosition, endPosition);
        } else if (token === '[') {
          this.startChord();
        } else if (token === ']') {
          this.endChord();
        } else if (token === '&') {
          this.parseSlur(token, startPosition, endPosition);
        } else if (token.startsWith('o')) {
          this.parseOctave(token, startPosition, endPosition);
        } else if (token.startsWith('k')) {
          this.parseKey(token, startPosition, endPosition);
        } else if (token.startsWith('v')) {
          this.parseVolume(token, startPosition, endPosition);
        } else if (token.startsWith('t')) {
          this.parseTempo(token, startPosition, endPosition);
        } else if (token.startsWith('l')) {
          this.parseDefaultLength(token, startPosition, endPosition);
        } else if (token.startsWith('q')) {
          this.parseQuantize(token, startPosition, endPosition);
        } else if (token.startsWith('@e')) {
          this.parseEnvelope(token, startPosition, endPosition);
        } else if (token.startsWith('@w')) {
          this.parseWaveform(token, startPosition, endPosition);
        } else if (token.startsWith('@c')) {
          this.parseCommand(token, startPosition, endPosition);
        } else if (token.startsWith('@')) {
          this.parseTone(token, startPosition, endPosition);
        } else if (token === '/:') {
          this.startRepeat(startPosition);
        } else if (token.startsWith(':/')) {
          this.endRepeat(token, startPosition, endPosition);
        } else if (token === ';') {
          this.endTrack(token, startPosition, endPosition);
        } else if (token === '=') {
          this.endTrack(token, startPosition, endPosition);
        } 
  
        this.currentPosition = endPosition;

      }
    }
  
    parseNote(token, startPosition, endPosition) {
      const pitches = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11};
      let pitch = pitches[token[0]];
      let accidental = 0;
      let length = this.defaultLength;
      let dotNum = 0;
      let tieNum = 0;
  
      if (token[1] === '+') {
        accidental = 1;
        token = token.slice(2);
      } else if (token[1] === '-') {
        accidental = -1;
        token = token.slice(2);
      } else {
        token = token.slice(1);
      }

      if(/\d+/g.test(token))
      {
        length = this.scanNumber(token);
        console.log("d:" + length + " token:" + token);
        token = token.replace(/\d+/g, '');
      }
  
      if (/\.+/g.test(token)) {
        console.log(".:" + token);
        dotNum = this.scanCount(/\.+/g, token);
        token = token.replace('.', '');
      }
  
      if (/\^+/g.test(token)) {
        console.log("^:" + token);
        tieNum = this.scanCount(/\^+/g, token);
        token = token.replace('^', '');
      }
  
      let noteNumber = (this.currentOctave + 1) * 12 + pitch + accidental;
      let duration = this.calculateNoteDuration(length, dotNum, tieNum);

      /*
      time: time,
        duration: duration,
        noteNumber: noteNumber,
        tempo: tempo,
        velocity: velocity,
        quantize: quantize,
        tone: tone,
        length:length,
        currentLength:currentLength,
        envelope:envelope,
        chord:noteNumbers.length > 1,
        commands:cmd,
        mute:mute,
        wave:wave,
        slur:slur,
        slurDuration:slurDuration,
        key:key,
        textIndex:textIndex,
    */
  
      const noteCommand = {
        type: 'note',
        trackNumber: this.trackNumber,
        noteNumber: noteNumber,
        length: length,
        duration: duration,
        chord: this.inChord,
        dotNum: dotNum,
        tieNum: tieNum,
        startTime: this.inChord ? this.chordStartTime : this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
      };
  
      if (this.inChord) {
        this.chordNotes.push(noteCommand);
        this.chordDuration = Math.max(this.chordDuration, duration);
      } else {
        this.result.commands.push(noteCommand);
        this.currentTime += duration;
      }
    }

    scanNumber(target){
        let regex = /\d+/g;
        let match = regex.exec(target);
        if (match) {
            return parseInt(match[0]);
        }
        return 0;
    }

    scanCount(regex, target){
        let result = 0;
        let match = regex.exec(target);
        if (match) {
            result = match[0].length;
        }
        return result;
    }
  
    parseRest(token, startPosition, endPosition) {
      let length = this.defaultLength;
      let dotNum = 0;
      let tieNum = 0;
  
      if(/\d+/g.test(token))
        {
            length = this.scanNumber(token);
            console.log("d:" + length + " token:" + token);
            token = token.replace(/\d+/g, '');
        }

        if (/\.+/g.test(token)) {
            console.log(".:" + token);
            dotNum = this.scanCount(/\.+/g, token);
            token = token.replace('.', '');
        }

        if (/\^+/g.test(token)) {
            console.log("^:" + token);
            tieNum = this.scanCount(/\^+/g, token);
            token = token.replace('^', '');
        }
  
      let duration = this.calculateNoteDuration(length, dotNum, tieNum);
  
      this.result.commands.push({
        type: 'rest',
        trackNumber: this.trackNumber,
        length: length,
        duration: duration,
        dotNum: dotNum,
        tieNum: tieNum,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
      });
  
      this.currentTime += duration;
    }
  
    calculateNoteLength(length, dotNum, tieNum){
        let lengthList = []
        let prev = length;
        lengthList.push(length);
        for(let i = 0; i < dotNum; ++i){
          lengthList.push(prev);
          prev *= 2;
        }
        for(let i = 0; i < tieNum; ++i){
            lengthList.push(prev);
        }
        return lengthList;
    }

    calculateNoteDuration(length, dotNum, tieNum) {
      const quarterNoteDuration = 60 / this.currentTempo;
      let lengthList = this.calculateNoteLength(length, dotNum, tieNum);
      let duration = 0;
      for(let i = 0; i < lengthList.length; ++i){
        duration += (4 / lengthList[i]) * quarterNoteDuration;
      }
      return duration;
    }
  
    parseDefaultLength(token, startPosition, endPosition) {
      this.defaultLength = parseInt(token.slice(1));
      this.result.commands.push({
        type: 'defaultLength',
        trackNumber: this.trackNumber,
        value: this.defaultLength,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
      });
    }
    
    parseOctave(token, startPosition, endPosition) {
        this.currentOctave = parseInt(token.slice(1));
        this.result.commands.push({
          type: 'octave',
          trackNumber: this.trackNumber,
          value: this.currentOctave,
          startTime: this.currentTime,
          startPosition: startPosition,
          endPosition: endPosition
        });
      }

    parseKey(token, startPosition, endPosition) {
        this.currentKey = parseInt(token.replace("+","").slice(1));
        this.result.commands.push({
          type: 'key',
          trackNumber: this.trackNumber,
          value: this.currentKey,
          startTime: this.currentTime,
          startPosition: startPosition,
          endPosition: endPosition
        });
      }
    
    parseOctaveChange(change, startPosition, endPosition) {
    this.currentOctave += change;
    this.result.commands.push({
        type: 'octaveChange',
        trackNumber: this.trackNumber,
        value: change,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseVolume(token, startPosition, endPosition) {
    this.result.commands.push({
        type: 'volume',
        trackNumber: this.trackNumber,
        value: parseInt(token.slice(1)),
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseTempo(token, startPosition, endPosition) {
    this.currentTempo = parseInt(token.slice(1));
    this.result.commands.push({
        type: 'tempo',
        trackNumber: this.trackNumber,
        value: this.currentTempo,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseTone(token, startPosition, endPosition) {
    this.result.commands.push({
        type: 'tone',
        trackNumber: this.trackNumber,
        value: parseInt(token.slice(1)),
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseEnvelope(token, startPosition, endPosition) {
    const [a, d, s, r] = token.replace(/\s*/g,"").slice(3, -1).split(',').map(Number);
    this.result.commands.push({
        type: 'envelope',
        trackNumber: this.trackNumber,
        attack: a,
        decay: d,
        sustain: s,
        release: r,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseWaveform(token, startPosition, endPosition) {
    const waveformData = token.slice(3, -1).split(',').map(Number);
    this.result.commands.push({
        type: 'waveform',
        data: waveformData,
        trackNumber: this.trackNumber,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseCommand(token, startPosition, endPosition) {
    const [commandName, ...values] = token.slice(3, -1).split(',');
    this.result.commands.push({
        type: 'command',
        trackNumber: this.trackNumber,
        name: commandName,
        values: values,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseQuantize(token, startPosition, endPosition) {
    this.result.commands.push({
        type: 'quantize',
        trackNumber: this.trackNumber,
        value: parseInt(token.slice(1)),
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    parseSlur(token, startPosition, endPosition) {
    this.isSlur = true;
    this.result.commands.push({
        type: 'slur',
        trackNumber: this.trackNumber,
        value: true,
        startTime: this.currentTime,
        startPosition: startPosition,
        endPosition: endPosition
    });
    }

    startChord() {
    this.inChord = true;
    this.chordStartTime = this.currentTime;
    this.chordDuration = 0;
    this.chordNotes = [];
    }

    endChord() {
    this.inChord = false;
    this.result.commands.push({
        type: 'chord',
        trackNumber: this.trackNumber,
        notes: this.chordNotes,
        startTime: this.chordStartTime,
        duration: this.chordDuration,
        startPosition: this.chordNotes[0].startPosition,
        endPosition: this.chordNotes[this.chordNotes.length - 1].endPosition
    });
    this.currentTime += this.chordDuration;
    this.chordNotes = [];
    }

    startRepeat(startPosition) {
      this.repeatStack.push({
        trackNumber: this.trackNumber,
        startPosition: startPosition,
        startTime: this.currentTime,
        commandIndex: this.result.commands.length
      });
    }
  
    endRepeat(token, startPosition, endPosition) {
      if (this.repeatStack.length === 0) {
        throw new Error('Unmatched repeat end at position ' + startPosition);
      }
  
      const repeat = this.repeatStack.pop();
      const repeatCount = token.length > 2 ? parseInt(token.slice(2)) : 2;
  
      const repeatedCommands = this.result.commands.slice(repeat.commandIndex);
      const repeatDuration = this.currentTime - repeat.startTime;
  
      for (let i = 1; i < repeatCount; i++) {
        repeatedCommands.forEach(cmd => {
          const newCmd = {...cmd};
          newCmd.startTime += i * repeatDuration;
          this.result.commands.push(newCmd);
        });
      }
  
      this.currentTime += (repeatCount - 1) * repeatDuration;
  
      this.result.commands.push({
        type: 'repeat',
        trackNumber: this.trackNumber,
        count: repeatCount,
        startTime: repeat.startTime,
        duration: repeatCount * repeatDuration,
        startPosition: repeat.startPosition,
        endPosition: endPosition
      });
    }

    endTrack(token, startPosition, endPosition){
        this.trackNumber++;
        this.reset();
        this.result.commands.push({
            type: 'trackChange',
            trackNumber: this.trackNumber,
            startPosition: startPosition,
            endPosition: endPosition
          });
    }

    checkVariable(token, startPos, endPos){
        if(this.trackNumber < this.variables.length && this.variables[this.trackNumber]){
            let variables = this.variables[this.trackNumber];
            Object.keys(variables).map(key => {
                let start = variables[key].startPosition;
                let end = variables[key].endPosition;
                if(startPos <= end){
                    token.slice()
                    let startToken = token.slice(0, startPos - start + 1);
                    let endToken = token.slice(end - start, token.length);
                }
              });
        }
        return token;
    }
  
    registerVariable(token, startPosition, endPosition){
        const nameStartRegex = new RegExp(/^(var[\s]+)?/, 'g');
        const nameEqualLeftRegex = new RegExp(/^(var[\s]+)?[a-zA-Z0-9@_]+[\s]*=[\s]*/, 'g');
        const nameEqualDeleteRegex = new RegExp(/[\s]*=[\s]*/, 'g');

        let name = token.match(nameEqualLeftRegex)[0].replace(nameEqualDeleteRegex,"").replace(nameStartRegex, "");

        this.variableName = name;
        this.variableValueStr = "";
        this.variableStartPosition = startPosition;
        
        this.parseVariableValue(endPosition);
    }

    parseVariableValue(startPosition){

        let valueStr = "";
        let hierarchy = 0;
        let index = startPosition;
        while(index < this.text.length){
            let s = this.text[index];
            if(s === '{'){
                hierarchy ++;
                if(hierarchy === 1) {
                    index++
                    continue;
                }
            } else if (s === '}'){
                hierarchy --;
                if(hierarchy === 0){
                    break;
                }
            } else if(/(\r|\n)+/.test(s)){
                if(hierarchy === 0) break;
                else {
                    index++;
                    continue;
                }
            }
            valueStr += s;
            index++;
        }

        this.currentPosition = index + 1;
        this.variableEndPosition = index + 1;

        this.result.commands.push({
            type: 'variable',
            trackNumber: this.trackNumber,
            name: this.variableName,
            value: valueStr,
            startPosition: this.variableStartPosition,
            endPosition:  this.variableEndPosition
          });
        for(let i = this.variables.length; i <= this.trackNumber; ++i){
            this.variables.push({});
        }
        this.variables[this.trackNumber][this.variableName] = {
            startPosition: this.variableStartPosition,
            endPosition: this.variableEndPosition,
            value:valueStr,
            targets:this.createVariableTargets(this.variableName, this.variableEndPosition, this.text.length)
        };
    }

    // 変換候補位置リストを作成
    createVariableTargets(variableName, startPos, endPos){
        let targets = [];
        let regex = new RegExp("((${" + variableName + "})|(" + variableName + "))", 'g');
        let match;
        while(match = regex.exec(this.text)){
            const token = match[0];
            const startPosition = match.index;
            const endPosition = startPosition + token.length;
            if(startPosition < startPos) continue;
            if(endPosition > endPos) continue;
            targets.push({
                startPosition:startPosition,
                endPosition:endPosition
            });
        }
        return targets;
    }

    getJSON() {
      return JSON.stringify(this.result, null, 2);
    }
  }

  let MMLParserTest = () => {
    const mml = `
        // This is a comment
        t120 l8 o4 v100 @1 @e[0.01,0.2,1.0,0]
        /*
        abcdefg
        */
        cdef g.^g // test
        a&b&c
        [ceg]4 r4 f+8g-4
        @w[0,10,20,30,40] @c[customCommand,arg1,2,arg3] <c>e
        ;
        abcdd
    `;
    const mml2 = `t150 l8 c+4^rrr
    test={
    abcdefg
    bdbdbdbd
    }abc
    testtesttest\${test}
    `;
    console.log(mml2);
    const parser = new MMLParser(mml2);
    console.log(parser.getJSON());
    console.log(parser.variables);
  }
  //MMLParserTest();