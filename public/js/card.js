
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
        this.masters_players = players_list;
        this.hands = {};
        this.stacks = [new Array(5), new Array(5), new Array(5), new Array(5), new Array(5)];
        this.discard = new Array();
        this.hints = 8;
        this.fails= 0;
        this.deal();
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
                    hintsValues.push(i);
                }
            }
            this.hints--;
            return hintsValues;
        }
        return false;
    }

    discard_card(player, indexCard){
        let card = this.hands[player][indexCard];
        this.discard.push(card);
        this.hands[player].splice(this.hands[player].indexOf(card), 1);
        this.hands[player].push(this.deck.cards.pop());
        if (this.hints < 8){
            this.hints++;
        }
    }

    play_card(player, indexCard,indexStack){

        let stack = this.stacks[indexStack];
        let card = this.hands[player][indexCard];
        /* for (let i = 0; i < this.stacks.length; ++i){
            if (this.stacks[i][0] != undefined && this.stacks[i][0].get_color() == card.get_color()){
                stack = this.stacks[i];
                break;
            }
            if (this.stacks[i][0] == undefined){
                stack = this.stacks[i];
                break;
            }
        } */
        if (stack[0] == undefined && card.get_value() != 1){
            this.discard_card(player, card);
            this.fails++;
            return false;
        }

        if (stack[0] != undefined && card.get_color() != stack[0].get_color()){
            this.discard_card(player, card);
            this.fails++;
            return false;
        }

        for (let i = 0; i < card.get_value()-1; ++i){
            if (stack[i] == undefined){
                this.discard_card(player, card);
                this.fails++;
                return false;
            }
        }
        stack[card.get_value()-1] = card;
        this.hands[player].splice(this.hands[player].indexOf(card), 1);
        this.hands[player].push(this.deck.cards.pop());
        return true;
    }
}
module.exports = {Card, Deck, Game};
