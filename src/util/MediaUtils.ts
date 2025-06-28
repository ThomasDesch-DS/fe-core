export function getMediaUrl(
    escortId: string,
    fileName: string,
    type: 'profile' | 'pics' | 'videos' | 'audio'
): string {
    if (fileName?.startsWith('http')) return fileName;
    return `https://nexus.daisyssecrets.com/escorts/${escortId}/${type}/${fileName}`;
}
