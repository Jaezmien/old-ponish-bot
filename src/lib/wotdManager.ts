import { join } from 'node:path';
import { rootDir } from './constants';
import { readFile, writeFile } from 'node:fs/promises';

export interface WOTDEntry {
	message_id: string;
	author: string;
	word: string;
	message: string;
}

class WOTDManager {
	private get filePath() {
		return join(rootDir, 'data', 'wotd.json');
	}

	async load(): Promise<WOTDEntry[]> {
		try {
			const raw_contents = await readFile(this.filePath, 'utf-8');
			const contents = JSON.parse(raw_contents.trim());
			return contents as WOTDEntry[];
		} catch (err) {
			return [];
		}
	}
	async save(entries: WOTDEntry[]) {
		await writeFile(this.filePath, JSON.stringify(entries));
	}

	async create(entry: WOTDEntry) {
		const entries = await this.load();
		entries.push(entry);
		await this.save(entries);
	}

	async update(id: string, entry: WOTDEntry) {
		const entries = await this.load();
		const entry_index = entries.findIndex((e) => e.message_id === id);
		if (entry_index === -1) return false;
		entries[entry_index] = entry;
		return true;
	}

	async findByMessageID(id: string) {
		const entries = await this.load();
		for (const entry of entries) {
			if (entry.message_id === id) {
				return entry;
			}
		}
		return null;
	}
}

const __wotdManager = new WOTDManager();

export { __wotdManager as WOTDManager };
