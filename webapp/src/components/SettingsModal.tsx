import React, { useState, useEffect } from 'react';
import '../styles/SettingsModal.scss';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentUserId: string;
	bearerToken: string;
	onUserIdChange: (userId: string) => void;
	onBearerTokenChange: (token: string) => void;
	userIdValid: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
	isOpen,
	onClose,
	currentUserId,
	bearerToken,
	onUserIdChange,
	onBearerTokenChange,
	userIdValid
}) => {
	const [localUserId, setLocalUserId] = useState(currentUserId);
	const [localBearerToken, setLocalBearerToken] = useState(bearerToken);
	const [showToken, setShowToken] = useState(false);

	// Update local state when props change
	useEffect(() => {
		setLocalUserId(currentUserId);
		setLocalBearerToken(bearerToken);
	}, [currentUserId, bearerToken]);

	const handleSave = () => {
		onUserIdChange(localUserId);
		onBearerTokenChange(localBearerToken);
		onClose();
	};

	const handleCancel = () => {
		// Reset to original values
		setLocalUserId(currentUserId);
		setLocalBearerToken(bearerToken);
		onClose();
	};

	const handleClearData = () => {
		if (window.confirm('Are you sure you want to clear all stored data? This will remove your user ID and bearer token.')) {
			setLocalUserId('');
			setLocalBearerToken('');
			onUserIdChange('');
			onBearerTokenChange('');
		}
	};

	if (!isOpen) return null;

	return (
		<div className="settings-modal-overlay" onClick={onClose}>
			<div className="settings-modal" onClick={(e) => e.stopPropagation()}>
				<div className="settings-header">
					<h2>⚙️ Settings</h2>
					<button className="close-button" onClick={onClose}>×</button>
				</div>

				<div className="settings-content">
					<div className="setting-group">
						<label htmlFor="userId">User ID</label>
						<input
							id="userId"
							type="text"
							value={localUserId}
							onChange={(e) => setLocalUserId(e.target.value)}
							placeholder="Enter your user ID"
							className={!userIdValid && localUserId ? 'invalid' : ''}
						/>
						<div className="setting-description">
							Your unique identifier for bookmarks and personal data. Only alphanumeric characters, hyphens, and underscores are allowed.
						</div>
						{!userIdValid && localUserId && (
							<div className="validation-error">
								Invalid user ID. Only letters, numbers, hyphens, and underscores are allowed.
							</div>
						)}
					</div>

					<div className="setting-group">
						<label htmlFor="bearerToken">Bearer Token</label>
						<div className="token-input-container">
							<input
								id="bearerToken"
								type={showToken ? 'text' : 'password'}
								value={localBearerToken}
								onChange={(e) => setLocalBearerToken(e.target.value)}
								placeholder="Enter your API bearer token"
							/>
							<button
								type="button"
								className="toggle-visibility"
								onClick={() => setShowToken(!showToken)}
								title={showToken ? 'Hide token' : 'Show token'}
							>
								{showToken ? '👁️‍🗨️' : '👁️'}
							</button>
						</div>
						<div className="setting-description">
							Optional API authentication token for enhanced features.
						</div>
					</div>

					<div className="setting-group">
						<div className="setting-info">
							<h4>Data Storage</h4>
							<p>Your settings are stored locally in your browser. No data is sent to external servers unless you explicitly use features that require it.</p>
						</div>
					</div>
				</div>

				<div className="settings-footer">
					<div className="button-group-left">
						<button className="clear-button" onClick={handleClearData}>
							🗑️ Clear All Data
						</button>
					</div>
					<div className="button-group-right">
						<button className="cancel-button" onClick={handleCancel}>
							Cancel
						</button>
						<button className="save-button" onClick={handleSave}>
							Save
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsModal;
