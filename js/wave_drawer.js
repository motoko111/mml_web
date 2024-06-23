const FFT_SIZE = 500;

class WaveDrawer{
    constructor(canvas){
        this.canvas = canvas;
        this.context = canvas.getContext("2d", { alpha: false, antialias: false, });
        this.freqData = [];
        this.fftSize = FFT_SIZE
        this.setWaveData();
    }
    setWaveData(data){
        this.freqData = data;
    }
    draw(){
        this.clear();
        this.context.beginPath();
        this.context.fillStyle = 'rgb( 0, 0, 0)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.strokeStyle = 'rgb( 128, 255, 255)';
        this.context.lineWidth = 4;
        let waveHeight = this.canvas.height - 10;
        if(this.freqData && this.freqData.length > 0){
            let drawLength = 512;
            for(let i = 0; i < drawLength; ++i){
                let freq = 0; 
                if(i < this.freqData.length){
                    freq = this.freqData[i]; // -1 から 1 になるように
                }
                const x = Math.floor((i / drawLength) * this.canvas.width);
                const y = Math.floor((freq) * (waveHeight/2) + (this.canvas.height / 2));
                if(i === 0){
                    this.context.moveTo(x,y);
                }
                else{
                    this.context.lineTo(x,y);
                }
            }
        }
        else{
            this.context.moveTo(0,Math.floor(this.canvas.height / 2));
            this.context.lineTo(this.canvas.width,Math.floor(this.canvas.height / 2));
        }
        this.context.stroke();
    }
    clear(){
        this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
    }
}