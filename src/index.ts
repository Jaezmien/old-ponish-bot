import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import { Prisma } from './lib/constants';
import './lib/setup';
import { display_suggestion_category, hide_suggestion_category } from './lib/utils';
import { Dictionary, Etymology } from './lib/dictionary';

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: process.env.NODE_ENV === 'production' ? LogLevel.Info : LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
	loadMessageCommandListeners: true
});

let database_open = true;
async function stop_bot(signal?: number | string) {
	try {
		if (process.env.NODE_ENV === 'production') await hide_suggestion_category(client, '940438939632795650');

		client.user?.setStatus('invisible');
		client.destroy();

		if (database_open) {
			database_open = false;
			await Prisma.$disconnect();
		}

		client.logger.info('👋 Goodbye!');
	} catch (err) {
		client.logger.error('💥 An error has occured while trying to exit!');
		client.logger.error(err);
	} finally {
		process.kill(process.pid, signal);
	}
}
async function sig_stop_bot(signal?: number | string) {
	stop_bot(signal);
}

process.addListener('SIGINT', sig_stop_bot);
process.addListener('SIGTERM', sig_stop_bot);

const main = async () => {
	try {
		client.on('error', async (err) => {
			client.logger.fatal('💥 An error has occured within the Discord.JS Client!');
			console.error(err);

			await stop_bot(1);
		});

		client.logger.info('🔄 Loading database...');
		await Dictionary.reload(true);
		await Etymology.reload(true);

		// -- //

		client.logger.info('🔒 Logging in...');
		await client.login();
		client.logger.info('🔓 Logged in!');
		client.logger.info(`👤 User: ${client.user?.tag} | ID: ${client.user?.id}`);

		// -- //

		function set_presence() {
			client.user?.setPresence({
				activities: [{ name: 'with the Dictionary!' }],
				status: 'idle'
			});
		}
		setInterval(() => {
			set_presence();
		}, 1000 * 60 * 60); // Reset presence every hour.
		set_presence();

		if (process.env.NODE_ENV === 'production') await display_suggestion_category(client, '940438939632795650');
	} catch (error) {
		client.logger.fatal(error);
		stop_bot(1);
	}
};

main();
