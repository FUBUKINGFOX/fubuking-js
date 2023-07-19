const { SlashCommandBuilder, EmbedBuilder, version } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("system_info")
    .setDescription("show bot information"),
    async execute(interaction){
        let embed = new EmbedBuilder()
			.setTitle("System INFO")
            .setDescription(`Client ID \`\`\`js\n${interaction.client.user.id}                                        \`\`\``)
            .setColor(0xff55fc)
			.addFields(
				{name:`<:nodejs:1129082045138743429>node`,value:`> \`${process.version}\``, inline:true},
				{name:`<:folderserver:1131107239055343616>server`,value:`> \`v0.0.1b\``, inline:true},
                {name:`<:folderqueue:1131103042629017660>discord.js`,value:`> \`v${version}\``, inline:true}
			)
            .setFooter({ text: 'CORN Studio', iconURL: 'https://cdn.discordapp.com/emojis/1028895182290161746.webp?size=96' });
        await interaction.reply({embeds:[embed]})
    }
    
}