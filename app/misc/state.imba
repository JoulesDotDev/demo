class State
	constructor
		init!

	def init
		#title = ""

	set title value
		#title = value
		imba.commit!
	
	get title
		#title

	get ready
		yes && #title

	def clear
		init!

const state = new State!

tag app-state
	get #app
		return state