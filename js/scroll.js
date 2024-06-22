class ScrollHelper{
    constructor(x,y,w,h,virtical,onScroll,onScrollEnded){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.backColor = color(88, 88, 88);
        this.frontColor = {
            "idle":color(200, 200, 200),
            "hover":color(220, 220, 220),
            "press":color(255, 255, 255),
        }
        this.scrollVirtical = virtical;
        if(this.scrollVirtical){
            this.front_rect = {x:this.x,y:this.y,w:this.w,h:50};
        }
        else{
            this.front_rect = {x:this.x,y:this.y,w:50,h:this.h};
        }
        this.state = "idle";
        this.scroll = {x:0,y:0};
        this.scrollRate = {x:0,y:0};
        this.onScroll = onScroll;
        this.onScrollEnded = onScrollEnded;
        this.dragStart = {x:0,y:0};
        this.prevScroll = {x:0,y:0};
    }
    draw(){
        if(this.scrollVirtical){

        }
        else{
            // 背景を描画
            fill(this.backColor);
            rect(this.x,this.y,this.w,this.h);
            // スクロールの割合に沿った大きさを求める

            // スクロールの割合に沿った開始位置を求める
            let front_x = this.x + this.scroll.x;
            let front_y = this.y + this.scroll.y;
            let front_w = this.front_rect.w;
            let front_h = this.front_rect.h;
            // つまみ部分を描画
            fill(this.frontColor[this.state]);
            rect(front_x,front_y,front_w,front_h);
            // つまみ部分の情報更新
            this.front_rect.x = front_x;
            this.front_rect.y = front_y;
            this.front_rect.w = front_w;
            this.front_rect.h = front_h;
        }

        this.updateScroll(mouseX,mouseY);
    }
    checkHitBack(x,y){
        return this.x <= x && x <= this.x + this.w 
        && this.y <= y && y <= this.y + this.h;
    }
    checkHitFront(x,y){
        return this.front_rect.x <= x && x <= this.front_rect.x + this.front_rect.w 
        && this.front_rect.y <= y && y <= this.front_rect.y + this.front_rect.h;
    }
    isMouseDown(){
        return mouseIsPressed;
    }
    getScrollRate(){
        return this.scrollRate;
    }
    updateScroll(x,y){
        if(this.isMouseDown()){
            if(this.state == "press"){
                this.moveScroll(x,y);
            }
            else{
                if(this.state == "hover"){
                    if(this.checkHitBack(x,y)){
                        // ノブ移動
                        if(this.checkHitFront(x,y)){
                            this.moveScroll(x,y, false);
                        }
                        // 直接スクロール値計算
                        else{
                            this.moveScroll(x,y, true);
                        }
                    }
                    else{
                        this.state = "idle";
                    }
                }
                else{
                    this.state = "idle";
                }
            }
        }
        else{
            if(this.state == "press")
            {
                if(this.onScrollEnded) this.onScrollEnded(this.scrollRate.x, this.scrollRate.y); 
            }
            if(this.checkHitFront(x,y)){
                this.state = "hover";
            }
            else if(this.checkHitBack(x,y)){
                this.state = "hover";
            }
            else{
                this.state = "idle";
            }
        }
    }
    moveScroll(x,y, force){
        if(this.state != "press"){
            this.dragStart.x = x;
            this.dragStart.y = y;
            if(force){
                if(this.scrollVirtical){
                    let scroll_start_y = this.y + this.front_rect.h;
                    let scroll_end_y = this.y + this.h;
                    let scroll_max_h = scroll_end_y - scroll_start_y;
                    this.scroll.y = Math.min(scroll_max_h, Math.max(0,this.y - scroll_start_y + this.front_rect.h / 2));
                }
                else{
                    let scroll_start_x = this.x + this.front_rect.w;
                    let scroll_end_x = this.x + this.w;
                    let scroll_max_w = scroll_end_x - scroll_start_x;
                    this.scroll.x = Math.min(scroll_max_w, Math.max(0,x - scroll_start_x + this.front_rect.w / 2));
                }
            }
            this.prevScroll.x = this.scroll.x;
            this.prevScroll.y = this.scroll.y;
        }
        this.state = "press";
        // 可動域
        if(this.scrollVirtical){
            let scroll_start_y = this.y + this.front_rect.h;
            let scroll_end_y = this.y + this.h;
            let scroll_max_h = scroll_end_y - scroll_start_y;
            this.scroll.y = this.prevScroll.y + (y - this.dragStart.y);
            this.scroll.y = Math.min(scroll_max_h, Math.max(0,this.scroll.y));
            this.scrollRate.y = this.scroll.y / scroll_max_h;
        }
        else{
            let scroll_start_x = this.x + this.front_rect.w;
            let scroll_end_x = this.x + this.w;
            let scroll_max_w = scroll_end_x - scroll_start_x;
            this.scroll.x = this.prevScroll.x + (x - this.dragStart.x);
            this.scroll.x = Math.min(scroll_max_w, Math.max(0,this.scroll.x));
            this.scrollRate.x = this.scroll.x / scroll_max_w;
        }
        if(this.onScroll) this.onScroll(this.scrollRate.x, this.scrollRate.y);
    }
}