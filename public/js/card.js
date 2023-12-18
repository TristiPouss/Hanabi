
"use strict";


class Card {
    value;
    color;
    constructor(value, color) {
        this.value = value;
        this.color = color;
    }

    get_value() {
        return this.value;
    }

    get_color() {
        return this.color;
    }

    set_value(value) {
        this.value = value;
    }

    set_color(color) {
        this.color = color;
    }
}

class Deck {
    static colors = ["red", "blue", "green", "yellow", "white"];
    static values = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];
    constructor() {
        this.reset();
        this.shuffle();
    }

    reset(){
        this.cards = new Array();
        Deck.colors.forEach(color => {
            Deck.values.forEach(value => {
                this.cards.push(new Card(value, color));
            });
        });
    }


    //Implementation of the Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
    shuffle() {
        let curr = this.cards.length;
        let rand;
        // While there remain elements to shuffle.
        while (curr > 0) {
          // Pick a remaining element.
          rand = Math.floor(Math.random() * curr);
          curr--;
          // And swap it with the current element.
          [this.cards[curr], this.cards[rand]] = [
            this.cards[rand], this.cards[curr]];
        }
    }
}

class Game{
    constructor(players_list){
        this.deck = new Deck();
        this.masters_players = [];
        players_list.forEach(player => {
           this.masters_players.push(player);
        });
        this.hands = {};
        this.stacks = [];
        for (let i = 0; i < 5; ++i){
            this.stacks.push(new Array());
        }
        this.discard = new Array();
        this.hints = 8;
        this.fails= 0;
        this.round = 0;
        this.deal();
        this.lastTurn = false;
        this.lastPlayer = null;
    }

    deal(){
        let nb_cards = (this.masters_players.length > 3) ? 4 : 5;
       this.masters_players.forEach(player => {
            this.hands[player] = new Array();
            for(let i = 0; i < nb_cards; ++i){
                this.hands[player].push(this.deck.cards.pop());
            }
        });
    }

    give_information(player, info){
        if(this.hints > 0){
            let hintsValues = [];
            let cards = this.hands[player];
            for (let i = 0; i < cards.length; ++i){
                if (cards[i].get_color() == info || cards[i].get_value() == info){
                    hintsValues.push(i+1);
                }
            }
            this.hints--;
            this.round++;
            return hintsValues;
        }
        return false;
    }

    discard_card(player, indexCard){
        if (this.hints < 8){
            let card = this.hands[player][indexCard];
            this.discard.push(card);
            this.hands[player].splice(indexCard, 1);
            this.deal_card(player);
            this.hints++;
            this.round++;
            return true;
        } else {
            return false;
        }
    }

    deal_card(player){
        if (this.deck.cards.length > 0){
            this.hands[player].push(this.deck.cards.pop());
        }
        if (this.deck.cards.length == 0){
            this.lastTurn = true;
        }
    }

    play_card(player, indexCard,indexStack){

        let card = this.hands[player][indexCard];
        let stackSelected = this.stacks[indexStack];
        console.log(card);
        let isAGoodCard = true;
        if (stackSelected.length == 0 && card.get_value() == 1){
            this.stacks.forEach(stack => {
                if (stack.length == 0){
                    return;
                }
                let stackColor = stack[0].get_color();
                if (stackColor == card.get_color() && stack != stackSelected){
                    isAGoodCard = false;
                }});
        } else {
            if (card.get_value() != (stackSelected.length+1) || card.get_color() != stackSelected[0].get_color()){
                console.log("pas la bonne carte");
                isAGoodCard = false;
            }
        }
        if (isAGoodCard){
            this.stacks[indexStack].push(card);
        } else {
            this.fails++;
            this.discard.push(card);
        }
        this.hands[player].splice(indexCard, 1);
        this.deal_card(player);
        this.round++;
        return isAGoodCard;
    }

    endGame(player){
        //3 fails or all stacks are full
        if (this.fails >= 3){
            return true;
        }

        //Turn of the player who picked the last card
        if (this.deck.cards.length == 0 && player == this.lastPlayer){
            return true;
        }
        if (this.lastTurn){
            this.lastPlayer = player;
        }

        //check if all stacks are full
        for (let i = 0; i < 5; ++i){
            if (this.stacks[i].length != 5){
                return false;
            }
        }
        return true;
    }

    processScore(){
        let score = 0;
        this.stacks.forEach(stack => {
            if (stack.length == 0){
                return;
            }
            score += stack[stack.length-1].get_value();
        });
        return score;
    }

    nextPlayer(player){
        let index = this.masters_players.indexOf(player);
        if (index == this.masters_players.length-1){
            return this.masters_players[0];
        } else {
            return this.masters_players[index+1];
        }
    }

    bot_play(player){
        let cards = this.hands[player];
        let played = false;

        cards.forEach(function (card,index){
            if (!played){
                console.log(this)
                let stackSelected;
                if (card.get_value() == 1){
                    this.stacks.forEach(stack => {
                        if (stack.length == 1 && stack[0].get_color() == card.get_color()){
                            stackSelected = stack;
                        }
                    });
                    if (stackSelected == undefined){
                        this.stacks.forEach(stack => {
                            if (stack.length == 0){
                                stackSelected = stack;
                            };
                        });
                        this.play_card(player, index, this.stacks.indexOf(stackSelected));
                        played = true;
                    }
                } else {
                    this.stacks.forEach(stack => {
                        if (stack.length != 0){
                           if (stack[0].get_color() == card.get_color() && stack.length+1 == card.get_value()){
                               stackSelected = stack;
                           }
                        };
                    });
                    if (stackSelected != undefined){
                        this.play_card(player, index, this.stacks.indexOf(stackSelected));
                        played = true;
                    }
                }
            }
        },this);

        if(played){
            return 'play';
        }

        if (this.hints > 0){
            played = true;
            return 'hint'
        }

        if (this.hints < 8 && !played){
            let index = Math.floor(Math.random() * cards.length);
            this.discard_card(player, index);
            played = true;
            return 'discard'
        }
    }
}
module.exports = {Card, Deck, Game};
