const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Установить громкость')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Уровень громкости (0-200)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(200)),

    async execute(interaction, client) {
        const level = interaction.options.getInteger('level');
        const player = client.getPlayer(interaction.guildId);

        player.setVolume(level);

        const volumeBar = '█'.repeat(Math.floor(level / 20)) + '░'.repeat(10 - Math.floor(level / 20));

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🔊 Громкость изменена')
            .setDescription(`${volumeBar} **${level}%**`)
            .setFooter({ text: 'Применится к следующему треку' });

        await interaction.reply({ embeds: [embed] });
    },
};
