const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Показать очередь воспроизведения'),

    async execute(interaction, client) {
        const player = client.getPlayer(interaction.guildId);

        if (!player.currentTrack && player.queue.length === 0) {
            return interaction.reply({
                content: '❌ Очередь пуста!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📜 Очередь воспроизведения');

        if (player.currentTrack) {
            embed.addFields({
                name: '🎵 Сейчас играет',
                value: `[${player.currentTrack.title}](${player.currentTrack.url}) - ${player.currentTrack.author}`
            });
        }

        if (player.queue.length > 0) {
            const queueList = player.queue
                .slice(0, 10)
                .map((track, index) => `${index + 1}. [${track.title}](${track.url})`)
                .join('\n');

            embed.addFields({
                name: `📋 Следующие треки (${player.queue.length})`,
                value: queueList
            });

            if (player.queue.length > 10) {
                embed.setFooter({ text: `И ещё ${player.queue.length - 10} треков...` });
            }
        }

        embed.addFields({
            name: '🔁 Режим повтора',
            value: player.loopMode === 'off' ? 'Выключен' : 
                   player.loopMode === 'track' ? 'Текущий трек' : 'Вся очередь',
            inline: true
        });

        await interaction.reply({ embeds: [embed] });
    },
};
