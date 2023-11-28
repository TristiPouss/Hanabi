"use strict"

document.addEventListener("DOMContentLoaded", function() {

    const socket = io.connect();

    // Variables
    let id = null;
    let lobby = null;
    let userArray = [];
    let lobbyArray = [];

    const username = document.getElementById("pseudo");
    const lobbyName = document.getElementById("lobbyName");

    const btnConnecter = document.getElementById("btnConnecter");
    const btnCreer = document.getElementById("btnCreer");
    const btnQuitter = document.getElementById("btnQuitter");
    let btnCommencer = document.getElementById("btnCommencer");
    btnCommencer.setAttribute('disabled',true);
    btnCommencer.setAttribute("style","display:none");

    const loginPage = document.getElementById("radio1");
    const lobbyListPage = document.getElementById("radio2");
    const lobbyPage = document.getElementById("radio3");

    const lobbyList = document.getElementById("lobbyList").querySelector("ul");
    const lobbyLog = document.getElementById("content").querySelector("aside");

    const card_width = 100;
    const card_height = 140;

    resetHTML();
    goToLogin();

    // Reset
    socket.on("reset", function (){
        reset();
        goToLogin();
    });

    // Login
    btnConnecter.addEventListener("click", function(e){
        let u = checkUsername(preventInjection(username.value.trim()));
        if(u != null && u != ""){
            // Connexion
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

    // Lobby list receive
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

    btnCreer.addEventListener("click", function() {
        let name = checkLobbyName(preventInjection(lobbyName.value.trim()));
        if(name != null && name != ""){
            socket.emit("createLobby", name);
            lobby = name;
            goToLobby();
            btnCommencer.removeAttribute('disabled');
            btnCommencer.setAttribute("style","display:block");
        }else{
            alert("Le nom du lobby n'est pas valide.\nIl ne doit pas contenir de caractère spécial ou d'espace.");
        }
        lobbyName.value = "";
    });

    function disconnectLobby() {
        socket.emit("disconnectLobby", lobby);
        lobby = null;
        lobbyName.value = "";
        goToLobbyList();
    }

    btnQuitter.addEventListener("click", disconnectLobby);
    socket.on("closingLobby", disconnectLobby);


    btnCommencer.addEventListener("click",function(cc){
        socket.emit("launchGame",{idEmit:id,lobbyName:lobby});
    });

    socket.on("launchGame",function(e){
        console.log(JSON.parse(e));
        
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
        username.focus();
        loginPage.checked = true;
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


    /* */
}); // End