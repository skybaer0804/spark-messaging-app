import './Sidebar.scss';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    return (
        <aside className="sidebar">
            <nav className="sidebar__nav">
                <button className={`sidebar__item ${currentView === 'chat' ? 'sidebar__item--active' : ''}`} onClick={() => onViewChange('chat')}>
                    <span className="sidebar__item-label">Chat</span>
                </button>
                <button
                    className={`sidebar__item ${currentView === 'notification' ? 'sidebar__item--active' : ''}`}
                    onClick={() => onViewChange('notification')}
                >
                    <span className="sidebar__item-label">Notification</span>
                </button>
                <button
                    className={`sidebar__item ${currentView === 'reverse-auction' ? 'sidebar__item--active' : ''}`}
                    onClick={() => onViewChange('reverse-auction')}
                >
                    <span className="sidebar__item-label">Reverse Auction</span>
                </button>

                {/* 구분선 */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-border-default)', margin: '8px 0' }}></div>

                <button
                    className={`sidebar__item ${currentView === 'design-system' ? 'sidebar__item--active' : ''}`}
                    onClick={() => onViewChange('design-system')}
                >
                    <span className="sidebar__item-label">Design System</span>
                </button>
            </nav>
        </aside>
    );
}
