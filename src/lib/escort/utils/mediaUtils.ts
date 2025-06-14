// Media utilities for handling files and base64 conversion

/**
 * Get the file size limit in MB based on file type
 */
export function limitMB(file: File) {
    return file.type.startsWith('video/') ? 20 : file.type.startsWith('audio/') ? 5 : 5;
}

/**
 * Convert the limit from MB to bytes
 */
export function maxSizeBytes(file: File) {
    return limitMB(file) * 1024 * 1024;
}

/**
 * Convert a file to base64 string
 */
export function toBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
        if (file.size > maxSizeBytes(file)) {
            return rej(`El archivo supera ${limitMB(file)} MB`);
        }
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = e => rej(e);
        reader.readAsDataURL(file);
    });
}