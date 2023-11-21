"use strict"

document.addEventListener("DOMContentLoaded", function() {

    const socket = io.connect();
    let id = null;

    /**
     *  Connexion de l'utilisateur au jeu -> Selection des lobbys.
     */
    function connect() {
        console.log(sock);
        // recupération du pseudo
        var user = document.getElementById("pseudo").value.trim();
        if (! user) return;
        document.getElementById("radio2").check = true;
        currentUser = user;
        sock.emit("login", user);
    }

    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
        function quitter() {
            currentUser = null;
            sock.emit("logout");
            document.getElementById("radio1").checked = true;
        };


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

        }
    });

    // Lobby list receive
    socket.on("listLobby", function(l){
        if(id != null){
            lobbyList = l;
            console.log(lobbyList);
        }
    });
    document.getElementById("btnCreer").addEventListener("click", function() {
        // TODO
        document.getElementById("radio2").checked = false;
        document.getElementById("radio3").checked = true;
        document.querySelectorAll(".hill0,.hill1,.hill2,.hill3,.plain,.moon").forEach(element => {
            console.log(element.className);
            element.setAttribute("class",element.className + " selected");
        });
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