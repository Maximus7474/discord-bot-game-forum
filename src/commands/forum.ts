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

            try {
                const response: {
                    created: boolean; dbid: string; roles: { role: string }[];
                } = await ForumPosts.addPost(user, post as PublicThreadChannel, role);

                const description = [
                    `The role **${role.name}** (<@&${role.id}>) has been successfully linked to the forum post <#${post.id}>.`,
                    response.created ? '\n**Database Action:** This is the first time this post has been indexed in the database.' : '',
                    '\n**Currently Linked Roles:**',
                    `\n- ${response.roles.map(r => `<@&${r.role}>`).join('\n- ')}`,
                ].join('\n');

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(response.created ? 'Post Created and Role Added' : 'Role Added Successfully')
                        .setDescription(description)
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
        }
    }
});