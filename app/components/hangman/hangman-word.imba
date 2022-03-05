tag hangman-word < hangman-state

	css mt:12 ta:center

	<self>
		for letter of #game.word
			<hangman-letter letter=letter solved=(#game.correct.includes letter)>

