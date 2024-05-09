import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits, TextChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'auth',
	description: '🔓 Authenticate a user.'
})
export class AuthCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addUserOption((option) => option.setName('user').setDescription('The user you want to authenticate.').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (interaction.channelId !== '572183161895649313') {
			await interaction.reply({
				ephemeral: true,
				content: '❌ This command can only be used at <#572183161895649313>'
			});

			return;
		}

		await interaction.deferReply({ ephemeral: true });

		const user = interaction.options.getUser('user', true);
		const member = await interaction.guild!.members.fetch(user.id);

		const MEMBER_ROLE = `570760407422074880`;

		if (member.roles.cache.has(MEMBER_ROLE)) {
			await interaction.editReply({
				content: `❌ This user already has the member role!`
			});

			return;
		}

		await member.roles.add(MEMBER_ROLE);

		await interaction.editReply({
			content: `🔓 Authenticated user!`
		});

		const channel = (await interaction.guild!.channels.fetch('572183161895649313')) as TextChannel;
		if (!channel) return;

		const messages = await channel.messages.fetch({
			limit: 100,
			after: '931402994262618113' // Introduction message
		});

		await channel.bulkDelete(messages);
	}
}
