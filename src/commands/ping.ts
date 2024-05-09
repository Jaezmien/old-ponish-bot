import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { format_time_proper } from '../lib/utils';

@ApplyOptions<Command.Options>({
	description: '🏓 Pings the bot'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendPing(interaction);
	}

	private async sendPing(interaction: Command.ChatInputCommandInteraction) {
		const pingMessage = await interaction.reply({ content: '💭 Ping?...', fetchReply: true });

		let content = '🏓 Pong!\n\n';
		content += `- 🤖 \`Bot Latency\` ${Math.round(this.container.client.ws.ping)}ms.\n`;
		content += `- 🌐 \`API Latency\` ${pingMessage.createdTimestamp - interaction.createdTimestamp}ms.\n`;
		content += `- 🕰 \`Uptime\` ${format_time_proper(process.uptime())}.`;

		this.container.logger.info(process.uptime());

		return interaction.editReply({
			content: content
		});
	}
}
