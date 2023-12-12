"use strict"


document.addEventListener("DOMContentLoaded", function() {

    const socket = io.connect();
    
    /**********************************************
     *                                            *
     *             Global Variables               *
     *                                            *
     * ********************************************/

    let id = null;
    let lobby = null;
    let isOwner = false;
    let userArray = [];
    let lobbyArray = [];

    const username = document.getElementById("pseudo");
    const lobbyName = document.getElementById("lobbyName");
    const wrongAction = document.getElementById("wrongAction");

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

    const namePlayer1 = document.getElementById("otherPlayer1Name");
    const namePlayer2 = document.getElementById("otherPlayer2Name");
    const namePlayer3 = document.getElementById("otherPlayer3Name");

    const card_width = 100;
    const card_height = 140;

    let selectedCard = null;

    let actionHint;

    //using the popup-js library to create a popup for the hint action
    const popup = new Popup({
        id: "override",
        title: "Donner un indice",
        content: `Choisissez l'information de la carte sélectionnée à indiquer :,
        {btn-value-hint}[Valeur]{btn-color-hint}[Couleur]`,
        sideMargin: "1.5em",
        fontSizeMultiplier: "1.2",
        backgroundColor: "white",
        allowClose: true,
        css: `
        .popup.override .custom-space-out {
            display: flex;
            font-family: "Hanami";
            justify-content: center;
            gap: 1.5em;
        }`,
        loadCallback: () => {
            /* button functionality */
            document.querySelector("button.value-hint").onclick =
                () => {
                    popup.hide();
                    let popupNode = document.getElementsByClassName("popup")[0];
                    popupNode.style.display="none";
                    actionHint = "value";
                    // user wants to use local data
                    giveHint();
                };
            document.querySelector("button.color-hint").onclick =
                () => {
                    popup.hide();
                    let popupNode = document.getElementsByClassName("popup")[0];
                    popupNode.style.display="none";
                    actionHint = "color";
                    // user wants to use cloud data
                    giveHint();
                };
        },
    });


    /************************************************
     *                                             *
     *              Socket Events                  *
     *                                             *
     * *********************************************/

    // Reset
    socket.on("reset", function (){
        reset();
        if(!loginPage.checked){
            goToLogin();
        }
        username.focus();
    });

    // Lobby list reception
    socket.on("listLobby", function(l){
        if(id != null && lobby == null){
            lobbyArray = JSON.parse(l);
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

    socket.on("playerList", function(data){
        if(id != null){
            userArray = JSON.parse(data);
            let playerString = "Joueurs : ";
            for(let i = 0; i < userArray.length; ++i){
                playerString += userArray[i];
                (i != userArray.length-1) ? playerString += ", " : playerString += "";
            }
            document.getElementById("connectedPlayers").innerHTML = playerString;
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
                                (msg.isLobby ? "[LOBBY]" : "[JEU]") +         // Lobby or game info
                                " : " + msg.text +    // Main text
                                "</p>";               // End
        
                // Scroll down automatically
                let history = lobbyLog.getElementsByTagName("p");
                history[history.length-1].scrollIntoView(false);
            }
        }
    });


    // Election of a new owner
    socket.on("newOwner", function(){
        btnCommencer.removeAttribute('disabled');
        btnCommencer.setAttribute("style","display:block");
    });

    // Lobby connection
    socket.on("lobbyConnection", function(data){
        let d = JSON.parse(data);
        lobby = d.lobby;
        isOwner = d.isOwner;
        goToLobby();
    });

    // On game launch response from server - display first hands
    socket.on("launchGame",function(e){ 
        if(isOwner){
            btnCommencer.setAttribute('disabled',true);
            btnCommencer.setAttribute("style","display:none");
        }
        let res = JSON.parse(e);
        
        displayPlayersHands(res.playersCards);
        displayHand(res.nb_card);
        document.querySelector("#nbHints").innerHTML  = "Indices restants : " + res.nb_hints;
    })

    socket.on("updateGame",function(e){
        let res = JSON.parse(e);

        canvasHand.innerHTML = "";
        canvasPlayer1.innerHTML = "";
        canvasPlayer2.innerHTML = "";
        canvasPlayer3.innerHTML = "";
        console.log(res);
        displayPlayersHands(res.playersCards);
        //displayStacks(res.stacks);
        displayHand(res.nb_card);
        document.querySelector("#nbHints").innerHTML  = "Indices restants : " + res.nb_hints;
    });
    
    socket.on("updateHints",function(e){
        let res = JSON.parse(e);
        document.querySelector("#nbHints").innerHTML  = "Indices restants : " + res.nb_hints;
    });

    socket.on("resetGame", function(){
        if(isOwner){
            btnCommencer.removeAttribute('disabled');
            btnCommencer.setAttribute("style","display:block");
        }
        canvasHand.innerHTML = "";
        canvasPlayer1.innerHTML = "";
        canvasPlayer2.innerHTML = "";
        canvasPlayer3.innerHTML = "";
        namePlayer1.innerHTML = "";
        namePlayer2.innerHTML = "";
        namePlayer3.innerHTML = "";
    });

    socket.on("wrongAction", function(res){
        wrongAction.innerHTML = res;
        setTimeout(function(){
            wrongAction.innerHTML = "";
        },5000);

    });
    
    /************************************************
     *                                             *
     *             Event Listeners                 *
     *                                             *
     * *********************************************/

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
            alert("Le pseudo n'est pas valide.\nIl ne doit pas faire plus de 10 caractères de long et ne doit pas contenir de caractère spécial ou d'espace.");
            username.value = "";
        }
    });

    // Create lobby
    btnCreer.addEventListener("click", function() {
        let name = checkLobbyName(preventInjection(lobbyName.value.trim()));
        if(name != null && name != ""){
            socket.emit("createLobby", name);
        }else{
            alert("Le nom du lobby n'est pas valide.\nIl ne doit pas faire plus de 15 caractères de long et ne doit pas contenir de caractère spécial ou d'espace.");
        }
        lobbyName.value = "";
    });

    // Disconnect from lobby
    function disconnectLobby() {
        socket.emit("disconnectLobby", lobby);
        lobby = null;
        lobbyName.value = "";
        userArray = [];
        goToLobbyList();
    }

    // Quit lobby
    btnQuitter.addEventListener("click", disconnectLobby);
    socket.on("closingLobby", disconnectLobby);

    // Start the game
    btnCommencer.addEventListener("click",function(cc){
        socket.emit("launchGame");
    });


    // Play a card with a click on a cardstack with a card selected
    let cardstacks = document.querySelectorAll(".cardstack");
    cardstacks.forEach(stack => {
        stack.addEventListener("click", function(e){
            if(selectedCard != null && selectedCard.parentNode == canvasHand){
                let res = {indexCard: Array.prototype.indexOf.call(canvasHand.children, selectedCard),indexStack: Array.prototype.indexOf.call(cardstacks, e.target)};
                socket.emit("playCard", JSON.stringify(res));
                selectedCard = null;
            }
        });
    });

    // Discard a card with a click on a cardstack with a card selected
    let discard = document.getElementById("btnDefausser");
    discard.addEventListener("click", function(e){
        if(selectedCard != null && selectedCard.parentNode == canvasHand){
            let res = {indexCard: Array.prototype.indexOf.call(canvasHand.children, selectedCard)};
            socket.emit("discard", JSON.stringify(res));
            selectedCard.classList.remove('selectedCard');
            selectedCard = null;
        }
    });

    //Open a popup to give a hint
    let hint = document.getElementById("btnHint");
    hint.addEventListener("click", function(e){
        let popupNode = document.getElementsByClassName("popup")[0];
        popupNode.style.display="block";
        popup.show();
        
    });

    // Send a hint with a click on a cardstack with a card selected
    function giveHint(e){
        if (selectedCard != null && selectedCard.parentNode != canvasHand){
            let hint_value = null;
            if (actionHint == "value"){
                hint_value = selectedCard.getAttribute("value").split(" ")[0];
            } else if (actionHint == "color"){
                hint_value = selectedCard.getAttribute("value").split(" ")[1];   
            }
            let idOwner = selectedCard.parentNode.getAttribute("owner");
            let res = {idPlayer:idOwner, value: hint_value};
            socket.emit("hint", JSON.stringify(res));
            selectedCard.classList.remove('selectedCard');
            selectedCard = null;
        } else {
            alert("Veuillez sélectionner une carte");
        }
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

    // Open the rules in a new tab
    document.getElementById("btnAide").addEventListener("click", function(){
        window.open("https://www.ludicbox.fr/ressources/9088-regle-du-jeu-Hanabi.pdf", "_blank").focus();
    });


    /************************************************
     *                                              *
     *               Misc. Functions                *
     *                                              *
     * *********************************************/
 

    function reset(){
        id = null;
        lobby = null;
        isOwner = false;
        userArray = [];
        lobbyArray = [];
        selectedCard = null;
        resetHTML();
    }

    function resetHTML(){
        username.value = "";
        lobbyName.value = "";
        lobbyLog.innerHTML = "";
        btnConnecter.removeAttribute("disabled");
        username.removeAttribute("disabled");
        
        namePlayer1.innerHTML = "";
        namePlayer2.innerHTML = "";
        namePlayer3.innerHTML = "";
        canvasPlayer1.innerHTML = "";
        canvasPlayer2.innerHTML = "";
        canvasPlayer3.innerHTML = "";

        btnCommencer.setAttribute('disabled',true);
        btnCommencer.setAttribute("style","display:none");
        document.querySelectorAll(".card").forEach(element => {
            element.remove();
        });
    }


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
        if ((str===null) || (str==='') || (str.length > 10)) return null;
        else str = str.toString();
        return (/^[\d\w]+$/g.test(str)) ? str : null;
    }
    function checkLobbyName(str){
        if ((str===null) || (str==='') || (str.length > 15)) return null;
        else str = str.toString();
        return (/^[\d\w\(\)]+$/g.test(str)) ? str : null;
    }
    function preventInjection(str) {
        if ((str===null) || (str==='')) return null;
        else str = str.toString();
        return str.replace(/\</g,"&lt;").replace(/\>/g, "&gt;"); 
    }

    /***************************************************************************************/
    /*                                   Card display                                      */
    /***************************************************************************************/


    function draw_a_firework(ctx,color,sx,sy,maxDist,minDist){
        let nbParticles = 8;
        ctx.lineWidth = 5;
        ctx.lineJoin = "round";
        let dist = Math.random() * (maxDist-minDist) + minDist;
        dist = Math.floor(dist)
        
        let grad;
        let gradMarker = Math.random() * 0.5+0.1;
       
        for (let i = 1; i<nbParticles+1; i++){
          let newX =Math.floor(sx + dist * Math.cos(Math.PI * (i * 45) / 180));
          let newY = Math.floor(sy + dist * Math.sin(Math.PI * (i * 45) / 180));
      
          ctx.beginPath();
      
          ctx.moveTo(sx,sy);
          ctx.lineTo(newX,newY)
          ctx.closePath();
          grad = ctx.createLinearGradient(sx,sy,newX,newY)
          grad.addColorStop(gradMarker,"hsla(0, 0%, 0%, 0)");
          grad.addColorStop(1,color)
          ctx.strokeStyle = grad;
          ctx.stroke();
        }
      }


    function displayCard(card) {
        let cardDiv = document.createElement("canvas");
        cardDiv.setAttribute("class", "card");
        cardDiv.setAttribute("width", card_width);
        cardDiv.setAttribute("height", card_height);
        let ctx = cardDiv.getContext("2d");
        let gradient = ctx.createLinearGradient(0,0,0,card_height)
        gradient.addColorStop(0.21,"rgba(10,14,40,1)");
        gradient.addColorStop(0.91,"rgba(31,70,124,1)")
        gradient.addColorStop(1,"rgba(74,93,130,1)")
        ctx.fillStyle=gradient;
        ctx.fillRect(0,0,card_width,card_height);

        for (let i = 1; i < card.value+1; ++i){
            let sx,sy;
            if (i==1){
                sx = Math.random() * card_width/2;
                sy = Math.random() * card_height/2;
                draw_a_firework(ctx,card.color,sx,sy,30,15);
            }
            if (i==2){
                sx = Math.random() * card_width/2 + card_width/2;
                sy = Math.random() * card_height/2 + card_height/2;
                draw_a_firework(ctx,card.color,sx,sy,30,15);
            }
            if (i==3){
                sx = Math.random() * card_width/2
                sy = Math.random() * card_height/2 + card_height/2;

                draw_a_firework(ctx,card.color,sx,sy,30,15);
            }
            if (i==4){
                sx = Math.random() * card_width/2 + card_width/2;
                sy = Math.random() * card_height/2;
                draw_a_firework(ctx,card.color,sx,sy,30,15);
            }

            if (i==5){
                draw_a_firework(ctx,card.color,card_width/2,card_height/2,30,15);
            }
        }

        ctx.fillStyle = card.color;
        ctx.shadowColor = "black";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.font = "30px Hanami";
        ctx.fillText(card.value, 10, 50);
        cardDiv.setAttribute("value", card.value+" "+card.color);

        cardDiv.addEventListener("click", function(e) {
            if (selectedCard != null){
                selectedCard.classList.remove('selectedCard');
            }
            selectedCard = e.target;
            selectedCard.classList.add('selectedCard');
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
            cardDiv.addEventListener("click", function(e) {
                if (selectedCard != null){
                    selectedCard.classList.remove('selectedCard');
                }
                selectedCard = e.target;
                selectedCard.classList.add('selectedCard');
            });
            return cardDiv;
    }

    function displayStacks(stacks) {
        let stacksDiv = document.querySelectorAll(".cardstack");
        stacks.forEach(function(stack,index){
            stack.forEach(card => {
                if (card!=undefined) stacksDiv[index].appendChild(displayCard(card));
            });
        });
        
    }

    function displayHand(numberCards) {
        for(let i = 0;i<numberCards;i++){
            let cardDiv = displayOwnCards();
            canvasHand.appendChild(cardDiv);
        }
    }

    function displayPlayersHands(hands) {
        
        let littlePlayers = Object.keys(hands);
       
        let nbPlayer = littlePlayers.length;
        switch (nbPlayer) {
            case 3:
                hands[(littlePlayers[0])].forEach(card => {
                    canvasPlayer1.appendChild(displayCard(card));
                });
                canvasPlayer1.setAttribute("owner",littlePlayers[0]);
                namePlayer1.innerHTML = littlePlayers[0];
                hands[littlePlayers[1]].forEach(card => {
                    canvasPlayer2.appendChild(displayCard(card));
                });
                canvasPlayer2.setAttribute("owner",littlePlayers[1]);
                namePlayer2.innerHTML = littlePlayers[1];
                hands[littlePlayers[2]].forEach(card => {
                    canvasPlayer3.appendChild(displayCard(card));
                });
                canvasPlayer3.setAttribute("owner",littlePlayers[2]);
                namePlayer3.innerHTML = littlePlayers[2];
                break;
            case 2:

                hands[littlePlayers[0]].forEach(card => {
                    canvasPlayer2.appendChild(displayCard(card));
                });
                canvasPlayer2.setAttribute("owner",littlePlayers[0]);
                namePlayer2.innerHTML = littlePlayers[0];
                hands[littlePlayers[1]].forEach(card => {
                    canvasPlayer3.appendChild(displayCard(card));
                });
                canvasPlayer3.setAttribute("owner",littlePlayers[1]);
                namePlayer3.innerHTML = littlePlayers[1];
                break;
            case 1:
                hands[littlePlayers[0]].forEach(card => {
                    canvasPlayer1.appendChild(displayCard(card));
                });
                canvasPlayer1.setAttribute("owner",littlePlayers[0]);
                namePlayer1.innerHTML = littlePlayers[0];
                break;
            default:
                console.log("Error : hand length is not in [1,4]");
                break;
        }
    }

}); // End

        
        