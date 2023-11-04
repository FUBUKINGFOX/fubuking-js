const { Events, ActivityType } = require('discord.js')
const {get_cfg_value} = require("../module/config_loader")

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log("\x1b[92mlog in as:\x1b[0m")
        console.log(`\x1b[95m${client.user.username}\x1b[0m`)
		client.user.setStatus("idle")
		client.user.setActivity("youtube",{type:ActivityType.Listening})
		const guild = await client.guilds.fetch(get_cfg_value("config","MAIN","GUILD_ID",""))
		const ch = await guild.channels.fetch(get_cfg_value("config","MAIN","ON_READY_MSG",""))
		await ch.send(`<:nodejs:1129082045138743429> :${client.user.username}\`${client.user.id}\``)
	},
};