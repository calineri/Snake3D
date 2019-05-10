/* Variaveis globais*/

let {mat4, vec4, vec3, vec2} = glMatrix;

const SPEED = 0.03;

let ver = 0, 
    hor = 0,
    blockver = false,
    blockhor = false, 
    pos = [0.0, 0.0, 0.0],
    pos2= [0.0, 0.0, 0.0],
    min = 1,
    max = 9;

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
let colorUniform;
let viewUniform;
let view;
let eye = [0,0,0];
let color0 = [0, 0, 0];
let color1 = [1, 0, 0];
let color2 = [0, 0, 1];
let color3 = [0, .7, 0];
let color4 = [1, 0, 1];
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
        h: [0.5, -0.5, 0.5]
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
        ...p.g, ...p.e, ...p.h
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
    eye = [0,7,10];
    let up = [0,1,0];
    let center = [0,0,0];
    view = mat4.lookAt([], eye, center, up);
    viewUniform = gl.getUniformLocation(shaderProgram, "view");
    gl.uniformMatrix4fv(viewUniform, false, view);

// 7.3 - Model Matrix Uniform

    pos2[0] = (Math.floor(Math.random() * 10 + 1)) -5;
    pos2[2] = (Math.floor(Math.random() * 10 + 1)) -5;
    console.log(pos2);

    model = mat4.fromTranslation([],pos2);
    modelUniform = gl.getUniformLocation(shaderProgram, "model");

    //model2 = mat4.fromTranslation([],loc);
    model2 = mat4.fromTranslation([],pos);


// 7.4 - Color Uniform
    colorUniform = gl.getUniformLocation(shaderProgram, "color");

// 8 - Chamar o loop de redesenho
    render();

}

function render(){
    frame++

    if(frame % 30 === 0){
        pos[0] += hor;
        pos[2] += ver;
        //console.log(pos);
        model2 = mat4.fromTranslation([], pos);
    }
    
    let up = [0, 1, 0];
    let center = [0, 0, 0];
    view = mat4.lookAt([], eye, center, up);
    gl.uniformMatrix4fv(viewUniform, false, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.POINTS
    // gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP
    // gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN 
    //gl.drawArrays(gl.TRIANGLES, 0, data.points.length / 2);
    
    // Cubo 01
    gl.uniformMatrix4fv(modelUniform, false, model);
    gl.uniform3f(colorUniform, color1[0], color1[1], color1[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // Cubo 02
    gl.uniformMatrix4fv(modelUniform, false, model2);
    gl.uniform3f(colorUniform, color2[0], color2[1], color2[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // Linhas
    //gl.uniformMatrix4fv(modelUniform, false, model2);
    //gl.uniform3f(colorUniform, color0[0], color0[1], color0[2]);
    //gl.drawArrays(gl.LINES, 0, 36);
    
    window.requestAnimationFrame(render);
}

function keyDown(evt){
    if(evt.key === "ArrowDown"){ 
        if (!blockver){
            ver = 1.0, hor = 0.0, blockver = true, blockhor = false;
        }
        return;
    }
    
    if(evt.key === "ArrowUp"){
        if (!blockver){
            ver = -1.0, hor = 0.0, blockver = true, blockhor = false;
        }
        return;
    }

    if(evt.key === "ArrowLeft"){
        if (!blockhor){
            hor = -1.0, ver = 0.0, blockhor = true, blockver = false;
        }
        return;
    }

    if(evt.key === "ArrowRight"){
        if (!blockhor){
            hor = 1.0, ver = 0.0, blockhor = true, blockver = false;
        }
        return;
    }
}

window.addEventListener("load", main);

window.addEventListener("resize", resize);
window.addEventListener("keydown", keyDown);    
