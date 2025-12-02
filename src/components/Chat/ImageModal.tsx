import { memo } from 'preact/compat';
import './Chat.scss';

interface ImageModalProps {
    url: string;
    fileName: string;
    onClose: () => void;
    classNamePrefix?: string;
}

function ImageModalComponent({ url, fileName, onClose, classNamePrefix = 'chat' }: ImageModalProps) {
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

// memo로 메모이제이션하여 url과 fileName이 변경되지 않으면 리렌더링 방지
export const ImageModal = memo(ImageModalComponent, (prevProps, nextProps) => {
    return prevProps.url === nextProps.url && prevProps.fileName === nextProps.fileName && prevProps.classNamePrefix === nextProps.classNamePrefix;
});

