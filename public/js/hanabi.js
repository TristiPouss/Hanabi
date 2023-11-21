"use strict"

document.addEventListener("DOMContentLoaded", function() {

    const socket = io.connect();

    // Users List Receive
    socket.on("liste", function(l){
        if(id != null){
            connectedUsers.innerHTML = ""; // reset
            usersList = l;
            usersList.forEach(user => {
                connectedUsers.innerHTML += "<span>"+user+"</span><br>"
            });
        }
    });

    document.getElementById("btnConnecter").addEventListener("click", function() {
        // TODO
        document.getElementById("radio1").checked = false;
        document.getElementById("radio2").checked = true;
    });
});