import React from 'react';
import { Card } from '../types';
import CardDisplay from './CardDisplay';

interface CardTableProps {
  cards: Card[];
  hoveredCardImage: string | null;
  onCardHover: (imagePath: string | null) => void;
}

const CardTable: React.FC<CardTableProps> = ({ 
  cards, 
  hoveredCardImage, 
  onCardHover 
}) => {
  return (
    <div className='table-image-container'>
      {cards.length > 0 && (
        <div className="table-container">
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
                  Main Cost
                </th>
                <th scope="col" className="text-center">
                  Recall Cost
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
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.id}
                  className="card-display-row"
                  onMouseEnter={() => onCardHover(card.imagePath || null)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <CardDisplay card={card} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hoveredCardImage && (
        <div className="image-preview-container">
          <div className="sticky-image-wrapper">
            <img
              src={hoveredCardImage}
              alt="Hovered card"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CardTable;
