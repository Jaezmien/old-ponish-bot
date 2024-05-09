import { Prisma as PrismaClient } from '@prisma/client';
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

type EmbeddableWord = PrismaClient.WordGetPayload<{
	include: { nsfw: true; part_of_speech: { include: { speech: true } } };
}>;
export function create_embed_from_word(word: EmbeddableWord) {
	let embed = new EmbedBuilder()
		.setTitle(`🔖 ${word.word}`)
		.setDescription(word.description)
		.addFields({
			name: '📎 Parts of Speech',
			value: word.part_of_speech.map((p) => capitalize(p.speech.type_of_speech)).join(', ')
		});
	if (word.nsfw) {
		embed.addFields({
			name: '<:lewd:666458724625416255> Notice',
			value: 'This word may be **Not Safe For Work**!'
		});
	}

	return embed;
}
type EmbeddableEtymology = PrismaClient.EtymologyGetPayload<{}>;
export function create_embed_from_etymology(etymology: EmbeddableEtymology) {
	let embed = new EmbedBuilder().setTitle(`🔖 ${etymology.word}`);

	if (etymology.credit) embed = embed.setFooter({ text: `Found by ${etymology.credit}` });
	if (etymology.description) embed = embed.setDescription(etymology.description);
	if (etymology.etymology) embed = embed.addFields({ name: '📌 Etymology', value: etymology.etymology });
	if (etymology.parts_of_speech) embed = embed.addFields({ name: '📎 Parts of Speech', value: etymology.parts_of_speech });
	if (etymology.note) embed = embed.addFields({ name: '📝 Note', value: etymology.note });

	return embed;
}

type WOTDWord = PrismaClient.WordGetPayload<{
	include: {
		part_of_speech: {
			include: {
				speech: true;
			};
		};
		character: true;
		nsfw: true;
	};
}>;
export function create_wotd_from_word(word: WOTDWord, user: User) {
	let embed = new EmbedBuilder()

		.setTitle(`🔖  ${word.word}  🔖`)
		.setDescription(word.description)
		.setFooter({
			text: `✉ This was posted by ${user.username}`,
			iconURL: user.displayAvatarURL()
		})
		.addFields({
			name: '📎 Parts of Speech',
			value: word.part_of_speech.map((p) => capitalize(p.speech.type_of_speech)).join(', '),
			inline: true
		})
		.setColor(7819180);

	if (word.nsfw) {
		embed = embed.addFields({
			name: '⚠️ This word is Not Safe For Work <:lewd:666458724625416255>',
			value: '\u200B'
		});
		if (word.nsfw.out_of_universe_context)
			embed = embed.addFields({
				name: 'Out Of Universe Context',
				value: word.nsfw.out_of_universe_context,
				inline: true
			});
		if (word.nsfw.in_universe_context)
			embed = embed.addFields({
				name: 'In Universe Context',
				value: word.nsfw.in_universe_context,
				inline: true
			});
	}

	if (word.character) {
		embed = embed.addFields({ name: 'Character', value: word.character.character });
		if (word.character.character_justification) {
			embed = embed.addFields({
				name: 'Character Justification',
				value: word.character.character_justification
			});
		}
	}

	if (word.note) {
		embed = embed.addFields({ name: '📝 Note', value: word.note });
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
