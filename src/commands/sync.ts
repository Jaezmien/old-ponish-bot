import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Prisma } from '../lib/constants';
import { PART_OF_SPEECH_LOOKUP } from '../lib/constants';

async function downloadJSONFile(url: string) {
	try {
		const result = await fetch(url);
		return result.json() as Promise<Record<string, any>>;
	} catch (err) {
		throw err;
	}
}

@ApplyOptions<Command.Options>({
	name: 'sync',
	description: "🔃 Sync up the database!",
	cooldownDelay: 30_000,
})
export class DatabaseSyncCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({
			content: '🌟 The database sync is in progress!'
		})

		const channelID = interaction.channelId

		// TODO: Can we not do this?
		// This seems highly inefficient just to change a couple of words.
		const Dictionary = await downloadJSONFile('https://github.com/Jaezmien/old-ponish-db/releases/latest/download/dictionary.json');
		const Etymology = await downloadJSONFile('https://github.com/Jaezmien/old-ponish-db/releases/latest/download/etymology.json');

		for (const word of Object.keys(Dictionary)) {
			const info = (Dictionary as any)[word];

			await Prisma.word.upsert({
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
				const existing_group = await Prisma.wordRelation.findFirst({
					where: { word_id: word }
				});

				if (!existing_group) {
					// Group has not existed, let's see if there's one with our similar words in it.
					const group = await Prisma.wordRelation.findMany({
						where: {
							word_id: {
								in: info.similar
							}
						}
					});

					if (group.length) {
						// There is a group! Let's join that.
						await Prisma.wordRelation.create({
							data: { id: group[0].id, word_id: word }
						});
					} else {
						// There isn't any group! Let's make one.
						await Prisma.wordRelation.create({
							data: { word_id: word }
						});
					}
				} else {
					// Group has existed, and we're already in it!
					// We don't have to do anything.
				}
			}
		}

		await Prisma.$transaction(
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
		await Prisma.$transaction(async (t) => {
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
			await Prisma.etymology.upsert({
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

		const channel = await interaction.client.channels.fetch(channelID)
		if (!channel || !channel.isTextBased()) return;
		channel.send({ content: "✅ Database has been fully synced!" })
	}
}
