import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { PartialMessage, TextChannel } from 'discord.js';
import { EmbedBuilder, Events, Message } from 'discord.js';

type MaybePartialMessage = PartialMessage | Message;

@ApplyOptions<Listener.Options>({ name: 'messageEditLogger', once: false, event: Events.MessageUpdate })
export class MessageEditLoggerEvent extends Listener {
	public async run(oldMessage: MaybePartialMessage, newMessage: MaybePartialMessage) {
		if (!newMessage || !oldMessage) return;

		if (process.env.NODE_ENV === 'production' && newMessage.guildId !== '570666587632173062') return;

		try {
			if (oldMessage.partial) await oldMessage.fetch();
			if (newMessage.partial) await newMessage.fetch();
		} catch (err) {
			// ...
		}

		if (!newMessage.author || newMessage.author.bot) return;

		if (oldMessage.content === newMessage.content) return;

		let embed = new EmbedBuilder({
			title: `✍ Message edited in #${(newMessage.channel as TextChannel).name}!`,
			description: `[🔗 Message Link](${newMessage.url})`,

			author: {
				name: newMessage.author?.tag.replace(/\#0$/g, '') || 'Unknown User',
				icon_url: newMessage.member?.displayAvatarURL() || newMessage.author?.displayAvatarURL()
			},

			footer: {
				text: `📜 Message ID: ${newMessage.id}`
			},

			color: 0xc9f4aa
		});

		embed = embed.addFields({ name: '**Before**', value: oldMessage.cleanContent || oldMessage.content || '[Missing]' });
		embed = embed.addFields({ name: '**After**', value: newMessage.cleanContent || newMessage.content || '[Missing]' });

		if (process.env.LOG_CHANNEL_ID) {
			const channel = await newMessage.client.channels.fetch(process.env.LOG_CHANNEL_ID);
			if (!channel || !channel.isSendable()) return;

			channel.send({ embeds: [embed] });
		} else if (process.env.NODE_ENV === 'development') {
			if (!newMessage.channel.isSendable()) return;
			await newMessage.channel.send({ embeds: [embed] });
		}
	}
}
