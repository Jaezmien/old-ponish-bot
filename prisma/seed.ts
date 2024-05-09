import { PrismaClient } from '@prisma/client';

import { join } from 'node:path';
const rootDir = join(__dirname, '..');

import { PART_OF_SPEECH_LOOKUP } from '../src/lib/constants';

const prisma = new PrismaClient();

async function downloadJSONFile(url: string) {
	try {
		const result = await fetch(url);
		return result.json() as Promise<Record<string, any>>;
	} catch (err) {
		throw err;
	}
}

async function main() {
	// Reset Parts of Speech - related tables
	await prisma.wordSpeech.deleteMany();
	await prisma.partOfSpeech.deleteMany();

	// Set up parts of speech table

	let parts_of_speech = PART_OF_SPEECH_LOOKUP;
	for (let i = 0; i < parts_of_speech.length; i++) {
		const type = parts_of_speech[i];

		await prisma.partOfSpeech.upsert({
			where: { id: i + 1 },
			update: { type_of_speech: type },
			create: { id: i + 1, type_of_speech: type }
		});
	}

	// Set up dictionary
	const Dictionary = await downloadJSONFile('https://github.com/Jaezmien/old-ponish-db/releases/latest/download/dictionary.json');
	const Etymology = await downloadJSONFile('https://github.com/Jaezmien/old-ponish-db/releases/latest/download/etymology.json');

	for (const word of Object.keys(Dictionary)) {
		const info = (Dictionary as any)[word];

		await prisma.word.upsert({
			where: { word: word },
			update: {
				description: info.definition,
				note: info.note
			},
			create: {
				word: word,
				description: info.definition,
				note: info.note
			}
		});

		// Create relation group (if it doesn't exist yet)
		if (info.similar) {
			const existing_group = await prisma.wordRelation.findFirst({
				where: { word_id: word }
			});

			if (!existing_group) {
				// Group has not existed, let's see if there's one with our similar words in it.
				const group = await prisma.wordRelation.findMany({
					where: {
						word_id: {
							in: info.similar
						}
					}
				});

				if (group.length) {
					// There is a group! Let's join that.
					await prisma.wordRelation.create({
						data: { id: group[0].id, word_id: word }
					});
				} else {
					// There isn't any group! Let's make one.
					await prisma.wordRelation.create({
						data: { word_id: word }
					});
				}
			} else {
				// Group has existed, and we're already in it!
				// We don't have to do anything.
			}
		}
	}

	await prisma.$transaction(
		async (t) => {
			for (const word of Object.keys(Dictionary)) {
				const info = (Dictionary as any)[word];

				if (info.speech) {
					await Promise.all(
						info.speech.map((part: string) =>
							t.wordSpeech.create({
								data: {
									word_id: word,
									speech_id: PART_OF_SPEECH_LOOKUP.indexOf(part) + 1
								}
							})
						)
					);
				}
			}
		},
		{
			timeout: 50000
		}
	);
	await prisma.$transaction(async (t) => {
		for (const word of Object.keys(Dictionary)) {
			const info = (Dictionary as any)[word];

			// Create NSFW
			if (info.nsfw) {
				await t.wordNSFW.upsert({
					where: { word_id: word },
					update: {
						out_of_universe_context: info.nsfw.out_universe,
						in_universe_context: info.nsfw.in_universe,
						nsfw_description: info.nsfw.description
					},
					create: {
						word_id: word,
						out_of_universe_context: info.nsfw.out_universe,
						in_universe_context: info.nsfw.in_universe,
						nsfw_description: info.nsfw.description
					}
				});
			}

			// Create character
			if (info.character) {
				await t.wordCharacter.upsert({
					where: { word_id: word },
					update: {
						character: info.character.english || info.definition,
						character_justification: info.character.justification
					},
					create: {
						word_id: word,
						character: info.character.english || info.definition,
						character_justification: info.character.justification
					}
				});
			}
		}
	});

	for (const word of Object.keys(Etymology)) {
		const info = (Etymology as any)[word];
		await prisma.etymology.upsert({
			where: { word: word },
			update: {
				etymology: info.etymology,
				description: info.description,
				parts_of_speech: info.speech?.join(', '),
				credit: info.credit,
				note: info.note
			},
			create: {
				word: word,
				etymology: info.etymology,
				description: info.description,
				parts_of_speech: info.speech?.join(', '),
				credit: info.credit,
				note: info.note
			}
		});
	}

	// Set up settings
	const settings = [
		['allow_suggestions', '1'],
		['word_suggestions_count', '0'],
		['etymology_suggestions_count', '0'],
		['idea_suggestions_count', '0']
	];
	for (const setting of settings)
		[
			await prisma.setting.upsert({
				where: { name: setting[0] },
				update: {
					value: setting[1]
				},
				create: {
					name: setting[0],
					value: setting[1]
				}
			})
		];
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
