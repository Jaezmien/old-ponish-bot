import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { PartialMessage, TextChannel } from 'discord.js';
import { EmbedBuilder, Events, Message } from 'discord.js';

type MaybePartialMessage = PartialMessage | Message;

@ApplyOptions<Listener.Options>({ name: 'messageDeleteLogger', once: false, event: Events.MessageDelete })
export class MessageDeleteLoggerEvent extends Listener {
	public async run(message: MaybePartialMessage) {
		if (!message) return;

		if (process.env.NODE_ENV === 'production' && message.guildId !== '570666587632173062') return;

		try {
			if (message.partial) await message.fetch();
		} catch (err) {
			// ...
		}

		if (!message.author || message.author.bot) return;

		let embed = new EmbedBuilder({
			title: `❌ Message deleted in #${(message.channel as TextChannel).name}!`,
			description: message.cleanContent || message.content || '[Missing]',

			author: {
				name: message.author?.tag.replace(/\#0$/g, '') || 'Unknown User',
				icon_url: message.member?.displayAvatarURL() || message.author?.displayAvatarURL()
			},

			footer: {
				text: `📜 Message ID: ${message.id}`
			},

			color: 0xfd8a8a
		});

		if (process.env.LOG_CHANNEL_ID) {
			const channel = await message.client.channels.fetch(process.env.LOG_CHANNEL_ID);
			if (!channel || !channel.isTextBased()) return;

			channel.send({ embeds: [embed] });
		} else if (process.env.NODE_ENV === 'development') {
			await message.channel.send({ embeds: [embed] });
		}
	}
}
