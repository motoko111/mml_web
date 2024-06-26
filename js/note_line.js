class NoteLine {
    constructor(w,h){
        this.x = canvas.width/2;
        this.y = 0;
        this.w = w;
        this.h = h;
        this.color = color(255, 255, 255);
    }
    draw(){
        noStroke();
        fill(this.color);
        rect(this.x,this.y,this.w,this.h);
    }
}
class RepeatNoteLine extends NoteLine {
    constructor(){
        super();
    }
}