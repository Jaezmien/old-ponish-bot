import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { create_could_not_find_string, create_embed_from_word, find_closest_from_array } from '../lib/utils';
import { Dictionary } from '../lib/dictionary';

@ApplyOptions<Command.Options>({
	name: 'word',
	description: '📖 Grabs a word entry from the dictionary.'
})
export class DictionaryWordCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('word').setDescription('The word you would like to search for.').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: false });

		const word = interaction.options.getString('word', true);

		const entry = await Dictionary.getEntry(word);

		if (!entry) {
			const db_words = Dictionary.getWords();
			const closest_words = find_closest_from_array(word, db_words).splice(0, 5);

			console.log(db_words);
			console.log(closest_words);

			return await interaction.editReply({
				content: create_could_not_find_string(
					`<:panic:570675430328107018> Sorry, I couldn't find \`${word}\` in the dictionary!`,
					closest_words
				)
			});
		}

		let embed = create_embed_from_word(word, entry);

		return await interaction.editReply({
			content: `📚 *Found it*!`,
			embeds: [embed]
		});
	}
}
