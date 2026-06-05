import { useState, useEffect } from 'react';
import { CardType } from './types/types';
import './App.css';
import type { Card, ApiCard } from './types/types';
import CardComponent from './components/CardComponent';
import { draw_cards } from './utils/Utils';

function App() {
    const [cards, setCards] = useState<Card[]>([]);
    const [health] = useState(20);
    const [currentHand, setCurrentHand] = useState<Card[]>([]);
    const [drawCount, setDrawCount] = useState(0);

    useEffect(() => {
        fetch("https://deckofcardsapi.com/api/deck/new/draw/?count=52")
            .then(response => response.json())
            .then(data => {
                const parsedCards = data.cards
                    .map(parse_card)
                    .filter((card: Card | null): card is Card => card !== null);

                setCards(parsedCards);
            })
            .catch(error => console.error(error));
    }, []);

    function drawHand() {
        const { hand, remainingDeck } = draw_cards(cards);

        setCurrentHand(hand);
        setCards(remainingDeck);
        setDrawCount(prev => prev + 1);
    }

    return (
        <>
            <section className="wrapper">
                <div className="deckHolder">
                    <h3>Deck</h3>
                    <p>{cards.length} cards</p>
                </div>

                <div className="playArea">
                </div>

                <div className="playerArea">
                    {currentHand.map((card, index) => (
                        <div
                            key={`${drawCount}-${index}`}
                            className="dealtCard"
                        >
                            <CardComponent image={card.image} />
                        </div>
                    ))}
                </div>
            </section>

            <h1 className="playerHP">{health}</h1>

            <button onClick={drawHand}>
                Draw
            </button>
        </>
    );
}

function get_card_value(value: string): number {
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
    if (apiCard.code.startsWith("X")) {
        return null;
    }

    const cardNumber = get_card_value(apiCard.value);

    switch (apiCard.suit) {
        case "HEARTS":
            if (cardNumber > 10) {
                return null;
            }

            return {
                cardType: CardType.potion,
                cardNumber,
                image: apiCard.image
            };

        case "SPADES":
            return {
                cardType: CardType.monster,
                cardNumber,
                image: apiCard.image
            };

        case "CLUBS":
        case "DIAMONDS":
            if (cardNumber > 10) {
                return null;
            }

            return {
                cardType: CardType.weapon,
                cardNumber,
                image: apiCard.image
            };

        default:
            return null;
    }
}

export default App;