"use strict"


document.addEventListener("DOMContentLoaded", function() {

    const socket = io.connect();

    // Variables
    let id = null;
    let lobby = null;
    let isOwner = false;
    let userArray = [];
    let lobbyArray = [];

    const username = document.getElementById("pseudo");
    const lobbyName = document.getElementById("lobbyName");

    const btnConnecter = document.getElementById("btnConnecter");
    const btnCreer = document.getElementById("btnCreer");
    const btnQuitter = document.getElementById("btnQuitter");
    let btnCommencer = document.getElementById("btnCommencer");

    const loginPage = document.getElementById("radio1");
    const lobbyListPage = document.getElementById("radio2");
    const lobbyPage = document.getElementById("radio3");

    const lobbyList = document.getElementById("lobbyList").querySelector("ul");
    const lobbyLog = document.getElementById("content").querySelector("aside");

    const canvasHand = document.getElementById("myCards");
    const canvasPlayer1 = document.getElementById("otherPlayer1");
    const canvasPlayer2 = document.getElementById("otherPlayer2");
    const canvasPlayer3 = document.getElementById("otherPlayer3");

    const card_width = 100;
    const card_height = 140;

    let valueSelected = null;

    /*resetHTML();
    if(!loginPage.checked){
        goToLogin();
    }
    username.focus();*/

    // Reset
    socket.on("reset", function (){
        reset();
        if(!loginPage.checked){
            goToLogin();
        }
        username.focus();
    });

    // Login
    btnConnecter.addEventListener("click", function(e){
        let u = checkUsername(preventInjection(username.value.trim()));
        if(u != null && u != ""){
            // Connection
            socket.emit("login", u);
            id = u;
            // sending to main page
            btnConnecter.setAttribute("disabled", true);
            loginPage.checked = false;
            lobbyListPage.checked = true;
        }else{
            alert("Le pseudo n'est pas valide.\nIl ne doit pas contenir de caractère spécial ou d'espace.");
            username.value = "";
        }
    });

    // Lobby list reception
    socket.on("listLobby", function(l){
        if(id != null && lobby == null){
            lobbyArray = JSON.parse(l);
            console.log(lobbyArray);
            lobbyList.innerHTML = ""; // reset
            let curr = null;
            lobbyArray.forEach(_lobby => {
                let li = document.createElement("li");
                li.innerHTML = _lobby.name+" - "+_lobby.littlePlayers.length+"/4";
                lobbyList.appendChild(li);
                if(_lobby.littlePlayers.length < 4){
                    li.addEventListener("click", function() {
                        lobby = _lobby.name;
                        socket.emit("connectLobby", lobby);
                        goToLobby();
                    });
                }
            });
        }
    });

    // Log message reception
    socket.on("log", function (log) {
        if(id != null && lobby != null){
            let msg = JSON.parse(log);
            if(id != null){
                let d = new Date(msg.date);
                const time = d.toLocaleTimeString();
                let color = "";
                if(msg.isLobby == true){
                    color = "class='lobby'";
                }else{
                    color = "class='game'";
                }
                // Add message to the chat log
                lobbyLog.innerHTML += "<p "+color+">" +   // Start + Color
                                time + " - " +        // Timestamp
                                (msg.isLobby ? "[lobby]" : "[game]") +         // Lobby or game info
                                " : " + msg.text +    // Main text
                                "</p>";               // End
        
                // Scroll down automatically
                let history = lobbyLog.getElementsByTagName("p");
                history[history.length-1].scrollIntoView(false);
            }
        }else console.log("Cdt pour recevoir le message non remplies");
    });

    socket.on("newOwner", function(){
        btnCommencer.removeAttribute('disabled');
        btnCommencer.setAttribute("style","display:block");
    });

    socket.on("lobbyConnection", function(data){
        let d = JSON.parse(data);
        lobby = d.lobby;
        isOwner = d.isOwner;
        goToLobby();
    });

    // Create lobby
    btnCreer.addEventListener("click", function() {
        let name = checkLobbyName(preventInjection(lobbyName.value.trim()));
        if(name != null && name != ""){
            socket.emit("createLobby", name);
        }else{
            alert("Le nom du lobby n'est pas valide.\nIl ne doit pas contenir de caractère spécial ou d'espace.");
        }
        lobbyName.value = "";
    });

    // Disconnect from lobby
    function disconnectLobby() {
        socket.emit("disconnectLobby", lobby);
        lobby = null;
        lobbyName.value = "";
        goToLobbyList();
    }
    btnQuitter.addEventListener("click", disconnectLobby);
    socket.on("closingLobby", disconnectLobby);

    // Start the game
    btnCommencer.addEventListener("click",function(cc){
        socket.emit("launchGame",{idEmit:id,lobbyName:lobby});
        console.log(lobby);
    });

    socket.on("launchGame",function(e){
        let res = JSON.parse(e);
        displayPlayersHands(res.playersCards);
        displayHand(res.nb_card);
        
    })

    /*** Misc ***/

    function reset(){
        id = null;
        lobby = null;
        userArray = [];
        lobbyArray = [];
        resetHTML();
    }

    function resetHTML(){
        username.value = "";
        lobbyName.value = "";
        lobbyLog.innerHTML = "";
        btnConnecter.removeAttribute("disabled");
        username.removeAttribute("disabled");
        btnCommencer.setAttribute('disabled',true);
        btnCommencer.setAttribute("style","display:none");
        document.querySelectorAll(".card").forEach(element => {
            element.remove();
        });
        console.log("resetHTML");
    }

    document.addEventListener("keypress", function(e){
        if(e.key == "Enter"){
            if(loginPage.checked){
                btnConnecter.click();
            }else if(lobbyListPage){
                btnCreer.click();
            }
        }
    })

    document.getElementById("btnAide").addEventListener("click", function(){
        window.open("https://www.ludicbox.fr/ressources/9088-regle-du-jeu-Hanabi.pdf", "_blank").focus();
    });


    function goToLobby(){
        if(loginPage.checked){
            loginPage.checked = false;
        }else if(lobbyListPage.checked){
            lobbyListPage.checked = false;
            document.querySelectorAll(".hill0,.hill1,.hill2,.hill3,.plain,.moon").forEach(element => {
                element.setAttribute("class",element.className + " selected");
            });
        }
        resetHTML();
        document.getElementById("lobby").innerHTML = lobby;
        if(isOwner){
            btnCommencer.removeAttribute('disabled');
            btnCommencer.setAttribute("style","display:block");
        }
        lobbyPage.checked = true;
    }

    function goToLobbyList(){
        if(loginPage.checked){
            loginPage.checked = false;
        }else if(lobbyPage.checked){
            lobbyPage.checked = false;
            document.querySelectorAll(".hill0,.hill1,.hill2,.hill3,.plain,.moon").forEach(element => {
                element.classList.remove('selected');
            });
        }
        resetHTML();
        lobbyName.focus();
        lobbyListPage.checked = true;
    }

    function goToLogin(){
        if(lobbyList.checked){
            lobbyList.checked = false;
        }else if(lobbyPage.checked){
            lobbyPage.checked = false;
            document.querySelectorAll(".hill0,.hill1,.hill2,.hill3,.plain,.moon").forEach(element => {
                element.classList.remove('selected');
            });
        }
        resetHTML();
        loginPage.checked = true;
        username.focus();
    }

    function checkUsername(str){
        if ((str===null) || (str===''))
            return null;
        else
            str = str.toString();
        return (/^[\d\w]+$/g.test(str)) ? str : null;
    }
    function checkLobbyName(str){
        if ((str===null) || (str===''))
            return null;
        else
            str = str.toString();
        return (/^[\d\w\(\)]+$/g.test(str)) ? str : null;
    }
    function preventInjection(str) {
        if ((str===null) || (str===''))
            return null;
        else
            str = str.toString();

        return str.replace(/\</g,"&lt;").replace(/\>/g, "&gt;"); 
    }


    /* Card display */
    function displayCard(card) {
        let cardDiv = document.createElement("canvas");
        cardDiv.setAttribute("class", "card");
        cardDiv.setAttribute("width", card_width);
        cardDiv.setAttribute("height", card_height);
        let ctx = cardDiv.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, card_width, card_height);
        ctx.fillStyle = card.color;
        ctx.font = "30px Hanami";
        ctx.fillText(card.value, 10, 50);


        cardDiv.setAttribute("value", card.value+" "+card.color);

        cardDiv.addEventListener("click", function(e) {
            valueSelected = e.target;
            console.log("(click on " + valueSelected.getAttribute("value")  + " card)");
        }
        );

        return cardDiv;
    }

function displayOwnCards(){
    let cardDiv = document.createElement("canvas");
        cardDiv.setAttribute("class", "card");
        cardDiv.setAttribute("width", card_width);
        cardDiv.setAttribute("height", card_height);
        let ctx = cardDiv.getContext("2d");
        ctx.fillStyle = "grey";
        ctx.fillRect(0, 0, card_width, card_height);       

        return cardDiv;
}

    function displayStacks(stacks) {
        let stacksDiv = document.querySelectorAll(".cardstack");
        stacks.forEach(function(stack,index){
            stack.forEach(card => {
                stackDiv[index].appendChild(displayCard(card));
            });
        });
        
    }

    function displayHand(numberCards) {
        for(let i = 0;i<numberCards;i++){
            let cardDiv = displayOwnCards();
            cardDiv.addEventListener("click", function(e) {
                valueSelected = e.target;
                console.log("(click on " + valueSelected  + " card)");
            });
            canvasHand.appendChild(cardDiv);
        }
    }

    function displayPlayersHands(hands) {
        let littlePlayers = Object.keys(hands);
        console.log(littlePlayers);
        let nbPlayer = littlePlayers.length;
        switch (nbPlayer) {
            case 3:
                hands[littlePlayers[0]].forEach(card => {
                    canvasPlayer1.appendChild(displayCard(card));
                });
                hands[littlePlayers[1]].forEach(card => {
                    canvasPlayer2.appendChild(displayCard(card));
                });
                hands[littlePlayers[2]].forEach(card => {
                    canvasPlayer3.appendChild(displayCard(card));
                });
                break;
            case 2:
                hands[littlePlayers[0]].forEach(card => {
                    canvasPlayer2.appendChild(displayCard(card));
                });
                hands[littlePlayers[1]].forEach(card => {
                    canvasPlayer3.appendChild(displayCard(card));
                });
                break;
            case 1:
                hands[littlePlayers[0]].forEach(card => {
                    canvasPlayer1.appendChild(displayCard(card));
                });
                break;
            default:
                console.log("Error : hand length is not in [1,4]");
                break;
        }
    }

    class Particle {

        static gravity = 0.05;
        
        constructor() {
            this.w = this.h = Math.random()*4+1;
            
            this.x = xPoint-this.w/2; // x coordinate
            this.y = yPoint-this.h/2;
            this.vx = (Math.random()-0.5)*10;
            this.vy = (Math.random()-0.5)*10;
            this.alpha = Math.random()*.5+.5;
            this.color = color ;
        } 
    
        move() {
            this.x += this.vx;
            this.vy += this.gravity;
            this.y += this.vy;
            this.alpha -= 0.01;
            if (this.x <= -this.w || this.x >= screen.width ||
                this.y >= screen.height ||
                this.alpha <= 0) {
                    return false;
            }
            return true;
        }

        draw(c) {
            c.save();
            c.beginPath();
            
            c.translate(this.x+this.w/2, this.y+this.h/2);
            c.arc(0, 0, this.w, 0, Math.PI*2);
            c.fillStyle = this.color;
            c.globalAlpha = this.alpha;
            
            c.closePath();
            c.fill();
            c.restore();
        }
    }

    function updateCard(color) {
        if (particles.length < 500 && Math.random() < probability) {
            createFirework(color);
        }
        var alive = [];
        for (var i=0; i<particles.length; i++) {
            if (particles[i].move()) {
                alive.push(particles[i]);
            }
        }
        particles = alive;
    }

    function paintCard(ctx) {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        for (var i=0; i<particles.length; i++) {
            particles[i].draw(ctx);
        }
    } 

    function createFirework(color) {
        xPoint = Math.random()*(w-200)+100;
        yPoint = Math.random()*(h-200)+100;
        var nFire = Math.random()*50+100;
        for (let i=0; i<nFire; i++) {
            var particle = new Particle(color);

            var vy = Math.sqrt(25-particle.vx*particle.vx);
            if (Math.abs(particle.vy) > vy) {
                particle.vy = particle.vy>0 ? vy: -vy;
            }
            particles.push(particle);
        }
    } 


function draw_a_firework(ctx,color){
    let nbParticles = Math.random() * 100;
    let center = {x:Math.random() * canvas.width, y:Math.random() * canvas.height};
    for (let i = 0; i<nbParticles; i++){
        ctx.beginPath();
        let vx = Math.random() * 10 - 5;
        let vy = Math.random() * 10 - 5;
        ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.closePath();
        ctx.stroke();
    }
  }  
//Firework animation - inspired from https://codepen.io/judag/pen/XmXMOL

}); // End

        
        