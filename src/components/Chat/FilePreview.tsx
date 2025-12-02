import { formatFileSize, getFileIcon } from '../../utils/fileUtils';
import './Chat.scss';

interface FilePreviewProps {
    files: File[];
    uploadingFile?: File | null;
    uploadProgress?: number;
    onRemove: (index: number) => void;
    classNamePrefix?: string;
}

export function FilePreview({ files, uploadingFile, uploadProgress = 0, onRemove, classNamePrefix = 'chat' }: FilePreviewProps) {
    const baseClass = classNamePrefix;

    if (files.length === 0) {
        return null;
    }

    return (
        <div className={`${baseClass}__file-preview`}>
            {files.map((file: File, index: number) => (
                <div key={index} className={`${baseClass}__file-preview-item`}>
                    <span className={`${baseClass}__file-preview-icon`}>{getFileIcon(file.type)}</span>
                    <span className={`${baseClass}__file-preview-name`}>{file.name}</span>
                    <span className={`${baseClass}__file-preview-size`}>{formatFileSize(file.size)}</span>
                    <button className={`${baseClass}__file-remove`} onClick={() => onRemove(index)}>
                        ✕
                    </button>
                </div>
            ))}
            {uploadingFile && (
                <div className={`${baseClass}__progress-container`}>
                    <div className={`${baseClass}__progress-bar`}>
                        <div className={`${baseClass}__progress-bar-fill`} style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className={`${baseClass}__progress-text`}>{Math.round(uploadProgress)}% 전송 중...</span>
                </div>
            )}
        </div>
    );
}
