class Material{
    constructor(canvas, vert, frag){
        this.canvas = canvas;
        this.shader = loadShader(vert, frag);
    }
    draw(){
        //pg.push()
        //pg.clear()
        //pg.fill(0,0,0,255)
        //pg.rect(0,0,100,100)
        //pg.pop()

        shader(this.shader);

        this.shader.setUniform('u_resolution', [pg.width, pg.height]);
        this.shader.setUniform('u_tex', pg);
        this.shader.setUniform(`u_time`, frameCount / 35);

        /*
        // vertex shaderのコンパイルエラーを取得して表示
        const messageVert = gl.getShaderInfoLog(this.shader._vertShader);
        if (messageVert !== null && messageVert.length > 0) {
            console.log("error of vertex shader");
           // console.error(messageVert);
        }

        // fragment shaderのコンパイルエラーを取得して表示
        const messageFrag = gl.getShaderInfoLog(this.shader._fragShader);
        if (messageFrag !== null && messageFrag.length > 0) {
            console.log("error of fragment shader");
            console.error(messageFrag);
        }

        // WebGLProgramのエラーを取得して表示
        const messageProgram = gl.getProgramInfoLog(this.shader._glProgram);
        if (messageProgram !== null && messageProgram.length > 0) {
            console.log("error of gl program");
            console.error(messageProgram);
        }
        */

        image(pg,0,0);
    }
}