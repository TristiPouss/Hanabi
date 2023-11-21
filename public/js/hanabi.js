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

    const loginPage = document.getElementById("radio1");
    const lobbyListPage = document.getElementById("radio2");
    const lobbyPage = document.getElementById("radio3");

    const lobbyList = document.getElementById("lobbyList").querySelector("ul");

    // Login
    btnConnecter.addEventListener("click", function(e){
        e.stopImmediatePropagation();   // A try to solve the problem of the user lagging and clicking
                                        // multiple times on the login button, causing multiple
                                        // connections on the same client

        let u = checkUsername(preventInjection(username.value.trim()));
        if(u != null && u != ""){
            // Connexion
            socket.emit("login", u);
            id = u;
            // sending to main page
            loginPage.checked = false;
            lobbyListPage.checked = true;
        }else{
            alert("Le pseudo n'est pas valide.\nIl ne doit pas contenir de caractère spécial ou d'espace.");
            username.value = "";
        }
    });

    // Welcome
    socket.on("bienvenue", function(id) {
        if(id != null){

        }
    });

    // Lobby list receive
    socket.on("listLobby", function(l){
        if(id != null && lobby == null){
            lobbyArray = JSON.parse(l);
            console.log(lobbyArray);
            lobbyList.innerHTML = ""; // reset
            lobbyArray.forEach(_lobby => {
                let li = document.createNode("<li>"+_lobby.name+" - "+_lobby.littlePlayers.length+"/4</li>");
                li.addEventListener("click", function() {
                    lobby = _lobby.name;
                    socket.emit("connectLobby", lobby);
                    goToLobby();
                });
                lobbyList.appendChild(li);
            });
        }
    });

    btnCreer.addEventListener("click", function() {
        let name = checkLobbyName(preventInjection(lobbyName.value.trim()));
        if(name != null && name != ""){
            socket.emit("createLobby", name);
            lobby = name;
            goToLobby();
        }else{
            alert("Le nom du lobby n'est pas valide.\nIl ne doit pas contenir de caractère spécial ou d'espace.");
            lobbyName.value = "";
        }
    });

    btnQuitter.addEventListener("click", function() {
        socket.emit("disconnectLobby", lobby);
        lobby = null;
        goToLobbyList();
    });

    /*** Misc ***/

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
                console.log(element.className);
                element.setAttribute("class",element.className + " selected");
            });
        }
        document.getElementById("lobby").innerHTML = lobby;
        lobbyPage.checked = true;
    }

    function goToLobbyList(){
        if(loginPage.checked){
            loginPage.checked = false;
        }else if(lobbyPage.checked){
            lobbyPage.checked = false;
            document.querySelectorAll(".hill0,.hill1,.hill2,.hill3,.plain,.moon").forEach(element => {
                console.log(element.className);
                element.setAttribute("class",element.className.substring(0, element.className.length-9));
            });
        }
        lobbyListPage.checked = true;
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
            
        return str.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"); 
    }

}); // End