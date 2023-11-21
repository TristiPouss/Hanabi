"use strict"

document.addEventListener("DOMContentLoaded", function() {

    const socket = io.connect();

    // Variables
    let id = null;
    let usersList = [];
    let lobbyList = [];

    const username = document.getElementById("pseudo");
    const btnConnect = document.getElementById("btnConnecter");

    const loginPage = document.getElementById("radio1");
    const mainPage = document.getElementById("radio2");

    // Login
    btnConnect.addEventListener("click", function(e){
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
            mainPage.checked = true;

            socket.emit("createLobby", "test");
        }else{
            alert("Le pseudo n'est pas valide.\nIl ne doit pas contenir de caractère spécial ou d'espace.");
            username.value = "";
        }
    });

    // Welcome
    socket.on("bienvenue", function(id) {
        if(id != null){
            // Filling title 
        }
    });

    // Users list receive
    socket.on("listClient", function(l){
        if(id != null){

        }
    });

    // Lobby list receive
    socket.on("listLobby", function(l){
        if(id != null){
            lobbyList = l;
            console.log(lobbyList);
        }
    });
});

function checkUsername(str){
    if ((str===null) || (str==='')) 
		return null; 
	else
        str = str.toString();

    return (/^[\d\w]+$/g.test(str)) ? str : null;
}

function preventInjection(str) { 
	if ((str===null) || (str==='')) 
		return null; 
	else
		str = str.toString(); 
		
	return str.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"); 
}