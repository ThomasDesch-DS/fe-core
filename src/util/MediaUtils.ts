export function getMediaUrl(
    escortId: string,
    fileName: string,
    type: 'profile' | 'pics' | 'videos' | 'audio'| 'swap'
): string {
    if (fileName?.startsWith('http')) return fileName;
    if (type=='swap') return import.meta.env.VITE_MEDIA_CDN`/${type}/${fileName}`;
    return import.meta.env.VITE_MEDIA_CDN`/${escortId}/${type}/${fileName}`;
}


