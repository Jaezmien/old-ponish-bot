import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Prisma } from '../lib/constants';
import { create_could_not_find_string, create_embed_from_etymology, find_closest_from_array } from '../lib/utils';

@ApplyOptions<Command.Options>({
	name: 'etymology',
	description: "📖 Get information about a word's etymology."
})
export class DictionaryEtymologyCommand extends Command {
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

		const search_word = interaction.options.getString('word', true);

		const word = await Prisma.etymology.findFirst({
			where: { word: search_word }
		});

		if (word === null) {
			const db_words = (
				await Prisma.etymology.findMany({
					select: { word: true }
				})
			).map((w) => w.word);
			const closest_words = find_closest_from_array(search_word, db_words).splice(0, 5);

			return await interaction.editReply({
				content: create_could_not_find_string(
					`<:panic:570675430328107018> Sorry, I couldn't find \`${search_word}\` in the etymology list!`,
					closest_words
				)
			});
		}

		let embed = create_embed_from_etymology(word);

		return await interaction.editReply({
			content: `📚 *Found it*!`,
			embeds: [embed]
		});
	}
}
