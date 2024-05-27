// Constants and global variables
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pointsLabel = document.getElementById('points-label');
const edgesLabel = document.getElementById('edges-label');
var coords = [];
var lines = [];
markedForRmb = false;
rmbMarkedCoord = [];
var generatedLines = [];
var stepCounter = 0;
var longPressedCoord= -1;
var intervalID;
var mouseX;
var mouseY;
var lang = 'hu';
var timerId;
var edgeDeletion=false;
var longPressDuration = 500;
var markedForMmb=[];
var primStarter = 0;
var markedForLmb = [];
var isLast=false;

class Graph {
    constructor() {
        this.adjacencyList = [];
    }

    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) {
            this.adjacencyList[vertex] = {};
        }
    }

    addEdge(vertex1, vertex2, weight) {
        // Automatically add vertices if they don't exist.
        this.addVertex(vertex1);
        this.addVertex(vertex2);

        // Add the edge in both directions since it's an undirected graph.
        this.adjacencyList[vertex1][vertex2] = weight;
        this.adjacencyList[vertex2][vertex1] = weight;
    }

    getGraph() {
        return this.adjacencyList;
    }
}

class PriorityQueue {
    constructor() {
        this.nodes = [];
        this.vertices = new Set();  // To keep track of vertices currently in the priority queue
    }

    enqueue(priority, key) {
        if (this.vertices.has(key)) {
            this.decreasePriority(key, priority);
        } else {
            this.nodes.push({key, priority});
            this.nodes.sort((a, b) => a.priority - b.priority);
            this.vertices.add(key);
        }
    }

    dequeue() {
        const node = this.nodes.shift();
        this.vertices.delete(node.key);
        return node.key;
    }

    isEmpty() {
        return this.nodes.length === 0;
    }

    decreasePriority(key, priority) {
        // Only update if the new priority is lower
        this.nodes = this.nodes.map(node => {
            if (node.key === key && node.priority > priority) {
                return {key, priority};
            }
            return node;
        });
        this.nodes.sort((a, b) => a.priority - b.priority);
    }
}

function isConnected() {
    let temp = [];
    temp = collectUnreachedCoords(coords[0]);
    if(temp.length>0){
        return false;
    }
    else{
        return true;
    }
}

function prim(graph, start) {
    let numVertices = graph.length;
    let inMST = Array(numVertices).fill(false);
    let costs = Array(numVertices).fill(Infinity);
    let parents = Array(numVertices).fill(null);
    let priorityQueue = new PriorityQueue();
    let mstEdges = [];

    costs[start] = 0;
    priorityQueue.enqueue(0, start);

    while (!priorityQueue.isEmpty()) {
        let u = priorityQueue.dequeue();
        inMST[u] = true;

        if (parents[u] !== null) {
            mstEdges.push({ from: parents[u], to: u, weight: graph[parents[u]][u] });
        }

        for (let v in graph[u]) {
            let weight = graph[u][v];
            if (!inMST[v] && costs[v] > weight) {
                parents[v] = u;
                costs[v] = weight;
                priorityQueue.enqueue(weight, v);
            }
        }
    }
    return mstEdges;
}

// Function to draw a point with a given size
function drawPoint(x, y, size) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x-5, y-5, size, size);
    coords.push([x,y]);
}

function drawLine(start, finish, color){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(finish[0], finish[1]);
    ctx.stroke();
}

function drawNumber(number, x, y) {
    ctx.font = 14 + 'px ' + "Arial";
    ctx.fillStyle = "black";
    ctx.fillText(number, x, y);
}

// Function to handle left click on canvas
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    var occupied = false;
    for(let i=0;i<coords.length;i++){
        if(coords[i][0]-10<=x&&x<=coords[i][0]+10){
            if(coords[i][1]-10<=y&&y<=coords[i][1]+10){
                occupied=true;
                break;
            }
        }
    }
    if(occupied==false){
        //console.log(occupied);
        drawPoint(x, y, 10); 
    }
    for(let i=0;i<coords.length;i++){
        if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
            if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                if(markedForLmb.length>0){
                    if(markedForLmb==coords[i]){
                        markedForLmb = []
                        primStarter=i;
                        console.log("Starter Changed");
                        alert("Kezdőpont megváltoztatva/Startpoint changed");
                        generatedLines=[];
                        resizeCanvas();
                    }
                }
                else{
                    console.log("Set starter");
                    markedForLmb=coords[i];
                }
                break;
            }
        }
    }
    markedForRmb = false;
    markedForMmb = [];
    rmbMarkedCoord = [];
}

// Function to handle right click on canvas
function handleRightClick(event){
    const rect = canvas.getBoundingClientRect(); 
    const x = event.clientX - rect.left; 
    const y = event.clientY - rect.top; 
    if(!markedForRmb){
        for(let i=0;i<coords.length;i++){
            if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
                if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                    markedForRmb = true;
                    rmbMarkedCoord = coords[i];
                    console.log("right click set");
                }
            }
        }
    }
    else{
        for(let i=0;i<coords.length;i++){
            if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
                if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                    if(coords[i]!=rmbMarkedCoord){
                        if(!lines.includes([coords[i],rmbMarkedCoord])){
                            lines.push([coords[i],rmbMarkedCoord]);
                            generatedLines=[];
                            resizeCanvas();
                        }
                        markedForRmb = false;
                        rmbMarkedCoord = [];
                    }
                    else{
                        markedForRmb = false;
                        rmbMarkedCoord = [];
                    }
                }
            }
        }
    }
    markedForLmb = [];
    markedForMmb = [];
}

// Function to handle middle click on canvas
function handleMiddleClick(event){
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if(!edgeDeletion){
        for(let i=0;i<coords.length;i++){
            if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
                if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                    deletePoint(i);
                    break;
                }
            }
        }
        generatedLines=[];
        markedForRmb = false;
        markedForLmb = [];
        rmbMarkedCoord = [];
        markedForMmb = [];
    }
    else{
        if(markedForMmb.length==0){
            for(let i=0;i<coords.length;i++){
                if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
                    if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                        markedForMmb = coords[i];
                        console.log("middle click set");
                    }
                }
            }
        }
        else{
            for(let i=0;i<coords.length;i++){
                if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
                    if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                        if(coords[i]!=markedForMmb){
                            for(let j = 0; j < lines.length; j++){
                                if((lines[j][0]==coords[i]&&lines[j][1]==markedForMmb)||(lines[j][0]==markedForMmb&&lines[j][1]==coords[i])){
                                    lines.splice(j,1);
                                    j--; //Make sure that splicing doesnt skip steps
                                }
                            }
                            generatedLines=[];
                            resizeCanvas();
                            markedForMmb = [];
                        }
                        else{
                            markedForMmb = [];
                        }
                    }
                }
            }
        }
    }
    generatedLines=[];
    markedForRmb = false;
    markedForLmb = [];
    rmbMarkedCoord = [];
}

// Function to resize the canvas
function resizeCanvas(){
    const prevwidth = canvas.width;
    const prevheight = canvas.height;
    canvas.width  = window.innerWidth*0.8;
    canvas.height = Math.floor(9*canvas.width/16);
    const changevectorX = canvas.width/prevwidth;
    const changevectorY = canvas.height/prevheight;
    //redrawing the points
    for (let i = 0; i < coords.length; i++) {
        ctx.fillStyle = 'black';
        coords[i][0]=coords[i][0]*changevectorX;
        coords[i][1]=coords[i][1]*changevectorY;
        ctx.fillRect(coords[i][0]-5, coords[i][1]-5,10 , 10);
    }
    //redrawing the lines
    
    for (let j = 0; j < lines.length; j++){
        drawLine(lines[j][0],lines[j][1],"blue");
        let distanceNum = Math.round(calcDistance(lines[j][0],lines[j][1]));
        let coordX = Math.round((lines[j][0][0]+lines[j][1][0])/2);
        let coordY = Math.round((lines[j][0][1]+lines[j][1][1])/2);

        drawNumber(distanceNum,coordX, coordY);
    }
    if(generatedLines.length>0){
        for (let k = 0; k < stepCounter; k++){
            generatedLines[k][0][0]=generatedLines[k][0][0]*changevectorX;
            generatedLines[k][1][0]=generatedLines[k][1][0]*changevectorX;
            generatedLines[k][0][1]=generatedLines[k][0][1]*changevectorY;
            generatedLines[k][1][1]=generatedLines[k][1][1]*changevectorY;
        }//resize

        for (let k = 0; k < stepCounter; k++){
            ctx.lineWidth = 2;
            drawLine(generatedLines[k][0],generatedLines[k][1],"green");
            if(k==stepCounter-1&&!isLast){
                ctx.lineWidth = 2;
                drawLine(generatedLines[k][0],generatedLines[k][1],"orange");
            }else if(k==stepCounter-1&&isLast){
                ctx.lineWidth = 2;
                drawLine(generatedLines[k][0],generatedLines[k][1],"green");
            }
            ctx.lineWidth = 1;
        }
    }
    markedForRmb = false;
    markedForMmb = [];
    rmbMarkedCoord = [];
}

function deletePoint(x){
    if(primStarter==x){
        primStarter=0;
    }
    for(let i = 0; i < lines.length; i++){
        if(lines[i][0]==coords[x]||lines[i][1]==coords[x]){
            lines.splice(i,1);
            i--; //Make sure that splicing doesnt skip steps
        }
    }

    if(generatedLines.length>0){
        for(let i = 0; i < generatedLines.length; i++){
            if(generatedLines[i][0]==coords[x]){
                generatedLines=[];
                stepCounter=0;
            }
            else if(generatedLines[i][1]==coords[x]){
                generatedLines=[];
                stepCounter=0;
            }
        }
    }
    coords.splice(x,1);
    ctx.clearRect(0,0, canvas.width, canvas.height);
    generatedLines=[];
    resizeCanvas();
}

function handleLongPress(x,y){
    console.log("longpressed");
    generatedLines=[];
    if(longPressedCoord==-1){
        for(let i=0;i<coords.length;i++){
            if(coords[i][0]-5<=x&&x<=coords[i][0]+5){
                if(coords[i][1]-5<=y&&y<=coords[i][1]+5){
                    longPressedCoord=i;
                    console.log(longPressedCoord);
                }
            }
        }

    }
    if(longPressedCoord!=-1){
        //coords.push([x,y]);
        coords[longPressedCoord][0]=x;
        coords[longPressedCoord][1]=y;
        console.log(coords[longPressedCoord]);
    }
    ctx.clearRect(0,0, canvas.width, canvas.height);
    for (let i = 0; i < coords.length; i++) {
        ctx.fillStyle = 'black';
        ctx.fillRect(coords[i][0]-5, coords[i][1]-5,10 , 10);
    }
    //redrawing the lines
    for (let j = 0; j < lines.length; j++){
        drawLine(lines[j][0],lines[j][1],"blue");
    }
}

function calcDistance(x, y){
    return Math.sqrt(Math.pow(y[1] - x[1], 2) + Math.pow(y[0] - x[0], 2));
}

//EVENT LISTENERS

// Event listener for canvas click
canvas.addEventListener('click', handleCanvasClick);

// Event listener for canvas rmb click
canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    handleRightClick(event);
});

// Event listener for canvas mmb click
canvas.addEventListener('mousedown', function(event) {
    if (event.button === 1){
      event.preventDefault();
      handleMiddleClick(event);
    }
});

// Event listener for holding down lmb
canvas.addEventListener('mousedown', function(event) {
    if (event.button === 0) { 
        mouseDownEvent = event;
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
        timerId = setTimeout(function() {
            canvas.style.cursor = "grabbing";
            intervalID = setInterval(function() {
                handleLongPress(mouseX, mouseY);
            }, 25);
        }, longPressDuration);
    }
});

canvas.addEventListener('mouseup', function(event) {
    if (event.button === 0){
      clearTimeout(timerId);
      clearInterval(intervalID);
      console.log("cleared");
      resizeCanvas();
      longPressedCoord=-1;
      canvas.style.cursor = "auto";
    }
});

canvas.addEventListener('mousemove', function(event) {
    // Update mouse position
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

//resizes the canvas when the page is loaded
document.addEventListener("DOMContentLoaded", function(){
    resizeCanvas();
});

// Event listener for window resize
window.addEventListener("resize", resizeCanvas, false);

// BUTTONS

function clearCanvas(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    coords = [];
    lines = [];
    generatedLines = [];
    stepCounter = 0;
    markedForRmb = false;
    markedForLmb = [];
    markedForMmb = [];
    rmbMarkedCoord = [];
    primStarter=0;
}

function previousStep(){
    if(stepCounter>0){
        stepCounter--;
        if(isLast){
            isLast=false;
        }
        resizeCanvas();
    }
}

function nextStep(){
    if(stepCounter<(generatedLines.length)){
        stepCounter++;
        resizeCanvas();
    }else{
        isLast=true;
        resizeCanvas();
    }

}

function clearLines(){
    lines=[];
    generatedLines=[];
    stepCounter=0;
    resizeCanvas();
}


function generateMST() {
    const graph = new Graph();
    if(coords.length<2){
        if(lang=="hu"){
            alert("Nem megfelelő gráf! Az algoritmus bemutatásához legalább 2 csúcsú gráfra van szükség.");
        }
        else{
            alert("Invalid Graph! To properly visualize the algorithm, the program requires a graph made of at least 2 points.");
        }
    }
    else{
        for(let k=0;k<lines.length;k++){
            for(let i=0;i<coords.length;i++){
                if(lines[k][0]==coords[i]){
                    for(let j=0;j<coords.length;j++){
                        if(lines[k][1]==coords[j]){//if we found both indexes of the line's 2 points
                            graph.addEdge(i,j,calcDistance(lines[k][0],lines[k][1]));
                            break;  
                        }
                    }
                    break;  
                }
            }
        }
    
        console.log(graph.getGraph());
        if(isConnected()){
            const mst = prim(graph.getGraph(),primStarter)
            console.log("mst:",mst);
            generatedLines=[];
            for(let i=0;i<mst.length;i++){
                generatedLines.push([[coords[parseInt(mst[i].from)][0],coords[parseInt(mst[i].from)][1]],[coords[parseInt(mst[i].to)][0],coords[parseInt(mst[i].to)][1]]]);
            }
            console.log(generatedLines);
            //console.log(lines);
            stepCounter=generatedLines.length;
            resizeCanvas();
        }
        else{
            if(lang=="hu"){
                alert("Nem megfelelő gráf! A Prim algoritmus csak összefüggő gráfon futtatható.");
            }
            else{
                alert("Invalid Graph! Prim's algorithm can only be used on whole graphs.");
            }
            
        }
    }
}

function generateMSTfirst(){
    const graph = new Graph();
    if(coords.length<2){
        if(lang=="hu"){
            alert("Nem megfelelő gráf! Az algoritmus bemutatásához legalább 2 csúcsú gráfra van szükség.");
        }
        else{
            alert("Invalid Graph! To properly visualize the algorithm, the program requires a graph made of at least 2 points.");
        }
    }
    else{
        for(let k=0;k<lines.length;k++){
            for(let i=0;i<coords.length;i++){
                if(lines[k][0]==coords[i]){
                    for(let j=0;j<coords.length;j++){
                        if(lines[k][1]==coords[j]){//if we found both indexes of the line's 2 points
                            graph.addEdge(i,j,calcDistance(lines[k][0],lines[k][1]));
                            break;  
                        }
                    }
                    break;  
                }
            }
        }
        //console.log(graph.getGraph());
        if(isConnected()){
            const mst = prim(graph.getGraph(),primStarter)
            console.log("mst:",mst);
            generatedLines=[];
            for(let i=0;i<mst.length;i++){
                generatedLines.push([[coords[parseInt(mst[i].from)][0],coords[parseInt(mst[i].from)][1]],[coords[parseInt(mst[i].to)][0],coords[parseInt(mst[i].to)][1]]]);
            }
            console.log(generatedLines);
            //console.log(lines);
            stepCounter=1;
            resizeCanvas();
        }
        else{
            if(lang=="hu"){
                alert("Nem megfelelő gráf! A Prim algoritmus csak összefüggő gráfon futtatható.");
            }
            else{
                alert("Invalid Graph! Prim's algorithm can only be used on whole graphs.");
            }
            
        }
    }
}

function toggleDeletion(){
    const pageTitle = document.querySelector('.page-title');
    const buttons = document.querySelectorAll('.btn-container button');
    edgeDeletion=!edgeDeletion;
    markedForMmb=[];
    if (lang === 'en') {
        buttons.forEach(button => {
            switch (button.textContent) {
                case 'Deletion mode: Point':
                    button.textContent = 'Deletion mode: Edge';
                    break; 
                case 'Deletion mode: Edge':
                    button.textContent = 'Deletion mode: Point';
                    break; 
            }
        });
    } else {
        buttons.forEach(button => {
            switch (button.textContent) {
                case 'Törlés mód: Csúcs' :
                    button.textContent = 'Törlés mód: Él';
                    break;
                case 'Törlés mód: Él' :
                    button.textContent = 'Törlés mód: Csúcs';
                    break;
            }
        });
    }
}


function toggleLanguage() {
    const pageTitle = document.querySelector('.page-title');
    const buttons = document.querySelectorAll('.btn-container button');
    const languageToggle = document.getElementById('language-toggle');

    if (lang === 'en') {
        lang = 'hu';
        pageTitle.textContent = 'Prim Algoritmus Vizualizálása';
        buttons.forEach(button => {
            switch (button.textContent) {
                case 'Generate MST':
                    button.textContent = 'MST Generálás';
                    break;
                case 'Clear':
                    button.textContent = 'Törlés';
                    break;
                case 'Clear Lines':
                    button.textContent = 'Élek Törlése';
                    break;
                case 'Previous Step':
                    button.textContent = 'Előző Lépés';
                    break;
                case 'Next Step':
                    button.textContent = 'Következő Lépés';
                    break;
                case 'Generate MST (From First Step)':
                    button.textContent = 'MST Generálása (Első lépéstől)';
                    break;
                case 'Generate MST (From First Step)':
                    button.textContent = 'MST Generálása (Első lépéstől)';
                    break; 
                case 'Deletion mode: Point':
                    button.textContent = 'Törlés mód: Csúcs';
                    break; 
                case 'Deletion mode: Edge':
                    button.textContent = 'Törlés mód: Él';
                    break; 
            }
        });
        languageToggle.innerHTML = '<img src="uk_flag.png" alt="British Flag">';
    } else {
        lang = 'en';
        pageTitle.textContent = 'Prim Algorithm Visualization';
        buttons.forEach(button => {
            switch (button.textContent) {
                case 'MST Generálás':
                    button.textContent = 'Generate MST';
                    break;
                case 'Törlés':
                    button.textContent = 'Clear';
                    break;
                case 'Élek Törlése':
                    button.textContent = 'Clear Lines';
                    break;
                case 'Előző Lépés':
                    button.textContent = 'Previous Step';
                    break;
                case 'Következő Lépés':
                    button.textContent = 'Next Step';
                    break;
                case 'MST Generálása (Első lépéstől)':
                    button.textContent = 'Generate MST (From First Step)';
                    break;
                case 'Törlés mód: Csúcs' :
                    button.textContent = 'Deletion mode: Point';
                    break;
                case 'Törlés mód: Él' :
                    button.textContent = 'Deletion mode: Edge';
                    break;
            }
        });
        languageToggle.innerHTML = '<img src="hungary_flag.png" alt="Hungarian Flag">';
    }
}


function collectUnreachedCoords(coord) {
    const reachedCoords = collectReachedCoords(coord);
    return coords.filter((coord) => !reachedCoords.includes(coord));
}
 
function collectReachedCoords(coord, givenReachedCoords) {
    let reachedCoords = givenReachedCoords ?? [coord];
    getConnectedCoords(coord).forEach((connectedCoord) => {
        if (!reachedCoords.includes(connectedCoord)) {
            reachedCoords = [...reachedCoords, connectedCoord];
            reachedCoords = [...reachedCoords, ...collectReachedCoords(connectedCoord, reachedCoords)];
        }
    });
 
    return reachedCoords;
}
 
function getConnectedCoords(coord) {
    const connectedCoords = [];
    lines.forEach(([coord1, coord2]) => {
        if (coord === coord1) {
            connectedCoords.push(coord2);
        } else if (coord === coord2) {
            connectedCoords.push(coord1);
        }
    });
    return connectedCoords;
}
 