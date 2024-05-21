import {
	SapphireClient,
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload
} from '@sapphire/framework';
import { cyan } from 'colorette';
import { ChannelType, EmbedBuilder, type APIUser, type Guild, type User } from 'discord.js';
import { distance } from 'fastest-levenshtein';
import { capitalize } from 'lodash';
import { DictionaryEntry, EtymologyEntry } from './dictionary';

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}

// -- //

export function create_embed_from_word(word: string, entry: DictionaryEntry) {
	let embed = new EmbedBuilder()
		.setTitle(`🔖 ${word}`)
		.setDescription(entry.definition)
		.addFields({
			name: '📎 Parts of Speech',
			value: entry.speech.map((p) => capitalize(p)).join(', ')
		});
	if (!!entry.nsfw) {
		embed.addFields({
			name: '<:lewd:666458724625416255> Notice',
			value: 'This word may be **Not Safe For Work**!'
		});
	}

	return embed;
}
export function create_embed_from_etymology(word: string, entry: EtymologyEntry) {
	let embed = new EmbedBuilder().setTitle(`🔖 ${word}`);

	if (entry.credit) embed = embed.setFooter({ text: `Found by ${entry.credit}` });
	if (entry.description) embed = embed.setDescription(entry.description);
	if (entry.etymology) embed = embed.addFields({ name: '📌 Etymology', value: entry.etymology });
	if (entry.speech) embed = embed.addFields({ name: '📎 Parts of Speech', value: entry.speech.join(', ') });
	if (entry.note) embed = embed.addFields({ name: '📝 Note', value: entry.note });

	return embed;
}

export function create_wotd_from_word(word: string, entry: DictionaryEntry, user: User) {
	let embed = new EmbedBuilder()

		.setTitle(`🔖  ${word}  🔖`)
		.setDescription(entry.definition)
		.setFooter({
			text: `✉ This was posted by ${user.username}`,
			iconURL: user.displayAvatarURL()
		})
		.addFields({
			name: '📎 Parts of Speech',
			value: entry.speech.map((p) => capitalize(p)).join(', '),
			inline: true
		})
		.setColor(7819180);

	if (entry.nsfw) {
		embed = embed.addFields({
			name: '⚠️ This word is Not Safe For Work <:lewd:666458724625416255>',
			value: '\u200B'
		});
		if (entry.nsfw.out_universe)
			embed = embed.addFields({
				name: 'Out Of Universe Context',
				value: entry.nsfw.out_universe,
				inline: true
			});
		if (entry.nsfw.in_universe)
			embed = embed.addFields({
				name: 'In Universe Context',
				value: entry.nsfw.in_universe,
				inline: true
			});
	}

	if (entry.character) {
		embed = embed.addFields({ name: 'Character', value: entry.character.english! });
		if (entry.character.justification) {
			embed = embed.addFields({
				name: 'Character Justification',
				value: entry.character.justification
			});
		}
	}

	if (entry.note) {
		embed = embed.addFields({ name: '📝 Note', value: entry.note });
	}

	return embed;
}

export function find_closest_from_array(word: string, arr: string[], leven_distance = 5) {
	const leven_closest = new Set<string>();

	for (const array_word of arr) {
		const word_dist = distance(word, array_word);

		if (word_dist <= leven_distance) {
			if (word_dist < leven_distance) {
				leven_closest.clear();
				leven_distance = word_dist;
			}

			leven_closest.add(array_word);
		}
	}

	return Array.from(leven_closest);
}

export function create_could_not_find_string(msg: string, subst: string[]) {
	if (subst.length) {
		msg += '\n\n❓ Did you mean `' + subst.join(', ') + '`?';
	}

	return msg;
}

export async function hide_suggestion_category(client: SapphireClient, id: string) {
	const channel = await client.channels.fetch(id);
	if (!channel) return;
	if (channel.type !== ChannelType.GuildCategory) return;

	await channel.permissionOverwrites.edit('625516772023599135', {
		SendMessages: false
	});
}
export async function display_suggestion_category(client: SapphireClient, id: string) {
	const channel = await client.channels.fetch(id);
	if (!channel) return;
	if (channel.type !== ChannelType.GuildCategory) return;

	await channel.permissionOverwrites.edit('625516772023599135', {
		SendMessages: true
	});
}

export function format_time_proper(time: number) {
	time = Math.floor(time);
	if (time <= 0) return 'Just now';

	let seconds = time % 60;
	let minutes = Math.floor(time / 60) % 60;
	let hours = Math.floor(Math.floor(time / 60) / 60);

	const pl = (x: number, y: string) => (x > 1 ? y + 's' : y);

	let output = [];
	if (hours > 0) output.push(`${hours} ${pl(hours, 'Hour')}`);
	if (minutes > 0) output.push(`${minutes} ${pl(minutes, 'Minute')}`);
	if (seconds > 0) output.push(`${seconds} ${pl(seconds, 'Second')}`);

	return output.join(', ');
}
