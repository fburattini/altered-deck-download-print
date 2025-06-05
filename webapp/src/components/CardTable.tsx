import React from 'react';
import { Card } from '../types';
import { BookmarkEntry } from '../services/searchAPI';
import CardDisplay from './CardDisplay';

interface CardTableProps {
	cards: Card[];
	hoveredCard: Card | null;
	onCardHover: (card: Card | null) => void;
	userBookmarks?: BookmarkEntry[];
	onToggleBookmark?: (card: Card) => Promise<void>;
	isCardBookmarked?: (cardId: string) => boolean;
}

const CardTable: React.FC<CardTableProps> = ({
	cards,
	hoveredCard,
	onCardHover,
	userBookmarks,
	onToggleBookmark,
	isCardBookmarked
}) => {
	return (
		<div className='table-container-standalone'>
			{cards.length > 0 && (
				<table>
					<thead>
						<tr>
							<th scope="col">
								Name
							</th>
							<th scope="col">
								Price
							</th>
							<th scope="col">
								H.C.
							</th>
							<th scope="col">
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
							{onToggleBookmark && (
								<th scope="col">
									📚
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{cards.map((card) => (
							<tr
								key={card.id}
								className={`card-display-row ${hoveredCard?.id === card.id ? 'highlighted' : ''}`}
								onMouseEnter={() => onCardHover(card)}
							>
								<CardDisplay 
									card={card} 
									userBookmarks={userBookmarks}
									onToggleBookmark={onToggleBookmark}
									isCardBookmarked={isCardBookmarked}
								/>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default CardTable;
