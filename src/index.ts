import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

import { DiscordClient } from './types';

import Config from './utils/config';

import LoadCommands from './utils/initialisation/load_commands';
import LoadEvents from './utils/initialisation/load_events';
import LoadStaticMessages from './utils/initialisation/load_static_messages';
import AntiPostArchiver from './handlers/anti-postarchiver';

const client: DiscordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
}) as DiscordClient;

client.commands = new Collection();
client.autocompleteCommands = new Collection();

LoadCommands(client);
LoadEvents(client);
LoadStaticMessages(client);
AntiPostArchiver.initialize(client);

client.login(Config.DISCORD_BOT_TOKEN);
