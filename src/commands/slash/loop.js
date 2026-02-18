const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Установить режим повтора')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Режим повтора')
                .setRequired(true)
                .addChoices(
                    { name: 'Выключить', value: 'off' },
                    { name: 'Текущий трек', value: 'track' },
                    { name: 'Вся очередь', value: 'queue' }
                )),

    async execute(interaction, client) {
        const mode = interaction.options.getString('mode');
        const player = client.getPlayer(interaction.guildId);

        player.setLoop(mode);

        const modeText = mode === 'off' ? 'Выключен' : 
                        mode === 'track' ? 'Текущий трек' : 'Вся очередь';

        const embed = new EmbedBuilder()
            .setColor(0x00CED1)
            .setTitle('🔁 Режим повтора изменён')
            .setDescription(`Режим: ${modeText}`);

        await interaction.reply({ embeds: [embed] });
    },
};
