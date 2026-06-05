import { useState, useEffect } from 'react'
import { CardType } from './types/types';
import './App.css'
import type { Card, ApiCard } from './types/types'

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [health, setHealth] = useState(20);
  
  //api : https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1
useEffect(() => {
    fetch("https://deckofcardsapi.com/api/deck/new/draw/?count=52")
        .then(response => response.json())
        .then(data => {
            const parsedCards: Card[] = data.cards.map(parse_card);
            setCards(parsedCards);
        })
        .catch(error => console.error(error));
    }, []);
  return (
    <>
        
    </>
  )
}
function parse_card(apiCard: ApiCard): Card {
    let cardType: CardType;

    switch (apiCard.suit) {
        case "HEARTS":
            cardType = CardType.potion;
            break;
        case "SPADES":
            cardType = CardType.monster;
            break;
        default:
            cardType = CardType.weapon;
            break;
    }

    let cardNumber: number;

    switch (apiCard.value) {
        case "ACE":
            cardNumber = 14;
            break;
        case "JACK":
            cardNumber = 11;
            break;
        case "QUEEN":
            cardNumber = 12;
            break;
        case "KING":
            cardNumber = 13;
            break;
        default:
            cardNumber = Number(apiCard.value);
            break;
    }

    return {
        cardType,
        cardNumber
    };
}

export default App
