export function getMediaUrl(
    escortId: string,
    fileName: string,
    type: 'profile' | 'pics' | 'videos' | 'audio'| 'swap' | 'motel'
): string {
    if (fileName?.startsWith('http')) return fileName;
    if (type=='swap') return import.meta.env.VITE_MEDIA_CDN + `/${type}/${fileName}`;
    if (type=='motel') return import.meta.env.VITE_MEDIA_CDN + `/motels/${escortId}/images/${fileName}`;
    return import.meta.env.VITE_MEDIA_CDN + `/escorts/${escortId}/${type}/${fileName}`;
}


