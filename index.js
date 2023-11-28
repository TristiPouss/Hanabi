// Chargement des modules
const express = require('express');
const game = require('./public/js/card.js');
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
class Lobby {
    name;
    creator;
    littlePlayers;
    game;
    constructor(n, id){
        this.name = n;
        this.creator = id;
        this.littlePlayers = [id];
        lobbyArray.push(this);
    }

    addPlayer(n){
        return this.littlePlayers.push(n);
    }

    rmPlayer(n){
        for(let i = 0; i < this.littlePlayers.length; ++i){
            if(this.littlePlayers[i] == n){
                delete this.littlePlayers[i];
                return true;
            }
        }
        return false;
    }
    launchGame(){
        this.game = new Game(this.littlePlayers);
    }
}

function seekLobby(name){
    let res = null;
    lobbyArray.forEach(lobby => {
        if(lobby.name == name){
            res = lobby;
        }
    });
    return res;
}

function checkLobby(){
    lobbyArray.forEach(l => {
        if(l.littlePlayers.length == 0){
            const index = lobbyArray.indexOf(l);
            if (index > -1) { // only splice array when item is found
                lobbyArray.splice(index, 1); // 2nd parameter means remove one item only
            }
            console.log("Suppresion du lobby :" + l.name);
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
        let l = new Lobby(name, currentID);
        console.log("Nouveau lobby : " + name);
        // envoi de la nouvelle liste de lobby à tous les clients connectés
        io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
    });

    socket.on("connectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            lobby.addPlayer(currentID);
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else{console.log("Erreur dans la recherche du lobby.");}
    });

    /**
     *  Gestion des déconnexions
     */

    // Déconnexion du lobby
    socket.on("disconnectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            if(lobby.creator == currentID){ // Si l'utilisateur était l'hôte, on ferme le lobby
                lobby.littlePlayers.forEach(player => {
                    Object.keys(clients).forEach(client => {
                        if(client != currentID && player == client){
                            clients[client].emit("closingLobby"); // Force les utilisateurs présents dans le lobby a le quitter 
                        }
                    })
                });
            }
            //
            const index = lobby.littlePlayers.indexOf(currentID);
            if (index > -1) { // only splice array when item is found
            lobby.littlePlayers.splice(index, 1); // 2nd parameter means remove one item only
            }
            checkLobby(); // supprime le lobby si il est vide
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else{console.log("Erreur dans la recherche du lobby.");}
    });

    // fermeture
    socket.on("logout", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // suppression de l'entrée
            delete clients[currentID];
            // déconnexion du lobby 
            disconnectFromLobby(currentID);
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
    });

    // déconnexion de la socket
    socket.on("disconnect", function(reason) {
        // si client était identifié
        if (currentID) {
            delete clients[currentID];
            disconnectFromLobby(currentID);
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
        console.log("Client déconnecté");
    });

    /*** Misc ***/

    function disconnectFromLobby(id){
        lobbyArray.forEach(lobby => {
            lobby.rmPlayer(id);
        })
    }

});