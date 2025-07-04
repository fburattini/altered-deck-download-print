import React, { useState } from 'react';
import '../styles/LeftMenu.scss';
import { BookmarkEntry, CardNameFaction, WatchlistEntry } from '../services/searchAPI';

interface LeftMenuProps {
	isCollapsed?: boolean;
	currentView?: string;
    bookmarks: BookmarkEntry[]
    database: CardNameFaction[]
    watchlist: WatchlistEntry[]
	onToggleCollapse?: () => void;
    onMenuItemClick: (menu: string) => void;
}

const LeftMenu: React.FC<LeftMenuProps> = ({
	isCollapsed = false,
	currentView = 'search',
    bookmarks,
    database,
    watchlist,
	onToggleCollapse,
    onMenuItemClick,
}) => {
	const [activeSection, setActiveSection] = useState<string>(currentView);

	const menuItems = [
		{
			id: 'home',
			icon: '🏠',
			label: 'Home',
			onClick: () => {
				setActiveSection('home');
                onMenuItemClick('home')
			}
		},
		{
			id: 'search',
			icon: '🔍',
			label: 'Search',
			onClick: () => {
				setActiveSection('search');
				// Search is the main view, so just set active
			}
		},
		{
			id: 'bookmarks',
			icon: '🔖',
			label: `Bookmarks (${bookmarks?.length ?? 0})`,
			onClick: () => {
				setActiveSection('bookmarks');
                onMenuItemClick('bookmarks');
			}
		},
		{
			id: 'collection',
			icon: '📚',
			label: `Database (${database?.length ?? 0})`,
			onClick: () => {
				setActiveSection('collection');
                onMenuItemClick('collection');
			}
		},
		{
			id: 'watchlist',
			icon: '📋',
			label: `Watchlist (${watchlist?.length ?? 0})`,
			onClick: () => {
				setActiveSection('watchlist');
                onMenuItemClick('watchlist');
			}
		}
	];

	const handleItemClick = (item: typeof menuItems[0]) => {
		setActiveSection(item.id);
		item.onClick();
	};

	return (
		<div className={`left-menu ${isCollapsed ? 'collapsed' : 'expanded'}`}>
			{/* Menu Header */}
			<div className="menu-header">
				<div className="app-logo">
					<span className="logo-icon">🎴</span>
					{!isCollapsed && <span className="logo-text">Altered Deck</span>}
				</div>
				
				{onToggleCollapse && (
					<button 
						className="collapse-toggle"
						onClick={onToggleCollapse}
						title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
					>
						{isCollapsed ? '→' : '←'}
					</button>
				)}
			</div>

			{/* Menu Items */}
			<nav className="menu-nav">
				<ul className="menu-list">
					{menuItems.map((item) => (
						<li key={item.id} className="menu-item">
							<button
								className={`menu-button ${activeSection === item.id ? 'active' : ''}`}
								onClick={() => handleItemClick(item)}
								title={isCollapsed ? item.label : undefined}
							>
								<span className="menu-icon">{item.icon}</span>
								{!isCollapsed && <span className="menu-label">{item.label}</span>}
							</button>
						</li>
					))}
				</ul>
			</nav>

			{/* Menu Footer */}
			<div className="menu-footer">
				<button
					className="menu-button"
					onClick={() => onMenuItemClick('settings')}
					title={isCollapsed ? 'Settings' : undefined}
				>
					<span className="menu-icon">⚙️</span>
					{!isCollapsed && <span className="menu-label">Settings</span>}
				</button>
			</div>
		</div>
	);
};

export default LeftMenu;
