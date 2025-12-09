import Fuse from 'fuse.js';
import scienceContent from '../data/class6-science-content.json';
import appHelpContent from '../data/app-help-content.json';

// Flatten science content for better searching
interface SubchapterContent {
    explanation: string;
    definitions: string[];
    keyPoints: string[];
    summary: string;
    examples: string[];
}

interface Subchapter {
    name: string;
    content: SubchapterContent;
}

interface Chapter {
    name: string;
    subchapters: Subchapter[];
}

interface SearchChunk {
    type: 'science' | 'help';
    title: string;
    text: string;
    chapter?: string;
    subchapter?: string;
}

const flattenScienceContent = (): SearchChunk[] => {
    const chunks: SearchChunk[] = [];
    (scienceContent.chapters as Chapter[]).forEach(chapter => {
        chapter.subchapters.forEach(sub => {
            // Add explanation chunk
            chunks.push({
                type: 'science',
                title: `${chapter.name} - ${sub.name}`,
                text: sub.content.explanation,
                chapter: chapter.name,
                subchapter: sub.name
            });
            // Add definitions as individual chunks
            if (sub.content.definitions && Array.isArray(sub.content.definitions)) {
                sub.content.definitions.forEach((def: string) => {
                    chunks.push({
                        type: 'science',
                        title: `${chapter.name} - ${sub.name} (Definition)`,
                        text: def,
                        chapter: chapter.name,
                        subchapter: sub.name
                    });
                });
            }
            // Add summary
            chunks.push({
                type: 'science',
                title: `${chapter.name} - ${sub.name} (Summary)`,
                text: sub.content.summary,
                chapter: chapter.name,
                subchapter: sub.name
            });
        });
    });
    return chunks;
};

const scienceChunks = flattenScienceContent();
const helpChunks = appHelpContent.helpTopics.map((topic: { topic: string, content: string }) => ({
    type: 'help' as const, // Explicitly type as literal 'help' matching SearchChunk
    title: topic.topic,
    text: topic.content
}));

const allChunks = [...scienceChunks, ...helpChunks];

const fuseOptions = {
    keys: ['title', 'text'],
    threshold: 0.3, // Tighter matching to avoid irrelevant results
    includeScore: true
};

const fuse = new Fuse(allChunks, fuseOptions);

export const searchOffline = (query: string) => {
    const results = fuse.search(query);
    // Return top 3 matches
    return results.slice(0, 3).map(result => result.item);
};
