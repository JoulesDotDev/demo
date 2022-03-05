import 'app/misc'
import 'app/router'
import 'app/components'
import 'app/style'

tag app < app-state
	
	<self [d:none] [d:block]=(#app.ready)>
		<app-header>
		<app-router.limited>

imba.mount <app>