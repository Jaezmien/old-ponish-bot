import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from 'discord.js';
import { WOTDManager } from '../lib/wotdManager';

@ApplyOptions<Subcommand.Options>({
	name: 'wotd'
})
export class UserCommand extends Subcommand {
	public constructor(context: Subcommand.Context, options: Subcommand.Options) {
		super(context, {
			...options,
			name: 'wotd',
			subcommands: [
				{
					name: 'send',
					chatInputRun: 'wotdSend'
				},
				{
					name: 'fix',
					chatInputRun: 'wotdFix'
				}
			]
		});
	}
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription('📢 Commands related to Word of the Day')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand((build) => build.setName('send').setDescription('📢 Sends a Word of the Day!'))
				.addSubcommand((build) =>
					build
						.setName('fix')
						.setDescription('🔨 Fixes a Word of the Day!')
						.addStringOption((option) =>
							option
								.setName('message')
								.setDescription("🔍 The message id of the post you want to fix (I didn't implement message menus yet)")
								.setRequired(true)
						)
				)
		);
	}

	public async wotdSend(interaction: Subcommand.ChatInputCommandInteraction) {
		const modal = new ModalBuilder().setCustomId('wotd_send').setTitle('📢 Send a Word of the Day!');

		const wordTextInput = new TextInputBuilder()
			.setCustomId('wotd_word')
			.setLabel('What is the word that you want to use?')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const messageTextInput = new TextInputBuilder()
			.setCustomId('wotd_message')
			.setLabel('What is the message to include?')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		const firstRow = new ActionRowBuilder<TextInputBuilder>();
		firstRow.addComponents(wordTextInput);
		modal.addComponents(firstRow);

		const secondRow = new ActionRowBuilder<TextInputBuilder>();
		secondRow.addComponents(messageTextInput);
		modal.addComponents(secondRow);

		await interaction.showModal(modal);
	}

	public async wotdFix(interaction: Subcommand.ChatInputCommandInteraction) {
		const messageID = interaction.options.getString('message', true);

		const wotd_post = await WOTDManager.findByMessageID(messageID);

		if (!wotd_post) {
			await interaction.editReply({
				content: '<:panic:570675430328107018> Sorry, I could not find that word of the day!'
			});

			return;
		}

		const modal = new ModalBuilder().setCustomId('wotd_fix').setTitle('📢 Fixes a word of the day!');

		const wordTextInput = new TextInputBuilder()
			.setCustomId('wotd_id')
			.setLabel('What is the id of the post to edit?')
			.setValue(messageID)
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const firstRow = new ActionRowBuilder<TextInputBuilder>();
		firstRow.addComponents(wordTextInput);
		modal.addComponents(firstRow);

		const messageTextInput = new TextInputBuilder()
			.setCustomId('wotd_message')
			.setLabel('What is the new message of the post?')
			.setStyle(TextInputStyle.Paragraph)
			.setValue(wotd_post.message)
			.setRequired(true);

		const secondRow = new ActionRowBuilder<TextInputBuilder>();
		secondRow.addComponents(messageTextInput);
		modal.addComponents(secondRow);

		await interaction.showModal(modal);
	}
}
