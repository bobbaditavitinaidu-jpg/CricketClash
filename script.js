import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseApp=initializeApp({apiKey:"AIzaSyBU0mLVYHIy10_DR_leBbzZrAtSip9rwhc",authDomain:"cricketclash-2dac2.firebaseapp.com",projectId:"cricketclash-2dac2",storageBucket:"cricketclash-2dac2.firebasestorage.app",messagingSenderId:"491625722889",appId:"1:491625722889:web:638fa8e325cdbec195b4d8",measurementId:"G-99EX6FWV8V"});
const firebaseAuth=getAuth(firebaseApp);
const firebaseDb=getFirestore(firebaseApp);

(function(){
  var N=20, cv=document.getElementById("c"), ctx=cv.getContext("2d"), S=cv.width/N;
  var $=function(id){return document.getElementById(id)};
  var snake, dir, next, food, foodFriend=null, score, best=0, loop=null, running=false, bonus=null, bonusT=0, level="normal", paused=false, rocks=[], rocksOn=false, wrap=false, skin=null, top=[];
  var particles=[], foodColor="#ff4d9d", rainbowShift=0, foodPop=null;
  var eatSound=new Audio("Fahhhh (1).mp3");
  eatSound.preload="auto";
  eatSound.volume=0.8;
  var FOOD_COLORS=["#ff4d9d","#ff5a36","#ffd166","#40d9a0","#55aaff","#a66cff"];
  var FRIENDS=["images/friend1.jpg","images/friend2.jpg","images/friend3.jpg","images/friend4.jpg"];
  var friendImages={};
  FRIENDS.forEach(function(src){
    var img=new Image();
    img.onload=function(){friendImages[src]=img};
    img.onerror=function(){friendImages[src]=null};
    img.src=src;
  });
  try{best=parseInt(localStorage.getItem("snake-best")||"0",10)||0}catch(e){}
  $("best").textContent=best;
  var V={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  var SKINS=[null,{b:"#3b82f6",h:"#1d4ed8"},{b:"#a855f7",h:"#7e22ce"},{b:"#f59e0b",h:"#b45309"}];
  try{top=JSON.parse(localStorage.getItem("snake-top")||"[]")}catch(e){top=[]}
  if(!Array.isArray(top))top=[];
  top=top.filter(function(n){return typeof n==="number"&&isFinite(n)}).slice(0,5);
  function renderTop(){
    var el=$("top"); el.innerHTML="";
    top.forEach(function(s,i){var li=document.createElement("li");li.innerHTML=(i+1)+". <b>"+s+"</b>";el.appendChild(li)});
  }
  renderTop();

  function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
  function placeFood(){
    var free=[];
    for(var x=0;x<N;x++)for(var y=0;y<N;y++){
      if(!snake.some(function(s){return s[0]===x&&s[1]===y})&&!isRock(x,y))free.push([x,y]);
    }
    food=free.length?free[Math.floor(Math.random()*free.length)]:null;
    if(food){
      foodColor=FOOD_COLORS[Math.floor(Math.random()*FOOD_COLORS.length)];
      foodFriend=FRIENDS[Math.floor(Math.random()*FRIENDS.length)];
    }else{
      foodFriend=null;
    }
  }
  function reset(){
    snake=[[10,10],[9,10],[8,10]]; dir=V.right; next=V.right; score=0; bonus=null; paused=false;
    particles=[]; rainbowShift=0; foodPop=null;
    $("score").textContent=0; $("level").textContent=1; rocks=[]; placeFood(); if(rocksOn){for(var i=0;i<4;i++)addRock(true)} draw();
  }
  function draw(){
    ctx.fillStyle=css("--board"); ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle=css("--grid");
    for(var x=0;x<N;x++)for(var y=0;y<N;y++){ if((x+y)%2===0)ctx.fillRect(x*S,y*S,S,S); }
    if(food){
      var cx=food[0]*S+S/2, cy=food[1]*S+S/2, photoSize=S*2;
      var img=friendImages[foodFriend];
      ctx.save();
      ctx.shadowBlur=S*.9; ctx.shadowColor=foodColor;
      ctx.fillStyle=foodColor;
      ctx.beginPath(); ctx.arc(cx,cy,photoSize/2+S*.12,0,Math.PI*2); ctx.fill();
      ctx.restore();
      if(img){
        ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,photoSize/2,0,Math.PI*2); ctx.clip();
        var iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
        var scale=Math.max(photoSize/iw,photoSize/ih);
        var dw=iw*scale, dh=ih*scale;
        ctx.drawImage(img,cx-dw/2,cy-dh/2,dw,dh); ctx.restore();
      }else{
        ctx.save(); ctx.shadowBlur=S*.7; ctx.shadowColor=foodColor;
        ctx.fillStyle=foodColor; ctx.beginPath(); ctx.arc(cx,cy,S*.36,0,Math.PI*2); ctx.fill(); ctx.restore();
        ctx.fillStyle="rgba(255,255,255,.75)";ctx.beginPath();ctx.arc(cx-S*.05,cy-S*.08,S*.09,0,Math.PI*2);ctx.fill();
      }
    }
    if(foodPop){
      var popRadius=S*(.5+(12-foodPop.life)/12*1.1);
      ctx.save(); ctx.globalAlpha=Math.max(0,foodPop.life/12); ctx.strokeStyle=foodColor; ctx.lineWidth=4;
      ctx.shadowBlur=12; ctx.shadowColor=foodColor; ctx.beginPath();
      ctx.arc(foodPop.x*S+S/2,foodPop.y*S+S/2,popRadius,0,Math.PI*2); ctx.stroke(); ctx.restore();
    }
    rocks.forEach(function(r){ctx.fillStyle="#7b8290";ctx.beginPath();if(ctx.roundRect)ctx.roundRect(r[0]*S+1,r[1]*S+1,S-2,S-2,6);else ctx.rect(r[0]*S+1,r[1]*S+1,S-2,S-2);ctx.fill();ctx.fillStyle="#9aa1ad";ctx.fillRect(r[0]*S+5,r[1]*S+5,S/3,3)});
    if(bonus){ctx.fillStyle="#f2b200";ctx.beginPath();ctx.arc(bonus[0]*S+S/2,bonus[1]*S+S/2,S*0.42,0,Math.PI*2);ctx.fill();ctx.fillStyle=css("--board");ctx.beginPath();ctx.arc(bonus[0]*S+S/2,bonus[1]*S+S/2,S*0.16,0,Math.PI*2);ctx.fill();}
    snake.forEach(function(s,i){
      var hue=(i*28+rainbowShift)%360;
      ctx.fillStyle=skin?(i===0?skin.h:skin.b):"hsl("+hue+",88%,58%)";
      if(i===0)ctx.shadowBlur=skin?0:8,ctx.shadowColor="hsl("+hue+",88%,58%)";
      var p=1.5; ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(s[0]*S+p,s[1]*S+p,S-2*p,S-2*p,5); else ctx.rect(s[0]*S+p,s[1]*S+p,S-2*p,S-2*p);
      ctx.fill(); ctx.shadowBlur=0;
    });
    particles.forEach(function(p){
      ctx.globalAlpha=Math.max(0,p.life/30);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    });ctx.globalAlpha=1;
  }
  function tick(){
    dir=next;
    var h=[snake[0][0]+dir[0],snake[0][1]+dir[1]];
    if(wrap){h[0]=(h[0]+N)%N;h[1]=(h[1]+N)%N}
    var hitWall=h[0]<0||h[1]<0||h[0]>=N||h[1]>=N||isRock(h[0],h[1]);
    var ate=food&&h[0]===food[0]&&h[1]===food[1];
    var ateB=bonus&&h[0]===bonus[0]&&h[1]===bonus[1];
    var body=(ate||ateB)?snake:snake.slice(0,-1);
    var hitSelf=body.some(function(s){return s[0]===h[0]&&s[1]===h[1]});
    if(hitWall||hitSelf){return over()}
    snake.unshift(h);
    if(ate){
      score++; $("score").textContent=score; updateLevel(); rainbowShift=(rainbowShift+28)%360; burst(food[0],food[1]); foodPop={x:food[0],y:food[1],life:12}; placeFood();
      if(!food)return over(true);
      if(rocksOn&&score%5===0&&rocks.length<12)addRock(false);
      if(!bonus&&Math.random()<0.25)placeBonus();
      try{eatSound.pause();eatSound.currentTime=0;eatSound.play().catch(function(){})}catch(e){}
      restart(); draw();
    }else if(ateB){
      score+=5; $("score").textContent=score; updateLevel(); burst(bonus[0],bonus[1]); rainbowShift=(rainbowShift+28)%360; bonus=null; restart();
    }else{snake.pop()}
    if(bonus&&--bonusT<=0)bonus=null;
    rainbowShift=(rainbowShift+1)%360;
    updateParticles();
    draw();
  }
  function updateLevel(){
    var newLevel=Math.floor(score/5)+1;
    $("level").textContent=newLevel;
  }
  function burst(x,y){
    var cx=x*S+S/2, cy=y*S+S/2;
    for(var i=0;i<18;i++){
      var angle=(Math.PI*2*i)/18;
      particles.push({x:cx,y:cy,vx:Math.cos(angle)*(1.5+Math.random()*2),vy:Math.sin(angle)*(1.5+Math.random()*2),size:2+Math.random()*3,life:30,color:foodColor});
    }
  }
  function updateParticles(){
    particles.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=0.04;p.life--});
    particles=particles.filter(function(p){return p.life>0});
  }
  function speed(){var base={easy:190,normal:150,hard:110}[level];return Math.max(50,base-score*4)}
  function isRock(x,y){return rocks.some(function(r){return r[0]===x&&r[1]===y})}
  function addRock(initial){
    var free=[],hx=snake[0][0],hy=snake[0][1];
    for(var x=0;x<N;x++)for(var y=0;y<N;y++){
      if(snake.some(function(s){return s[0]===x&&s[1]===y})||isRock(x,y))continue;
      if(food&&food[0]===x&&food[1]===y)continue;
      if(bonus&&bonus[0]===x&&bonus[1]===y)continue;
      if(initial?(y>=8&&y<=12):(Math.abs(x-hx)+Math.abs(y-hy)<5))continue;
      free.push([x,y]);
    }
    if(free.length)rocks.push(free[Math.floor(Math.random()*free.length)]);
  }
  function placeBonus(){
    var free=[];
    for(var x=0;x<N;x++)for(var y=0;y<N;y++){
      if(!snake.some(function(s){return s[0]===x&&s[1]===y})&&!(food&&food[0]===x&&food[1]===y)&&!isRock(x,y))free.push([x,y]);
    }
    if(free.length){bonus=free[Math.floor(Math.random()*free.length)];bonusT=40}
  }
  function togglePause(){
    if(!running)return;
    paused=!paused;
    if(paused){clearInterval(loop);$("pause").textContent="Resume"}
    else{restart();$("pause").textContent="Pause"}
  }
  function restart(){clearInterval(loop);loop=setInterval(tick,speed())}
  function start(){
    reset();running=true;$("pause").textContent="Pause";$("ov").classList.add("hide");restart();
  }
  function over(won,customTitle,customText){
    clearInterval(loop);running=false;paused=false;
    if(score>best){best=score;$("best").textContent=best;try{localStorage.setItem("snake-best",String(best))}catch(e){}}
    if(score>0){top.push(score);top.sort(function(a,b){return b-a});top=top.slice(0,5);try{localStorage.setItem("snake-top",JSON.stringify(top))}catch(e){}renderTop()}
    $("ovTitle").textContent=customTitle||(won?"You filled the board":"Game over");$("ovText").textContent=customText||("You scored "+score+". Best score: "+best+".");$("go").textContent="Play again";$("ov").classList.remove("hide");draw();
    if(firebaseAuth.currentUser&&score>0){var playerRef=doc(firebaseDb,"players",firebaseAuth.currentUser.uid);setDoc(playerRef,{lastScore:score,bestScore:Math.max(score,best),lastPlayed:serverTimestamp()},{merge:true}).catch(function(){})}
  }
  function turn(name){var v=V[name];if(!v||!running)return;if(v[0]===-dir[0]&&v[1]===-dir[1])return;next=v}
  document.addEventListener("keydown",function(e){var m={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right"}[e.key];if(m){e.preventDefault();turn(m)}else if(e.key=== "p"||e.key=== "P"||(e.key=== " "&&running)){e.preventDefault();togglePause()}else if((e.key=== " "||e.key=== "Enter")&&!running&&document.activeElement.tagName!== "BUTTON")start()});
  Array.prototype.forEach.call(document.querySelectorAll(".dpad button"),function(b){b.addEventListener("click",function(){turn(b.getAttribute("data-d"))})});
  var sx=0,sy=0;
  cv.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  cv.addEventListener("touchend",function(e){var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;turn(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"))},{passive:true});
  $("rockBtn").addEventListener("click",function(){rocksOn=!rocksOn;this.setAttribute("aria-pressed",String(rocksOn));this.textContent=rocksOn?"Rocks: on":"Rocks: off"});
  $("wrapBtn").addEventListener("click",function(){wrap=!wrap;this.setAttribute("aria-pressed",String(wrap));this.textContent=wrap?"Walls: wrap":"Walls: solid"});
  var sws=document.querySelectorAll("#skins button");Array.prototype.forEach.call(sws,function(b){b.addEventListener("click",function(){skin=SKINS[+b.getAttribute("data-k")];Array.prototype.forEach.call(sws,function(x){x.setAttribute("aria-pressed",String(x===b))});draw()})});
  $("pause").addEventListener("click",togglePause);
  var dbs=document.querySelectorAll("#diff button");Array.prototype.forEach.call(dbs,function(b){b.addEventListener("click",function(){level=b.getAttribute("data-s");Array.prototype.forEach.call(dbs,function(x){x.setAttribute("aria-pressed",String(x===b))})})});
  $("go").addEventListener("click",start);

  var authMode="login";
  function nameToEmail(name){return name.trim().toLowerCase().replace(/[^a-z0-9]/g,"-")+"@cricketclash.local"}
  function showGame(username){$("loginScreen").classList.add("hidden");$("gameApp").classList.remove("hidden");if(username)$("ovText").textContent="Welcome, "+username+"! Eat the glowing friend photos to grow."}
  function showLogin(){running=false;if(loop)clearInterval(loop);$("loginScreen").classList.remove("hidden");$("gameApp").classList.remove("hidden");$("loginError").textContent=""}
  $("authSwitch").addEventListener("click",function(){authMode=authMode=== "login"?"create":"login";$("loginButton").textContent=authMode=== "login"?"Log in":"Create account";$("password").autocomplete=authMode=== "login"?"current-password":"new-password";this.textContent=authMode=== "login"?"New player? Create an account":"Already have an account? Log in";$("loginError").textContent=""});
  $("loginForm").addEventListener("submit",async function(e){e.preventDefault();var name=$("username").value.trim(),password=$("password").value;if(name.length<2||password.length<4){$("loginError").textContent="Use a name with 2+ characters and a password with 4+ characters.";return}var email=nameToEmail(name);try{var credential;if(authMode=== "create")credential=await createUserWithEmailAndPassword(firebaseAuth,email,password);else credential=await signInWithEmailAndPassword(firebaseAuth,email,password);await setDoc(doc(firebaseDb,"players",credential.user.uid),{name:name,email:email,lastLogin:serverTimestamp()},{merge:true});$("password").value="";showGame(name)}catch(error){$("loginError").textContent=error.code=== "auth/email-already-in-use"?"That name already exists. Please log in.":"Name or password is incorrect."}});
  $("logout").addEventListener("click",async function(){await signOut(firebaseAuth).catch(function(){})});

  reset();
  onAuthStateChanged(firebaseAuth,function(user){if(user){showGame(user.email?user.email.split("@")[0].replace(/-/g," "):"Player")}else{showLogin()}});
})();
