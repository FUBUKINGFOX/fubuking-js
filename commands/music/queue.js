const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { queue } = require("./bin/functions.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("show the song list"),
    async execute(interaction){
        const guild_id = interaction.guild.id
        if (queue[guild_id] == null || queue[guild_id].length == 0){
            await interaction.reply("queue is empty")
            return
        } 
        const embed = new EmbedBuilder()
        .setTitle(`**queue for ${interaction.guild.name}**`)
        .setColor(0x00c6ff)
        for (const i of queue[guild_id]){
            embed.addFields(
                {name: i.title,value: `\`duration: ${i.duration}\``}
            )
        }
        await interaction.reply({embeds:[embed]})
    }
}