import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ModalSubmitInteraction } from 'discord.js';
import { create_wotd_from_word } from '../lib/utils';
import { Dictionary } from '../lib/dictionary';
import { WOTDManager } from '../lib/wotdManager';

@ApplyOptions<InteractionHandler.Options>({
	name: 'wotd_send',
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class WOTDSendHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction) {
		await interaction.deferReply();

		const word = interaction.fields.getTextInputValue('wotd_word');
		const message = interaction.fields.getTextInputValue('wotd_message');

		const db_word = await Dictionary.getEntry(word);

		if (!db_word) {
			await interaction.editReply({
				content: `<:panic:570675430328107018> Sorry, I couldn't find the word \`${word}\`!`
			});
			return;
		}

		const channel = await interaction.guild!.channels.fetch(process.env.WOTD_CHANNEL_ID!); // I will probably regret this later.
		if (!channel || !channel.isTextBased()) {
			await interaction.editReply({
				content: `<:panic:570675430328107018> An error has occued while trying to fetch the WOTD channel!`
			});
			return;
		}

		let embed = create_wotd_from_word(word, db_word, interaction.user);

		const wotd_message = await channel.send({
			content: `## **[ 📰 Word Of The Day! 📰 ]**\n${message}\n\n📢 <@&581679273010790403>`,
			embeds: [embed]
		});

		await WOTDManager.create({
			message_id: wotd_message.id,
			author: interaction.user.id,
			message: message,
			word: word
		});

		await interaction.editReply({
			content: '<:hoof:572187847629733922> Your post has been created!'
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId !== this.name) return this.none();

		return this.some();
	}
}
