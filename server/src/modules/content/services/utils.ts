const MAX_CHUNK_SIZE = 4000;
export function chunkText(
    text: string,
    chunkSize: number = MAX_CHUNK_SIZE
): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (let sentence of sentences) {
        sentence = sentence.trim();
        if (currentChunk.length + sentence.length > chunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence + " ";
        } else {
            currentChunk += sentence + " ";
        }
    }

    // Push the last chunk if it exists
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}
