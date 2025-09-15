const levels=[
  {size:6, extraWords:["SOL","LUZ","AR","MAR","FLOR"]},
  {size:8, extraWords:["ARVORE","AGUA","ECO","JARDIM","FOGO"]},
  {size:10, extraWords:["RECICLAR","ANIMAIS","POLUIR","ENERGIA","FLORESTA"]},
  {size:12, extraWords:["SUSTENTAVEL","COMPOSTAR","RENOVAVEL","REUTILIZAR","BIODIVERSIDADE"]},
  {size:14, extraWords:["CONSERVACAO","DESMATAMENTO","RESPONSAVEL","PROTECAO","ECOSSISTEMA","PRESERVACAO"]}
];

let currentLevel=0, score=0, timer, seconds=0, timesPerLevel=[];
let gridData=[], wordPositions=[];

function startTimer(){
  clearInterval(timer);
  seconds=0;
  timer=setInterval(()=>{
    seconds++;
    const m=String(Math.floor(seconds/60)).padStart(2,"0");
    const s=String(seconds%60).padStart(2,"0");
    document.getElementById("time").textContent=`${m}:${s}`;
  },1000);
}

function startGame(levelIndex){
  currentLevel=levelIndex; score=0; timesPerLevel=[];
  document.getElementById("menu").style.display="none";
  document.getElementById("levelSelection").style.display="none";
  document.getElementById("statusBar").style.display="flex";
  generateGrid(currentLevel);
}

function showLevelSelection(){
  document.getElementById("menu").style.display="none";
  document.getElementById("levelSelection").style.display="flex";
}

function generateGrid(levelIndex){
  document.getElementById("level").textContent=levelIndex+1;
  document.getElementById("score").textContent=score;
  const level=levels[levelIndex]; const size=level.size;
  const grid=document.getElementById("grid"); grid.innerHTML="";
  grid.style.gridTemplateColumns=`repeat(${size},1fr)`;

  const words=level.extraWords.slice(0,5+levelIndex*2);
  gridData=Array.from({length:size},()=>Array(size).fill(""));
  wordPositions=[];

  words.forEach(word=>{
    let placed=false,tries=0;
    while(!placed && tries<200){
      tries++;
      const dirs=["H","V","D"];
      const dir=dirs[Math.floor(Math.random()*dirs.length)];
      const row=Math.floor(Math.random()*size);
      const col=Math.floor(Math.random()*size);
      if(canPlace(word,row,col,dir,size)){
        for(let i=0;i<word.length;i++){
          let r=row, c=col;
          if(dir==="H") c+=i;
          if(dir==="V") r+=i;
          if(dir==="D") {r+=i;c+=i;}
          gridData[r][c]=word[i];
        }
        wordPositions.push({word,row,col,dir,found:false});
        placed=true;
      }
    }
  });

  const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!gridData[r][c]) gridData[r][c]=letters[Math.floor(Math.random()*letters.length)];
      const cell=document.createElement("div");
      cell.className="cell";
      cell.dataset.row=r; cell.dataset.col=c;
      cell.textContent=gridData[r][c];
      grid.appendChild(cell);
    }
  }
  renderWordList(words);
  startTimer();
}

function canPlace(word,row,col,dir,size){
  for(let i=0;i<word.length;i++){
    let r=row, c=col;
    if(dir==="H") c+=i;
    if(dir==="V") r+=i;
    if(dir==="D") {r+=i;c+=i;}
    if(r<0||r>=size||c<0||c>=size) return false;
    if(gridData[r][c]) return false;
  }
  return true;
}

function renderWordList(words){
  const wl=document.getElementById("wordList"); wl.innerHTML="";
  words.forEach(w=>{
    const span=document.createElement("div");
    span.className="wordItem";
    span.textContent=w;
    wl.appendChild(span);
  });
}

let isSelecting=false, selectedCells=[];
const gridEl=document.getElementById("grid");

function startSelect(e){
  isSelecting=true; selectedCells=[];
  const cell=e.target.closest(".cell");
  if(cell) addCell(cell);
  e.preventDefault();
}

function moveSelect(e){
  if(!isSelecting) return;
  const touch = e.touches ? e.touches[0] : e;
  const el = document.elementFromPoint(touch.clientX,touch.clientY);
  const cell = el && el.classList.contains("cell") ? el : null;
  if(cell) addCell(cell);
  e.preventDefault();
}

function endSelect(){
  if(selectedCells.length) checkSelection();
  selectedCells.forEach(c=>c.classList.remove("selected"));
  selectedCells=[]; isSelecting=false;
}

function addCell(cell){
  if(!selectedCells.includes(cell) && !cell.classList.contains("found")){
    cell.classList.add("selected"); selectedCells.push(cell);
  }
}

function checkSelection(){
  if(selectedCells.length < 2) return;
  const r0 = parseInt(selectedCells[0].dataset.row);
  const c0 = parseInt(selectedCells[0].dataset.col);
  const r1 = parseInt(selectedCells[selectedCells.length-1].dataset.row);
  const c1 = parseInt(selectedCells[selectedCells.length-1].dataset.col);

  let dr = r1 - r0;
  let dc = c1 - c0;

  dr = dr===0?0:dr/Math.abs(dr);
  dc = dc===0?0:dc/Math.abs(dc);

  const isValidDir = (dr===0 && dc!==0) || (dr!==0 && dc===0) || (dr!==0 && dc!==0 && Math.abs(dr)===Math.abs(dc));
  if(!isValidDir) return;

  for(let i=1;i<selectedCells.length;i++){
    const rr = parseInt(selectedCells[i].dataset.row)-parseInt(selectedCells[i-1].dataset.row);
    const cc = parseInt(selectedCells[i].dataset.col)-parseInt(selectedCells[i-1].dataset.col);
    const rrNorm = rr===0?0:rr/Math.abs(rr);
    const ccNorm = cc===0?0:cc/Math.abs(cc);
    if(rrNorm!==dr || ccNorm!==dc) return;
  }

  const word = selectedCells.map(c=>c.textContent).join("");
  const rev  = selectedCells.map(c=>c.textContent).reverse().join("");
  let found=false;

  wordPositions.forEach(pos=>{
    if(!pos.found && (word===pos.word || rev===pos.word)){
      selectedCells.forEach(c=>{
        c.classList.remove("selected");
        c.classList.add("found");
      });
      pos.found=true; found=true;
    }
  });

  if(found) selectedCells=[];
  if(wordPositions.every(pos=>pos.found)) completeLevel();
}

gridEl.addEventListener("mousedown", startSelect);
gridEl.addEventListener("mousemove", moveSelect);
document.addEventListener("mouseup", endSelect);
gridEl.addEventListener("touchstart", startSelect);
gridEl.addEventListener("touchmove", moveSelect);
document.addEventListener("touchend", endSelect);

function completeLevel(){
  clearInterval(timer);
  timesPerLevel.push(seconds);
  const levelScore=Math.max(100-seconds,10);
  score+=levelScore;
  if(currentLevel<levels.length-1){
    showMessage(`🎉 Nível ${currentLevel+1} concluído!`,`Você fez ${levelScore} pontos neste nível.<br>Indo para o próximo nível...`);
    setTimeout(()=>{
      currentLevel++;
      generateGrid(currentLevel);
      document.getElementById("message").style.display="none";
    },2000);
  } else {
    let text=`Parabéns! Você concluiu todos os níveis!<br><br>`;
    text+=`Pontuação Total: <b>${score}</b><br><br>`;
    timesPerLevel.forEach((t,i)=>{
      const m=String(Math.floor(t/60)).padStart(2,"0");
      const s=String(t%60).padStart(2,"0");
      text+=`Nível ${i+1}: ${m}:${s}<br>`;
    });
    showMessage("🎉 Você venceu!",text);
    document.getElementById("playAgain").style.display="inline-block";
  }
}

function showMessage(title,text){
  const m=document.getElementById("message");
  document.getElementById("messageTitle").textContent=title;
  document.getElementById("messageText").innerHTML=text;
  m.style.display="block";
}

document.getElementById("playAgain").onclick=()=>{
  currentLevel=0; score=0; timesPerLevel=[];
  document.getElementById("playAgain").style.display="none";
  document.getElementById("message").style.display="none";
  document.getElementById("menu").style.display="flex";
};
