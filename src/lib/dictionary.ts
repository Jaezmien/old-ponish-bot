import NodeCache from 'node-cache';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rootDir } from './constants';

const cache = new NodeCache({
	stdTTL: 3_600, // 1 Hour
	maxKeys: 64
});

class FileDBManager {
	private __url: string;
	private __filename: string;
	private get filePath() {
		return join(rootDir, 'data', this.__filename);
	}

	constructor(url: string, filename: string) {
		this.__url = url;
		this.__filename = filename;
	}

	async reload(ignoreIfExists = false) {
		if (!existsSync(join(rootDir, 'data'))) mkdirSync(join(rootDir, 'data'));
		if (ignoreIfExists && existsSync(this.filePath)) return;

		try {
			const data = await this.fetch();
			await writeFile(this.filePath, JSON.stringify(data));
		} catch (err) {
			throw err;
		}
	}

	private async fetch() {
		try {
			const result = await fetch(this.__url);
			return result.json() as Promise<Record<string, any>>;
		} catch (err) {
			throw err;
		}
	}

	async load() {
		return JSON.parse(await readFile(this.filePath, 'utf-8')) as Record<string, any>;
	}
}

export interface DictionaryEntry {
	definition: string;
	speech: string[];
	note?: string;
	similar?: string[];
	nsfw?: {
		out_universe?: string;
		in_universe?: string;
		nsfw_description?: string;
	};
	character?: {
		english?: string;
		justification?: string;
	};
}
class Dictionary {
	private __filedb: FileDBManager;
	private __words: Set<string>;

	constructor() {
		this.__filedb = new FileDBManager('https://github.com/Jaezmien/old-ponish-db/releases/latest/download/dictionary.json', 'dictionary.json');

		this.__words = new Set();
	}

	async reload(ignoreIfExists = false) {
		await this.__filedb.reload(ignoreIfExists);
		await this.load();
	}

	async getEntries() {
		const entries: Record<string, any> = await this.__filedb.load();
		return entries;
	}
	getWords() {
		return Array.from(this.__words);
	}

	async load() {
		const entries = await this.getEntries();
		this.__words = new Set(Object.keys(entries));
	}

	async getEntry(word: string): Promise<DictionaryEntry | undefined> {
		if (cache.has('dictionary-' + word)) return cache.get('dictionary-' + word);

		if (!this.__words.has(word)) {
			return undefined;
		}
		const entries = await this.getEntries();
		const entry = entries[word] as DictionaryEntry;

		cache.set('dictionary-' + word, entry);
		return entry;
	}
}

export interface EtymologyEntry {
	etymology?: string;
	description?: string;
	speech?: string[];
	credit?: string;
	note?: string;
}
class Etymology {
	private __filedb: FileDBManager;
	private __words: Set<string>;

	constructor() {
		this.__filedb = new FileDBManager('https://github.com/Jaezmien/old-ponish-db/releases/latest/download/etymology.json', 'etymology.json');

		this.__words = new Set();
	}

	async reload(ignoreIfExists = false) {
		await this.__filedb.reload(ignoreIfExists);
		await this.load();
	}

	async getEntries() {
		const entries: Record<string, any> = await this.__filedb.load();
		return entries;
	}
	getWords() {
		return Array.from(this.__words);
	}

	async load() {
		const entries = await this.getEntries();
		this.__words = new Set(Object.keys(entries));
	}

	async getEntry(word: string): Promise<EtymologyEntry | undefined> {
		if (cache.has('etymology-' + word)) return cache.get('etymology-' + word);

		if (!this.__words.has(word)) {
			return undefined;
		}
		const entries = await this.getEntries();
		const entry = entries[word] as EtymologyEntry;

		cache.set('etymology-' + word, entry);
		return entry;
	}
}

const __dictionary = new Dictionary();
const __etymology = new Etymology();

export { __dictionary as Dictionary, __etymology as Etymology, cache as DictionaryCache };
