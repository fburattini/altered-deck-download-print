import React from 'react';
import { Card } from '../types';
import CardDisplay from './CardDisplay';

interface CardTableProps {
  cards: Card[];
  hoveredCard: Card | null;
  onCardHover: (card: Card | null) => void;
}

const CardTable: React.FC<CardTableProps> = ({ 
  cards, 
  hoveredCard, 
  onCardHover 
}) => {return (
    <div className='table-container-standalone'>
      {cards.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">
                Name
              </th>
              <th scope="col" className="text-center">
                Price
              </th>
              <th scope="col" className="text-center">
                H.C.
              </th>
              <th scope="col" className="text-center">
                R.C.
              </th>
              <th scope="col">
                Attributes
              </th>
              <th scope="col">
                Main Effect
              </th>
              <th scope="col">
                Echo Effect
              </th>
            </tr>
          </thead>
          <tbody>            {cards.map((card) => (
              <tr
                key={card.id}
                className={`card-display-row ${hoveredCard?.id === card.id ? 'highlighted' : ''}`}
                onMouseEnter={() => onCardHover(card)}
              >
                <CardDisplay card={card} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CardTable;
