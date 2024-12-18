import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ModalSubmitInteraction } from 'discord.js';
import { create_wotd_from_word } from '../lib/utils';
import { Dictionary } from '../lib/dictionary';
import { WOTDManager } from '../lib/wotdManager';

@ApplyOptions<InteractionHandler.Options>({
	name: 'wotd_fix',
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class WOTDFixHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction) {
		await interaction.deferReply();

		const id = interaction.fields.getTextInputValue('wotd_id');
		const message = interaction.fields.getTextInputValue('wotd_message');

		const wotd_post = await WOTDManager.findByMessageID(id);

		if (!wotd_post) {
			await interaction.editReply({
				content: '<:panic:570675430328107018> Sorry, I could not find that Word of the Day post!'
			});

			return;
		}

		const db_word = await Dictionary.getEntry(wotd_post.word);

		if (!db_word) {
			await interaction.editReply({
				content: `<:panic:570675430328107018> Sorry, I couldn't find the word \`${wotd_post.word}\`!`
			});
			return;
		}

		const channel = await interaction.guild!.channels.fetch(process.env.WOTD_CHANNEL_ID!);
		if (!channel || !channel.isTextBased()) {
			await interaction.editReply({
				content: `<:panic:570675430328107018> An error has occued while trying to fetch the WOTD channel!`
			});
			return;
		}

		const old_message = await channel.messages.fetch(id);
		const embed = create_wotd_from_word(wotd_post.word, db_word, interaction.user);

		old_message.edit({
			content: `## **[ 📰 Word Of The Day! 📰 ]**\n${message}\n\n📢 <@&581679273010790403>`,
			embeds: [embed]
		});

		await WOTDManager.update(id, {
			message_id: id,
			author: wotd_post.author,
			word: wotd_post.word,
			message
		});

		await interaction.editReply({
			content: '<:hoof:572187847629733922> Your post has been edited!'
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId !== this.name) return this.none();

		return this.some();
	}
}
