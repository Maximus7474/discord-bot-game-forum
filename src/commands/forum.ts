import { ChannelType, Colors, EmbedBuilder, MessageFlags, PermissionFlagsBits, PublicThreadChannel, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../classes/slash_command";
import ForumPosts from "../handlers/forum-posts";

export default new SlashCommand({
    name: 'forum',
    guildSpecific: true,
    hideFromHelp: false,
    slashcommand: new SlashCommandBuilder()
        .setName('forum-roles')
        .setDescription('Handle your forum roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(c => 
            c.setName('add')
            .setDescription('Add a role to a forum post reaction')
            .addChannelOption(o =>
                o.setName('post')
                .setDescription('Forum post to link')
                .setRequired(true)
            )
            .addRoleOption(o =>
                o.setName('role')
                .setDescription('Role to link to the post react')
                .setRequired(true)
            )
        )
        .addSubcommand(c =>
            c.setName('remove')
            .setDescription('Remove all roles associated with post')
            .addChannelOption(o =>
                o.setName('post')
                .setDescription('Forum post to remove all roles from')
                .setRequired(true)
            )
            .addBooleanOption(o =>
                o.setName('delete-post')
                .setDescription('Do you want the bot to also delete the channel ?')
                .setRequired(false)
            )
        ),
    callback: async (logger, client, interaction) => {
        const { user, options, guild } = interaction;
        const subcommand = options.getSubcommand(true) as 'add' | 'remove';

        if (!guild) {
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Unable to use')
                    .setDescription(`This command needs to be used within a guild.`)
                    .setColor(Colors.DarkRed)
                ],
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (subcommand === 'add') {
            const post = options.getChannel('post', true);
            const role = options.getRole('role', true);

            const isThread = post.type === ChannelType.PublicThread;

            if (!isThread) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Failed to add role')
                        .setDescription(`The provided channel: <#${post?.id ?? 'no channel'}> is not a thread from a forum channel.`)
                        .setColor(Colors.DarkRed)
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (guild.id !== (post as PublicThreadChannel).guildId) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Failed to add post')
                        .setDescription(`The provided channel: <#${post?.id ?? 'no channel'}> is not on this guild's (${guild.name}) channel list.`)
                        .setColor(Colors.DarkRed)
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            try {
                const response: {
                    created: boolean; dbid: string; roles: { role: string }[];
                } = await ForumPosts.addPost(user, post as PublicThreadChannel, guild.id, role);

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(response.created ? 'Post Created and Role Added' : 'Role Added Successfully')
                        .setDescription(
                            `The role **${role.name}** (<@&${role.id}>) has been successfully linked to the forum post <#${post.id}>.\n`+
                            '\n**Currently Linked Roles:**\n'+
                            `\n- ${response.roles.map(r => `<@&${r.role}>`).join('\n- ')}`
                        )
                        .setColor(Colors.DarkGreen)
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            } catch (err) {
                logger.error('Unable to add role to post', err);

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Failed to add role')
                        .setDescription(
                            'The attempt to save the post/role to the database failed.\n'+
                            `**Error Details:** \`\`\`${(err as Error).message.substring(0, 500)}...\`\`\`\n`+
                            'Please notify a server administrator with the details above.'
                        )
                        .setColor(Colors.DarkRed)
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }
        } else if (subcommand === 'remove') {
            const post = options.getChannel('post', true);
            const deleteThread = options.getBoolean('delete', false) ?? false;

            const isThread = post.type === ChannelType.PublicThread;

            if (!isThread) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Failed to delete thread')
                        .setDescription(`The provided channel: <#${post?.id ?? 'no channel'}> is not a thread from a forum channel.`)
                        .setColor(Colors.DarkRed)
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const result = await ForumPosts.deletePost(guild.id, (post as PublicThreadChannel));

            if (!result.success) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Failed to delete thread')
                        .setDescription(result.message ?? 'Unknown reason.')
                        .setColor(Colors.DarkRed)
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (deleteThread) {
                await (post as PublicThreadChannel).delete(`Removed by ${user.username} (${user.id}) via ${client.user?.username}'s command.`);
            }

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Action was successful')
                    .setDescription(
                        'Post was removed from the database' +
                        deleteThread
                            ? ' and the thread was deleted'
                            : ''
                    )
                    .setColor(Colors.DarkGreen)
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});