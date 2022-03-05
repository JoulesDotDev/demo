tag hangman-timer < hangman-state

	css h:4 w:250px m:0 auto
		bgc:cooler8 mt:12
		.time h:4 bgc:cooler7

	<self> 
		<div.time [w:{100 * #game.timer + "%"}]>

