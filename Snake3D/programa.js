/* Variaveis globais*/

let {mat4, vec4, vec3, vec2} = glMatrix;

let ver = 0, 
    hor = 0,
    blockver = false,
    blockhor = false, 
    cabeca = [0.0, 0.0, 0.0],
    corpo1 = [-1.0, 0.0, 0.0],
    corpo2 = [-2.0, 0.0, 0.0],
    maca = [0.0, 0.0, 0.0],
    cenario = [0.0, 0.0, 0.0],
    linha = [0.0, 0.0, 0.0];

let jogador=[cabeca, corpo1, corpo2];
let cont = 2;
let iniciou = false;
let gameOver = false;
let contadorMaca;
let mensagem;
let retry;

let frame = 0;
let canvas;
let gl;
let vertexShaderSource;
let fragmentShaderSource;
let vertexShader;
let fragmentShader;
let shaderProgram;
let data;
let positionAttr;
let positionBuffer;
let width;
let height;
let projectionUniform;
let projection;
let loc = [2.5,0,0];
let modelUniform;
let model;
let model2;
let modelCenario;
let modelLinha;
let colorUniform;
let viewUniform;
let view;
let eye = [0,0,0];
let color0 = [0, 0, 0];
let color1 = [1, 0, 0];
let color2 = [0, 0, 1];
let color3 = [0, .2, 1];
let color4 = [0.1, 0.1, 0.1];
let color5 = [1, .6, 0];
let color6 = [0, 1, 1];

function resize(){
    if(!gl) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    gl.viewport(0,0,width, height);
    let aspect = width / height;
    let near = 0.001;
    let far = 1000;
    let fovy = 1.3;
    projectionUniform = gl.getUniformLocation(shaderProgram, "projection");
    projection = mat4.perspective([], fovy, aspect, near, far);
    gl.uniformMatrix4fv(projectionUniform, false, projection); 
}

function getCanvas(){
    return document.querySelector("canvas");
}

function getGLContext(canvas){
    let gl = canvas.getContext("webgl");
    gl.enable(gl.DEPTH_TEST);
    return gl;
}

function compileShader(source, type, gl){
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.error("ERRO NA COMPILAÇÃO", gl.getShaderInfoLog(shader));
    }
    return shader;
}

function linkProgram(vertexShader, fragmentShader, gl){
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error("ERRO NA LINKAGEM");
    }
    return program;
}

function getData(){
    let p = {
        a: [-0.5, 0.5, -0.5],
        b: [-0.5, -0.5, -0.5],
        c: [0.5, 0.5, -0.5],
        d: [0.5, -0.5, -0.5],
        e: [-0.5, 0.5, 0.5],
        f: [0.5, 0.5, 0.5],
        g: [-0.5, -0.5, 0.5],
        h: [0.5, -0.5, 0.5],
        x1: [-0.5, -0.5, 0.5],
        x2: [14.5, -0.5, 0.5],
        z1: [0.5, -0.5, -0.5],
        z2: [0.5, -0.5, 14.5]
    };

    let faces = [
        // FRENTE
        ...p.a, ...p.b, ...p.c,
        ...p.d, ...p.c, ...p.b,

        // TOPO
        ...p.e, ...p.a, ...p.f,
        ...p.c, ...p.f, ...p.a,

        // BAIXO
        ...p.b, ...p.g, ...p.d,
        ...p.h, ...p.d, ...p.g,

        // ESQUERDA
        ...p.e, ...p.g, ...p.a,
        ...p.b, ...p.a, ...p.g,

        // DIREITA
        ...p.c, ...p.d, ...p.f,
        ...p.h, ...p.f, ...p.d,

        //FUNDO
        ...p.f, ...p.h, ...p.e,
        ...p.g, ...p.e, ...p.h,

        // linha
        ...p.x1, ...p.x2, ...p.z1, ...p.z2
    ];

    return { "points": new Float32Array(faces)};
}

async function main(){
// 1 - Carregar tela de desenho
    canvas = getCanvas();

// 2 - Carregar o contexto  (API) WebGL
    gl = getGLContext(canvas);
    //resize();

// 3 - ler os arquivos de shader
    vertexShaderSource = await fetch("vertex.glsl").then(r => r.text());
    console.log("VERTEX", vertexShaderSource);

    fragmentShaderSource = await fetch("fragment.glsl").then(r => r.text());
    console.log("FRAGMENT", fragmentShaderSource);

// 4 - Compilar arquivos de shader
    vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER, gl);
    fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER, gl);

// 5 - Linkar o programa de shader
    shaderProgram = linkProgram(vertexShader, fragmentShader, gl);
    gl.useProgram(shaderProgram);

// 6 - Criar dados de parâmetro
    data = getData();

// 7 - Transferir os dados para GPU
    positionAttr = gl.getAttribLocation(shaderProgram, "position");
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.points, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);

// 7.1 - Projection Matrix Uniform 
    resize();
    window.addEventListener("resize", resize);

// 7.2 - View Matrix Uniform 
    eye = [0,9,10];
    let up = [0,1,0];
    let center = [0,0,0];
    view = mat4.lookAt([], eye, center, up);
    viewUniform = gl.getUniformLocation(shaderProgram, "view");
    gl.uniformMatrix4fv(viewUniform, false, view);

// 7.3 - Model Matrix Uniform
    modelUniform = gl.getUniformLocation(shaderProgram, "model");
    desenhaCenario();
    criaMaca();
    model2 = mat4.fromTranslation([],cabeca);

// 7.4 - Color Uniform
    colorUniform = gl.getUniformLocation(shaderProgram, "color");

// 8 - Chamar o loop de redesenho
    contadorMaca = document.getElementById("contadorMaca");
    mensagem = document.getElementById("gameOverText");
    retry = document.getElementById("retryText");
    render();

}

function render(){
    if (iniciou){
        frame++
        if(frame % 10 === 0){
            
            movimentaCobra();

            if(colisaoProprioCorpo() || colisaoCenario()){
                gameOver = true;
                iniciou = false;
                console.log("Voce Perdeu!");
            }

            if(colisaoCabecaMaca()){
                console.log("Passou aqui");
                cont = cont +1;
                jogador[cont] = Array(jogador[0][0],jogador[0][1],jogador[0][2]);
                criaMaca();
                contadorMaca.innerHTML=': ' + (cont - 2);
            }
            
            if(ver!=0){
                blockhor = false;
            }

            if(hor!=0){
                blockver = false;
            }

        }

    }

    // Desenha na tela situacao atual dos objetos
    if(!gameOver){
        desenha();
    }else{
        mensagem.innerHTML="GAME OVER!"
        retry.innerHTML="Retry?"
    }
    
    window.requestAnimationFrame(render);
}

function keyDown(evt){
    if(!gameOver){
        if(evt.key === "ArrowDown"){ 
            if (!blockver){
                ver = 1.0, hor = 0.0, blockver = true, iniciou=true;
            }
            return;
        }
        
        if(evt.key === "ArrowUp"){
            if (!blockver){
                ver = -1.0, hor = 0.0, blockver = true, iniciou=true;
            }
            return;
        }

        if(evt.key === "ArrowLeft"){
            if (!blockhor){
                hor = -1.0, ver = 0.0, blockhor = true;
            }
            return;
        }

        if(evt.key === "ArrowRight"){
            if (!blockhor){
                hor = 1.0, ver = 0.0, blockhor = true, iniciou=true;
            }
            return;
        }
    }
}

function criaMaca(){
    while(colisaoCorpoMaca()){
        maca[0] = (Math.floor(Math.random() * 14 + 1)) -7;
        maca[2] = (Math.floor(Math.random() * 14 + 1)) -7;
    }
    model = mat4.fromTranslation([],maca);
    return;
}

function movimentaCobra(){
    for(let i = jogador.length-1; i>0; i--){
        jogador[i][0] = jogador[i-1][0];
        jogador[i][2] = jogador[i-1][2];
    }

    jogador[0][0] += hor;
    jogador[0][2] += ver;

    return;
}

function colisaoCabecaMaca(){
    if(jogador[0][0] == maca[0] && jogador[0][2] == maca[2]){
        return true;
    }
    return false;
}

function colisaoCorpoMaca(){
    let i;
    for(i = 0; i < jogador.length; i++){
        if(jogador[i][0] == maca[0] && jogador[i][2] == maca[2]){
            return true;
        }
    }
    return false;
}

function colisaoProprioCorpo(){
    let i;
    for(i = 1; i < jogador.length; i++){
        if(jogador[i][0] == jogador[0][0] && jogador[i][2] == jogador[0][2]){
            return true;
        }
    }
    return false;
}

function colisaoCenario(){
    // Borda direita
    if(jogador[0][0] >= 8){
        return true;
    }

    // Borda esquerda
    if(jogador[0][0] <= -8){
        return true;
    }

    // Borda Inferior
    if(jogador[0][2] >= 8){
        return true;
    }

    // Borda Superior
    if(jogador[0][2] <= -8){
        return true;
    }

    return false;

}

function desenhaCenario(){
    
    // Desenha borda superior da tela
    for(let i=-8; i <= 8; i++){
        cenario[0] = i;
        cenario[2] = -8;
        modelCenario = mat4.fromTranslation([],cenario);
        gl.uniformMatrix4fv(modelUniform, false, modelCenario);
        gl.uniform3f(colorUniform, color4[0], color4[1], color4[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    // Desenha borda inferior da tela
    for(let i=-8; i <= 8; i++){
        cenario[0] = i;
        cenario[2] = 8;
        modelCenario = mat4.fromTranslation([],cenario);
        gl.uniformMatrix4fv(modelUniform, false, modelCenario);
        gl.uniform3f(colorUniform, color4[0], color4[1], color4[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    // Desenha borda esquerda da tela
    for(let i=-8; i <= 8; i++){
        cenario[0] = -8;
        cenario[2] = i;
        modelCenario = mat4.fromTranslation([],cenario);
        gl.uniformMatrix4fv(modelUniform, false, modelCenario);
        gl.uniform3f(colorUniform, color4[0], color4[1], color4[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    // Desenha borda direita da tela
    for(let i=-8; i <= 8; i++){
        cenario[0] = 8;
        cenario[2] = i;
        modelCenario = mat4.fromTranslation([],cenario);
        gl.uniformMatrix4fv(modelUniform, false, modelCenario);
        gl.uniform3f(colorUniform, color4[0], color4[1], color4[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    // Desenha linha horizontal
    for(let i=9; i>=-9; i--){
        linha[0] = -7;
        linha[2] = i;
        modelLinha = mat4.fromTranslation([],linha);
        gl.uniformMatrix4fv(modelUniform, false, modelLinha);
        gl.uniform3f(colorUniform, color4[0], color4[1], color4[2]);
        gl.drawArrays(gl.LINES, 36, 2);
    }

    // Desenha linha vertical
    for(let i=-9; i<=9; i++){
        linha[0] = i;
        linha[2] = -7;
        modelLinha = mat4.fromTranslation([],linha);
        gl.uniformMatrix4fv(modelUniform, false, modelLinha);
        gl.uniform3f(colorUniform, color4[0], color4[1], color4[2]);
        gl.drawArrays(gl.LINES, 38, 2);
    }

    return;
}

function desenhaMaca(){
    gl.uniformMatrix4fv(modelUniform, false, model);
    gl.uniform3f(colorUniform, color1[0], color1[1], color1[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    return;
}

function desenhaCobra(){
    let i=0;
    while(i<jogador.length){
        model2 = mat4.fromTranslation([], jogador[i]);
        gl.uniformMatrix4fv(modelUniform, false, model2);
        if(i == 0){
            gl.uniform3f(colorUniform, color3[0], color3[1], color3[2]);
        }else{
            gl.uniform3f(colorUniform, color2[0], color2[1], color2[2]);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        i++;
    }
    return;
}

function desenha(){

    let up = [0, 1, 0];
    let center = [0, 0, 0];
    view = mat4.lookAt([], eye, center, up);
    gl.uniformMatrix4fv(viewUniform, false, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Desenha Cenario
    desenhaCenario();

    // Desenha a Maca
    desenhaMaca();

    // Desenha a Cobra
    desenhaCobra();

    return;
}

window.addEventListener("load", main);
window.addEventListener("resize", resize);
window.addEventListener("keydown", keyDown);    
