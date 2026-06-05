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
        const parsedCards = data.cards
            .map(parse_card)
            .filter((card : any): card is Card => card !== null);

        setCards(parsedCards);
        })
        .catch(error => console.error(error));
    }, []);
  return (
    <>
        <section className='wrapper'>
            <div className='playArea'>

            </div>
            <div className='playerArea'>
                
            </div>
        </section>
        <h1 className='playerHP'>{health}</h1>
    </>
  )
}
function getCardValue(value:string) : number{
    switch (value) {
        case "ACE":
            return 14;
        case "JACK":
            return 11;
        case "QUEEN":
            return 12;
        case "KING":
            return 13;
        default:
            return Number(value);
    }
}
function parse_card(apiCard: ApiCard): Card | null {
    // Discard jokers
    if (apiCard.code.startsWith("X")) {
        return null;
    }

    const cardNumber = getCardValue(apiCard.value);

    switch (apiCard.suit) {
        case "HEARTS":
            return {
                cardType: CardType.potion,
                cardNumber
            };

        case "SPADES":
            return {
                cardType: CardType.monster,
                cardNumber
            };

        case "CLUBS":
        case "DIAMONDS":
            if (cardNumber > 10) {
                return null;
            }

            return {
                cardType: CardType.weapon,
                cardNumber
            };

        default:
            return null;
    }
}

export default App
