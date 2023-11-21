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


    // Users List Receive
    socket.on("liste", function(l){
        if(id != null){

        }
    });

    document.getElementById("btnConnecter").addEventListener("click", function() {
        // TODO
        document.getElementById("radio1").checked = false;
        document.getElementById("radio2").checked = true;
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