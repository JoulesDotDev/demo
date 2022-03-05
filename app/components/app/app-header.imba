tag app-header < app-state

	css .background bgc:gray8 shadow: 0px 8px 0px gray7 
		px:4 py:6
	css h1 fs:1.8em m:0 ta:center us:none
	css back-button mt:8

	<self> 
		<div.background>
			<h1> #app.title

		unless router.path === "/"
			<div.limited>
				<back-button route-to="../"> 
					<i.fa-solid.fa-arrow-left>	