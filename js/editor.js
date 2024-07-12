
const REGEX_NOTE_STR = new RegExp("([cdefgab]|[CDEFGAB]|\\+|\\-)+");
const REGEX_NUMBER_STR = new RegExp("([0-9])+");
const REGEX_DOT_STR = new RegExp("(\\.)+");
const REGEX_TAI_STR = new RegExp("(\\^)+");
const REGEX_COMMENT_LINE = new RegExp("//.*", 'g');
//const REGEX_COMMENT_LINE = new RegExp(/^\s*\/\/.*/, 'g');

class MMLEditor{
    constructor(){
        this.editor = null;
        this.logEditors = [null,null,null,null];
        this.lastEditNote = null;
        this.playEditNoteFunc = null;
        this.deleteEditNoteFunc = null;
        this.normalEditNote = null;
        this.enableEditPlay = false;
        this.lastPlayOctave = 4;
    }
    clear(){
        if(this.editor != null) return
        this.editor.setValue("");
    }
    insertNoteNumber(noteNumber, length){
        // 現在トラックを解析してオクターブを割り出す
        let trackMML = this.getStringBeforeCursorToSemicolon();
        let analysis = analysisEditMML(trackMML);
        // オクターブ変更はおきないはずなので適当に1音追加して解析する
        analysis = analysisEditMML(trackMML + "c");
        let lastOctave = analysis.getLastOctave();
        let oct = mtoo(noteNumber);
        if(oct > lastOctave){
            let diff = Math.abs(oct - lastOctave);
            for(let i = 0; i < diff; ++i){
                this.editor.insert(">");
            }
        }
        if(oct < lastOctave){
            let diff = Math.abs(oct - lastOctave);
            for(let i = 0; i < diff; ++i){
                this.editor.insert("<");
            }
        }
        if(!length) {
            this.editor.insert(mtoc(noteNumber, true));
        }
        else{
            this.editor.insert(mtoc(noteNumber, true));
        }
    }
    setEnableEditPlay(flag){
        this.enableEditPlay = flag;
    }
    editPlay(mml, playLine){
        if(!this.enableEditPlay) return;
        if(this.playEditNoteFunc == null) return;
        this.playEditNoteFunc(mml, playLine);
    }
    setPlayEditNoteFunc(func){
        this.playEditNoteFunc = func
    }
    setDeleteEditNoteFunc(func){
        this.deleteEditNoteFunc = func
    }
    setNormalEditNoteFunc(func){
        this.normalEditNote = func
    }
    // カーソル位置までの文字数を計算する関数
    getTotalCharsBeforeCursor(cursorPosition) {
        let lines = this.editor.session.doc.getAllLines();
        let totalChars = 0;
        let getTextCount = (txt) => {
            txt = txt.replace(REGEX_COMMENT_LINE, " ");
            console.log(txt + " length:" + txt.length);
            return txt.length + 1;
        };
        for (var i = 0; i < cursorPosition.row; i++) {
            totalChars += getTextCount(lines[i]); // +1は改行文字を考慮
        }
        let last_txt = this.editor.session.getTextRange({start: {row: cursorPosition.row, column:0}, end: cursorPosition});
        totalChars += getTextCount(last_txt);
        console.log("totalChars=" + totalChars);
        return totalChars;
    }
    // カーソル位置の列の文字列を抽出する関数
    getStringAtCursorColumn() {
        // カーソル位置を取得
        var cursor = this.editor.getCursorPosition();
        // カーソルがある行の文字列全体を取得
        var lineText = this.editor.session.getLine(cursor.row);
        // カーソルのある列までの部分文字列を抽出
        // var columnText = lineText.substring(0, cursor.column);
        return lineText;
    }
    // カーソル位置から前のセミコロンまでのトラック内の文字列を抽出する関数
    getStringBeforeCursorToSemicolon() {
        // カーソル位置を取得
        var cursor = this.editor.getCursorPosition();
        return this.getTrackStringRange({row: 0, column: 0}, cursor);
    }
    // 指定範囲のトラック内の文字列を抽出する関数
    getTrackStringRange(start, end) {
        // カーソル位置より前のテキストを取得
        var text = this.editor.session.getTextRange({start: start, end: end});
        text = text.replace(REGEX_COMMENT_LINE, "");
        // セミコロンの数を取得
        var count = (text.match(/;/g) || []).length;
        // 最後のセミコロンの位置を取得
        var lastSemicolonIndex = text.lastIndexOf(';');
        // セミコロンからカーソル位置までの文字列を抽出
        if (lastSemicolonIndex !== -1) 
        {
            var ret = "";
            for(let i = 0;i < count; ++i){
                ret += "t120;";
            }
            ret += text.substring(lastSemicolonIndex + 1, text.length).trim();
            return ret;
        }
        // なければ一番はじめから 
        else 
        {
            return text;
        }
        return "";
    }
    analysisPlayNote(last){
        let str = this.getStringBeforeCursorToSemicolon() + last;
        console.log(str);
        return str;
    }
    analysisPlayLineNote(){
        let cursorPos = this.editor.getCursorPosition();
        let lineStartPos = {row: cursorPos.row, column: 0};
        let lineStr = this.getStringAtCursorColumn();
        let trackStr = this.getTrackStringRange({row: 0, column: 0}, lineStartPos);
        trackStr = trackStr.replace(/@m0/g, "@m1"); // 強制ミュート
        trackStr = trackStr.replace(/(\/:|:\/)/g, ""); // 繰り返しは削除
        lineStr = lineStr.replace(/(\/:|:\/)/g, ""); // 繰り返しは削除
        let str = trackStr + "\r\n @m0 " + lineStr;
        //console.log(str);
        return str;
    }
    createEditor(){
        if(this.editor != null) return
        let _this = this
        this.editor = ace.edit("editor");
        this.editor.setTheme("ace/theme/tomorrow_night_eighties");
        this.editor.setFontSize(14);
        this.editor.getSession().setMode("ace/mode/mml");
        this.editor.getSession().setUseWrapMode(true);
        this.editor.getSession().setTabSize(2);
        this.editor.commands.addCommand({
            name: 'save',
            bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
            exec: function(editor) {
                saveLocalStorage();
                //console.log("saving", editor.session.getValue())
            }
        })
        this.editor.commands.addCommand({
            name: 'play line2',
            bindKey: {win: "Ctrl-L", "mac": "Cmd-L"},
            exec: function(editor) {
                stop();
                _this.editPlay(_this.analysisPlayLineNote(), true);
            }
        })
        this.editor.commands.addCommand({
            name: 'play line',
            bindKey: {win: "Alt-L", "mac": "Option-L"},
            exec: function(editor) {
                stop();
                rewind(true);
            }
        })
        this.editor.commands.addCommand({
            name: 'check line length',
            bindKey: {win: "Alt-I", "mac": "Option-I"},
            exec: function(editor) {
                stop();
                _this.editPlay(_this.analysisPlayLineNote(), true);
                let note = getLastEditNote();
                _this.editor.insert("" + note.currentLength);
            }
        })
        this.editor.session.on('change', function(delta) {
            // delta.start, delta.end, delta.lines, delta.action
            // console.log("editor change" + delta.lines)
            try{
                if(delta.action == "insert"){
                    if(REGEX_NOTE_STR.test(delta.lines[0])){
                        _this.editPlay(_this.analysisPlayNote(delta.lines[0]), false);
                    }
                    else if(REGEX_NUMBER_STR.test(delta.lines[0])){
                        _this.editPlay(_this.analysisPlayNote(delta.lines[0]), false);
                    }
                    else if(REGEX_TAI_STR.test(delta.lines[0])){
                        _this.editPlay(_this.analysisPlayNote(delta.lines[0]), false);
                    }
                    else{
                        if(_this.normalEditNote) _this.normalEditNote();
                    }
                }
                else if(delta.action == "remove"){
                    if(_this.deleteEditNoteFunc) _this.deleteEditNoteFunc();
                }
            }catch(e){
                console.log(e);
            }
            
        });
        /*
        this.editor.session.selection.on('changeCursor', () => {
            let cursorPosition = _this.editor.getCursorPosition();
            let total = _this.getTotalCharsBeforeCursor(cursorPosition);
            console.log("Cursor moved to row: " + cursorPosition.row + ", column: " + cursorPosition.column + " total:" + total);
            let time = G_NoteAnalysis.textIndexToTime(total);
            console.log("Cursor moved time: " + time);
            setTimeSliderValue(time/G_NoteAnalysis.getDuration());
        });
        */

        this.setTheme();
    }

    setTheme(){
        // テーマを適用
        this.editor.setTheme("ace/theme/ace-mml");
    }

    createLogEditor(track){
        if(this.logEditors[track] != null) return;
        let logEditor = this.logEditors[track]
        logEditor = ace.edit("logEditor_" + track);
        logEditor.setTheme("ace/theme/tomorrow_night_eighties");
        logEditor.setFontSize(14);
        logEditor.getSession().setMode("ace/mode/mml");
        logEditor.getSession().setUseWrapMode(true);
        logEditor.getSession().setTabSize(2);
        logEditor.setOptions({
            fontSize: "8pt"
        });
        this.logEditors[track] = logEditor
    }

    soundLog(track, s){
        if(this.logEditors[track] == null) return;
        this.logEditors[track].insert(s);
        this.scrollToBottom(this.logEditors[track]);
    }
    resetLog(track){
        if(this.logEditors[track] == null) return;
        this.logEditors[track].setValue("");
    }
    resetLogAll(){
        for(let i = 0; i < 10; ++i) this.resetLog(i)
    }

    setMarker(row, col){
        
    }

    initEditor(){
        this.createEditor()
        for(let i = 0; i < 10; ++i) this.createLogEditor(i)
    }
    // スクロール位置を最後にする関数
    scrollToBottom(editor) {
        // エディタのセッションを取得
        var session = editor.getSession();
        // 最後の行番号を取得
        var lastRow = session.getLength() - 1;
        // 最後の行の最後の列にカーソルを移動
        editor.scrollToLine(lastRow, true, true, function() {});
        editor.gotoLine(lastRow + 1, 0, true);
    }
    setFontSize(size){
        this.editor.setOption("fontSize", size);
    }
    getFontSize(){
        let size = this.editor.getOption("fontSize");
        console.log(size);
        return size;
    }
    setLastEditorPlayNote(e){
        this.lastPlayOctave = e.octave;
    }
}