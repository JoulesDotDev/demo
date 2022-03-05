tag hangman-game < hangman-state

	def setup
		#game.init!
	
	def mount
		setup!

	<self> 
		<hangman-attempts>
		<hangman-word>
		<hangman-timer>
		<hangman-buttons>