import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Prisma } from '../lib/constants';
import { create_embed_from_word } from '../lib/utils';

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

		const words_count = await Prisma.word.count();
		const word = await Prisma.word.findFirst({
			skip: Math.floor(Math.random() * (words_count + 1)),
			include: {
				nsfw: true,
				part_of_speech: {
					include: {
						speech: true
					}
				}
			}
		});

		if (!word) {
			await interaction.editReply({
				content: '<:panic:570675430328107018> An error has occured while trying to get a random word!'
			});

			return;
		}

		let embed = create_embed_from_word(word);

		interaction.editReply({
			content: `📚 *Here's a word*!`,
			embeds: [embed]
		});
	}
}
