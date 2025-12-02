import './Chat.scss';

interface ImageModalProps {
    url: string;
    fileName: string;
    onClose: () => void;
    classNamePrefix?: string;
}

export function ImageModal({ url, fileName, onClose, classNamePrefix = 'chat' }: ImageModalProps) {
    const baseClass = classNamePrefix;

    return (
        <div className={`${baseClass}__image-modal`} onClick={onClose}>
            <div className={`${baseClass}__image-modal-content`} onClick={(e) => e.stopPropagation()}>
                <button className={`${baseClass}__image-modal-close`} onClick={onClose}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <img src={url} alt={fileName} className={`${baseClass}__image-modal-image`} />
            </div>
        </div>
    );
}

