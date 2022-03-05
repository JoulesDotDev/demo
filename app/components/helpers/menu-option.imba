tag menu-option < common-button

	css d:inline-block flf:column jc:center pos:relative
		h:35 w:35
		mx:3 my:3.3
	css .icon mb:2 pos:absolute l:50% t:35%
		transform: translate(-50%, -50%)
		fs:1.9em
	css .text pos:absolute b:4.5 l:0 r:0 
		fs:1.1em

	<self> 
		<div.icon><slot name="icon">
		<div.text> <slot>
