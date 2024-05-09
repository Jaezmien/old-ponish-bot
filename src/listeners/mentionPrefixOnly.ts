import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public async run(message: Message) {
		if (Math.random() >= 0.1) await message.react('👋');
		else await message.react('🐄');
		return;
	}
}
