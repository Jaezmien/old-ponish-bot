import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { find_closest_from_array } from '../lib/utils';
import { Dictionary } from '../lib/dictionary';

@ApplyOptions<Command.Options>({
	name: 'search',
	description: '📚 Search the dictionary for a word!'
})
export class SearchWordCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('query').setDescription('Your word search query.').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		const query = interaction.options.getString('query', true);

		const db_words = Dictionary.getWords();

		const leven_closest = find_closest_from_array(query, db_words);

		if (leven_closest.length === 0) {
			await interaction.editReply({
				content: `<:panic:570675430328107018> Sorry, but your search query \`${query}\` did not match any words!`
			});

			return;
		}

		const MAXIMUM_AMOUNT = 5;

		let result = '📚 Here is your search result!\n' + '```diff\n';

		const leven_result = await Promise.all(
			leven_closest.slice(0, MAXIMUM_AMOUNT).map(async (w) => {
				const entry = (await Dictionary.getEntry(w))!;
				return `+ ${w}\n---> ${entry.definition}`;
			})
		);
		result += leven_result.join('\n\n');

		if (leven_closest.length - MAXIMUM_AMOUNT > 0) {
			result += `\n\n- ... Omitted ${leven_closest.length - MAXIMUM_AMOUNT} words ...`;
		}

		result += '```';

		await interaction.editReply({
			content: result
		});
	}
}
