// Chargement des modules
const express = require('express');
const app = express();
const server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
const { Server } = require("socket.io");
const io = new Server(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/hanabi.html');
});

/*** Gestion des lobbys ***/

let lobbyArray = [];

function seekLobby(name){
    lobbyArray.forEach(lobby => {
        if(lobby.name == name){
            return lobbyArray[lobby];
        }
    });
    return null;
}

function checkLobby(){
    lobbyArray.forEach(l => {
        if(l.littlePlayers.length == 0){
            delete lobbyArray[l];
        }
    });
}

/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {

    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        while (clients[id]) {
            id = id + "(1)";
        }
        currentID = id;
        clients[currentID] = socket;
        console.log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        socket.emit("bienvenue", id);
        // envoi de la nouvelle liste à tous les clients connectés
        io.sockets.emit("listClient", Object.keys(clients));
        // envoi de la liste de lobby à ce client
        socket.emit("listLobby", JSON.stringify(lobbyArray));
    });

    /**
     * Creation de lobby
     */
    socket.on("createLobby", function(name){
        while(seekLobby(name) != null){
            name = name + "(1)";
        }
        let l = {"name": name, "creator": currentID, "littlePlayers":[currentID]};
        lobbyArray.push(l);
        // envoi de la nouvelle liste de lobby à tous les clients connectés
        io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
    });

    socket.on("connectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            lobby.littlePlayers.push(currentID);
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else{console.log("FF");}
    });

    socket.on("disconnectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            for(let i = 0; i<lobby.littlePlayers.length; ++i){
                if(lobby.littlePlayers[i] == currentID){
                    delete lobby.littlePlayers[i];
                    break;
                }
            }
            checkLobby();
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else{console.log("FF");}
    });

    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logout", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
    });

    // déconnexion de la socket
    socket.on("disconnect", function(reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
        console.log("Client déconnecté");
    });

});