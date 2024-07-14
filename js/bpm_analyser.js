class BPMAnalyser{
    constructor(){
        
    }
    start(){
        this.time = 0;
        this.count = 0;
        this.intervals = []
        this.bpm = 0;
        this.delayCount = 0;
    }
    stop(){

    }
    click(){
        if(this.delayCount > 0){
            this.delayCount--;
            return;
        }
        if(this.intervals.length >= 30) this.intervals.splice(0,1);
        this.intervals.push(performance.now());
        this.bpm = this.calcBPM();
    }
    calcBPM(){
        if(this.intervals.length >= 2){
            let start = this.intervals[0];
            let end = this.intervals[this.intervals.length-1];
            let diff = end - start;
            // diff秒間にx回押せた
            // x*60/diff = 0; // 1分間の拍数に変換
            return this.intervals.length * 60 * 1000 / diff;
        }
        else{
            return 0;
        }
    }
    run(){
        let _this = this;
        
        const content = document.createElement('div');
        const bpm = document.createElement('p');
        bpm.textContent = "" + 0;
        bpm.style = "text-align: ceneter;"
        content.appendChild(bpm);

        const button = document.createElement('button');
        button.textContent = "Click";
        button.style = "text-align: ceneter;"
        button.addEventListener('mousedown', () => {
            _this.click();
            bpm.textContent = "" + _this.calcBPM().toFixed(2);
        });
        content.appendChild(button);

        const reset = document.createElement('button');
        reset.textContent = "reset";
        reset.style = "text-align: ceneter;"
        reset.addEventListener('mousedown', () => {
            _this.start();
            bpm.textContent = "" + 0;
        });
        content.appendChild(reset);

        _this.start();

        dialog("BPM計測", content, {
            close:true,
            onClose:() => {
                _this.stop();
            }
        });
    }
}