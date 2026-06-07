import { useState, useEffect, useRef } from 'react';
import { CardType } from './types/types';
import './App.css';
import type { Card, ApiCard } from './types/types';
import CardComponent from './components/CardComponent';
import { draw_cards, draw_monster } from './utils/Utils';

function App() {
    const [cards, setCards] = useState<Card[]>([]);
    const [health, setHealth] = useState(20);
    const [currentHand, setCurrentHand] = useState<Card[]>([]);
    const [drawCount, setDrawCount] = useState(0);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [flyState, setFlyState] = useState<{ card: Card; from: DOMRect; to: DOMRect; active: boolean } | null>(null);
    const [currentMonster, setCurrentMonster] = useState<Card | null>(null);
    const [message, setMessage] = useState('Draw cards to begin your hunt.');
    const [status, setStatus] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
    const [monstersDefeated, setMonstersDefeated] = useState(0);
    const currCardRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        if (status === 'lost' || status === 'won') {
            return;
        }

        let nextDeck = cards;
        let monster = currentMonster;

        if (!monster) {
            const monsterResult = draw_monster(nextDeck);
            monster = monsterResult.monster;
            nextDeck = monsterResult.remainingDeck;

            if (!monster) {
                setStatus('won');
                setMessage('You have defeated every monster!');
                setCards(nextDeck);
                return;
            }

            setCurrentMonster(monster);
            setMessage(`A ${monster.cardNumber} health monster appears! Choose your cards and strike.`);
        }

        const { hand, remainingDeck } = draw_cards(nextDeck);

        setCurrentHand(hand);
        setCards(remainingDeck);
        setDrawCount(prev => prev + 1);
        setStatus('playing');
    }

    useEffect(() => {
        if (flyState && !flyState.active) {
            const frame = requestAnimationFrame(() => {
                setFlyState(prev => prev ? { ...prev, active: true } : prev);
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [flyState]);

    const handleSelect = (card: Card, index: number) => {
        if (status !== 'playing' || !currentMonster && card.cardType !== CardType.potion) {
            return;
        }

        const key = `${drawCount}-${index}`;
        const source = cardRefs.current[key];
        const destination = currCardRef.current;
        if (!source || !destination) return;

        const from = source.getBoundingClientRect();
        const to = destination.getBoundingClientRect();

        setFlyState({ card, from, to, active: false });
        setCurrentHand(prev => prev.filter((_, i) => i !== index));

        window.setTimeout(() => {
            setSelectedCard(card);
            resolveCard(card);
            setFlyState(null);
        }, 420);
    }    

    const flyingCardStyle = flyState ? {
        position: 'fixed' as const,
        width: '226px',
        height: '314px',
        left: flyState.from.left,
        top: flyState.from.top,
        backgroundImage: `url(${flyState.card.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: flyState.active
            ? `translate(${flyState.to.left - flyState.from.left}px, ${flyState.to.top - flyState.from.top}px)`
            : 'translate(0, 0)',
        transition: 'transform 0.38s ease, opacity 0.38s ease',
        zIndex: 999,
        pointerEvents: 'none' as const
    } : undefined;

    function resolveCard(card: Card) {
        if (card.cardType === CardType.potion) {
            setHealth(prev => Math.min(prev + card.cardNumber, 20));
            setMessage(`You drink a potion and recover ${card.cardNumber} health.`);
            return;
        }

        if (!currentMonster) {
            setMessage('There is no monster to attack right now.');
            return;
        }

        const attackValue = card.cardNumber;
        const monsterValue = currentMonster.cardNumber;

        if (attackValue >= monsterValue) {
            setMonstersDefeated(prev => prev + 1);
            const nextMonsterResult = draw_monster(cards);
            setCards(nextMonsterResult.remainingDeck);

            if (!nextMonsterResult.monster) {
                setCurrentMonster(null);
                setStatus('won');
                setMessage(`You crushed the ${monsterValue} monster and have defeated every challenge!`);
                return;
            }

            setCurrentMonster(nextMonsterResult.monster);
            setMessage(`You defeated the ${monsterValue} monster! A ${nextMonsterResult.monster.cardNumber}-strength monster appears.`);
            return;
        }

        const damage = monsterValue - attackValue;
        setHealth(prev => {
            const nextHealth = Math.max(prev - damage, 0);
            if (nextHealth <= 0) {
                setStatus('lost');
                setMessage(`Your attack failed and the monster dealt ${damage} damage. You have fallen.`);
            } else {
                setMessage(`Your attack failed and the monster dealt ${damage} damage.`);
            }
            return nextHealth;
        });
    }

    function handleFlee() {
        if (!currentMonster || status !== 'playing') {
            return;
        }

        const penalty = Math.min(currentMonster.cardNumber, 5);
        setHealth(prev => {
            const nextHealth = Math.max(prev - penalty, 0);
            if (nextHealth <= 0) {
                setStatus('lost');
                setMessage(`You tried to flee but collapsed under pressure and lost ${penalty} health.`);
            } else {
                setMessage(`You fled and lost ${penalty} health. A new monster appears.`);
            }
            return nextHealth;
        });

        const nextMonsterResult = draw_monster(cards);
        setCards(nextMonsterResult.remainingDeck);

        if (!nextMonsterResult.monster) {
            setCurrentMonster(null);
            setStatus('won');
            setMessage('You fled past the final monster and escaped victorious!');
            return;
        }

        setCurrentMonster(nextMonsterResult.monster);
    }

    function resetGame() {
        setCards([]);
        setCurrentHand([]);
        setDrawCount(0);
        setSelectedCard(null);
        setCurrentMonster(null);
        setMessage('Draw cards to begin your hunt.');
        setStatus('ready');
        setMonstersDefeated(0);
        setHealth(20);

        fetch("https://deckofcardsapi.com/api/deck/new/draw/?count=52")
            .then(response => response.json())
            .then(data => {
                const parsedCards = data.cards
                    .map(parse_card)
                    .filter((card: Card | null): card is Card => card !== null);

                setCards(parsedCards);
            })
            .catch(error => console.error(error));
    }

    return (
        <>
            <section className="wrapper">
                <div className="deckHolder">
                    <h3>Deck</h3>
                    <p>{cards.length} cards</p>
                </div>

                <div className="playArea">
                    <div className="monsterBoard">
                        <h3>Current Monster</h3>
                        {currentMonster ? (
                            <div className="monsterCard">
                                <CardComponent onclick={() => undefined} image={currentMonster.image} />
                                <p>Strength: {currentMonster.cardNumber}</p>
                            </div>
                        ) : (
                            <div className="monsterEmpty">No monster</div>
                        )}
                    </div>

                    <div className="statusBoard">
                        <p>{message}</p>
                        <p>Monsters defeated: {monstersDefeated}</p>
                        <p>Deck remaining: {cards.length}</p>
                        <button className="actionButton" onClick={handleFlee} disabled={!currentMonster || status !== 'playing'}>Flee</button>
                        {(status === 'won' || status === 'lost') && <button className="actionButton" onClick={resetGame}>Restart</button>}
                    </div>
                </div>

                <div className="playerArea">
                    {currentHand.map((card, index) => {
                        const key = `${drawCount}-${index}`;
                        return (
                            <div key={key} className="dealtCard" ref={el => { cardRefs.current[key] = el; }}>
                                <CardComponent onclick={() => handleSelect(card, index)} image={card.image} />
                            </div>
                        );
                    })}
                </div>

                <div className='currCard' ref={currCardRef}>
                    {selectedCard && (
                        <div
                            className="cardComponent currCardSelected"
                            style={{
                                backgroundImage: `url(${selectedCard.image})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat"
                            }}
                        />
                    )}
                </div>

                {flyState && <div className="flyingCard" style={flyingCardStyle} />}
            </section>

            <div className="playerFooter">
                <h1 className="playerHP">Health: {health}</h1>
                <span className="statusLabel">{status === 'won' ? 'Victory!' : status === 'lost' ? 'Defeat!' : 'Battle in progress'}</span>
            </div>

            { currentHand.length <= 1 && status !== 'lost' && status !== 'won' && <button className="drawButton" onClick={drawHand}>Draw</button>}
            {(status === 'won' || status === 'lost') && currentHand.length <= 1 && <button className="drawButton" onClick={resetGame}>Restart</button>}
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