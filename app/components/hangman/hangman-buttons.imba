tag hangman-buttons

	css w: 200px m:0 auto
		mt:12 d:flex jc:center
		.button d:grid mx:2.5 fs:2.5em h:12 w:12 rd:0
			outline:0 bd:0 bgc:cool8 c:white jc:center ai:center

	def press value
		console.log value

	<self> 
		<div.button @click=(press '.')>
			<dot>
		<div.button @click=(press '-')>
			<dash>

tag dot
	css h:3.5 w:3.5 bgc:white rd:full

tag dash
	css h:2 w:6 bgc:white rd:xs
