import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Dictionary, DictionaryCache, Etymology } from '../lib/dictionary';
import { PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'sync',
	description: '🔃 Sync up the database!',
	cooldownDelay: 30_000
})
export class DatabaseSyncCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName(this.name).setDescription(this.description).setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();

		await interaction.editReply({
			content: '🔄 The database sync is in progress!'
		});

		DictionaryCache.flushAll();
		await Dictionary.reload(false);
		await Etymology.reload(false);

		await interaction.editReply({
			content: '<:hoof:572187847629733922> Database has been fully synced!'
		});
	}
}
