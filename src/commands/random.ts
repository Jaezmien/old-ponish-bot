import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { create_embed_from_word } from '../lib/utils';
import { Dictionary } from '../lib/dictionary';

@ApplyOptions<Command.Options>({
	name: 'random',
	description: '📚 Get a random word from the dictionary!'
})
export class RandomWordCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: false });

		const words = Dictionary.getWords();
		const index = Math.floor(Math.random() * (words.length + 1));
		const word = words[index];
		const entry = await Dictionary.getEntry(word);

		if (!entry) {
			await interaction.editReply({
				content: '<:panic:570675430328107018> An error has occured while trying to get a random word!'
			});

			return;
		}

		let embed = create_embed_from_word(word, entry);

		interaction.editReply({
			content: `📚 *Here's a word*!`,
			embeds: [embed]
		});
	}
}
