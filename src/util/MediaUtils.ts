export function getMediaUrl(
    escortId: string,
    fileName: string,
    type: 'profile' | 'pics' | 'videos' | 'audio'| 'swap'
): string {
    if (fileName?.startsWith('http')) return fileName;
    if (type=='swap') return `https://nexus.daisyssecrets.com/${type}/${fileName}`;
    return `https://nexus.daisyssecrets.com/escorts/${escortId}/${type}/${fileName}`;
}


