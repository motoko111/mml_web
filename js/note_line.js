class NoteLine {
    constructor(w,h, col){
        this.x = canvas.width/2;
        this.y = 0;
        this.w = w;
        this.h = h;
        this.visible = true;
        this.color = col ? col : color(255,255,255);
    }
    draw(){
        if(!this.visible) return;
        pg.noStroke();
        pg.fill(this.color);
        pg.rect(this.x,this.y,this.w,this.h);
    }
    setPosition(x,y){
        this.x = x;
        this.y = y;
    }
}
class RepeatNoteLine extends NoteLine {
    constructor(){
        super();
    }
}