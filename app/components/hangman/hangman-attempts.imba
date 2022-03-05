tag hangman-attempts < hangman-state

	css m:0 auto mt:10 ta:center
	css .attempts d:inline-flex
		bgc:cooler8 c.danger:red4 .over:red5
		w:12 h:10 fs:1.2em mr:3 jc:center ai:center
		px:2 pt:2 pb:1 ta:center

	<self> 
		<div.attempts .danger=(#game.attempts < 6) .over=(#game.over)> 
			#game.attempts
		"Attempts left" 
